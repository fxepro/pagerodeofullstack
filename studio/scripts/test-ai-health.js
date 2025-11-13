// Test script for AI Health endpoints
// Run with: node scripts/test-ai-health.js

const BASE_URL = 'http://localhost:3000'

async function testAIHealthEndpoints() {
  console.log('🧪 Testing AI Health Endpoints...\n')
  
  try {
    // Test 1: AI Health Status
    console.log('1️⃣ Testing /api/ai-health/status...')
    const statusResponse = await fetch(`${BASE_URL}/api/ai-health/status`)
    const statusData = await statusResponse.json()
    
    console.log('✅ Status Response:', {
      overall: statusData.overall,
      providers: statusData.providers?.length || 0,
      successRate: statusData.successRate,
      averageResponseTime: statusData.averageResponseTime
    })
    
    // Test 2: AI Health Metrics (GET)
    console.log('\n2️⃣ Testing /api/ai-health/metrics (GET)...')
    const metricsResponse = await fetch(`${BASE_URL}/api/ai-health/metrics`)
    const metricsData = await metricsResponse.json()
    
    console.log('✅ Metrics Response:', {
      totalRequests: metricsData.totalRequests,
      successRate: metricsData.successRate,
      averageResponseTime: metricsData.averageResponseTime,
      totalCost: metricsData.totalCost
    })
    
    // Test 3: AI Health Metrics (POST) - Simulate metrics collection
    console.log('\n3️⃣ Testing /api/ai-health/metrics (POST)...')
    const testMetrics = {
      provider: 'gemini',
      model: 'gemini-1.5-flash',
      responseTime: 1250,
      status: 'success',
      inputTokens: 150,
      outputTokens: 75,
      requestSize: 1024,
      responseSize: 512
    }
    
    const postResponse = await fetch(`${BASE_URL}/api/ai-health/metrics`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testMetrics)
    })
    
    const postData = await postResponse.json()
    console.log('✅ Metrics POST Response:', postData)
    
    // Test 4: Verify metrics were stored
    console.log('\n4️⃣ Verifying stored metrics...')
    const verifyResponse = await fetch(`${BASE_URL}/api/ai-health/metrics`)
    const verifyData = await verifyResponse.json()
    
    console.log('✅ Updated Metrics:', {
      totalRequests: verifyData.totalRequests,
      successRate: verifyData.successRate,
      totalCost: verifyData.totalCost
    })
    
    console.log('\n🎉 All tests completed successfully!')
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
    console.log('\n💡 Make sure the development server is running: npm run dev')
  }
}

// Run the tests
testAIHealthEndpoints()
