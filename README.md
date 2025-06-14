Akto.io Assignment: API Rate Limiter and Log Analyzer
This project implements two backend assignments for Akto.io:

API Rate Limiter: A Node.js service that limits API requests per IP using a sliding window algorithm with Redis Enterprise Cloud.
API Log Analyzer: A script that processes a JSON log file to generate insights about IPs, endpoints, and response codes.

Prerequisites

Node.js: Version 14 or higher
Redis Enterprise Cloud: For the rate limiter (free tier available)
RedisInsight: GUI tool to manage and verify Redis data (optional, for testing)
Git: For cloning the repository
NPM: For installing dependencies

Setup Instructions
1. Set Up Redis Enterprise Cloud

Sign up for a free account at Redis Enterprise Cloud.
Create a new database and note the Endpoint URL, Port, and Password.
Update src/rate-limiter/services/redisClient.js with your Redis connection details:url: 'redis://:<password>@<endpoint>:<port>'


(Optional) Install RedisInsight to manage your Redis database:
Download from RedisInsight Downloads.
Install on Windows and connect to your Redis Enterprise Cloud database using the endpoint, port, and password.
Verify connection by running PING in the CLI tab (should return PONG).



2. Clone the Repository
git clone <your-repo-link>
cd akto-assignment

3. Install Dependencies
npm install

4. Run the Project
Start the Rate Limiter API
npm run start:limiter

The API runs on http://localhost:3000. Test endpoints:

GET /api/test: Rate-limited endpoint (10 requests per minute per IP).
GET /api/unlimited: Non-rate-limited endpoint for comparison.

Run the Log Analyzer
npm run analyze

This processes logs.json (place in the data/ folder) and outputs results to output/summary.json.
Project Structure
akto-assignment/
├── src/
│   ├── rate-limiter/
│   │   ├── middleware/
│   │   │   └── ratelimiter.js
│   │   ├── routes/
│   │   │   └── testapi.js
│   │   ├── services/
│   │   │   └── redisclient.js
│   │   └── server.js
│   ├── log-analyzer/
│   │   ├── analyzer.js
│   │   └── output/
│   │       └── summary.json
│   └── utils/
│       └── logger.js
├── data/
│   └── sample_api_logs.json
├── package.json
└── README.md

Rate Limiter Approach

Algorithm: Sliding window with Redis to track requests per IP within a 60-second window.
Logic: Stores timestamps of requests in a Redis sorted set. Removes timestamps older than 60 seconds and checks if the count exceeds 10.
Endpoints:
/api/test: Rate-limited endpoint.
/api/unlimited: No rate limit for testing.


Redis: Uses Redis Enterprise Cloud for persistent storage of request timestamps.
Error Handling: Returns 429 Too Many Requests when limit is exceeded.

Log Analyzer Approach

Input: Reads logs.json from the data/ folder.
Processing:
Identifies top 5 most active IPs by request count.
Identifies top 5 API endpoints by request count.
Flags 5xx response codes.


Output: Saves summary to output/summary.json in JSON format.
Error Handling: Validates input file and handles missing or malformed data.

Sample Log File Format
Place your logs.json in the data/ folder with the following structure:
[
  { "ip": "192.168.1.1", "endpoint": "/api/users", "response_code": 200, "timestamp": "2025-06-15T01:00:00Z" },
  { "ip": "192.168.1.2", "endpoint": "/api/orders", "response_code": 500, "timestamp": "2025-06-15T01:01:00Z" }
]

Sample Output (Log Analyzer)
The output/summary.json will look like:
{
  "most_active_ips": [
    { "ip": "192.168.1.1", "requests": 100 },
    { "ip": "192.168.1.2", "requests": 50 }
  ],
  "top_endpoints": [
    { "endpoint": "/api/users", "requests": 80 },
    { "endpoint": "/api/orders", "requests": 30 }
  ],
  "errors": [
    { "ip": "192.168.1.2", "endpoint": "/api/orders", "response_code": 500, "timestamp": "2025-06-15T01:01:00Z" }
  ]
}

Testing the Rate Limiter
Use curl or Postman to test:
curl http://localhost:3000/api/test

After 10 requests within 60 seconds from the same IP, you’ll see:
{ "error": "Too many requests, please try again later." }

Dependencies

express: For the API server
redis: For rate limiting
winston: For logging
uuid: For generating unique IDs

Notes

Ensure you’ve updated redisClient.js with your Redis Enterprise Cloud credentials.
Use RedisInsight to inspect keys (e.g., rate-limit:<ip>) and verify rate limiter functionality.
Place logs.json in the data/ folder before running the analyzer.
The code is modular, with separate concerns for middleware, routes, services, and utilities.
Error handling and logging are implemented for robustness.

