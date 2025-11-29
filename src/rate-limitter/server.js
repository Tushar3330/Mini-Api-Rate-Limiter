const express = require('express');
const cluster = require('cluster');
const os = require('os');
const slidingwindowratelimmiter = require('./middleware/ratelimiter');
const apiRoutes = require('./routes/testapi');
const logger = require('../../utils/logger');

const PORT = 3000;
const numCPUs = os.cpus().length;

// Multi-threading for concurrent request handling
if (cluster.isMaster) {
  logger.info(`Master process ${process.pid} starting...`);
  logger.info(`Spawning ${numCPUs} worker processes for concurrent handling`);
  
  // Fork workers
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
  
  cluster.on('exit', (worker, code, signal) => {
    logger.warn(`Worker ${worker.process.pid} died. Spawning new worker...`);
    cluster.fork();
  });
} else {
  // Worker processes
  const app = express();
  
  app.use(express.json());
  app.use((req, res, next) => {
    logger.info(`Worker ${process.pid}: ${req.method} ${req.url} from ${req.ip}`);
    next();
  });

  app.use('/api', apiRoutes);

  app.listen(PORT, (err) => {
    if (err) {
      logger.error(`Worker ${process.pid} failed to start: ${err.message}`);
      process.exit(1);
    }
    logger.info(`Worker ${process.pid} running on http://localhost:${PORT}`);
  });
}