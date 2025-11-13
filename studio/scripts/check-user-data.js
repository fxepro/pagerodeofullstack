// Quick script to check user data
const axios = require('axios');

async function checkUserData() {
  try {
    console.log('🔍 Checking user data...');
    
    // Test login for madman user
    const loginResponse = await axios.post('http://localhost:8000/api/token/', {
      username: 'madman',
      password: 'your_password_here' // Replace with actual password
    });
    
    console.log('✅ Login successful');
    
    // Get user info
    const userInfoResponse = await axios.get('http://localhost:8000/api/user-info/', {
      headers: { Authorization: `Bearer ${loginResponse.data.access}` }
    });
    
    console.log('📋 User data:', JSON.stringify(userInfoResponse.data, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

checkUserData();
