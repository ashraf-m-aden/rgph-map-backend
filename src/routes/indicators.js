import express from 'express';
const router = express.Router();
import { compare, getAll, getByTheme, getChartData, getMapData } from '../controllers/indicatorController.js';

// GET /api/indicators — List indicators (with filters)
// Query params: ?theme=economie&indicator=taux_chomage&region=DJ-AS&disaggregation[sexe]=masculin
//               (la forme ?disaggregation.sexe=masculin est acceptee aussi)
// Pagination : ?limit=100&offset=0
router.get('/', getAll);

// GET /api/indicators/by-theme/:themeSlug — Get all indicators for a theme
router.get('/by-theme/:themeSlug', getByTheme);

// GET /api/indicators/map-data/:indicatorCode — Get data formatted for choropleth map
router.get('/map-data/:indicatorCode', getMapData);

// GET /api/indicators/compare — Compare indicator across regions
// Query params: ?indicator=population_totale&regions=DJ-AS,DJ-AR,DJ-DI
router.get('/compare', compare);

// GET /api/indicators/chart-data/:indicatorCode — Get data formatted for charts
// Query params: ?level=region&groupBy=region&lang=fr
router.get('/chart-data/:indicatorCode', getChartData);

export default router;
