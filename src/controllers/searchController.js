import { Indicator } from "../models/Indicator.js";
import { Region } from "../models/Region.js";
import { Theme } from "../models/Theme.js";

export const search = async (req, res, next) => {
  try {
    const { q, lang = 'fr' } = req.query;

    if (!q || q.length < 2) {
      return res.status(400).json({ success: false, error: 'Requête trop courte (min 2 caractères)' });
    }

    const searchField = `name.${lang}`;
    const regex = new RegExp(q, 'i');

    // Search across themes, regions, and indicators
    const [themes, regions, indicators] = await Promise.all([
      Theme.find({ [searchField]: regex, isPublished: true }).limit(5),
      Region.find({ [searchField]: regex, isActive: true }).limit(5),
      Indicator.find({ [searchField]: regex }).limit(10),
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
