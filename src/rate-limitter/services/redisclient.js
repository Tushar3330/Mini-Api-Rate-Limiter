const { createClient } = require('redis');
const logger = require('../../../utils/logger');

let client;

async function getClient() {
  if (!client) {
    client = createClient({
      url: 'redis://default:DhgXDzzSyWMndOv1XC47Rv6s4ilICS49@redis-15731.c15.us-east-1-2.ec2.redns.redis-cloud.com:15731'
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