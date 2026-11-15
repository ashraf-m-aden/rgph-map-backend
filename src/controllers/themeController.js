import { Indicator } from "../models/Indicator.js";
import { KeyFigure } from "../models/KeyFigure.js";
import { Region } from "../models/Region.js";
import { Theme } from "../models/Theme.js";

export const getAll = async (req, res, next) => {
  try {
    const themes = await Theme.find({ isPublished: true }).sort({ sortOrder: 1 }).lean();

    // Build hierarchical structure
    const rootThemes = themes.filter(t => !t.parentSlug);
    const hierarchy = rootThemes.map(root => ({
      ...root,
      children: themes.filter(t => t.parentSlug === root.slug),
    }));

    res.json({ success: true, data: hierarchy });
  } catch (error) {
    next(error);
  }
};

export const getBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;

    const theme = await Theme.findOne({ slug, isPublished: true }).lean();
    if (!theme) {
      return res.status(404).json({ success: false, error: 'Thème non trouvé' });
    }

    // Une seule agregation pour les metadonnees de chaque indicateur du theme :
    // l'ancienne version enchainait un distinct() puis un findOne() par code
    // (64 requetes pour ce theme), et ce findOne omettait le filtre themeSlug.
    const [aggregated, regionLevelCodes] = await Promise.all([
      Indicator.aggregate([
        { $match: { themeSlug: slug } },
        { $sort: { indicatorCode: 1, regionCode: 1 } },
        {
          $group: {
            _id: "$indicatorCode",
            name: { $first: "$name" },
            unit: { $first: "$unit" },
            visualization: { $first: "$visualization" },
            regionCodes: { $addToSet: "$regionCode" },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Region.find({ level: "region" }).select("code").lean(),
    ]);

    const regionCodes = new Set(regionLevelCodes.map(r => r.code));

    // hasRegionalData distingue les indicateurs cartographiables de ceux qui
    // n'existent qu'au niveau national : sans cette information le selecteur
    // du frontend propose des indicateurs qui laissent la carte vide.
    const indicators = aggregated.map(doc => ({
      code: doc._id,
      name: doc.name,
      unit: doc.unit,
      visualization: doc.visualization,
      count: doc.count,
      hasRegionalData: doc.regionCodes.some(code => regionCodes.has(code)),
    }));

    // Get sub-themes
    const subThemes = await Theme.find({ parentSlug: slug, isPublished: true })
      .sort({ sortOrder: 1 })
      .lean();

    res.json({
      success: true,
      data: {
        theme,
        indicators,
        subThemes,
      },
    });
  } catch (error) {
    next(error);
  }
};


export const getKeyFigures = async (req, res, next) => {
  try {
    const keyFigures = await KeyFigure.find({ themeSlug: req.params.slug })
      .sort({ sortOrder: 1 })
      .lean();
    res.json({ success: true, count: keyFigures.length, data: keyFigures });
  } catch (error) {
    next(error);
  }
};
