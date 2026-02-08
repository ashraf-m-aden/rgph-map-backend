/**
 * Seed data extracted from: 
 * "Tome 3 - Caractéristiques économiques de la population"
 * RGPH-3, INSTAD (2024)
 * République de Djibouti
 */

import mongoose from "mongoose";

// Assurez-vous d'avoir "type": "module" dans votre package.json
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { KeyFigure } from "../models/KeyFigure.js";
import { Indicator } from "../models/Indicator.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../../.env') });
import { connectDB } from "../config/database.js";


// ============================================================
// KEY FIGURES (Headline indicators from p. xvi)
// ============================================================
const keyFigures = [
  {
    code: 'pop_15plus',
    label: { fr: 'Population de 15 ans et plus', ar: 'السكان 15 سنة فأكثر', en: 'Population aged 15+' },
    value: 659908,
    displayValue: { fr: '659 908', ar: '659 908', en: '659,908' },
    unit: { fr: 'habitants', ar: 'نسمة', en: 'inhabitants' },
    icon: 'mdi-account-group',
    color: '#1A9553',
    themeSlug: 'caracteristiques-economiques',
    sortOrder: 1,
  },
  {
    code: 'pop_active',
    label: { fr: 'Population active', ar: 'السكان النشيطون', en: 'Active population' },
    value: 330726,
    displayValue: { fr: '330 726', ar: '330 726', en: '330,726' },
    unit: { fr: 'habitants', ar: 'نسمة', en: 'inhabitants' },
    icon: 'mdi-briefcase',
    color: '#1A5276',
    themeSlug: 'caracteristiques-economiques',
    sortOrder: 2,
  },
  {
    code: 'taux_activite',
    label: { fr: "Taux d'activité", ar: 'معدل النشاط', en: 'Activity rate' },
    value: 50.1,
    displayValue: { fr: '50,1%', ar: '%50,1', en: '50.1%' },
    icon: 'mdi-chart-line',
    color: '#6AB2E7',
    themeSlug: 'caracteristiques-economiques',
    sortOrder: 3,
  },
  {
    code: 'taux_chomage_bit',
    label: { fr: 'Taux de chômage (BIT)', ar: 'معدل البطالة (BIT)', en: 'Unemployment rate (ILO)' },
    value: 37.9,
    displayValue: { fr: '37,9%', ar: '%37,9', en: '37.9%' },
    icon: 'mdi-account-search',
    color: '#D32F2F',
    themeSlug: 'caracteristiques-economiques',
    sortOrder: 4,
  },
  {
    code: 'taux_chomage_elargi',
    label: { fr: 'Taux de chômage élargi', ar: 'معدل البطالة الموسع', en: 'Extended unemployment rate' },
    value: 44.9,
    displayValue: { fr: '44,9%', ar: '%44,9', en: '44.9%' },
    icon: 'mdi-account-alert',
    color: '#E74C3C',
    themeSlug: 'caracteristiques-economiques',
    sortOrder: 5,
  },
  {
    code: 'prop_actifs_occupes',
    label: { fr: 'Actifs occupés', ar: 'العاملون', en: 'Employed persons' },
    value: 55.1,
    displayValue: { fr: '55,1%', ar: '%55,1', en: '55.1%' },
    icon: 'mdi-account-check',
    color: '#1E8449',
    themeSlug: 'caracteristiques-economiques',
    sortOrder: 6,
  },
  {
    code: 'secteur_formel',
    label: { fr: 'Secteur formel', ar: 'القطاع الرسمي', en: 'Formal sector' },
    value: 50.9,
    displayValue: { fr: '50,9%', ar: '%50,9', en: '50.9%' },
    icon: 'mdi-domain',
    color: '#2E86C1',
    themeSlug: 'caracteristiques-economiques',
    sortOrder: 7,
  },
  {
    code: 'secteur_informel',
    label: { fr: 'Secteur informel', ar: 'القطاع غير الرسمي', en: 'Informal sector' },
    value: 49.1,
    displayValue: { fr: '49,1%', ar: '%49,1', en: '49.1%' },
    icon: 'mdi-store',
    color: '#F39C12',
    themeSlug: 'caracteristiques-economiques',
    sortOrder: 8,
  },
  {
    code: 'dependance_eco',
    label: { fr: 'Rapport de dépendance économique', ar: 'نسبة التبعية الاقتصادية', en: 'Economic dependency ratio' },
    value: 262.3,
    displayValue: { fr: '262,3%', ar: '%262,3', en: '262.3%' },
    icon: 'mdi-scale-balance',
    color: '#8E44AD',
    themeSlug: 'caracteristiques-economiques',
    sortOrder: 9,
  },
];

// ============================================================
// INDICATORS BY REGION (from various tables)
// ============================================================
const indicators = [];
const theme = 'caracteristiques-economiques';
const year = 2024;
const source = { document: 'Tome 3 - Caractéristiques économiques de la population', table: '', page: 0 };

// Helper to create indicator entries
const addIndicator = (code, name, regionCode, value, unit = 'number', disagg = {}, vizType = 'bar', src = {}) => {
  indicators.push({
    themeSlug: theme,
    indicatorCode: code,
    name,
    unit,
    regionCode,
    value,
    disaggregation: disagg,
    year,
    visualization: { chartType: vizType, showOnMap: true },
    source: { ...source, ...src },
  });
};

// ------ Tableau 3: Population 15+ par région (p.24) ------
const popRegions = {
  'DJ-DJ': 495392, 'DJ-AS': 43340, 'DJ-DI': 37075,
  'DJ-TA': 35380, 'DJ-OB': 21670, 'DJ-AR': 27051, 'DJ': 659908,
};
Object.entries(popRegions).forEach(([code, val]) => {
  addIndicator('pop_15plus', 
    { fr: 'Population de 15 ans et plus', ar: 'السكان 15 سنة فأكثر', en: 'Population aged 15+' },
    code, val, 'number', {}, 'choropleth', { table: 'Tableau 3', page: 24 });
});

// ------ Tableau 3: Population 15+ par sexe (national) ------
addIndicator('pop_15plus',
  { fr: 'Population de 15 ans et plus', ar: 'السكان 15 سنة فأكثر', en: 'Population aged 15+' },
  'DJ', 320409, 'number', { sexe: 'masculin' }, 'bar', { table: 'Tableau 3', page: 24 });
addIndicator('pop_15plus',
  { fr: 'Population de 15 ans et plus', ar: 'السكان 15 سنة فأكثر', en: 'Population aged 15+' },
  'DJ', 339499, 'number', { sexe: 'feminin' }, 'bar', { table: 'Tableau 3', page: 24 });

// ------ Tableau 3: Population 15+ par milieu ------
addIndicator('pop_15plus_milieu',
  { fr: 'Population 15+ par milieu', ar: 'السكان 15+ حسب الوسط', en: 'Population 15+ by area' },
  'DJ', 567151, 'number', { milieu: 'urbain' }, 'bar');
addIndicator('pop_15plus_milieu',
  { fr: 'Population 15+ par milieu', ar: 'السكان 15+ حسب الوسط', en: 'Population 15+ by area' },
  'DJ', 92757, 'number', { milieu: 'rural' }, 'bar');

// ------ Taux d'activité par région et sexe (Graphique 7, p.36) ------
const tauxActivite = {
  'DJ': { ensemble: 50.1, masculin: 59.7, feminin: 41.1 },
};
const tauxActiviteMilieu = {
  urbain: { ensemble: 51.9, masculin: 61.6, feminin: 42.8 },
  rural: { ensemble: 39.2, masculin: 48.0, feminin: 30.5 },
};
Object.entries(tauxActivite).forEach(([code, vals]) => {
  addIndicator('taux_activite',
    { fr: "Taux d'activité", ar: 'معدل النشاط', en: 'Activity rate' },
    code, vals.ensemble, 'percentage', {}, 'bar', { page: 36 });
  addIndicator('taux_activite',
    { fr: "Taux d'activité", ar: 'معدل النشاط', en: 'Activity rate' },
    code, vals.masculin, 'percentage', { sexe: 'masculin' }, 'bar');
  addIndicator('taux_activite',
    { fr: "Taux d'activité", ar: 'معدل النشاط', en: 'Activity rate' },
    code, vals.feminin, 'percentage', { sexe: 'feminin' }, 'bar');
});

// ------ Taux d'activité par groupe d'âge (Graphique 8, p.37) ------
const tauxActiviteAge = [
  { age: '15-19', masculin: 31.0, feminin: 32.2, ensemble: 31.6 },
  { age: '20-24', masculin: 54.0, feminin: 48.3, ensemble: 51.0 },
  { age: '25-29', masculin: 69.4, feminin: 51.9, ensemble: 60.2 },
  { age: '30-34', masculin: 74.6, feminin: 48.4, ensemble: 61.2 },
  { age: '35-39', masculin: 77.4, feminin: 51.2, ensemble: 63.7 },
  { age: '40-44', masculin: 74.7, feminin: 44.2, ensemble: 59.1 },
  { age: '45-49', masculin: 74.9, feminin: 43.9, ensemble: 58.9 },
  { age: '50-54', masculin: 72.0, feminin: 36.6, ensemble: 55.1 },
  { age: '55-59', masculin: 68.7, feminin: 31.2, ensemble: 51.4 },
  { age: '60-64', masculin: 39.4, feminin: 12.0, ensemble: 25.5 },
  { age: '65+', masculin: 21.7, feminin: 5.6, ensemble: 12.6 },
];
tauxActiviteAge.forEach(row => {
  ['masculin', 'feminin', 'ensemble'].forEach(sexe => {
    const disagg = sexe === 'ensemble' ? { tranche_age: row.age } : { tranche_age: row.age, sexe };
    addIndicator('taux_activite_age',
      { fr: "Taux d'activité par âge", ar: 'معدل النشاط حسب العمر', en: 'Activity rate by age' },
      'DJ', row[sexe], 'percentage', disagg, 'line', { table: 'Graphique 8', page: 37 });
  });
});

// ------ Composition de la population active (p.34-35) ------
addIndicator('composition_active',
  { fr: 'Actifs occupés', ar: 'العاملون', en: 'Employed persons' },
  'DJ', 55.1, 'percentage', { categorie: 'actifs_occupes' }, 'pie');
addIndicator('composition_active',
  { fr: 'Chômeurs BIT', ar: 'العاطلون (BIT)', en: 'Unemployed (ILO)' },
  'DJ', 33.7, 'percentage', { categorie: 'chomeurs_bit' }, 'pie');
addIndicator('composition_active',
  { fr: 'Chômeurs découragés', ar: 'العاطلون المحبطون', en: 'Discouraged unemployed' },
  'DJ', 11.2, 'percentage', { categorie: 'chomeurs_decourages' }, 'pie');

// ------ Tableau 11: Secteur formel/informel par sexe (p.53) ------
addIndicator('secteur_formel_informel',
  { fr: 'Secteur formel', ar: 'القطاع الرسمي', en: 'Formal sector' },
  'DJ', 50.9, 'percentage', { secteur: 'formel' }, 'bar', { table: 'Tableau 11', page: 53 });
addIndicator('secteur_formel_informel',
  { fr: 'Secteur informel', ar: 'القطاع غير الرسمي', en: 'Informal sector' },
  'DJ', 49.1, 'percentage', { secteur: 'informel' }, 'bar');
addIndicator('secteur_formel_informel',
  { fr: 'Secteur formel - Hommes', ar: 'القطاع الرسمي - رجال', en: 'Formal sector - Men' },
  'DJ', 59.8, 'percentage', { secteur: 'formel', sexe: 'masculin' }, 'bar');
addIndicator('secteur_formel_informel',
  { fr: 'Secteur informel - Hommes', ar: 'القطاع غير الرسمي - رجال', en: 'Informal sector - Men' },
  'DJ', 40.2, 'percentage', { secteur: 'informel', sexe: 'masculin' }, 'bar');
addIndicator('secteur_formel_informel',
  { fr: 'Secteur formel - Femmes', ar: 'القطاع الرسمي - نساء', en: 'Formal sector - Women' },
  'DJ', 34.9, 'percentage', { secteur: 'formel', sexe: 'feminin' }, 'bar');
addIndicator('secteur_formel_informel',
  { fr: 'Secteur informel - Femmes', ar: 'القطاع غير الرسمي - نساء', en: 'Informal sector - Women' },
  'DJ', 65.1, 'percentage', { secteur: 'informel', sexe: 'feminin' }, 'bar');

// ------ Tableau 12: Formel/Informel par région (p.55) ------
const formelInformelRegion = {
  'DJ-DJ': { formel: 53.4, informel: 46.6, effectif: 144734 },
  'DJ-AS': { formel: 40.8, informel: 59.2, effectif: 9091 },
  'DJ-DI': { formel: 45.7, informel: 54.3, effectif: 6217 },
  'DJ-TA': { formel: 40.5, informel: 59.5, effectif: 7333 },
  'DJ-OB': { formel: 31.3, informel: 68.7, effectif: 6352 },
  'DJ-AR': { formel: 45.7, informel: 54.3, effectif: 8437 },
};
Object.entries(formelInformelRegion).forEach(([code, vals]) => {
  addIndicator('taux_formel_region',
    { fr: 'Part du secteur formel', ar: 'حصة القطاع الرسمي', en: 'Formal sector share' },
    code, vals.formel, 'percentage', {}, 'choropleth', { table: 'Tableau 12', page: 55 });
  addIndicator('taux_informel_region',
    { fr: 'Part du secteur informel', ar: 'حصة القطاع غير الرسمي', en: 'Informal sector share' },
    code, vals.informel, 'percentage', {}, 'choropleth', { table: 'Tableau 12', page: 55 });
  addIndicator('effectif_actifs_occupes_region',
    { fr: 'Effectif des actifs occupés', ar: 'عدد العاملين', en: 'Number of employed persons' },
    code, vals.effectif, 'number', {}, 'choropleth', { table: 'Tableau 12', page: 55 });
});

// ------ Tableau 13: Branches d'activité (p.57) ------
const branches = [
  { code: 'agriculture', fr: 'Agriculture, sylviculture et pêche', ar: 'الزراعة والغابات والصيد', en: 'Agriculture, forestry and fishing', effectif: 6533, pct: 5.1 },
  { code: 'extractives', fr: 'Activités extractives', ar: 'أنشطة التعدين', en: 'Mining and quarrying', effectif: 266, pct: 0.2 },
  { code: 'fabrication', fr: 'Activités de fabrication', ar: 'أنشطة التصنيع', en: 'Manufacturing', effectif: 8162, pct: 6.4 },
  { code: 'electricite', fr: 'Production/distribution électricité, gaz', ar: 'إنتاج وتوزيع الكهرباء والغاز', en: 'Electricity, gas supply', effectif: 1531, pct: 1.2 },
  { code: 'eau', fr: "Distribution d'eau, assainissement", ar: 'توزيع المياه والصرف الصحي', en: 'Water supply, waste management', effectif: 1243, pct: 1.0 },
  { code: 'construction', fr: 'Construction', ar: 'البناء', en: 'Construction', effectif: 8975, pct: 7.0 },
  { code: 'commerce', fr: 'Commerce de gros et de détail', ar: 'تجارة الجملة والتجزئة', en: 'Wholesale and retail trade', effectif: 17227, pct: 13.5 },
  { code: 'transport', fr: 'Transport et entreposage', ar: 'النقل والتخزين', en: 'Transportation and storage', effectif: 13492, pct: 10.6 },
  { code: 'hebergement', fr: 'Hébergement et restauration', ar: 'الإقامة والمطاعم', en: 'Accommodation and food service', effectif: 2342, pct: 1.8 },
  { code: 'info_comm', fr: 'Information et communication', ar: 'المعلومات والاتصالات', en: 'Information and communication', effectif: 3042, pct: 2.4 },
  { code: 'finance', fr: 'Activités financières et assurances', ar: 'الأنشطة المالية والتأمين', en: 'Financial and insurance activities', effectif: 2214, pct: 1.7 },
  { code: 'immobilier', fr: 'Activités immobilières', ar: 'الأنشطة العقارية', en: 'Real estate activities', effectif: 199, pct: 0.2 },
  { code: 'professionnel', fr: 'Activités professionnelles, scientifiques', ar: 'الأنشطة المهنية والعلمية', en: 'Professional, scientific activities', effectif: 3321, pct: 2.6 },
  { code: 'services_admin', fr: 'Services administratifs et appui', ar: 'الخدمات الإدارية والدعم', en: 'Administrative and support services', effectif: 7598, pct: 6.0 },
  { code: 'admin_publique', fr: 'Administration publique et défense', ar: 'الإدارة العامة والدفاع', en: 'Public administration and defence', effectif: 29441, pct: 23.1 },
  { code: 'education', fr: 'Éducation', ar: 'التعليم', en: 'Education', effectif: 5832, pct: 4.6 },
  { code: 'sante', fr: 'Santé et action sociale', ar: 'الصحة والعمل الاجتماعي', en: 'Health and social work', effectif: 2147, pct: 1.7 },
  { code: 'arts', fr: 'Arts, spectacles et loisirs', ar: 'الفنون والترفيه', en: 'Arts, entertainment and recreation', effectif: 403, pct: 0.3 },
  { code: 'autres_services', fr: 'Autres activités de services', ar: 'أنشطة خدمية أخرى', en: 'Other service activities', effectif: 1248, pct: 1.0 },
  { code: 'menages_prives', fr: 'Ménages privés (personnel domestique)', ar: 'الأسر الخاصة (العمالة المنزلية)', en: 'Private households (domestic staff)', effectif: 9618, pct: 7.5 },
  { code: 'organisations_intl', fr: 'Organisations extraterritoriales', ar: 'المنظمات الدولية', en: 'International organisations', effectif: 2692, pct: 2.1 },
];
branches.forEach(b => {
  addIndicator('branche_activite',
    { fr: b.fr, ar: b.ar, en: b.en },
    'DJ', b.effectif, 'number', { branche: b.code }, 'bar', { table: 'Tableau 13', page: 57 });
  addIndicator('branche_activite_pct',
    { fr: b.fr, ar: b.ar, en: b.en },
    'DJ', b.pct, 'percentage', { branche: b.code }, 'bar', { table: 'Tableau 13', page: 57 });
});

// ------ Secteurs primaire/secondaire/tertiaire (p.59) ------
addIndicator('secteur_activite',
  { fr: 'Secteur primaire', ar: 'القطاع الأولي', en: 'Primary sector' },
  'DJ', 5.1, 'percentage', { secteur: 'primaire' }, 'pie');
addIndicator('secteur_activite',
  { fr: 'Secteur secondaire', ar: 'القطاع الثانوي', en: 'Secondary sector' },
  'DJ', 8.8, 'percentage', { secteur: 'secondaire' }, 'pie');
addIndicator('secteur_activite',
  { fr: 'Secteur tertiaire', ar: 'القطاع الثالثي', en: 'Tertiary sector' },
  'DJ', 86.1, 'percentage', { secteur: 'tertiaire' }, 'pie');

// ------ Taux de chômage par sexe (p. xvi + graphiques) ------
addIndicator('taux_chomage_bit',
  { fr: 'Taux de chômage BIT', ar: 'معدل البطالة (BIT)', en: 'ILO unemployment rate' },
  'DJ', 37.9, 'percentage', {}, 'bar');
addIndicator('taux_chomage_bit',
  { fr: 'Taux de chômage BIT', ar: 'معدل البطالة (BIT)', en: 'ILO unemployment rate' },
  'DJ', 33.2, 'percentage', { sexe: 'masculin' }, 'bar');
addIndicator('taux_chomage_bit',
  { fr: 'Taux de chômage BIT', ar: 'معدل البطالة (BIT)', en: 'ILO unemployment rate' },
  'DJ', 44.9, 'percentage', { sexe: 'feminin' }, 'bar');

addIndicator('taux_chomage_elargi',
  { fr: 'Taux de chômage élargi', ar: 'معدل البطالة الموسع', en: 'Extended unemployment rate' },
  'DJ', 44.9, 'percentage', {}, 'bar');
addIndicator('taux_chomage_elargi',
  { fr: 'Taux de chômage élargi', ar: 'معدل البطالة الموسع', en: 'Extended unemployment rate' },
  'DJ', 39.0, 'percentage', { sexe: 'masculin' }, 'bar');
addIndicator('taux_chomage_elargi',
  { fr: 'Taux de chômage élargi', ar: 'معدل البطالة الموسع', en: 'Extended unemployment rate' },
  'DJ', 53.1, 'percentage', { sexe: 'feminin' }, 'bar');

// ------ Niveau d'instruction (from résumé, p.xiii) ------
const niveauInstruction = [
  { niveau: 'sans_instruction', fr: 'Sans instruction', ar: 'بدون تعليم', en: 'No education', pct: 54.4, pctH: 47.9, pctF: 60.6 },
  { niveau: 'primaire', fr: 'Primaire', ar: 'ابتدائي', en: 'Primary', pct: 5.4, pctH: 5.4, pctF: 5.4 },
  { niveau: 'secondaire1', fr: 'Secondaire 1', ar: 'ثانوي 1', en: 'Lower secondary', pct: 13.9, pctH: 15.9, pctF: 12.0 },
  { niveau: 'secondaire2', fr: 'Secondaire 2', ar: 'ثانوي 2', en: 'Upper secondary', pct: 13.6, pctH: 15.9, pctF: 11.5 },
  { niveau: 'superieur', fr: 'Supérieur', ar: 'عالي', en: 'Higher education', pct: 12.6, pctH: 15.0, pctF: 10.4 },
];
niveauInstruction.forEach(n => {
  addIndicator('niveau_instruction',
    { fr: n.fr, ar: n.ar, en: n.en },
    'DJ', n.pct, 'percentage', { niveau: n.niveau }, 'bar', { table: 'Tableau 4', page: 26 });
  addIndicator('niveau_instruction',
    { fr: n.fr, ar: n.ar, en: n.en },
    'DJ', n.pctH, 'percentage', { niveau: n.niveau, sexe: 'masculin' }, 'bar');
  addIndicator('niveau_instruction',
    { fr: n.fr, ar: n.ar, en: n.en },
    'DJ', n.pctF, 'percentage', { niveau: n.niveau, sexe: 'feminin' }, 'bar');
});

// ------ Tableau 15: Secteurs par région (p.62) ------
// Secteur primaire/secondaire/tertiaire
const secteursParRegion = {
  'DJ-DJ': { primaire: 3.0, secondaire: 9.2, tertiaire: 87.8 },
  'DJ-AS': { primaire: 12.1, secondaire: 7.3, tertiaire: 80.6 },
  'DJ-DI': { primaire: 13.4, secondaire: 7.7, tertiaire: 78.9 },
  'DJ-TA': { primaire: 16.2, secondaire: 5.8, tertiaire: 78.0 },
  'DJ-OB': { primaire: 30.5, secondaire: 4.2, tertiaire: 65.3 },
  'DJ-AR': { primaire: 7.4, secondaire: 9.2, tertiaire: 83.4 },
};
Object.entries(secteursParRegion).forEach(([code, vals]) => {
  ['primaire', 'secondaire', 'tertiaire'].forEach(secteur => {
    addIndicator(`secteur_${secteur}_region`,
      { fr: `Secteur ${secteur}`, ar: `القطاع ${secteur === 'primaire' ? 'الأولي' : secteur === 'secondaire' ? 'الثانوي' : 'الثالثي'}`, en: `${secteur.charAt(0).toUpperCase() + secteur.slice(1)} sector` },
      code, vals[secteur], 'percentage', { secteur }, 'choropleth', { table: 'Tableau 15', page: 62 });
  });
});

// ------ Population inactive (Chapitre 5) ------
addIndicator('pop_inactive',
  { fr: 'Population inactive', ar: 'السكان غير النشيطين', en: 'Inactive population' },
  'DJ', 563279, 'number', {}, 'bar');
addIndicator('prop_inactifs_sexe',
  { fr: 'Proportion inactifs masculins', ar: 'نسبة غير النشيطين ذكور', en: 'Male inactive proportion' },
  'DJ', 42.7, 'percentage', { sexe: 'masculin' }, 'pie');
addIndicator('prop_inactifs_sexe',
  { fr: 'Proportion inactifs féminins', ar: 'نسبة غير النشيطين إناث', en: 'Female inactive proportion' },
  'DJ', 57.3, 'percentage', { sexe: 'feminin' }, 'pie');

// ------ Travail des enfants (p.63) ------
addIndicator('travail_enfants',
  { fr: 'Enfants occupés (10-14 ans)', ar: 'الأطفال العاملون (10-14 سنة)', en: 'Working children (10-14 years)' },
  'DJ', 20248, 'number', {}, 'bar', { table: 'Tableau 16', page: 63 });
addIndicator('travail_enfants_informel',
  { fr: 'Enfants dans le secteur informel', ar: 'الأطفال في القطاع غير الرسمي', en: 'Children in informal sector' },
  'DJ', 98.8, 'percentage', {}, 'bar');

// ------ Secteur institutionnel (Graphique 15, p.52) ------
const secteurInstitutionnel = [
  { code: 'public_admin', fr: 'Public (administrations)', value: 38.4 },
  { code: 'public_contractuel', fr: 'Public (contractuel/collectivités)', value: 2.7 },
  { code: 'parapublic', fr: 'Parapublic', value: 1.6 },
  { code: 'prive_formel', fr: 'Privé formel', value: 14.5 },
  { code: 'prive_informel', fr: 'Privé informel', value: 42.1 },
  { code: 'institutions_intl', fr: 'Institutions internationales', value: 0.2 },
  { code: 'ong', fr: 'ONG', value: 0.2 },
  { code: 'association', fr: 'Association', value: 0.1 },
  { code: 'projet', fr: 'Projet', value: 0.3 },
];
secteurInstitutionnel.forEach(s => {
  addIndicator('secteur_institutionnel',
    { fr: s.fr, ar: s.fr, en: s.fr },
    'DJ', s.value, 'percentage', { secteur_inst: s.code }, 'bar', { page: 52 });
});

// ============================================================
// SEED FUNCTION
// ============================================================
async function seedEconomicData() {
  try {
    await connectDB();
    console.log('🌱 Seeding economic characteristics data...');
    console.log(`   📊 ${keyFigures.length} key figures`);
    console.log(`   📈 ${indicators.length} indicators`);

    // Clear existing economic data
    await KeyFigure.deleteMany({ themeSlug: 'caracteristiques-economiques' });
    await Indicator.deleteMany({ themeSlug: 'caracteristiques-economiques' });

    // Insert
    await KeyFigure.insertMany(keyFigures);
    console.log(`   ✅ Key figures inserted`);

    await Indicator.insertMany(indicators);
    console.log(`   ✅ Indicators inserted`);

    console.log('🎉 Economic data seeded successfully!');
    console.log(`   Total: ${keyFigures.length} key figures + ${indicators.length} indicators`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
}

seedEconomicData();
