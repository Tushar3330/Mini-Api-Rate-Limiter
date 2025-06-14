# Mini API Rate Limiter & Log Analyzer

This project contains two main components:

1. **Mini API Rate Limiter**  
2. **Log Analyzer for API Logs**

---

## Table of Contents

- [Features](#features)
- [Setup Instructions](#setup-instructions)
  - [1. Set Up Redis Enterprise Cloud](#1-set-up-redis-enterprise-cloud)
  - [2. Clone the Repository](#2-clone-the-repository)
  - [3. Install Dependencies](#3-install-dependencies)
  - [4. Run the Project](#4-run-the-project)
- [Project Structure](#project-structure)
- [Rate Limiter Approach](#rate-limiter-approach)
- [Log Analyzer Approach](#log-analyzer-approach)
- [Sample Outputs](#sample-outputs)
- [Testing the Rate Limiter](#testing-the-rate-limiter)

---

## Features

- **Sliding Window API Rate Limiting** with Redis for storing request timestamps.
- **Log Analyzer** to identify top IPs, top endpoints, and highlight 4xx/5xx responses.
- **Comprehensive Logging** for all major operations.


---

## Setup Instructions


- **Note:**  
   Anyways i have added mine reddis connection details in the `src/rate-limiter/services/redisclient.js` file. so you can run the project without setting up your own Redis instance.

---
### 1. ALTERNATIVELY

- Sign up for a free account at [Redis Enterprise Cloud](https://redis.com/try-free/).
- Create a new database and note the **Endpoint URL**, **Port**, and **Password**.
- Update `src/rate-limiter/services/redisclient.js` with your Redis connection details:

  ```js
  url: 'redis://:<password>@<endpoint>:<port>'
  ```


### 2. Clone the Repository

```bash
git clone <your-repo-link>
cd Mini-Api-Rate-Limiter
```

---

### 3. Install Dependencies

```bash
npm install
```

---

### 4. Run the Project

#### Start the Rate Limiter API

```bash
npm run start:limiter
```

The API runs on [http://localhost:3000](http://localhost:3000).

Endpoints:

- `GET /api/test` - Rate-limited endpoint (10 requests per minute per IP).
- `GET /api/unlimited` - Non-rate-limited endpoint for comparison.

---
**Test with:**

```bash
curl http://localhost:3000/api/test
```

#### Run the Log Analyzer

Place your log file as `sample_api_logs.json` in the `data/` folder.

```bash
npm run analyze
```

This will process `logs.json` (from `data/`) and output results to `output/summary.json`.

---

## Project Structure

```
Mini-Api-Rate-Limiter/
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
```

---

## Rate Limiter Approach

- **Algorithm:** Sliding window with Redis to track requests per IP within a 60-second window.
- **Logic:**  
  - Stores timestamps of requests in a Redis sorted set.
  - Removes timestamps older than 60 seconds.
  - Checks if the count exceeds 10.
- **Endpoints:**
  - `/api/test`: Rate-limited endpoint.
  - `/api/unlimited`: No rate limit for testing.
- **Redis:** Used for persistent storage of request timestamps.
- **Error Handling:** Returns `429 Too Many Requests` when the limit is exceeded.

---

## Log Analyzer Approach

- **Input:** Reads `sample_api_logs.json` from the `data/` folder.
- **Processing:**
  - Identifies top 5 most active IPs by request count.
  - Identifies top 5 API endpoints by request count.
  - Flags 5xx response codes.
  - Flags 4xx response codes for further analysis.
- **Output:** Saves summary to `output/summary.json` in JSON format.
- **Error Handling:** Validates input file and handles missing or malformed data.

---

## Sample Outputs

### API Rate Limiter

**Run the rate limiter:**

```bash
npm run start:limiter
```

**Test with:**

```bash
curl http://localhost:3000/api/test
```

**Response:**

```json
{"message":"Request successful"}
```

**Console logs:**

```
{"level":"info","message":"Server running on http://localhost:3000","timestamp":"2025-06-14T21:32:38.310Z"}
{"level":"info","message":"Request: GET /api/test from ::1","timestamp":"2025-06-14T21:32:45.650Z"}
{"level":"info","message":"Connected to Redis","timestamp":"2025-06-14T21:32:46.312Z"}
{"level":"info","message":"Processing request from IP: ::1","timestamp":"2025-06-14T21:32:47.300Z"}
```

---

### Log Analyzer

**Run the log analyzer:**

```bash
npm run analyze
```

**Console output:**

```
{"level":"info","message":"Analysis complete. Output saved to C:\\Users\\tusha\\Documents\\Projects\\Mini-Api-Rate-Limiter\\src\\log-analyzer\\output\\summary.json","timestamp":"2025-06-14T21:34:09.062Z"}
Analysis complete. Check output/summary.json
```

**Sample `output/summary.json`:**

```json
{
  "most_active_ips": [
    {
      "ip": "83.144.94.57",
      "requests": 1
    },
    {
      "ip": "146.24.177.177",
      "requests": 1
    },
    {
      "ip": "37.217.17.177",
      "requests": 1
    },
    {
      "ip": "114.65.65.39",
      "requests": 1
    },
    {
      "ip": "78.205.207.55",
      "requests": 1
    }
  ]
}
```

---

## Testing the Rate Limiter

Use `curl` or Postman to test:

```bash
curl http://localhost:3000/api/test
```

---
