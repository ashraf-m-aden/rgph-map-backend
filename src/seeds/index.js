// Assurez-vous d'avoir "type": "module" dans votre package.json
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, "../../.env") });
import { connectDB } from "../config/database.js";
import { Region } from "../models/Region.js";
import { Theme } from "../models/Theme.js";
import { GeoData } from "../models/GeoData.js";



const regions = [
  {
    code: "DJ",
    level: "country",
    name: {
      fr: "République de Djibouti",
      ar: "جمهورية جيبوتي",
      en: "Republic of Djibouti",
    },
    parentCode: null,
    center: { lat: 11.5721, lng: 43.1456 },
    area: 23200,
    sortOrder: 0,
  },
  {
    code: "DJ-DJ",
    level: "region",
    name: { fr: "Djibouti", ar: "جيبوتي", en: "Djibouti" },
    parentCode: "DJ",
    center: { lat: 11.588, lng: 43.1456 },
    area: 200,
    sortOrder: 1,
  },
  {
    code: "DJ-AR",
    level: "region",
    name: { fr: "Arta", ar: "أرتا", en: "Arta" },
    parentCode: "DJ",
    center: { lat: 11.5227, lng: 42.847 },
    area: 1800,
    sortOrder: 2,
  },
  {
    code: "DJ-AS",
    level: "region",
    name: { fr: "Ali Sabieh", ar: "علي صبيح", en: "Ali Sabieh" },
    parentCode: "DJ",
    center: { lat: 11.1559, lng: 42.7125 },
    area: 2200,
    sortOrder: 3,
  },
  {
    code: "DJ-DI",
    level: "region",
    name: { fr: "Dikhil", ar: "دخيل", en: "Dikhil" },
    parentCode: "DJ",
    center: { lat: 11.1062, lng: 42.3702 },
    area: 7200,
    sortOrder: 4,
  },
  {
    code: "DJ-OB",
    level: "region",
    name: { fr: "Obock", ar: "أوبوك", en: "Obock" },
    parentCode: "DJ",
    center: { lat: 11.968, lng: 43.287 },
    area: 4700,
    sortOrder: 5,
  },
  {
    code: "DJ-TA",
    level: "region",
    name: { fr: "Tadjourah", ar: "تاجورة", en: "Tadjourah" },
    parentCode: "DJ",
    center: { lat: 11.783, lng: 42.884 },
    area: 7100,
    sortOrder: 6,
  },
];

const themes = [
  {
    slug: "demographie",
    name: { fr: "Démographie", ar: "الديموغرافيا", en: "Demographics" },
    description: {
      fr: "Population, ménages et caractéristiques démographiques",
      ar: "السكان والأسر والخصائص الديموغرافية",
      en: "Population, households and demographic characteristics",
    },
    icon: "mdi-account-group",
    color: "#8B1A1A",
    sortOrder: 1,
  },
  {
    slug: "caracteristiques-economiques",
    name: {
      fr: "Caractéristiques économiques",
      ar: "الخصائص الاقتصادية",
      en: "Economic characteristics",
    },
    description: {
      fr: "Activité économique, emploi, chômage et secteurs d'activité",
      ar: "النشاط الاقتصادي والتوظيف والبطالة وقطاعات النشاط",
      en: "Economic activity, employment, unemployment and activity sectors",
    },
    icon: "mdi-briefcase",
    color: "#1A5276",
    sortOrder: 2,
  },
  {
    slug: "education",
    name: {
      fr: "Éducation et analphabétisme",
      ar: "التعليم والأمية",
      en: "Education and illiteracy",
    },
    description: {
      fr: "Niveau d'instruction, scolarisation et alphabétisation",
      ar: "مستوى التعليم والتمدرس ومحو الأمية",
      en: "Education level, enrollment and literacy",
    },
    icon: "mdi-school",
    color: "#1E8449",
    sortOrder: 3,
  },
  {
    slug: "sante",
    name: { fr: "Santé", ar: "الصحة", en: "Health" },
    description: {
      fr: "Indicateurs de santé, mortalité et accès aux soins",
      ar: "مؤشرات الصحة والوفيات والوصول إلى الرعاية",
      en: "Health indicators, mortality and access to care",
    },
    icon: "mdi-hospital",
    color: "#E74C3C",
    sortOrder: 4,
  },
  {
    slug: "habitat",
    name: {
      fr: "Conditions d'habitat",
      ar: "ظروف السكن",
      en: "Housing conditions",
    },
    description: {
      fr: "Type de logement, accès à l'eau, électricité et assainissement",
      ar: "نوع السكن والوصول إلى الماء والكهرباء والصرف الصحي",
      en: "Housing type, access to water, electricity and sanitation",
    },
    icon: "mdi-home",
    color: "#F39C12",
    sortOrder: 5,
  },
  {
    slug: "langue-maternelle",
    name: {
      fr: "Langue maternelle",
      ar: "اللغة الأم",
      en: "Mother tongue",
    },
    description: {
      fr: "Langues parlées et langue maternelle de la population",
      ar: "اللغات المنطوقة واللغة الأم للسكان",
      en: "Spoken languages and mother tongue of the population",
    },
    icon: "mdi-translate",
    color: "#8E44AD",
    sortOrder: 6,
  },
  {
    slug: "pauvrete",
    name: {
      fr: "Pauvreté multidimensionnelle",
      ar: "الفقر متعدد الأبعاد",
      en: "Multidimensional poverty",
    },
    description: {
      fr: "Indices de pauvreté et vulnérabilité",
      ar: "مؤشرات الفقر والهشاشة",
      en: "Poverty and vulnerability indices",
    },
    icon: "mdi-chart-line",
    color: "#D35400",
    sortOrder: 7,
  },
];

async function seed() {
  try {
    await connectDB();
    console.log("🌱 Seeding database...");

    // Clear existing data
    await Region.deleteMany({});
    await Theme.deleteMany({});

    // Insert regions
    await Region.insertMany(regions);
    console.log(`✅ ${regions.length} regions inserted`);

    // Insert themes
    await Theme.insertMany(themes);
    console.log(`✅ ${themes.length} themes inserted`);

  // Seed GeoData from GeoJSON file
    await GeoData.deleteMany({});
    const geojsonPath = join(__dirname, '../../data/djibouti-regions.geojson');
    if (fs.existsSync(geojsonPath)) {
      const geojsonRaw = fs.readFileSync(geojsonPath, 'utf-8');
      const geojson = JSON.parse(geojsonRaw);
      await GeoData.create({
        level: 'region',
        geojson: geojson,
        source: 'RGPH-3 INSTAD 2024',
      });
      console.log(`✅ GeoData inserted (${geojson.features.length} features)`);
    } else {
      console.warn('⚠️  GeoJSON file not found at', geojsonPath);
    }

    console.log("🎉 Seed completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  }
}

seed();
