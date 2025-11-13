// Simple route test
// Run with: node scripts/test-route.js

const fs = require('fs')
const path = require('path')

console.log('🔍 Checking AI Health route...\n')

// Check if the page file exists
const pagePath = path.join(__dirname, '..', 'app', 'ai-health', 'page.tsx')
if (fs.existsSync(pagePath)) {
  console.log('✅ AI Health page file exists:', pagePath)
} else {
  console.log('❌ AI Health page file not found:', pagePath)
}

// Check if the component file exists
const componentPath = path.join(__dirname, '..', 'components', 'ai-health-main.tsx')
if (fs.existsSync(componentPath)) {
  console.log('✅ AI Health component file exists:', componentPath)
} else {
  console.log('❌ AI Health component file not found:', componentPath)
}

// Check the app directory structure
const appDir = path.join(__dirname, '..', 'app')
const aiHealthDir = path.join(appDir, 'ai-health')

if (fs.existsSync(aiHealthDir)) {
  console.log('✅ AI Health directory exists:', aiHealthDir)
  const files = fs.readdirSync(aiHealthDir)
  console.log('📁 Files in ai-health directory:', files)
} else {
  console.log('❌ AI Health directory not found:', aiHealthDir)
}

console.log('\n💡 If all files exist, restart the development server:')
console.log('   1. Stop the server (Ctrl+C)')
console.log('   2. Run: npm run dev')
console.log('   3. Visit: http://localhost:3000/ai-health')
