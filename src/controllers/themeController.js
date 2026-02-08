import { Indicator } from "../models/Indicator.js";
import { KeyFigure } from "../models/KeyFigure.js";
import { Region } from "../models/Region.js";
import { Theme } from "../models/Theme.js";

export const getAll = async (req, res, next) => {
  try {
    const themes = await Theme.find({ isPublished: true }).sort({ sortOrder: 1 });

    // Build hierarchical structure
    const rootThemes = themes.filter(t => !t.parentSlug);
    const hierarchy = rootThemes.map(root => ({
      ...root.toObject(),
      children: themes.filter(t => t.parentSlug === root.slug),
    }));

    res.json({ success: true, data: hierarchy });
  } catch (error) {
    next(error);
  }
};

export const getBySlug = async (req, res, next) => {
  try {
    const theme = await Theme.findOne({ slug: req.params.slug, isPublished: true });
    if (!theme) {
      return res.status(404).json({ success: false, error: 'Thème non trouvé' });
    }

    // Get unique indicator codes for this theme
    const indicatorCodes = await Indicator.distinct('indicatorCode', {
      themeSlug: req.params.slug,
    });

    // Get indicator metadata (name, unit, etc.) for each code
    const indicatorsMeta = await Promise.all(
      indicatorCodes.map(async (code) => {
        const sample = await Indicator.findOne({ indicatorCode: code }).select('name unit visualization');
        return {
          code,
          name: sample?.name,
          unit: sample?.unit,
          visualization: sample?.visualization,
        };
      })
    );

    // Get sub-themes
    const subThemes = await Theme.find({ parentSlug: req.params.slug, isPublished: true }).sort({ sortOrder: 1 });

    res.json({
      success: true,
      data: {
        theme,
        indicators: indicatorsMeta,
        subThemes,
      },
    });
  } catch (error) {
    next(error);
  }
};


export const getKeyFigures = async (req, res, next) => {
  try {
    const keyFigures = await KeyFigure.find({ themeSlug: req.params.slug }).sort({ sortOrder: 1 });
    res.json({ success: true, data: keyFigures });
  } catch (error) {
    next(error);
  }
};
