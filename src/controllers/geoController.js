import fs from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

import { GeoData } from "../models/GeoData.js";
import { ADMIN_LEVELS } from "../utils/query.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Le fichier embarque ne decrit que les 6 regions : il ne peut servir de
// repli que pour ce niveau (il renvoyait auparavant les regions pour
// n'importe quel niveau demande, avec success: true).
const FALLBACK_FILES = {
  region: join(__dirname, "../../data/djibouti-regions.geojson"),
};

export const getGeoJSON = async (req, res, next) => {
  try {
    const { level } = req.params;

    if (!ADMIN_LEVELS.includes(level)) {
      return res.status(400).json({
        success: false,
        error: `Niveau inconnu : "${level}" (attendu : ${ADMIN_LEVELS.join(", ")})`,
      });
    }

    const geoData = await GeoData.findOne({ level }).lean();
    if (geoData?.geojson) {
      res.set("Cache-Control", "public, max-age=86400");
      return res.json({ success: true, data: geoData.geojson, source: "database" });
    }

    const fallbackPath = FALLBACK_FILES[level];
    if (fallbackPath && fs.existsSync(fallbackPath)) {
      const geojson = JSON.parse(fs.readFileSync(fallbackPath, "utf-8"));
      res.set("Cache-Control", "public, max-age=86400");
      return res.json({ success: true, data: geojson, source: "file" });
    }

    return res.status(404).json({
      success: false,
      error: `Données géographiques non trouvées pour le niveau "${level}"`,
    });
  } catch (error) {
    next(error);
  }
};
