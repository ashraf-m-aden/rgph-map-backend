import { GeoData } from "../models/GeoData.js";
import fs from 'fs';
import path from 'path';
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, "../../.env") });

export const getGeoJSON = async (req, res, next) => {
  try {
    const { level } = req.params;
    console.log(level);
    
    const geoData = await GeoData.findOne({ level });
    if (geoData) {
      res.set('Cache-Control', 'public, max-age=86400');
      return res.json({ success: true, data: geoData.geojson });
    }

    // Fallback: serve directly from file
    const filePath = path.join(__dirname, '../../data/djibouti-regions.geojson');
    if (fs.existsSync(filePath)) {
      const geojson = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      res.set('Cache-Control', 'public, max-age=86400');
      return res.json({ success: true, data: geojson });
    }
    if (!geoData) {
      return res.status(404).json({ success: false, error: 'Données géographiques non trouvées' });
    }

    // Set cache headers (GeoJSON rarely changes)
    res.set('Cache-Control', 'public, max-age=86400');
    res.json({ success: true, data: geoData.geojson });
  } catch (error) {
    next(error);
  }
};
