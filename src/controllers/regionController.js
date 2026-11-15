import { Indicator } from "../models/Indicator.js";
import { Region } from "../models/Region.js";
import { ADMIN_LEVELS, parsePagination } from "../utils/query.js";


export const getAll = async (req, res, next) => {
  try {
    const { level, parentCode } = req.query;
    const filter = { isActive: true };

    if (level) {
      if (!ADMIN_LEVELS.includes(level)) {
        return res.status(400).json({
          success: false,
          error: `Niveau inconnu : "${level}" (attendu : ${ADMIN_LEVELS.join(", ")})`,
        });
      }
      filter.level = level;
    }
    if (parentCode) filter.parentCode = parentCode;

    const regions = await Region.find(filter).sort({ sortOrder: 1 }).lean();
    res.json({ success: true, count: regions.length, data: regions });
  } catch (error) {
    next(error);
  }
};

export const getByCode = async (req, res, next) => {
  try {
    const region = await Region.findOne({ code: req.params.code, isActive: true }).lean();
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
    })
      .sort({ sortOrder: 1 })
      .lean();

    res.json({ success: true, count: children.length, data: children });
  } catch (error) {
    next(error);
  }
};

export const getIndicators = async (req, res, next) => {
  try {
    const { themeSlug, indicatorCode } = req.query;
    const { limit, offset } = parsePagination(req.query);
    const filter = { regionCode: req.params.code };

    if (themeSlug) filter.themeSlug = themeSlug;
    if (indicatorCode) filter.indicatorCode = indicatorCode;

    const [total, indicators] = await Promise.all([
      Indicator.countDocuments(filter),
      Indicator.find(filter)
        .sort({ indicatorCode: 1 })
        .skip(offset)
        .limit(limit)
        .lean(),
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
