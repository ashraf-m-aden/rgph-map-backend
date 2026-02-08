import express from 'express';
import { getGeoJSON } from '../controllers/geoController.js';
const router = express.Router();

// GET /api/geo/:level — Get GeoJSON for a level (country, region, district, commune)
router.get('/:level',getGeoJSON);

export default router;
