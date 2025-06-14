const express = require('express');
const slidingwindowratelimmiter = require('../middleware/ratelimiter');
const logger = require('../../../utils/logger');

const router = express.Router();

//api to test rate limiting of sliding window
router.get('/test', slidingwindowratelimmiter, (req, res) => {
  logger.info(`Processing request from IP: ${req.ip}`);
  res.json({ message: 'Request successful' });
});


//free
router.get('/unlimited', (req, res) => {
  logger.info(`Processing unlimited request from IP: ${req.ip}`);
  res.json({ message: 'Unlimited endpoint' });
});

module.exports = router;