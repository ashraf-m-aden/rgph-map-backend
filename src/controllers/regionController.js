import { Indicator } from "../models/Indicator.js";
import { Region } from "../models/Region.js";
import { Theme } from "../models/Theme.js";


export const getAll = async (req, res, next) => {
  try {
    const { level, parentCode } = req.query;
    const filter = { isActive: true };

    if (level) filter.level = level;
    if (parentCode) filter.parentCode = parentCode;

    const regions = await Region.find(filter).sort({ sortOrder: 1 });
    res.json({ success: true, data: regions });
  } catch (error) {
    next(error);
  }
};

export const getByCode = async (req, res, next) => {
  try {
    const region = await Region.findOne({ code: req.params.code, isActive: true });
    if (!region) {
      return res.status(404).json({ success: false, error: 'Région non trouvée' });
    }
    res.json({ success: true, data: region });
  } catch (error) {
    next(error);
  }
};

export const getChildren = async (req, res, next) => {
  try {
    const children = await Region.find({
      parentCode: req.params.code,
      isActive: true,
    }).sort({ sortOrder: 1 });

    res.json({ success: true, data: children });
  } catch (error) {
    next(error);
  }
};

export const getIndicators = async (req, res, next) => {
  try {
    const { themeSlug, indicatorCode } = req.query;
    const filter = { regionCode: req.params.code };

    if (themeSlug) filter.themeSlug = themeSlug;
    if (indicatorCode) filter.indicatorCode = indicatorCode;

    const indicators = await Indicator.find(filter);
    res.json({ success: true, data: indicators });
  } catch (error) {
    next(error);
  }
};
