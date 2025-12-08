/**
 * Quick script to verify PayPal Client ID is set
 * Run: node verify-paypal-env.js
 */

const fs = require('fs');
const path = require('path');

const envLocalPath = path.join(__dirname, '.env.local');
const envPath = path.join(__dirname, '.env');

console.log('Checking for PayPal Client ID...\n');

// Check .env.local first (Next.js priority)
if (fs.existsSync(envLocalPath)) {
  console.log('✓ Found .env.local');
  const envLocal = fs.readFileSync(envLocalPath, 'utf8');
  const paypalId = envLocal.match(/NEXT_PUBLIC_PAYPAL_CLIENT_ID=(.+)/);
  
  if (paypalId && paypalId[1] && paypalId[1].trim() !== '' && !paypalId[1].includes('your_')) {
    console.log('✓ NEXT_PUBLIC_PAYPAL_CLIENT_ID is set in .env.local');
    console.log(`  Value: ${paypalId[1].substring(0, 15)}...`);
  } else {
    console.log('✗ NEXT_PUBLIC_PAYPAL_CLIENT_ID not found or invalid in .env.local');
    console.log('  Add: NEXT_PUBLIC_PAYPAL_CLIENT_ID=your_sandbox_client_id');
  }
} else {
  console.log('✗ .env.local not found');
  console.log('  Create .env.local in the studio/ directory');
}

// Check .env as fallback
if (fs.existsSync(envPath)) {
  console.log('\n✓ Found .env');
  const env = fs.readFileSync(envPath, 'utf8');
  const paypalId = env.match(/NEXT_PUBLIC_PAYPAL_CLIENT_ID=(.+)/);
  
  if (paypalId && paypalId[1] && paypalId[1].trim() !== '' && !paypalId[1].includes('your_')) {
    console.log('✓ NEXT_PUBLIC_PAYPAL_CLIENT_ID is set in .env');
    console.log(`  Value: ${paypalId[1].substring(0, 15)}...`);
    console.log('\n⚠️  Note: Next.js prefers .env.local over .env');
    console.log('  Consider copying to .env.local for better security');
  }
}

console.log('\n📝 Next steps:');
console.log('1. Make sure NEXT_PUBLIC_PAYPAL_CLIENT_ID is in .env.local');
console.log('2. Restart your Next.js dev server (npm run dev)');
console.log('3. Check browser console for PayPal Client ID logs');

