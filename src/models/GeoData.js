import mongoose from "mongoose";

/**
 * GeoData Schema
 * Stores GeoJSON features for map rendering.
 * Separate from Region model to keep geographic data lightweight.
 */
const geoDataSchema = new mongoose.Schema(
  {
    // Administrative level
    level: {
      type: String,
      enum: ["country", "region", "district", "commune"],
      required: true,
      index: true,
    },

    // Full GeoJSON FeatureCollection
    geojson: {
      type: {
        type: String,
        enum: ["FeatureCollection"],
        default: "FeatureCollection",
      },
      features: [
        {
          type: {
            type: String,
            enum: ["Feature"],
            default: "Feature",
          },
          properties: {
            type: mongoose.Schema.Types.Mixed,
          },
          geometry: {
            type: {
              type: String,
              enum: ["Polygon", "MultiPolygon"],
              required: true,
            },
            coordinates: {
              type: mongoose.Schema.Types.Mixed,
              required: true,
            },
          },
        },
      ],
    },

    // Metadata
    source: { type: String },
    lastUpdated: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  },
);

export const GeoData = mongoose.model("GeoData", geoDataSchema);
