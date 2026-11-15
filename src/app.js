import compression from 'compression';
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import morgan from 'morgan';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

// Import routes
import geoRoutes from './routes/geo.js';
import indicatorRoutes from './routes/indicators.js';
import regionRoutes from './routes/regions.js';
import searchRoutes from './routes/search.js';
import themeRoutes from './routes/themes.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();

// Derriere le nginx de l'hote : sans cela toutes les requetes partagent
// l'IP du proxy et la limitation de debit s'applique globalement.
app.set('trust proxy', 1);

// Security
app.use(helmet());

// CORS
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  })
);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Compression
app.use(compression());

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Limitation de debit : les variables RATE_LIMIT_* etaient documentees dans
// .env.example et DEPLOIEMENT.md, et la dependance installee, mais aucun
// middleware n'etait monte (cf. AUDIT B-03).
app.use(
  '/api',
  rateLimit({
    windowMs: Number.parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
    max: Number.parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,
    standardHeaders: true,
    legacyHeaders: false,
    // Le point de sante est interroge toutes les 30 s par le HEALTHCHECK du
    // conteneur : il ne doit pas consommer le quota.
    skip: (req) => req.path === '/health',
    message: { success: false, error: 'Trop de requêtes, veuillez réessayer plus tard' },
  })
);

// Static files — chemin resolu depuis ce fichier et non depuis le repertoire
// de travail du processus (cf. AUDIT B-14).
app.use('/data', express.static(join(__dirname, '../data'), { maxAge: '1d' }));

// API Routes
app.use('/api/regions', regionRoutes);
app.use('/api/indicators', indicatorRoutes);
app.use('/api/themes', themeRoutes);
app.use('/api/geo', geoRoutes);
app.use('/api/search', searchRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'ok',
    service: 'RGPH Djibouti 2024 API',
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route non trouvée' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    error:
      process.env.NODE_ENV === 'development'
        ? err.message
        : 'Erreur serveur interne',
  });
});

export default app;
