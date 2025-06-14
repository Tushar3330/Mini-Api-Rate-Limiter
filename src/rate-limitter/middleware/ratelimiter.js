const redisClient = require('../services/redisClient');
const { v4: uuidv4 } = require('uuid');
const logger = require('../../../utils/logger');

//window size and limi of req
const wind_size = 60; const limit = 10;

async function slidingwindowratelimmiter(req, res, next) {
  const ip = req.ip;
  const key = `rate-limit:${ip}`;
  const now = Date.now() / 1000;
  const windowStart = now - wind_size;

  try {
    const cli = await redisClient.getClient();
    
    // Remove old requests outside the window
    await cli.zRemRangeByScore(key, 0, windowStart);
    // Count requests in the window
    const requestCount = await cli.zCard(key);
    
    if (requestCount >= limit) {
      logger.warn(`Rate limit crossed for IP: ${ip}`);
      return res.status(429).json({ error:
         'Too many requests, please try again later.' });
    }
    
    await cli.zAdd(key, { score: now, value: uuidv4() });
    await cli.expire(key, wind_size);
    
    next();
  } catch (error) {
    logger.error(`Error in limiter: ${error.message}`);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = slidingwindowratelimmiter;