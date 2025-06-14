const fs = require('fs').promises;
const path = require('path');
const logger = require('../../utils/logger');

async function analyzeLogs() {
  try {
    const logFilePath = path.join(__dirname, '../../data/sample_api_logs.json');
    const outputPath = path.join(__dirname, 'output/summary.json');

    // Read log file
    const rawData = await fs.readFile(logFilePath, 'utf-8');
    const logs = JSON.parse(rawData);

    // Initialize data structures
    const ipCounts = {};
    const endpointCounts = {};
    const errors5xx = [];
    const errors4xx = [];

    // Process logs
    logs.forEach(log => {
      // Count IPs
      ipCounts[log.ip] = (ipCounts[log.ip] || 0) + 1;
      
      // Count endpoints
      endpointCounts[log.endpoint] = (endpointCounts[log.endpoint] || 0) + 1;
      
      // Flag 5xx errors
      if (log.status >= 500) {
        errors5xx.push(log);
      }

      //flagg 4xx errors
      if (log.status >= 400 && log.status < 500) {
        errors4xx.push(log);
      }

    });

    // Get top 5 IPs
    const mostActiveIps = Object.entries(ipCounts)
      .map(([ip, requests]) => ({ ip, requests }))
      .sort((a, b) => b.requests - a.requests)
      .slice(0, 5);

    // Get top 5 endpoints
    const topEndpoints = Object.entries(endpointCounts)
      .map(([endpoint, requests]) => ({ endpoint, requests }))
      .sort((a, b) => b.requests - a.requests)
      .slice(0, 5);

    // Prepare output
    const summary = {
      most_active_ips: mostActiveIps,
      top_endpoints: topEndpoints,
      errors5xx,
      errors4xx,
    };

    // Write output
    await fs.writeFile(outputPath, JSON.stringify(summary, null, 2));
    logger.info(`Analysis complete. Output saved to ${outputPath}`);
    console.log('Analysis complete. Check output/summary.json');
  } catch (error) {
    logger.error(`Log analyzer error: ${error.message}`);
    console.error('Error analyzing logs:', error.message);
  }
}

analyzeLogs();