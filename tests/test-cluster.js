// Simple test to verify clustering is working
const http = require('http');

console.log('🚀 Testing clustered server with concurrent requests...\n');
console.log('📊 Part 1: Testing concurrency (should all pass)');
console.log('📊 Part 2: Testing rate limit (should block after 10)\n');

function makeRequest(num, label = '') {
  const startTime = Date.now();
  return new Promise((resolve) => {
    const req = http.get('http://localhost:3000/api/test', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const duration = Date.now() - startTime;
        const status = res.statusCode === 200 ? '✅' : '❌';
        const emoji = res.statusCode === 429 ? '🚫' : status;
        console.log(`${emoji} ${label}Request ${num.toString().padStart(2)}: Status ${res.statusCode} (${duration}ms)`);
        resolve(res.statusCode);
      });
    });
    req.on('error', (err) => {
      console.log(`❌ Request ${num}: Error - ${err.message}`);
      resolve(0);
    });
  });
}

async function runTest() {
  console.log('\n=== PART 1: Concurrent Requests (Testing Multi-Worker) ===');
  const concurrentPromises = [];
  // Send 8 concurrent requests (less than limit)
  for (let i = 1; i <= 8; i++) {
    concurrentPromises.push(makeRequest(i, '[Concurrent] '));
  }
  await Promise.all(concurrentPromises);
  
  console.log('\n=== PART 2: Sequential Requests with Delay (Testing Rate Limit) ===');
  console.log('Waiting 2 seconds before sequential test...\n');
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Now send 15 sequential requests with 100ms delay to avoid race condition
  let passCount = 0;
  let blockCount = 0;
  
  for (let i = 1; i <= 15; i++) {
    const status = await makeRequest(i, '[Sequential] ');
    if (status === 200) passCount++;
    if (status === 429) blockCount++;
    await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay to avoid race condition
  }
  
  console.log('\n=== RESULTS ===');
  console.log(`✅ Passed: ${passCount} requests`);
  console.log(`🚫 Blocked: ${blockCount} requests`);
  console.log('\n💡 CONCURRENCY PROOF:');
  console.log('👀 Check server terminal - you should see DIFFERENT worker PIDs handling requests');
  console.log('📊 This proves multiple workers are processing requests concurrently!');
  console.log('\n💡 RATE LIMITING PROOF:');
  console.log(`✅ After ~10 requests, you should see 429 (Too Many Requests) responses`);
  console.log('🔒 This proves the rate limiter is working across all workers!');
  console.log('📈 Check Redis count progression: 1/10 → 2/10 → 3/10 → ... → 10/10 → BLOCKED!\n');
}

runTest();
