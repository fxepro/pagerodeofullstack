#!/usr/bin/env node
/**
 * Test if Puppeteer can launch successfully
 * Run from any directory: node ServerDocs/test_puppeteer.js
 */
const path = require('path');
const fs = require('fs');
const Module = require('module');

// Find studio directory (where node_modules is)
const scriptDir = __dirname;
const projectRoot = path.resolve(scriptDir, '..');
const studioDir = path.join(projectRoot, 'studio');
const studioNodeModules = path.join(studioDir, 'node_modules');

if (!fs.existsSync(studioDir)) {
  console.error('❌ Error: Could not find studio directory');
  process.exit(1);
}

if (!fs.existsSync(studioNodeModules)) {
  console.error('❌ Error: Could not find studio/node_modules');
  console.error('   Please run: cd studio && npm install');
  process.exit(1);
}

// Add studio/node_modules to module search path
const originalResolveFilename = Module._resolveFilename;
Module._resolveFilename = function(request, parent, isMain, options) {
  // Try studio/node_modules first
  if (request === 'puppeteer' || request.startsWith('puppeteer/')) {
    const puppeteerPath = path.join(studioNodeModules, request);
    if (fs.existsSync(puppeteerPath) || fs.existsSync(puppeteerPath + '.js')) {
      return puppeteerPath;
    }
  }
  return originalResolveFilename.call(this, request, parent, isMain, options);
};

// Now require puppeteer - it will find it in studio/node_modules
const puppeteer = require('puppeteer');

async function testPuppeteer() {
  console.log('Testing Puppeteer...');
  console.log('Studio directory:', studioDir);
  console.log('Node modules:', studioNodeModules);
  
  try {
    const puppeteerPkg = require(path.join(studioNodeModules, 'puppeteer/package.json'));
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
