/**
 * Helpers partages par les controleurs : validation des parametres de requete
 * et pagination. Centralises ici pour que les memes regles s'appliquent
 * partout (les niveaux et les langues sont ceux des schemas Mongoose).
 */

export const ADMIN_LEVELS = ["country", "region", "district", "commune"];

export const LANGS = ["fr", "ar", "en"];

export const DEFAULT_LANG = "fr";

export const DEFAULT_LIMIT = 200;

export const MAX_LIMIT = 1000;

/**
 * Aucune route ne renvoyait de limite : un seul appel pouvait rapatrier la
 * totalite de la collection. On plafonne, sans jamais renvoyer d'erreur pour
 * une valeur farfelue (une liste tronquee vaut mieux qu'un 400 sur une route
 * de lecture publique).
 */
export const parsePagination = (query = {}) => {
  const rawLimit = Number.parseInt(query.limit, 10);
  const rawOffset = Number.parseInt(query.offset, 10);

  const limit = Number.isNaN(rawLimit) ? DEFAULT_LIMIT : Math.min(Math.max(rawLimit, 1), MAX_LIMIT);
  const offset = Number.isNaN(rawOffset) ? 0 : Math.max(rawOffset, 0);

  return { limit, offset };
};

/**
 * Neutralise les metacaracteres avant de construire une RegExp a partir d'une
 * saisie utilisateur : sans cela un motif comme "(a+)+$" provoque un retour
 * arriere catastrophique (ReDoS) sur chaque collection interrogee.
 */
export const escapeRegex = (input) => String(input).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Les libelles sont accentues ("Taux de chomage" n'existe pas, "chômage" si) :
// une recherche sur la saisie brute ne renvoyait donc rien des qu'un accent
// manquait. On etend chaque voyelle en classe de caracteres plutot que
// d'ajouter un champ normalise en base (cf. AUDIT B-20).
const DIACRITICS = {
  a: "aàâäáãå",
  c: "cç",
  e: "eéèêë",
  i: "iîïíì",
  n: "nñ",
  o: "oôöóòõ",
  u: "uùûüú",
  y: "yÿý",
};

const FOLD = new Map();
for (const [base, variants] of Object.entries(DIACRITICS)) {
  for (const char of variants) {
    FOLD.set(char, `[${variants}${variants.toUpperCase()}]`);
  }
}

/**
 * Construit, a partir d'une saisie utilisateur, une RegExp insensible a la
 * casse et aux accents. L'echappement precede l'expansion : le motif reste
 * entierement sous notre controle, donc sans risque de ReDoS.
 */
export const buildSearchRegex = (input) => {
  const pattern = escapeRegex(input)
    .split("")
    .map((char) => FOLD.get(char.toLowerCase()) ?? char)
    .join("");

  return new RegExp(pattern, "i");
};
