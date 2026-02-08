import mongoose from "mongoose";

/**
 * Theme Schema
 * Represents a thematic category of census data
 * e.g., "Démographie", "Santé", "Éducation", "Caractéristiques économiques"
 */
const themeSchema = new mongoose.Schema({
  // Unique slug identifier
  slug: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },

  // Theme name in multiple languages
  name: {
    fr: { type: String, required: true },
    ar: { type: String, required: true },
    en: { type: String, required: true },
  },

  // Description
  description: {
    fr: { type: String },
    ar: { type: String },
    en: { type: String },
  },

  // Icon name (for UI display, e.g., Material Icons or custom)
  icon: {
    type: String,
    default: 'mdi-chart-bar',
  },

  // Color theme for this category
  color: {
    type: String,
    default: '#8B1A1A',
  },

  // Parent theme slug (for sub-themes)
  parentSlug: {
    type: String,
    default: null,
    index: true,
  },

  // Sort order
  sortOrder: {
    type: Number,
    default: 0,
  },

  // Whether this theme is published
  isPublished: {
    type: Boolean,
    default: true,
  },

  // Source document reference
  sourceDocument: {
    title: { type: String },
    pages: { type: String },
    year: { type: Number, default: 2024 },
  },
}, {
  timestamps: true,
});

export const Theme = mongoose.model('Theme', themeSchema);
