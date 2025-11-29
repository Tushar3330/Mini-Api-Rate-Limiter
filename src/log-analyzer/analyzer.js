const fs = require('fs').promises;
const path = require('path');
const logger = require('../../utils/logger');

async function analyzeLogs() {
  try {
    //reading and writing to the files
    const logFilePath = path.join(__dirname, '../../data/sample_api_logs.json');
    const outputPath = path.join(__dirname, 'output/summary.json');
    const rawData = await fs.readFile(logFilePath, 'utf-8');
    const logs = JSON.parse(rawData);

    // Initialize an array
    const ipCounts = {};
    const endpointCounts = {};
    const errors5xx = [];
    const errors4xx = [];
    const latencies = [];

    logs.forEach(log => {
      // Count IP requests
      ipCounts[log.ip] = (ipCounts[log.ip] || 0) + 1;
      
      // Count endpoints
      endpointCounts[log.endpoint] = (endpointCounts[log.endpoint] || 0) + 1;
      
      // Collect latencies for distribution
      latencies.push(log.response_time_ms);
      
      // Flag 5xx errors
      if (log.status >= 500) {
        errors5xx.push(log);
      }

      //flagg 4xx errors
      if (log.status >= 400 && log.status < 500) {
        errors4xx.push(log);
      }

    });

    // Calculate latency distribution
    latencies.sort((a, b) => a - b);
    const latencyDistribution = {
      min: latencies[0] || 0,
      max: latencies[latencies.length - 1] || 0,
      avg: latencies.length > 0 ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) : 0,
      p50: latencies[Math.floor(latencies.length * 0.5)] || 0,
      p95: latencies[Math.floor(latencies.length * 0.95)] || 0,
      p99: latencies[Math.floor(latencies.length * 0.99)] || 0
    };

    // Identify error patterns (group by endpoint and status)
    const errorPatterns = {
      '4xx_by_endpoint': {},
      '5xx_by_endpoint': {}
    };
    
    errors4xx.forEach(log => {
      const key = `${log.endpoint} (${log.status})`;
      errorPatterns['4xx_by_endpoint'][key] = (errorPatterns['4xx_by_endpoint'][key] || 0) + 1;
    });
    
    errors5xx.forEach(log => {
      const key = `${log.endpoint} (${log.status})`;
      errorPatterns['5xx_by_endpoint'][key] = (errorPatterns['5xx_by_endpoint'][key] || 0) + 1;
    });

    // Get top 5 IPs
    const mostActiveIps = Object.entries(ipCounts) .map(([ip, requests]) => ({ ip, requests }))
  .sort((a, b) => b.requests - a.requests)
      .slice(0, 5);

    // Get top 5 endpoints
    const topEndpoints = Object.entries(endpointCounts).map(([endpoint, requests]) => ({ endpoint, requests })) .sort((a, b) => b.requests - a.requests)
      .slice(0, 5);

    // Prepare output
    const summary = {
      most_active_ips: mostActiveIps, top_endpoints: topEndpoints,
      latency_distribution_ms: latencyDistribution,
      error_patterns: errorPatterns,
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