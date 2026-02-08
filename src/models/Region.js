import mongoose from "mongoose";

/**
 * Region Schema
 * Represents administrative divisions of Djibouti:
 * - country (Djibouti)
 * - region (Ali Sabieh, Arta, Dikhil, Djibouti, Obock, Tadjourah)
 * - district (sous-préfecture)
 * - commune
 */
const regionSchema = new mongoose.Schema({
  // Unique code for this region (e.g., "DJ", "DJ-AS", "DJ-AR", etc.)
  code: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },

  // Administrative level
  level: {
    type: String,
    enum: ['country', 'region', 'district', 'commune'],
    required: true,
    index: true,
  },

  // Name in multiple languages
  name: {
    fr: { type: String, required: true },
    ar: { type: String, required: true },
    en: { type: String, required: true },
  },

  // Parent region code (null for country level)
  parentCode: {
    type: String,
    default: null,
    index: true,
  },

  // Geographic center (for map labels)
  center: {
    lat: { type: Number },
    lng: { type: Number },
  },

  // Area in km²
  area: {
    type: Number,
  },

  // GeoJSON feature ID (links to GeoJSON data)
  geoFeatureId: {
    type: String,
  },

  // Sort order for display
  sortOrder: {
    type: Number,
    default: 0,
  },

  // Whether this region is active/visible
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// Indexes
regionSchema.index({ level: 1, parentCode: 1 });
regionSchema.index({ 'name.fr': 'text', 'name.ar': 'text', 'name.en': 'text' });

export const Region =  mongoose.model('Region', regionSchema);
