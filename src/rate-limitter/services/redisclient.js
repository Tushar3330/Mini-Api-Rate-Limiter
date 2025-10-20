const { createClient } = require('redis');
const logger = require('../../../utils/logger');

let client;

async function getClient() {
  if (!client) {
    client = createClient({
      url: 'redis://default:DFT217XQtvlsTN6MZ3wuHLNVPocMkobz@redis-17120.crce179.ap-south-1-1.ec2.redns.redis-cloud.com:17120',
    });

    client.on('error', (err) => {
      logger.error(`Redis error: ${err.message}`);
    });

    await client.connect();
    logger.info('Connected to Redis');
  }
  return client;
}

module.exports = { getClient };