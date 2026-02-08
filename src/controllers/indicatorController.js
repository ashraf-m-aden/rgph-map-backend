import { Indicator } from "../models/Indicator.js";
import { Region } from "../models/Region.js";
import { Theme } from "../models/Theme.js";

export const getAll = async (req, res, next) => {
  try {
    const { theme, indicator, region, year, ...disaggregations } = req.query;
    const filter = {};

    if (theme) filter.themeSlug = theme;
    if (indicator) filter.indicatorCode = indicator;
    if (region) filter.regionCode = region;
    if (year) filter.year = parseInt(year);

    // Handle disaggregation filters
    // e.g., ?disaggregation.sexe=masculin&disaggregation.milieu=urbain
    Object.keys(disaggregations).forEach(key => {
      if (key.startsWith('disaggregation.')) {
        filter[key] = disaggregations[key];
      }
    });

    const indicators = await Indicator.find(filter).sort({ regionCode: 1 });
    res.json({ success: true, count: indicators.length, data: indicators });
  } catch (error) {
    next(error);
  }
};

export const getByTheme = async (req, res, next) => {
  try {
    const { themeSlug } = req.params;
    const { regionCode, level } = req.query;

    const filter = { themeSlug };
    if (regionCode) filter.regionCode = regionCode;

    // If level is specified, get all regions at that level and filter
    if (level) {
      const regions = await Region.find({ level }).select('code');
      const regionCodes = regions.map(r => r.code);
      filter.regionCode = { $in: regionCodes };
    }

    const indicators = await Indicator.find(filter).sort({ indicatorCode: 1, regionCode: 1 });

    // Group by indicator code
    const grouped = {};
    indicators.forEach(ind => {
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
        disaggregation: ind.disaggregation,
      });
    });

    res.json({ success: true, data: Object.values(grouped) });
  } catch (error) {
    next(error);
  }
};

export const getMapData = async (req, res, next) => {
  try {
    const { indicatorCode } = req.params;
    const { level = 'region', disaggregation } = req.query;

    // Get regions at the specified level
    const regions = await Region.find({ level }).select('code name center');
    const regionCodes = regions.map(r => r.code);

    // Build filter
    const filter = {
      indicatorCode,
      regionCode: { $in: regionCodes },
    };

    // Parse disaggregation filter if provided
    if (disaggregation) {
      try {
        const disagg = JSON.parse(disaggregation);
        Object.keys(disagg).forEach(key => {
          filter[`disaggregation.${key}`] = disagg[key];
        });
      } catch (e) {
        // Ignore parse errors
      }
    }

    const indicators = await Indicator.find(filter);

    // Build map-ready data
    const mapData = regions.map(region => {
      const ind = indicators.find(i => i.regionCode === region.code);
      return {
        regionCode: region.code,
        regionName: region.name,
        center: region.center,
        value: ind ? ind.value : null,
        unit: ind ? ind.unit : null,
      };
    });

    // Calculate min/max for color scale
    const values = mapData.filter(d => d.value !== null).map(d => d.value);
    const min = Math.min(...values);
    const max = Math.max(...values);

    res.json({
      success: true,
      data: {
        indicatorCode,
        mapData,
        scale: { min, max },
        visualization: indicators[0]?.visualization || {},
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

    const regionCodes = regions.split(',');
    const data = await Indicator.find({
      indicatorCode: indicator,
      regionCode: { $in: regionCodes },
    });

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const getChartData = async (req, res, next) => {
  try {
    const { indicatorCode } = req.params;
    const { level = 'region', groupBy = 'region' } = req.query;

    const regions = await Region.find({ level });
    const regionCodes = regions.map(r => r.code);

    const indicators = await Indicator.find({
      indicatorCode,
      regionCode: { $in: regionCodes },
    });

    // Format for chart consumption
    const chartData = {
      labels: [],
      datasets: [],
    };

    if (groupBy === 'region') {
      chartData.labels = regions.map(r => r.name);
      chartData.datasets.push({
        data: regions.map(r => {
          const ind = indicators.find(i => i.regionCode === r.code);
          return ind ? ind.value : 0;
        }),
      });
    }

    res.json({ success: true, data: chartData });
  } catch (error) {
    next(error);
  }
};
