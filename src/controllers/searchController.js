import { Indicator } from "../models/Indicator.js";
import { Region } from "../models/Region.js";
import { Theme } from "../models/Theme.js";
import { DEFAULT_LANG, LANGS, buildSearchRegex } from "../utils/query.js";

export const search = async (req, res, next) => {
  try {
    const { q, lang = DEFAULT_LANG } = req.query;

    if (!q || q.length < 2) {
      return res.status(400).json({ success: false, error: 'Requête trop courte (min 2 caractères)' });
    }
    if (!LANGS.includes(lang)) {
      return res.status(400).json({
        success: false,
        error: `Langue inconnue : "${lang}" (attendu : ${LANGS.join(", ")})`,
      });
    }

    const searchField = `name.${lang}`;
    // Saisie echappee puis rendue insensible aux accents : la construire
    // telle quelle exposerait les trois collections a un ReDoS (AUDIT B-07)
    // et ne trouverait rien sans accent exact (AUDIT B-20).
    const regex = buildSearchRegex(q);

    // Search across themes, regions, and indicators
    const [themes, regions, indicators] = await Promise.all([
      Theme.find({ [searchField]: regex, isPublished: true }).limit(5).lean(),
      Region.find({ [searchField]: regex, isActive: true }).limit(5).lean(),
      Indicator.find({ [searchField]: regex }).limit(50).lean(),
    ]);

    // Deduplicate indicator results by code
    const uniqueIndicators = [];
    const seenCodes = new Set();
    for (const ind of indicators) {
      if (!seenCodes.has(ind.indicatorCode)) {
        seenCodes.add(ind.indicatorCode);
        uniqueIndicators.push({
          code: ind.indicatorCode,
          name: ind.name,
          themeSlug: ind.themeSlug,
          unit: ind.unit,
        });
      }
      if (uniqueIndicators.length >= 10) break;
    }

    res.json({
      success: true,
      data: {
        themes: themes.map(t => ({ slug: t.slug, name: t.name, icon: t.icon })),
        regions: regions.map(r => ({ code: r.code, name: r.name, level: r.level })),
        indicators: uniqueIndicators,
      },
    });
  } catch (error) {
    next(error);
  }
};
