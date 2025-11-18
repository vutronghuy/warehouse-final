// Test toggle user status with email notification
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const axios = require('axios');

async function testToggleStatusWithEmail() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/warehouse_db');
    console.log('✅ Connected to MongoDB');

    // Find a test user (not super admin)
    const testUser = await User.findOne({ 
      role: { $ne: 'admin' } 
    }).lean();
    
    if (!testUser) {
      console.log('❌ No test user found. Please create a user first.');
      return;
    }

    console.log('👤 Test user found:');
    console.log('ID:', testUser._id);
    console.log('Role:', testUser.role);
    console.log('Username:', testUser[testUser.role]?.username);
    console.log('Email:', testUser[testUser.role]?.email);
    console.log('Status:', testUser[testUser.role]?.status);
    console.log('Is Active:', testUser[testUser.role]?.isActive);

    // Login as super admin to get token
    console.log('\n🔐 Logging in as super admin...');
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      identifier: 'superadmin',
      password: 'superadmin123'
    });

    const token = loginResponse.data.token;
    console.log('✅ Login successful');

    // Test deactivation
    console.log('\n🚫 Testing user deactivation...');
    try {
      const deactivateResponse = await axios.put(
        `http://localhost:3001/api/users/${testUser._id}/toggle-status`,
        { status: 'inactive' },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      console.log('✅ Deactivation successful');
      console.log('Response:', deactivateResponse.data);
      
      // Check if email was sent (this would be logged in backend)
      console.log('📧 Check backend logs for email notification');
      
    } catch (error) {
      console.error('❌ Deactivation failed:', error.response?.data || error.message);
    }

    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test reactivation
    console.log('\n✅ Testing user reactivation...');
    try {
      const reactivateResponse = await axios.put(
        `http://localhost:3001/api/users/${testUser._id}/toggle-status`,
        { status: 'active' },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      console.log('✅ Reactivation successful');
      console.log('Response:', reactivateResponse.data);
      
      // Check if email was sent (this would be logged in backend)
      console.log('📧 Check backend logs for email notification');
      
    } catch (error) {
      console.error('❌ Reactivation failed:', error.response?.data || error.message);
    }

    console.log('\n🎉 Test completed!');
    console.log('📧 Check the user\'s email for notifications');
    console.log('📋 Check backend logs for email sending status');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the test
testToggleStatusWithEmail();


























