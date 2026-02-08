import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';

// Import routes
import regionRoutes from './routes/regions.js';
import indicatorRoutes from './routes/indicators.js';
import themeRoutes from './routes/themes.js';
import geoRoutes from './routes/geo.js';
import searchRoutes from './routes/search.js';

const app = express();

// Security
app.use(helmet());

// CORS
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
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

// Static files
app.use('/data', express.static('data'));

// API Routes
app.use('/api/regions', regionRoutes);
app.use('/api/indicators', indicatorRoutes);
app.use('/api/themes', themeRoutes);
app.use('/api/geo', geoRoutes);
app.use('/api/search', searchRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'RGPH Djibouti 2024 API',
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route non trouvée' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(err.status || 500).json({
    error:
      process.env.NODE_ENV === 'development'
        ? err.message
        : 'Erreur serveur interne',
  });
});

export default app;
