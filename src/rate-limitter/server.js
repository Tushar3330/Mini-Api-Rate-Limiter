const express = require('express');
const slidingwindowratelimmiter = require('./middleware/ratelimiter');
const apiRoutes = require('./routes/testapi');
const logger = require('../../utils/logger');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use((req, res, next) => {
  logger.info(`Request: ${req.method} ${req.url} from ${req.ip}`);
  next();
});

app.use('/api', apiRoutes);

app.listen(PORT, (err) => {
  if (err) {
    logger.error(`Server failed to start: ${err.message}`);
    process.exit(1);
  }
  logger.info(`Server running on http://localhost:${PORT}`);
});