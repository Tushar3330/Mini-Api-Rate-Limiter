# Mini API Rate Limiter & Log Analyzer

A high-performance API rate limiting system with multi-worker concurrency and comprehensive log analysis capabilities.

## Features

- ✅ **Sliding Window Rate Limiting** with Redis (sorted sets + hash tables)
- ✅ **Multi-Worker Clustering** for concurrent request handling
- ✅ **Log Analysis** with latency distribution (p50, p95, p99) and error pattern detection
- ✅ **Performance Optimized** for high-traffic scenarios
---
## Quick Start

### Prerequisites
- Node.js (v14+)
- Redis (cloud or local)

### Installation

```bash
git clone <your-repo-url>
cd Mini-Api-Rate-Limiter
npm install
```

### Configuration
Update Redis connection in `src/rate-limitter/services/redisclient.js`:
```javascript
url: 'redis://:<password>@<endpoint>:<port>'
```
---

## Usage
### 1. Start Rate Limiter Server

```bash
npm run start:limiter
```
Server runs on `http://localhost:3000`

**Endpoints**:
- `GET /api/test` - Rate-limited (10 req/min per IP)
- `GET /api/unlimited` - No rate limit

### 2. Run Log Analyzer

Place your logs in `data/sample_api_logs.json`, then:

```bash
npm run analyze
```
Output saved to `src/log-analyzer/output/summary.json`

---
## Testing

### Test Rate Limiting (Sequential)
```bash
npm run test:sequential
```
**Expected**: Clean progression 1/10 → 2/10 → ... → 10/10 → BLOCKED

### Test Concurrency (Multi-Worker)
```bash
npm run test:cluster
```
**Expected**: Different worker PIDs handling requests simultaneously

### Manual Test
```bash
# Send multiple requests
for i in {1..15}; do curl http://localhost:3000/api/test; sleep 0.2; done
```

---
## What to Expect

### Rate Limiter Logs
```
✅ Allowed | IP: ::1 | Worker PID 1234: 1 req(s) | Total in Redis: 1/10
✅ Allowed | IP: ::1 | Worker PID 1235: 1 req(s) | Total in Redis: 2/10
...
✅ Allowed | IP: ::1 | Worker PID 1234: 5 req(s) | Total in Redis: 10/10
🚫 BLOCKED | IP: ::1 | Worker PID 1236: 2 req(s) | Total in Redis: 10/10 - LIMIT EXCEEDED
```

**Key Observations**:
- Different worker PIDs = concurrent processing
- Redis count increases = rate limiting works across all workers
- After 10 requests = 429 errors (Too Many Requests)

### Log Analyzer Output
```json
{
  "most_active_ips": [
    { "ip": "192.168.1.1", "requests": 45 }
  ],
  "top_endpoints": [
    { "endpoint": "/api/users", "requests": 127 }
  ],
  "latency_distribution_ms": {
    "min": 12,
    "max": 980,
    "avg": 245,
    "p50": 220,
    "p95": 650,
    "p99": 890
  },
  "error_patterns": {
    "4xx_by_endpoint": {
      "/api/auth (401)": 23,
      "/api/users (403)": 12
    },
    "5xx_by_endpoint": {
      "/api/orders (500)": 5
    }
  }
}
```

---

## Project Structure

```
Mini-Api-Rate-Limiter/
├── src/
│   ├── rate-limitter/
│   │   ├── server.js              # Clustering & master process
│   │   ├── middleware/
│   │   │   └── ratelimiter.js     # Rate limiting logic
│   │   ├── routes/
│   │   │   └── testapi.js         # API endpoints
│   │   └── services/
│   │       └── redisclient.js     # Redis connection
│   ├── log-analyzer/
│   │   ├── analyzer.js            # Log processing
│   │   └── output/
│   │       └── summary.json       # Results
│   └── utils/
│       └── logger.js              # Winston logger
├── tests/
│   ├── test-cluster.js            # Concurrency test
│   └── test-sequential.js         # Rate limit test
├── data/
│   └── sample_api_logs.json       # Sample logs
├── IMPLEMENTATION.md              # Detailed technical guide
└── README.md
```

## Common Issues

**Q: I see "1/10" for multiple requests**
- Race condition in concurrent requests (expected)
- See `IMPLEMENTATION.md` for detailed explanation
- Use `npm run test:sequential` for clean counting

**Q: All requests blocked immediately**
- Wait 60 seconds for Redis window to expire
- Or flush Redis: `redis-cli FLUSHALL`

