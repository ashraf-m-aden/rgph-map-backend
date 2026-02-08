import mongoose from "mongoose";

/**
 * KeyFigure Schema
 * Stores headline/key statistics displayed on the dashboard home page.
 * e.g., "Population totale: 1,200,000", "Nombre de ménages: 150,000"
 */
const keyFigureSchema = new mongoose.Schema({
  // Unique code
  code: {
    type: String,
    required: true,
    unique: true,
  },

  // Label in multiple languages
  label: {
    fr: { type: String, required: true },
    ar: { type: String, required: true },
    en: { type: String, required: true },
  },

  // The value to display
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },

  // Formatted display value
  displayValue: {
    fr: { type: String },
    ar: { type: String },
    en: { type: String },
  },

  // Unit
  unit: {
    fr: { type: String },
    ar: { type: String },
    en: { type: String },
  },

  // Icon
  icon: { type: String },

  // Color
  color: { type: String, default: '#8B1A1A' },

  // Theme association
  themeSlug: { type: String, index: true },

  // Sort order
  sortOrder: { type: Number, default: 0 },

  // Year
  year: { type: Number, default: 2024 },
}, {
  timestamps: true,
});

export const KeyFigure = mongoose.model('KeyFigure', keyFigureSchema);
