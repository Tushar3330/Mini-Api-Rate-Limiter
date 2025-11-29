// Test rate limiter with sequential requests only (no race condition)
const http = require('http');

console.log('🔢 Testing Rate Limiter with Sequential Requests\n');
console.log('📊 Sending 15 requests with 150ms delay between each\n');

function makeRequest(num) {
  const startTime = Date.now();
  return new Promise((resolve) => {
    const req = http.get('http://localhost:3000/api/test', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const duration = Date.now() - startTime;
        const emoji = res.statusCode === 200 ? '✅' : '🚫';
        console.log(`${emoji} Request ${num.toString().padStart(2)}: Status ${res.statusCode} (${duration}ms)`);
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
  let passCount = 0;
  let blockCount = 0;
  
  for (let i = 1; i <= 15; i++) {
    const status = await makeRequest(i);
    if (status === 200) passCount++;
    if (status === 429) blockCount++;
    
    // 150ms delay to ensure Redis writes complete before next read
    await new Promise(resolve => setTimeout(resolve, 150));
  }
  
  console.log('\n=== RESULTS ===');
  console.log(`✅ Passed: ${passCount} requests (should be ~10)`);
  console.log(`🚫 Blocked: ${blockCount} requests (should be ~5)`);
  console.log('\n💡 CHECK SERVER LOGS:');
  console.log('📈 You should see clean progression:');
  console.log('   1/10 → 2/10 → 3/10 → ... → 10/10 → BLOCKED!');
  console.log('👀 Notice different worker PIDs handling requests = Multi-worker distribution!');
  console.log('🎯 No race condition - each request waits for previous to complete!\n');
}

runTest();
