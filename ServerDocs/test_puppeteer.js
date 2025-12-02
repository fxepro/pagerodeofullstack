#!/usr/bin/env node
/**
 * Test if Puppeteer can launch successfully
 * Run from any directory: node ServerDocs/test_puppeteer.js
 */
const path = require('path');
const fs = require('fs');

// Find studio directory (where node_modules is)
const scriptDir = __dirname;
const projectRoot = path.resolve(scriptDir, '..');
const studioDir = path.join(projectRoot, 'studio');

if (!fs.existsSync(studioDir)) {
  console.error('❌ Error: Could not find studio directory');
  process.exit(1);
}

// Change working directory to studio BEFORE requiring puppeteer
process.chdir(studioDir);

// Now require puppeteer from the studio directory
const puppeteer = require('puppeteer');

async function testPuppeteer() {
  console.log('Testing Puppeteer...');
  console.log('Working directory:', process.cwd());
  
  try {
    const puppeteerPkg = require('puppeteer/package.json');
    console.log('Puppeteer version:', puppeteerPkg.version);
  } catch (e) {
    console.error('❌ Could not read Puppeteer package.json');
  }
  
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
    
    if (error.message.includes('Could not find Chrome') || error.message.includes('No usable sandbox')) {
      console.error('\n⚠️  Chrome/Chromium not found or sandbox issues!');
      console.error('Install Chrome dependencies:');
      console.error('  sudo apt-get update');
      console.error('  sudo apt-get install -y chromium-browser');
      console.error('  OR: sudo apt-get install -y chromium');
      console.error('\nIf Chrome is installed but not found, set PUPPETEER_EXECUTABLE_PATH:');
      console.error('  export PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser');
    }
    
    if (browser) {
      await browser.close();
    }
    process.exit(1);
  }
}

testPuppeteer();
