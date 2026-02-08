import 'dotenv/config';
import cluster from 'cluster';
import os from 'os';

import app from './app.js';
import { connectDB } from './config/database.js';


const PORT = process.env.PORT || 5000;

// Pour Render, pas besoin de cluster (ils gèrent le scaling)
// Utilisez cluster seulement en local ou sur VPS
const USE_CLUSTER = process.env.USE_CLUSTER === 'true';

if (USE_CLUSTER && cluster.isPrimary) {
  const numCPUs = os.cpus().length;
  console.log(`🚀 Master process ${process.pid} is running`);
  console.log(`🔥 Spawning ${numCPUs} worker processes...`);

  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`⚠️  Worker ${worker.process.pid} died. Spawning a new one...`);
    cluster.fork();
  });
} else {
  const startServer = async () => {
    try {
      await connectDB();
      console.log(`✅ MongoDB connected`);

      app.listen(PORT, '0.0.0.0', () => {
        console.log(`✅ Server running on port ${PORT}`);
        console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      });
    } catch (error) {
      console.error(`❌ Failed to start server:`, error);
      process.exit(1);
    }
  };

  startServer();
}

process.on('SIGTERM', () => {
  console.log('👋 SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('👋 SIGINT signal received: closing HTTP server');
  process.exit(0);
});