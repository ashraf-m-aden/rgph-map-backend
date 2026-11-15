/**
 * Extended seed data - Part 2
 * Extracted from: Tome 3 - Caractéristiques économiques de la population
 * RGPH-3, INSTAD (2024) - République de Djibouti
 *
 * Covers: Chômage détaillé, Population inactive, Dépendance économique,
 * Primo-demandeurs, Travail des enfants, Raisons d'inactivité
 */

import { Indicator } from "../models/Indicator.js";
// Assurez-vous d'avoir "type": "module" dans votre package.json
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, "../../.env") });
import { connectDB } from "../config/database.js";

const indicators = [];
const theme = "caracteristiques-economiques";
const year = 2024;

const add = (
  code,
  name,
  regionCode,
  value,
  unit = "percentage",
  disagg = {},
  viz = "bar",
  src = {},
) => {
  indicators.push({
    themeSlug: theme,
    indicatorCode: code,
    name,
    unit,
    regionCode,
    value,
    disaggregation: disagg,
    year,
    visualization: { chartType: viz, showOnMap: true },
    source: { document: "Tome 3", ...src },
  });
};

// ============================================================
// TABLEAU 17: Population active par situation d'activité et région (p.64)
// ============================================================
const situationActiviteRegion = {
  "DJ-DJ": {
    occupes: 144734,
    chomeurs: 87954,
    decourages: 27512,
    total: 260200,
  },
  "DJ-AS": { occupes: 9091, chomeurs: 6299, decourages: 1753, total: 17143 },
  "DJ-DI": { occupes: 6217, chomeurs: 4673, decourages: 1766, total: 12656 },
  "DJ-TA": { occupes: 7333, chomeurs: 4222, decourages: 3164, total: 14719 },
  "DJ-OB": { occupes: 6352, chomeurs: 3942, decourages: 1392, total: 11686 },
  "DJ-AR": { occupes: 8437, chomeurs: 4270, decourages: 1615, total: 14322 },
  DJ: { occupes: 182164, chomeurs: 111360, decourages: 37202, total: 330726 },
};
Object.entries(situationActiviteRegion).forEach(([code, v]) => {
  add(
    "actifs_occupes_region",
    { fr: "Actifs occupés", ar: "العاملون", en: "Employed" },
    code,
    v.occupes,
    "number",
    {},
    "choropleth",
    { table: "Tableau 17", page: 64 },
  );
  add(
    "chomeurs_region",
    { fr: "Chômeurs", ar: "العاطلون", en: "Unemployed" },
    code,
    v.chomeurs,
    "number",
    {},
    "choropleth",
    { table: "Tableau 17", page: 64 },
  );
  add(
    "chomeurs_decourages_region",
    {
      fr: "Chômeurs découragés",
      ar: "العاطلون المحبطون",
      en: "Discouraged unemployed",
    },
    code,
    v.decourages,
    "number",
    {},
    "choropleth",
    { table: "Tableau 17", page: 64 },
  );
  add(
    "pop_active_region",
    { fr: "Population active", ar: "السكان النشيطون", en: "Active population" },
    code,
    v.total,
    "number",
    {},
    "choropleth",
    { table: "Tableau 17", page: 64 },
  );
});

// ============================================================
// Taux de chômage par RÉGION (Graphique 21, p.71)
// ============================================================
const chomageRegion = {
  "DJ-DJ": { bit: 37.8, elargi: 44.4 },
  "DJ-AS": { bit: 40.9, elargi: 47.0 },
  "DJ-DI": { bit: 42.9, elargi: 50.9 },
  "DJ-TA": { bit: 36.5, elargi: 50.2 },
  "DJ-OB": { bit: 38.3, elargi: 45.6 },
  "DJ-AR": { bit: 33.6, elargi: 41.1 },
};
Object.entries(chomageRegion).forEach(([code, v]) => {
  add(
    "taux_chomage_bit_region",
    {
      fr: "Taux de chômage BIT",
      ar: "معدل البطالة (BIT)",
      en: "ILO unemployment rate",
    },
    code,
    v.bit,
    "percentage",
    {},
    "choropleth",
    { page: 71 },
  );
  add(
    "taux_chomage_elargi_region",
    {
      fr: "Taux de chômage élargi",
      ar: "معدل البطالة الموسع",
      en: "Extended unemployment rate",
    },
    code,
    v.elargi,
    "percentage",
    {},
    "choropleth",
    { page: 71 },
  );
});

// Taux de chômage par milieu
add(
  "taux_chomage_milieu",
  {
    fr: "Taux chômage BIT urbain",
    ar: "معدل البطالة حضري",
    en: "Urban ILO unemployment",
  },
  "DJ",
  37.5,
  "percentage",
  { milieu: "urbain", type: "bit" },
);
add(
  "taux_chomage_milieu",
  {
    fr: "Taux chômage BIT rural",
    ar: "معدل البطالة ريفي",
    en: "Rural ILO unemployment",
  },
  "DJ",
  41.2,
  "percentage",
  { milieu: "rural", type: "bit" },
);
add(
  "taux_chomage_milieu",
  {
    fr: "Taux chômage élargi urbain",
    ar: "معدل البطالة الموسع حضري",
    en: "Urban extended unemployment",
  },
  "DJ",
  44.3,
  "percentage",
  { milieu: "urbain", type: "elargi" },
);
add(
  "taux_chomage_milieu",
  {
    fr: "Taux chômage élargi rural",
    ar: "معدل البطالة الموسع ريفي",
    en: "Rural extended unemployment",
  },
  "DJ",
  49.8,
  "percentage",
  { milieu: "rural", type: "elargi" },
);

// ============================================================
// Taux de chômage par GROUPE D'ÂGE (Graphique 18, p.66)
// ============================================================
const chomageAge = [
  { age: "15-19", bit: 52.0, elargi: 58.4 },
  { age: "20-24", bit: 79.7, elargi: 82.7 },
  { age: "25-29", bit: 57.2, elargi: 62.5 },
  { age: "30-34", bit: 23.6, elargi: 32.2 },
  { age: "35-39", bit: 20.1, elargi: 27.4 },
  { age: "40-44", bit: 18.2, elargi: 26.1 },
  { age: "45-49", bit: 16.9, elargi: 23.6 },
  { age: "50-54", bit: 13.5, elargi: 20.0 },
  { age: "55-59", bit: 13.7, elargi: 20.3 },
  { age: "60-64", bit: 15.8, elargi: 25.3 },
  { age: "65+", bit: 15.7, elargi: 28.0 },
];
chomageAge.forEach((r) => {
  add(
    "taux_chomage_age",
    {
      fr: "Taux chômage BIT par âge",
      ar: "معدل البطالة حسب العمر",
      en: "Unemployment by age",
    },
    "DJ",
    r.bit,
    "percentage",
    { tranche_age: r.age, type: "bit" },
    "line",
    { page: 66 },
  );
  add(
    "taux_chomage_age",
    {
      fr: "Taux chômage élargi par âge",
      ar: "معدل البطالة الموسع حسب العمر",
      en: "Extended unemployment by age",
    },
    "DJ",
    r.elargi,
    "percentage",
    { tranche_age: r.age, type: "elargi" },
    "line",
  );
});

// ============================================================
// Taux de chômage par NIVEAU D'INSTRUCTION (Graphique 23, p.73)
// ============================================================
const chomageInstruction = [
  { niveau: "sans_instruction", bit: 47.3, elargi: 52.5 },
  { niveau: "primaire", bit: 37.0, elargi: 50.1 },
  { niveau: "secondaire1", bit: 36.0, elargi: 48.3 },
  { niveau: "secondaire2", bit: 27.4, elargi: 38.0 },
  { niveau: "superieur", bit: 15.0, elargi: 20.5 },
];
chomageInstruction.forEach((r) => {
  add(
    "taux_chomage_instruction",
    {
      fr: "Taux chômage par instruction",
      ar: "معدل البطالة حسب التعليم",
      en: "Unemployment by education",
    },
    "DJ",
    r.bit,
    "percentage",
    { niveau: r.niveau, type: "bit" },
    "bar",
    { page: 73 },
  );
  add(
    "taux_chomage_instruction",
    {
      fr: "Taux chômage élargi par instruction",
      ar: "معدل البطالة الموسع حسب التعليم",
      en: "Extended unemployment by education",
    },
    "DJ",
    r.elargi,
    "percentage",
    { niveau: r.niveau, type: "elargi" },
    "bar",
  );
});

// ============================================================
// Taux de chômage par STATUT MATRIMONIAL (Graphique 24, p.74)
// ============================================================
const chomageMatrimonial = [
  { statut: "celibataire", bit: 57.8, elargi: 63.7 },
  { statut: "union_libre", bit: 23.0, elargi: 27.6 },
  { statut: "marie_monogame", bit: 25.4, elargi: 32.0 },
  { statut: "marie_polygame", bit: 17.3, elargi: 29.5 },
  { statut: "divorce", bit: 29.4, elargi: 40.2 },
  { statut: "separe", bit: 30.0, elargi: 42.3 },
  { statut: "veuf", bit: 21.4, elargi: 35.8 },
];
chomageMatrimonial.forEach((r) => {
  add(
    "taux_chomage_matrimonial",
    {
      fr: "Taux chômage par statut matrimonial",
      ar: "معدل البطالة حسب الحالة الزوجية",
      en: "Unemployment by marital status",
    },
    "DJ",
    r.bit,
    "percentage",
    { statut: r.statut, type: "bit" },
    "bar",
    { page: 74 },
  );
  add(
    "taux_chomage_matrimonial",
    {
      fr: "Taux chômage élargi par statut",
      ar: "معدل البطالة الموسع حسب الحالة الزوجية",
      en: "Extended unemployment by marital status",
    },
    "DJ",
    r.elargi,
    "percentage",
    { statut: r.statut, type: "elargi" },
    "bar",
  );
});

// ============================================================
// TABLEAU 18: Chômage 15-64 ans par région/sexe (p.75)
// ============================================================
const chomage1564 = {
  "DJ-DJ": {
    hBit: 33.3,
    hElargi: 38.6,
    fBit: 44.9,
    fElargi: 52.6,
    eBit: 38.1,
    eElargi: 44.6,
  },
  "DJ-AS": {
    hBit: 36.2,
    hElargi: 41.5,
    fBit: 48.6,
    fElargi: 55.3,
    eBit: 41.1,
    eElargi: 47.1,
  },
  "DJ-DI": {
    hBit: 40.1,
    hElargi: 46.7,
    fBit: 48.3,
    fElargi: 57.9,
    eBit: 43.1,
    eElargi: 51.0,
  },
  "DJ-TA": {
    hBit: 33.4,
    hElargi: 44.9,
    fBit: 42.4,
    fElargi: 58.1,
    eBit: 36.8,
    eElargi: 50.3,
  },
  "DJ-OB": {
    hBit: 34.0,
    hElargi: 40.4,
    fBit: 45.3,
    fElargi: 53.3,
    eBit: 38.7,
    eElargi: 45.9,
  },
  "DJ-AR": {
    hBit: 28.2,
    hElargi: 34.2,
    fBit: 43.3,
    fElargi: 52.2,
    eBit: 33.9,
    eElargi: 41.4,
  },
};
Object.entries(chomage1564).forEach(([code, v]) => {
  add(
    "chomage_1564_bit_h",
    {
      fr: "Chômage BIT 15-64 Hommes",
      ar: "البطالة 15-64 ذكور",
      en: "ILO unemployment 15-64 Men",
    },
    code,
    v.hBit,
    "percentage",
    { sexe: "masculin", tranche: "15-64", type: "bit" },
    "bar",
    { table: "Tableau 18", page: 75 },
  );
  add(
    "chomage_1564_bit_f",
    {
      fr: "Chômage BIT 15-64 Femmes",
      ar: "البطالة 15-64 إناث",
      en: "ILO unemployment 15-64 Women",
    },
    code,
    v.fBit,
    "percentage",
    { sexe: "feminin", tranche: "15-64", type: "bit" },
    "bar",
  );
  add(
    "chomage_1564_elargi_h",
    {
      fr: "Chômage élargi 15-64 Hommes",
      ar: "البطالة الموسعة 15-64 ذكور",
      en: "Extended unemployment 15-64 Men",
    },
    code,
    v.hElargi,
    "percentage",
    { sexe: "masculin", tranche: "15-64", type: "elargi" },
    "bar",
  );
  add(
    "chomage_1564_elargi_f",
    {
      fr: "Chômage élargi 15-64 Femmes",
      ar: "البطالة الموسعة 15-64 إناث",
      en: "Extended unemployment 15-64 Women",
    },
    code,
    v.fElargi,
    "percentage",
    { sexe: "feminin", tranche: "15-64", type: "elargi" },
    "bar",
  );
  add(
    "chomage_1564_ensemble",
    {
      fr: "Chômage BIT 15-64 Ensemble",
      ar: "البطالة 15-64 المجموع",
      en: "ILO unemployment 15-64 Total",
    },
    code,
    v.eBit,
    "percentage",
    { tranche: "15-64", type: "bit" },
    "choropleth",
  );
  add(
    "chomage_1564_elargi_ensemble",
    {
      fr: "Chômage élargi 15-64 Ensemble",
      ar: "البطالة الموسعة 15-64 المجموع",
      en: "Extended unemployment 15-64 Total",
    },
    code,
    v.eElargi,
    "percentage",
    { tranche: "15-64", type: "elargi" },
    "choropleth",
  );
});

// ============================================================
// TABLEAU 20: Chômage 15-34 ans (jeunes) par région (p.79)
// ============================================================
const chomage1534 = {
  "DJ-DJ": {
    hBit: 50.3,
    fBit: 59.5,
    eBit: 54.5,
    hElargi: 55.5,
    fElargi: 65.6,
    eElargi: 60.2,
  },
  "DJ-AS": {
    hBit: 52.5,
    fBit: 65.0,
    eBit: 58.0,
    hElargi: 56.8,
    fElargi: 69.7,
    eElargi: 62.6,
  },
  "DJ-DI": {
    hBit: 56.9,
    fBit: 65.4,
    eBit: 60.3,
    hElargi: 62.4,
    fElargi: 72.1,
    eElargi: 66.5,
  },
  "DJ-TA": {
    hBit: 49.5,
    fBit: 59.3,
    eBit: 53.6,
    hElargi: 59.5,
    fElargi: 71.0,
    eElargi: 64.7,
  },
  "DJ-OB": {
    hBit: 50.5,
    fBit: 61.8,
    eBit: 55.5,
    hElargi: 55.6,
    fElargi: 67.6,
    eElargi: 61.0,
  },
  "DJ-AR": {
    hBit: 42.2,
    fBit: 59.1,
    eBit: 49.3,
    hElargi: 47.8,
    fElargi: 65.6,
    eElargi: 55.6,
  },
};
Object.entries(chomage1534).forEach(([code, v]) => {
  add(
    "chomage_jeunes_bit",
    {
      fr: "Chômage BIT jeunes 15-34",
      ar: "بطالة الشباب 15-34",
      en: "Youth unemployment 15-34 ILO",
    },
    code,
    v.eBit,
    "percentage",
    { tranche: "15-34", type: "bit" },
    "choropleth",
    { table: "Tableau 20", page: 79 },
  );
  add(
    "chomage_jeunes_elargi",
    {
      fr: "Chômage élargi jeunes 15-34",
      ar: "بطالة الشباب الموسعة 15-34",
      en: "Youth extended unemployment 15-34",
    },
    code,
    v.eElargi,
    "percentage",
    { tranche: "15-34", type: "elargi" },
    "choropleth",
  );
  add(
    "chomage_jeunes_bit_h",
    {
      fr: "Chômage BIT jeunes Hommes",
      ar: "بطالة الشباب ذكور",
      en: "Youth ILO unemployment Men",
    },
    code,
    v.hBit,
    "percentage",
    { tranche: "15-34", type: "bit", sexe: "masculin" },
    "bar",
  );
  add(
    "chomage_jeunes_bit_f",
    {
      fr: "Chômage BIT jeunes Femmes",
      ar: "بطالة الشباب إناث",
      en: "Youth ILO unemployment Women",
    },
    code,
    v.fBit,
    "percentage",
    { tranche: "15-34", type: "bit", sexe: "feminin" },
    "bar",
  );
});

// ============================================================
// TABLEAU 21: Chômage 15-24 ans par région (p.81)
// ============================================================
const chomage1524 = {
  "DJ-DJ": { bit: 69.5, elargi: 73.8 },
  "DJ-AS": { bit: 71.2, elargi: 74.2 },
  "DJ-DI": { bit: 74.4, elargi: 78.6 },
  "DJ-TA": { bit: 68.4, elargi: 76.3 },
  "DJ-OB": { bit: 63.8, elargi: 68.4 },
  "DJ-AR": { bit: 60.7, elargi: 65.9 },
};
Object.entries(chomage1524).forEach(([code, v]) => {
  add(
    "chomage_1524_bit",
    {
      fr: "Chômage BIT 15-24 ans",
      ar: "بطالة 15-24 سنة",
      en: "Youth unemployment 15-24 ILO",
    },
    code,
    v.bit,
    "percentage",
    { tranche: "15-24", type: "bit" },
    "choropleth",
    { table: "Tableau 21", page: 81 },
  );
  add(
    "chomage_1524_elargi",
    {
      fr: "Chômage élargi 15-24 ans",
      ar: "بطالة موسعة 15-24 سنة",
      en: "Youth extended unemployment 15-24",
    },
    code,
    v.elargi,
    "percentage",
    { tranche: "15-24", type: "elargi" },
    "choropleth",
  );
});

// ============================================================
// TABLEAU 22: Chômeurs par région et sexe (p.83)
// ============================================================
const chomeursParRegionSexe = {
  "DJ-DJ": { masculin: 49.5, feminin: 50.5, effectif: 115466 },
  "DJ-AS": { masculin: 52.3, feminin: 47.7, effectif: 8052 },
  "DJ-DI": { masculin: 56.9, feminin: 43.1, effectif: 6439 },
  "DJ-TA": { masculin: 52.7, feminin: 47.3, effectif: 7386 },
  "DJ-OB": { masculin: 50.5, feminin: 49.5, effectif: 5334 },
  "DJ-AR": { masculin: 49.5, feminin: 50.5, effectif: 5885 },
  DJ: { masculin: 50.2, feminin: 49.8, effectif: 148562 },
};
Object.entries(chomeursParRegionSexe).forEach(([code, v]) => {
  add(
    "chomeurs_effectif",
    {
      fr: "Effectif total chômeurs",
      ar: "إجمالي العاطلين",
      en: "Total unemployed",
    },
    code,
    v.effectif,
    "number",
    {},
    "choropleth",
    { table: "Tableau 22", page: 83 },
  );
  add(
    "chomeurs_pct_masculin",
    {
      fr: "Part hommes chômeurs",
      ar: "نسبة العاطلين الذكور",
      en: "Male unemployed share",
    },
    code,
    v.masculin,
    "percentage",
    { sexe: "masculin" },
    "bar",
  );
  add(
    "chomeurs_pct_feminin",
    {
      fr: "Part femmes chômeuses",
      ar: "نسبة العاطلات",
      en: "Female unemployed share",
    },
    code,
    v.feminin,
    "percentage",
    { sexe: "feminin" },
    "bar",
  );
});

// ============================================================
// Primo-demandeurs vs déjà travaillé (Graphique 25, p.85)
// ============================================================
const primoDemandeurs = {
  "DJ-DJ": { primo: 84.7, deja: 15.3 },
  "DJ-AS": { primo: 87.1, deja: 12.9 },
  "DJ-DI": { primo: 87.8, deja: 12.2 },
  "DJ-TA": { primo: 88.1, deja: 11.9 },
  "DJ-OB": { primo: 87.9, deja: 12.1 },
  "DJ-AR": { primo: 82.1, deja: 17.9 },
  DJ: { primo: 85.2, deja: 14.8 },
};
Object.entries(primoDemandeurs).forEach(([code, v]) => {
  add(
    "primo_demandeurs",
    {
      fr: "Primo-demandeurs d'emploi",
      ar: "طالبو العمل لأول مرة",
      en: "First-time job seekers",
    },
    code,
    v.primo,
    "percentage",
    { categorie: "primo" },
    "stacked_bar",
    { page: 85 },
  );
  add(
    "chomeurs_deja_travaille",
    {
      fr: "Chômeurs ayant déjà travaillé",
      ar: "عاطلون سبق لهم العمل",
      en: "Previously employed unemployed",
    },
    code,
    v.deja,
    "percentage",
    { categorie: "deja_travaille" },
    "stacked_bar",
  );
});

// Primo-demandeurs par sexe
add(
  "primo_demandeurs_sexe",
  {
    fr: "Primo-demandeurs Hommes",
    ar: "طالبو العمل الذكور",
    en: "Male first-time seekers",
  },
  "DJ",
  80.8,
  "percentage",
  { sexe: "masculin", categorie: "primo" },
  "bar",
  { page: 87 },
);
add(
  "primo_demandeurs_sexe",
  {
    fr: "Primo-demandeurs Femmes",
    ar: "طالبات العمل",
    en: "Female first-time seekers",
  },
  "DJ",
  89.6,
  "percentage",
  { sexe: "feminin", categorie: "primo" },
  "bar",
);

// ============================================================
// POPULATION INACTIVE (Chapitre 5)
// ============================================================
// Par région (Graphique 32, p.98)
const inactifsRegion = {
  "DJ-DJ": { pct: 73.4, effectif: 350658 },
  "DJ-AS": { pct: 7.2, effectif: 34249 },
  "DJ-DI": { pct: 6.5, effectif: 30858 },
  "DJ-TA": { pct: 5.9, effectif: 28047 },
  "DJ-OB": { pct: 3.2, effectif: 15318 },
  "DJ-AR": { pct: 3.9, effectif: 18614 },
};
Object.entries(inactifsRegion).forEach(([code, v]) => {
  add(
    "pop_inactive_region",
    {
      fr: "Population inactive",
      ar: "السكان غير النشيطين",
      en: "Inactive population",
    },
    code,
    v.effectif,
    "number",
    {},
    "choropleth",
    { page: 98 },
  );
  add(
    "pop_inactive_pct",
    {
      fr: "Part de la pop. inactive",
      ar: "حصة السكان غير النشيطين",
      en: "Inactive population share",
    },
    code,
    v.pct,
    "percentage",
    {},
    "choropleth",
  );
});

// Inactifs par milieu
add(
  "inactifs_milieu",
  { fr: "Inactifs urbain", ar: "غير نشيطين حضري", en: "Urban inactive" },
  "DJ",
  84.4,
  "percentage",
  { milieu: "urbain" },
  "pie",
);
add(
  "inactifs_milieu",
  { fr: "Inactifs rural", ar: "غير نشيطين ريفي", en: "Rural inactive" },
  "DJ",
  15.6,
  "percentage",
  { milieu: "rural" },
  "pie",
);

// Inactifs par niveau d'instruction (Graphique 34, p.100)
const inactifsInstruction = [
  { niveau: "sans_niveau", pct: 53.9 },
  { niveau: "primaire", pct: 5.7 },
  { niveau: "secondaire1", pct: 15.4 },
  { niveau: "secondaire2", pct: 14.1 },
  { niveau: "superieur", pct: 10.8 },
];
inactifsInstruction.forEach((r) => {
  add(
    "inactifs_instruction",
    {
      fr: "Inactifs par instruction",
      ar: "غير نشيطين حسب التعليم",
      en: "Inactive by education",
    },
    "DJ",
    r.pct,
    "percentage",
    { niveau: r.niveau },
    "bar",
    { page: 100 },
  );
});

// Inactifs par statut matrimonial (Graphique 35, p.101)
const inactifsMatrimonial = [
  { statut: "celibataire", pct: 50.7 },
  { statut: "union_libre", pct: 0.1 },
  { statut: "marie_monogame", pct: 40.8 },
  { statut: "marie_polygame", pct: 1.4 },
  { statut: "divorce", pct: 2.9 },
  { statut: "separe", pct: 0.4 },
  { statut: "veuf", pct: 3.7 },
];
inactifsMatrimonial.forEach((r) => {
  add(
    "inactifs_matrimonial",
    {
      fr: "Inactifs par statut matrimonial",
      ar: "غير نشيطين حسب الحالة الزوجية",
      en: "Inactive by marital status",
    },
    "DJ",
    r.pct,
    "percentage",
    { statut: r.statut },
    "bar",
    { page: 101 },
  );
});

// ============================================================
// TABLEAU 26: Raisons du non-emploi (p.102)
// ============================================================
const raisonsNonEmploi = [
  {
    raison: "responsabilite_famille",
    fr: "Responsabilité familiale",
    effectif: 116561,
    pct: 20.7,
  },
  {
    raison: "manque_documents",
    fr: "Manque de documents",
    effectif: 77583,
    pct: 13.8,
  },
  {
    raison: "attente_reponse",
    fr: "Attente réponse demande d'emploi",
    effectif: 45961,
    pct: 8.2,
  },
  {
    raison: "eleve_etudiant",
    fr: "Élève/Étudiant en formation",
    effectif: 147973,
    pct: 26.3,
  },
  {
    raison: "manque_qualification",
    fr: "Insuffisance de qualification",
    effectif: 14991,
    pct: 2.7,
  },
  {
    raison: "pas_envie",
    fr: "N'a pas envie de travailler",
    effectif: 23744,
    pct: 4.2,
  },
  { raison: "retraite", fr: "Retraité", effectif: 10259, pct: 1.8 },
  {
    raison: "maladie_age",
    fr: "Incapacité (maladie, blessure, âge)",
    effectif: 16408,
    pct: 2.9,
  },
  { raison: "handicap", fr: "Invalidité/handicap", effectif: 2251, pct: 0.4 },
  { raison: "aide_familiale", fr: "Aide familiale", effectif: 7469, pct: 1.3 },
  { raison: "autres", fr: "Autres raisons", effectif: 77560, pct: 13.8 },
];
raisonsNonEmploi.forEach((r) => {
  add(
    "raisons_non_emploi",
    { fr: r.fr, ar: r.fr, en: r.fr },
    "DJ",
    r.pct,
    "percentage",
    { raison: r.raison },
    "bar",
    { table: "Tableau 26", page: 102 },
  );
  add(
    "raisons_non_emploi_effectif",
    { fr: r.fr, ar: r.fr, en: r.fr },
    "DJ",
    r.effectif,
    "number",
    { raison: r.raison },
    "bar",
  );
});

// ============================================================
// TABLEAU 27: Types de responsabilité au sein du ménage (p.103)
// ============================================================
const responsabilites = [
  {
    type: "jeunes_enfants",
    fr: "Prendre soin de jeunes enfants",
    pct: 52.1,
    effectif: 59276,
  },
  {
    type: "personnes_agees",
    fr: "Prendre soin de personnes âgées",
    pct: 4.0,
    effectif: 4540,
  },
  {
    type: "personnes_handicapees",
    fr: "Prendre soin de personnes handicapées",
    pct: 0.6,
    effectif: 699,
  },
  { type: "gerer_menage", fr: "Gérer le ménage", pct: 34.9, effectif: 39727 },
  { type: "nettoyage", fr: "Nettoyer le ménage", pct: 4.7, effectif: 5396 },
  { type: "cuisine", fr: "Cuisiner", pct: 3.0, effectif: 3390 },
];
responsabilites.forEach((r) => {
  add(
    "responsabilites_menage",
    { fr: r.fr, ar: r.fr, en: r.fr },
    "DJ",
    r.pct,
    "percentage",
    { type_responsabilite: r.type },
    "pie",
    { table: "Tableau 27", page: 103 },
  );
});

// ============================================================
// RAPPORT DE DÉPENDANCE ÉCONOMIQUE (Graphique 36, p.104)
// ============================================================
const dependance = {
  "DJ-DJ": 242.3,
  "DJ-AS": 376.7,
  "DJ-DI": 496.3,
  "DJ-TA": 382.5,
  "DJ-OB": 241.2,
  "DJ-AR": 220.6,
  DJ: 262.3,
};
Object.entries(dependance).forEach(([code, val]) => {
  add(
    "rapport_dependance",
    {
      fr: "Rapport de dépendance économique",
      ar: "نسبة التبعية الاقتصادية",
      en: "Economic dependency ratio",
    },
    code,
    val,
    // Un rapport de dependance vaut 262,3 "inactifs pour 100 actifs" : le
    // declarer en "percentage" le faisait figurer sur la meme echelle que des
    // taux bornes a 100 (cf. AUDIT D-11).
    "ratio",
    {},
    "choropleth",
    { page: 104 },
  );
});
// Par milieu
add(
  "rapport_dependance_milieu",
  {
    fr: "Dépendance éco. urbain",
    ar: "التبعية الاقتصادية حضري",
    en: "Urban economic dependency",
  },
  "DJ",
  246.0,
  "ratio",
  { milieu: "urbain" },
);
add(
  "rapport_dependance_milieu",
  {
    fr: "Dépendance éco. rural",
    ar: "التبعية الاقتصادية ريفي",
    en: "Rural economic dependency",
  },
  "DJ",
  408.8,
  "ratio",
  { milieu: "rural" },
);

// ============================================================
// Travail des enfants détaillé (Tableau 16, p.63)
// ============================================================
const enfantsParAge = [
  { age: 10, masculin: 2035, feminin: 2156, total: 4191 },
  { age: 11, masculin: 1993, feminin: 1798, total: 3791 },
  { age: 12, masculin: 2143, feminin: 1862, total: 4005 },
  { age: 13, masculin: 2008, feminin: 2038, total: 4046 },
  { age: 14, masculin: 2106, feminin: 2109, total: 4215 },
];
enfantsParAge.forEach((r) => {
  add(
    "travail_enfants_age",
    {
      fr: `Enfants occupés ${r.age} ans`,
      ar: `الأطفال العاملون ${r.age} سنة`,
      en: `Working children age ${r.age}`,
    },
    "DJ",
    r.total,
    "number",
    { age: `${r.age}` },
    "bar",
    { table: "Tableau 16", page: 63 },
  );
  add(
    "travail_enfants_age",
    {
      fr: `Garçons occupés ${r.age} ans`,
      ar: `الأولاد العاملون ${r.age} سنة`,
      en: `Working boys age ${r.age}`,
    },
    "DJ",
    r.masculin,
    "number",
    { age: `${r.age}`, sexe: "masculin" },
    "bar",
  );
  add(
    "travail_enfants_age",
    {
      fr: `Filles occupées ${r.age} ans`,
      ar: `البنات العاملات ${r.age} سنة`,
      en: `Working girls age ${r.age}`,
    },
    "DJ",
    r.feminin,
    "number",
    { age: `${r.age}`, sexe: "feminin" },
    "bar",
  );
});

// ============================================================
// Secteur institutionnel par sexe (Graphique 15, p.52)
// ============================================================
const secteurInstSexe = [
  { code: "public_admin", masculin: 44.1, feminin: 27.3 },
  { code: "prive_informel", masculin: 33.6, feminin: 58.3 },
  { code: "prive_formel", masculin: 16.3, feminin: 11.0 },
  { code: "public_contractuel", masculin: 3.3, feminin: 1.5 },
  { code: "parapublic", masculin: 1.9, feminin: 1.1 },
];
secteurInstSexe.forEach((s) => {
  add(
    "secteur_inst_sexe",
    { fr: `Sect. inst. ${s.code} Hommes`, ar: s.code, en: s.code },
    "DJ",
    s.masculin,
    "percentage",
    { secteur_inst: s.code, sexe: "masculin" },
    "bar",
    { page: 52 },
  );
  add(
    "secteur_inst_sexe",
    { fr: `Sect. inst. ${s.code} Femmes`, ar: s.code, en: s.code },
    "DJ",
    s.feminin,
    "percentage",
    { secteur_inst: s.code, sexe: "feminin" },
    "bar",
  );
});

// ============================================================
// Population totale de référence
// ============================================================
add(
  "population_totale",
  { fr: "Population totale", ar: "إجمالي السكان", en: "Total population" },
  "DJ",
  1003800,
  "number",
  {},
);

// ============================================================
// SEED FUNCTION
// ============================================================
async function seedExtendedData() {
  try {
    await connectDB();
    console.log("🌱 Seeding extended economic data (Part 2)...");
    console.log(`   📈 ${indicators.length} new indicators`);

    // Ce script n'effacait rien avant d'inserer : chaque execution dupliquait
    // ses 288 documents, et les doublons devenaient invisibles (cf. AUDIT
    // B-10). On ne purge que les codes reinseres ici, pour ne pas toucher a
    // ceux de seedEconomicData.js.
    const seededCodes = [...new Set(indicators.map((i) => i.indicatorCode))];
    const removed = await Indicator.deleteMany({
      themeSlug: theme,
      indicatorCode: { $in: seededCodes },
    });
    if (removed.deletedCount) {
      console.log(`   🧹 ${removed.deletedCount} indicateurs existants remplaces`);
    }

    await Indicator.insertMany(indicators);
    console.log(`   ✅ ${indicators.length} indicators inserted`);
    console.log("🎉 Extended data seeded successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  }
}

seedExtendedData();
