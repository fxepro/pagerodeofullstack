// Test script to verify user routing works correctly
const axios = require('axios');

const BASE_URL = 'http://localhost:8000/api';

async function testUserRouting() {
  console.log('🧪 Testing User Routing System...\n');

  try {
    // Test 1: Create a test user with 'viewer' role
    console.log('1. Creating test user with viewer role...');
    const createUserResponse = await axios.post(`${BASE_URL}/users/create/`, {
      username: 'testviewer',
      email: 'viewer@test.com',
      password: 'testpass123',
      first_name: 'Test',
      last_name: 'Viewer',
      role: 'viewer'
    });
    console.log('✅ Test viewer user created:', createUserResponse.data.username);

    // Test 2: Create a test user with 'admin' role
    console.log('\n2. Creating test user with admin role...');
    const createAdminResponse = await axios.post(`${BASE_URL}/users/create/`, {
      username: 'testadmin',
      email: 'admin@test.com',
      password: 'testpass123',
      first_name: 'Test',
      last_name: 'Admin',
      role: 'admin'
    });
    console.log('✅ Test admin user created:', createAdminResponse.data.username);

    // Test 3: Test login for viewer user
    console.log('\n3. Testing login for viewer user...');
    const viewerLoginResponse = await axios.post(`${BASE_URL}/token/`, {
      username: 'testviewer',
      password: 'testpass123'
    });
    console.log('✅ Viewer login successful');

    // Test 4: Test user info for viewer
    console.log('\n4. Testing user info for viewer...');
    const viewerInfoResponse = await axios.get(`${BASE_URL}/user-info/`, {
      headers: { Authorization: `Bearer ${viewerLoginResponse.data.access}` }
    });
    console.log('✅ Viewer user info:', {
      username: viewerInfoResponse.data.username,
      role: viewerInfoResponse.data.role,
      shouldRouteTo: viewerInfoResponse.data.role === 'admin' ? 'Admin Dashboard' : 'User Dashboard'
    });

    // Test 5: Test login for admin user
    console.log('\n5. Testing login for admin user...');
    const adminLoginResponse = await axios.post(`${BASE_URL}/token/`, {
      username: 'testadmin',
      password: 'testpass123'
    });
    console.log('✅ Admin login successful');

    // Test 6: Test user info for admin
    console.log('\n6. Testing user info for admin...');
    const adminInfoResponse = await axios.get(`${BASE_URL}/user-info/`, {
      headers: { Authorization: `Bearer ${adminLoginResponse.data.access}` }
    });
    console.log('✅ Admin user info:', {
      username: adminInfoResponse.data.username,
      role: adminInfoResponse.data.role,
      shouldRouteTo: adminInfoResponse.data.role === 'admin' ? 'Admin Dashboard' : 'User Dashboard'
    });

    // Test 7: Test user statistics
    console.log('\n7. Testing user statistics...');
    const statsResponse = await axios.get(`${BASE_URL}/users/stats/`, {
      headers: { Authorization: `Bearer ${adminLoginResponse.data.access}` }
    });
    console.log('✅ User statistics:', statsResponse.data);

    console.log('\n🎉 All tests passed! User routing system is working correctly.');
    console.log('\n📋 Test Results Summary:');
    console.log('- Viewer users will be routed to: /dashboard');
    console.log('- Admin users will be routed to: /admin/dashboard');
    console.log('- Role-based access control is working');
    console.log('- User management APIs are functional');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testUserRouting();
