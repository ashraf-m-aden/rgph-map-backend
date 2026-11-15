import express from 'express';
import { getAll, getByCode, getChildren, getIndicators } from '../controllers/regionController.js';
const router = express.Router();

// GET /api/regions — List all regions (with optional level/parentCode filter)
router.get('/', getAll);

// GET /api/regions/:code — Get a single region by code
router.get('/:code', getByCode);

// GET /api/regions/:code/children — Get child regions
router.get('/:code/children', getChildren);

// GET /api/regions/:code/indicators — Get all indicators for a region
router.get('/:code/indicators', getIndicators);


export default router;
