// Test script for AI Health page
// Run with: node scripts/test-ai-health-page.js

const BASE_URL = 'http://localhost:3000'

async function testAIHealthPage() {
  console.log('🧪 Testing AI Health Page...\n')
  
  try {
    // Test 1: Page loads
    console.log('1️⃣ Testing AI Health page loads...')
    const pageResponse = await fetch(`${BASE_URL}/ai-health`)
    
    if (pageResponse.ok) {
      console.log('✅ AI Health page loads successfully')
    } else {
      console.log('❌ AI Health page failed to load:', pageResponse.status)
    }
    
    // Test 2: API endpoints work
    console.log('\n2️⃣ Testing API endpoints...')
    
    // Test status endpoint
    const statusResponse = await fetch(`${BASE_URL}/api/ai-health/status`)
    const statusData = await statusResponse.json()
    console.log('✅ Status endpoint:', statusData.overall)
    
    // Test metrics endpoint
    const metricsResponse = await fetch(`${BASE_URL}/api/ai-health/metrics`)
    const metricsData = await metricsResponse.json()
    console.log('✅ Metrics endpoint:', metricsData.totalRequests, 'requests')
    
    console.log('\n🎉 AI Health page is working correctly!')
    console.log('\n📋 What to check:')
    console.log('- Navigate to /ai-health in your browser')
    console.log('- Check the hero section with URL input')
    console.log('- Verify the AI Health link in navigation')
    console.log('- Test the "Check AI Health" button')
    console.log('- View the dashboard metrics')
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
    console.log('\n💡 Make sure the development server is running: npm run dev')
  }
}

// Run the tests
testAIHealthPage()
