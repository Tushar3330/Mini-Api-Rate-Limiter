const redisClient = require('../services/redisClient');
const { v4: uuidv4 } = require('uuid');
const logger = require('../../../utils/logger');

//window size and limi of req
const wind_size = 60; const limit = 10;

// Track requests per worker process
const workerRequestCount = {};

async function slidingwindowratelimmiter(req, res, next) {
  const ip = req.ip;
  const key = `rate-limit:${ip}`;
  const metaKey = `rate-limit-meta:${ip}`; // Hash table for metadata
  const now = Date.now() / 1000;
  const windowStart = now - wind_size;
  
  // Increment worker's request count
  workerRequestCount[ip] = (workerRequestCount[ip] || 0) + 1;

  try {
    const cli = await redisClient.getClient();
    
    // Remove old requests outside the window (sorted set)
    await cli.zRemRangeByScore(key, 0, windowStart);
    // Count requests in the window
    const requestCount = await cli.zCard(key);
    
    if (requestCount >= limit) {
      logger.warn(`🚫 BLOCKED | IP: ${ip} | Worker PID ${process.pid}: ${workerRequestCount[ip]} req(s) handled | Total in Redis: ${requestCount}/${limit} - LIMIT EXCEEDED`);
      // Update hash table with block info
      await cli.hSet(metaKey, {
        lastBlocked: now.toString(),
        totalBlocked: (parseInt(await cli.hGet(metaKey, 'totalBlocked') || '0') + 1).toString()
      });
      await cli.expire(metaKey, wind_size * 2);
      return res.status(429).json({ error:
         'Too many requests, please try again later.' });
    }
    
    // Store request in sorted set with timestamp as score
    await cli.zAdd(key, { score: now, value: uuidv4() });
    await cli.expire(key, wind_size);
    
    // Store metadata in hash table
    await cli.hSet(metaKey, {
      lastRequest: now.toString(),
      totalRequests: (parseInt(await cli.hGet(metaKey, 'totalRequests') || '0') + 1).toString(),
      endpoint: req.path
    });
    await cli.expire(metaKey, wind_size * 2);
    
    // Log worker's request count for this IP
    logger.info(`✅ Allowed | IP: ${ip} | Worker PID ${process.pid}: ${workerRequestCount[ip]} req(s) handled by THIS worker | Total in Redis: ${requestCount + 1}/${limit}`);
    
    next();
  } catch (error) {
    logger.error(`Error in limiter: ${error.message}`);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = slidingwindowratelimmiter;