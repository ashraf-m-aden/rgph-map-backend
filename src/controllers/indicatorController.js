import { Indicator } from "../models/Indicator.js";
import { Region } from "../models/Region.js";
import { ADMIN_LEVELS, DEFAULT_LANG, LANGS, parsePagination } from "../utils/query.js";

/**
 * Un indicateur est une cellule (code, region, desagregation). Quand aucune
 * desagregation n'est demandee, seule la ligne "ensemble" (desagregation vide)
 * represente la region : prendre le premier document venu afficherait une
 * valeur au hasard parmi "ensemble", "masculin", "feminin"...
 */
const isTotal = (doc) =>
  !doc.disaggregation || Object.keys(doc.disaggregation).length === 0;

const pickForRegion = (docs, regionCode, disaggregationRequested) => {
  const matches = docs.filter((d) => d.regionCode === regionCode);
  if (matches.length === 0) return null;
  if (disaggregationRequested) return matches[0];
  return matches.find(isTotal) ?? null;
};

/**
 * Accepte les deux syntaxes de desagregation :
 *   ?disaggregation[sexe]=masculin   (objet imbrique produit par Express)
 *   ?disaggregation.sexe=masculin    (clefs a plat)
 *   ?disaggregation={"sexe":"masculin"}  (JSON, utilise par map-data)
 */
const extractDisaggregation = (query) => {
  const out = {};

  if (typeof query.disaggregation === "string") {
    try {
      Object.assign(out, JSON.parse(query.disaggregation));
    } catch {
      return { error: 'Le parametre "disaggregation" n\'est pas un JSON valide' };
    }
  } else if (query.disaggregation && typeof query.disaggregation === "object") {
    Object.assign(out, query.disaggregation);
  }

  Object.keys(query).forEach((key) => {
    if (key.startsWith("disaggregation.")) {
      out[key.slice("disaggregation.".length)] = query[key];
    }
  });

  return { value: out };
};

const disaggregationFilter = (disagg) =>
  Object.fromEntries(
    Object.entries(disagg).map(([key, value]) => [`disaggregation.${key}`, value]),
  );

export const getAll = async (req, res, next) => {
  try {
    const { theme, indicator, region, year } = req.query;
    const { limit, offset } = parsePagination(req.query);
    const disagg = extractDisaggregation(req.query);
    if (disagg.error) {
      return res.status(400).json({ success: false, error: disagg.error });
    }

    const filter = { ...disaggregationFilter(disagg.value) };
    if (theme) filter.themeSlug = theme;
    if (indicator) filter.indicatorCode = indicator;
    if (region) filter.regionCode = region;
    if (year) {
      const parsed = Number.parseInt(year, 10);
      if (Number.isNaN(parsed)) {
        return res.status(400).json({ success: false, error: 'Le parametre "year" doit etre un nombre' });
      }
      filter.year = parsed;
    }

    const [total, indicators] = await Promise.all([
      Indicator.countDocuments(filter),
      Indicator.find(filter).sort({ indicatorCode: 1, regionCode: 1 }).skip(offset).limit(limit).lean(),
    ]);

    res.json({
      success: true,
      count: indicators.length,
      total,
      limit,
      offset,
      data: indicators,
    });
  } catch (error) {
    next(error);
  }
};

export const getByTheme = async (req, res, next) => {
  try {
    const { themeSlug } = req.params;
    const { regionCode, level } = req.query;
    const { limit, offset } = parsePagination(req.query);

    const filter = { themeSlug };
    if (regionCode) filter.regionCode = regionCode;

    // Si un niveau est demande, restreindre aux regions de ce niveau
    if (level) {
      if (!ADMIN_LEVELS.includes(level)) {
        return res.status(400).json({
          success: false,
          error: `Niveau inconnu : "${level}" (attendu : ${ADMIN_LEVELS.join(", ")})`,
        });
      }
      const regions = await Region.find({ level }).select("code").lean();
      filter.regionCode = { $in: regions.map((r) => r.code) };
    }

    const [total, indicators] = await Promise.all([
      Indicator.countDocuments(filter),
      Indicator.find(filter)
        .sort({ indicatorCode: 1, regionCode: 1 })
        .skip(offset)
        .limit(limit)
        .lean(),
    ]);

    // Group by indicator code
    const grouped = {};
    indicators.forEach((ind) => {
      if (!grouped[ind.indicatorCode]) {
        grouped[ind.indicatorCode] = {
          code: ind.indicatorCode,
          name: ind.name,
          unit: ind.unit,
          visualization: ind.visualization,
          data: [],
        };
      }
      grouped[ind.indicatorCode].data.push({
        regionCode: ind.regionCode,
        value: ind.value,
        disaggregation: ind.disaggregation ?? {},
      });
    });

    res.json({
      success: true,
      count: indicators.length,
      total,
      limit,
      offset,
      data: Object.values(grouped),
    });
  } catch (error) {
    next(error);
  }
};

export const getMapData = async (req, res, next) => {
  try {
    const { indicatorCode } = req.params;
    const { level = "region" } = req.query;

    if (!ADMIN_LEVELS.includes(level)) {
      return res.status(400).json({
        success: false,
        error: `Niveau inconnu : "${level}" (attendu : ${ADMIN_LEVELS.join(", ")})`,
      });
    }

    const disagg = extractDisaggregation(req.query);
    if (disagg.error) {
      return res.status(400).json({ success: false, error: disagg.error });
    }
    const hasDisaggregation = Object.keys(disagg.value).length > 0;

    const regions = await Region.find({ level }).select("code name center sortOrder").sort({ sortOrder: 1 }).lean();

    const indicators = await Indicator.find({
      indicatorCode,
      regionCode: { $in: regions.map((r) => r.code) },
      ...disaggregationFilter(disagg.value),
    }).lean();

    // Regions pour lesquelles il n'existe que des valeurs ventilees : on ne
    // peut pas en deduire un total, la valeur reste nulle et on le signale.
    const disaggregatedOnly = [];

    const mapData = regions.map((region) => {
      const ind = pickForRegion(indicators, region.code, hasDisaggregation);
      if (!ind && indicators.some((i) => i.regionCode === region.code)) {
        disaggregatedOnly.push(region.code);
      }
      return {
        regionCode: region.code,
        regionName: region.name,
        center: region.center,
        value: ind ? ind.value : null,
        unit: ind ? ind.unit : null,
      };
    });

    // Echelle de couleurs : null si aucune valeur numerique, plutot que les
    // Infinity produits par Math.min/max sur un tableau vide (serialises en
    // JSON par "null", donc indistinguables d'une vraie valeur).
    const values = mapData.map((d) => d.value).filter((v) => typeof v === "number" && Number.isFinite(v));
    const scale = values.length
      ? { min: values.reduce((a, b) => Math.min(a, b)), max: values.reduce((a, b) => Math.max(a, b)) }
      : null;

    res.json({
      success: true,
      data: {
        indicatorCode,
        level,
        mapData,
        scale,
        hasData: values.length > 0,
        disaggregatedOnly,
        visualization: indicators[0]?.visualization ?? {},
      },
    });
  } catch (error) {
    next(error);
  }
};

export const compare = async (req, res, next) => {
  try {
    const { indicator, regions } = req.query;

    if (!indicator || !regions) {
      return res.status(400).json({
        success: false,
        error: 'Les paramètres "indicator" et "regions" sont requis',
      });
    }

    const regionCodes = regions
      .split(",")
      .map((code) => code.trim())
      .filter(Boolean);

    if (regionCodes.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Le paramètre "regions" doit contenir au moins un code',
      });
    }

    const data = await Indicator.find({
      indicatorCode: indicator,
      regionCode: { $in: regionCodes },
    }).lean();

    res.json({ success: true, count: data.length, data });
  } catch (error) {
    next(error);
  }
};

export const getChartData = async (req, res, next) => {
  try {
    const { indicatorCode } = req.params;
    const { level = "region", groupBy = "region", lang = DEFAULT_LANG } = req.query;

    if (!ADMIN_LEVELS.includes(level)) {
      return res.status(400).json({
        success: false,
        error: `Niveau inconnu : "${level}" (attendu : ${ADMIN_LEVELS.join(", ")})`,
      });
    }
    if (!LANGS.includes(lang)) {
      return res.status(400).json({
        success: false,
        error: `Langue inconnue : "${lang}" (attendu : ${LANGS.join(", ")})`,
      });
    }
    if (groupBy !== "region") {
      return res.status(400).json({
        success: false,
        error: `Regroupement non supporté : "${groupBy}" (attendu : region)`,
      });
    }

    const disagg = extractDisaggregation(req.query);
    if (disagg.error) {
      return res.status(400).json({ success: false, error: disagg.error });
    }
    const hasDisaggregation = Object.keys(disagg.value).length > 0;

    const regions = await Region.find({ level }).select("code name sortOrder").sort({ sortOrder: 1 }).lean();

    const indicators = await Indicator.find({
      indicatorCode,
      regionCode: { $in: regions.map((r) => r.code) },
      ...disaggregationFilter(disagg.value),
    }).lean();

    // Les libelles doivent etre des chaines : renvoyer l'objet { fr, ar, en }
    // ferait afficher "[object Object]" sur l'axe du graphique.
    const chartData = {
      labels: regions.map((r) => r.name?.[lang] ?? r.name?.[DEFAULT_LANG] ?? r.code),
      datasets: [
        {
          label: indicators[0]?.name?.[lang] ?? indicators[0]?.name?.[DEFAULT_LANG] ?? indicatorCode,
          data: regions.map((r) => {
            const ind = pickForRegion(indicators, r.code, hasDisaggregation);
            return ind ? ind.value : null;
          }),
        },
      ],
    };

    res.json({ success: true, data: chartData });
  } catch (error) {
    next(error);
  }
};
