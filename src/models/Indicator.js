import mongoose from "mongoose";

/**
 * Indicator Schema
 * Core data model — stores all census indicator values.
 * Flexible enough for any theme: demographics, economy, education, health, etc.
 *
 * Example usage:
 * - Population totale by region → theme: "demographie", indicator: "population_totale"
 * - Taux de chômage by region/sex → theme: "economie", indicator: "taux_chomage", disaggregation: { sexe: "masculin" }
 * - Taux d'alphabétisation → theme: "education", indicator: "taux_alphabetisation"
 */
const indicatorSchema = new mongoose.Schema({
  // Link to theme
  themeSlug: {
    type: String,
    required: true,
    index: true,
  },

  // Indicator identifier (unique within a theme)
  indicatorCode: {
    type: String,
    required: true,
    index: true,
  },

  // Indicator name in multiple languages
  name: {
    fr: { type: String, required: true },
    ar: { type: String, required: true },
    en: { type: String, required: true },
  },

  // Unit of measurement
  unit: {
    type: String,
    enum: ['number', 'percentage', 'ratio', 'per_thousand', 'per_hundred_thousand', 'years', 'index', 'currency'],
    default: 'number',
  },

  // Region code this data belongs to
  regionCode: {
    type: String,
    required: true,
    index: true,
  },

  // The value
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },

  // Disaggregation dimensions (flexible key-value pairs)
  // e.g., { sexe: "masculin", tranche_age: "15-24", milieu: "urbain" }
  disaggregation: {
    type: Map,
    of: String,
    default: {},
  },

  // Reference year
  year: {
    type: Number,
    default: 2024,
    index: true,
  },

  // Visualization hints
  visualization: {
    // Suggested chart type
    chartType: {
      type: String,
      enum: ['choropleth', 'bar', 'pie', 'line', 'stacked_bar', 'treemap', 'gauge', 'table'],
      default: 'bar',
    },
    // Color scale for choropleth
    colorScale: {
      min: { type: String, default: '#FEE5D9' },
      max: { type: String, default: '#A50F15' },
    },
    // Number formatting
    decimals: { type: Number, default: 0 },
    // Whether to show on map
    showOnMap: { type: Boolean, default: true },
  },

  // Source info
  source: {
    document: { type: String },
    table: { type: String },
    page: { type: Number },
  },

  // Notes
  notes: {
    fr: { type: String },
    ar: { type: String },
    en: { type: String },
  },
}, {
  timestamps: true,
});

// Compound indexes for efficient queries
indicatorSchema.index({ themeSlug: 1, indicatorCode: 1, regionCode: 1 });
indicatorSchema.index({ themeSlug: 1, indicatorCode: 1, regionCode: 1, year: 1 });
indicatorSchema.index({ indicatorCode: 1, regionCode: 1, 'disaggregation': 1 });

// Text search index
indicatorSchema.index({ 'name.fr': 'text', 'name.ar': 'text', 'name.en': 'text' });

export const Indicator = mongoose.model('Indicator', indicatorSchema);
