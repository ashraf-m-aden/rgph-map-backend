import express from 'express';
import { getAll, getBySlug, getKeyFigures } from '../controllers/themeController.js';
const router = express.Router();

// GET /api/themes — List all themes (hierarchical)
router.get('/', getAll);

// GET /api/themes/:slug — Get a single theme with its indicators list
router.get('/:slug', getBySlug);

// GET /api/themes/:slug/key-figures — Get key figures for a theme
router.get('/:slug/key-figures', getKeyFigures);

export default router;
