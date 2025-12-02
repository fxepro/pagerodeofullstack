#!/usr/bin/env node
/**
 * Test if Puppeteer can launch successfully
 * Run: node test_puppeteer.js
 */
const puppeteer = require('puppeteer');

async function testPuppeteer() {
  console.log('Testing Puppeteer...');
  console.log('Puppeteer version:', require('puppeteer/package.json').version);
  
  let browser;
  try {
    console.log('\n[1] Attempting to launch browser...');
    browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
    
    console.log('✅ Browser launched successfully!');
    
    console.log('\n[2] Creating new page...');
    const page = await browser.newPage();
    console.log('✅ Page created successfully!');
    
    console.log('\n[3] Navigating to test page...');
    await page.goto('https://example.com', { 
      waitUntil: 'networkidle0',
      timeout: 10000 
    });
    console.log('✅ Navigation successful!');
    
    console.log('\n[4] Getting page title...');
    const title = await page.title();
    console.log('✅ Page title:', title);
    
    await browser.close();
    console.log('\n✅✅✅ All tests passed! Puppeteer is working correctly.');
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌❌❌ Puppeteer test failed!');
    console.error('Error:', error.message);
    console.error('\nFull error:', error);
    
    if (error.message.includes('Could not find Chrome')) {
      console.error('\n⚠️  Chrome/Chromium not found!');
      console.error('Install Chrome dependencies:');
      console.error('  Ubuntu/Debian: sudo apt-get install -y chromium-browser');
      console.error('  Or: sudo apt-get install -y chromium');
    }
    
    if (browser) {
      await browser.close();
    }
    process.exit(1);
  }
}

testPuppeteer();

