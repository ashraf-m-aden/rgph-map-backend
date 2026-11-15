import 'dotenv/config';
import cluster from 'cluster';
import mongoose from 'mongoose';
import os from 'os';

import app from './app.js';
import { connectDB } from './config/database.js';


const PORT = process.env.PORT || 5000;

// Le cluster n'a d'interet que sur une machine dediee. Sur l'EC2 partage
// (USE_CLUSTER=false, impose par le Dockerfile) un seul worker suffit.
const USE_CLUSTER = process.env.USE_CLUSTER === 'true';

if (USE_CLUSTER && cluster.isPrimary) {
  const numCPUs = os.cpus().length;
  console.log(`🚀 Master process ${process.pid} is running`);
  console.log(`🔥 Spawning ${numCPUs} worker processes...`);

  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  let shuttingDown = false;

  cluster.on('exit', (worker, code, signal) => {
    if (shuttingDown) return;
    console.log(`⚠️  Worker ${worker.process.pid} died. Spawning a new one...`);
    cluster.fork();
  });

  // Le maitre ne relayait pas les signaux : les workers survivaient a l'arret.
  for (const signal of ['SIGTERM', 'SIGINT']) {
    process.on(signal, () => {
      shuttingDown = true;
      console.log(`👋 ${signal} received: stopping workers`);
      for (const worker of Object.values(cluster.workers ?? {})) {
        worker?.kill(signal);
      }
    });
  }
} else {
  const startServer = async () => {
    try {
      await connectDB();

      const server = app.listen(PORT, '0.0.0.0', () => {
        console.log(`✅ Server running on port ${PORT}`);
        console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      });

      // Arret propre : les requetes en cours etaient coupees net par un
      // process.exit(0) immediat a chaque redeploiement (cf. AUDIT B-15).
      let shuttingDown = false;
      const shutdown = async (signal) => {
        if (shuttingDown) return;
        shuttingDown = true;
        console.log(`👋 ${signal} signal received: closing HTTP server`);

        const forced = setTimeout(() => {
          console.error('⛔ Arrêt force apres 10 s');
          process.exit(1);
        }, 10_000);
        forced.unref();

        try {
          await new Promise((resolve, reject) => {
            server.close((err) => (err ? reject(err) : resolve()));
          });
          await mongoose.connection.close(false);
          console.log('✅ Arrêt propre');
          process.exit(0);
        } catch (error) {
          console.error('❌ Erreur pendant l\'arrêt :', error);
          process.exit(1);
        }
      };

      process.on('SIGTERM', () => shutdown('SIGTERM'));
      process.on('SIGINT', () => shutdown('SIGINT'));
    } catch (error) {
      console.error(`❌ Failed to start server:`, error);
      process.exit(1);
    }
  };

  startServer();
}
