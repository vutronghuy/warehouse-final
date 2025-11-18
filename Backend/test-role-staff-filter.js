// Test role-based staff filtering
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const axios = require('axios');

async function testRoleStaffFilter() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/warehouse_db');
    console.log('✅ Connected to MongoDB');

    // Login as super admin to get token
    console.log('\n🔐 Logging in as super admin...');
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      identifier: 'superadmin',
      password: 'superadmin123'
    });

    const token = loginResponse.data.token;
    console.log('✅ Login successful');

    // Test 1: Get all users to see available roles
    console.log('\n📋 Test 1: Get all users to see available roles');
    try {
      const response = await axios.get('http://localhost:3001/api/users?role=all&status=all', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('✅ Users fetched successfully');
      console.log('Total users:', response.data.users.length);
      
      // Group users by role
      const usersByRole = {};
      response.data.users.forEach(user => {
        if (!usersByRole[user.role]) {
          usersByRole[user.role] = [];
        }
        usersByRole[user.role].push({
          id: user._id,
          name: user[user.role]?.fullName || user[user.role]?.username,
          role: user.role
        });
      });
      
      console.log('\n📊 Users by role:');
      Object.keys(usersByRole).forEach(role => {
        console.log(`- ${role}: ${usersByRole[role].length} users`);
        usersByRole[role].forEach(user => {
          console.log(`  - ${user.name} (${user.id})`);
        });
      });
      
    } catch (error) {
      console.error('❌ Error fetching users:', error.response?.data || error.message);
    }

    // Test 2: Test audit logs with role filter
    console.log('\n📋 Test 2: Test audit logs with role filter');
    const roles = ['staff', 'manager', 'accounter', 'admin'];
    
    for (const role of roles) {
      try {
        console.log(`\n🔍 Testing role filter: ${role}`);
        const response = await axios.get(`http://localhost:3001/api/audit/logs?role=${role}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log(`✅ ${role} filter successful`);
        console.log(`Total logs for ${role}:`, response.data.pagination.total);
        
        if (response.data.auditLogs.length > 0) {
          console.log('Sample log:', {
            action: response.data.auditLogs[0].action,
            actor: response.data.auditLogs[0].actor.name,
            role: response.data.auditLogs[0].actor.role
          });
        }
        
      } catch (error) {
        console.error(`❌ Error testing ${role} filter:`, error.response?.data || error.message);
      }
    }

    // Test 3: Test combined role and staff filters
    console.log('\n📋 Test 3: Test combined role and staff filters');
    try {
      // Get a staff user ID
      const usersResponse = await axios.get('http://localhost:3001/api/users?role=staff&status=all', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (usersResponse.data.users.length > 0) {
        const staffId = usersResponse.data.users[0]._id;
        const staffName = usersResponse.data.users[0].staff?.fullName || usersResponse.data.users[0].staff?.username;
        
        console.log(`\n🔍 Testing staff filter for: ${staffName} (${staffId})`);
        
        const response = await axios.get(`http://localhost:3001/api/audit/logs?role=staff&staffId=${staffId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log('✅ Combined filter successful');
        console.log(`Total logs for specific staff:`, response.data.pagination.total);
        
        if (response.data.auditLogs.length > 0) {
          console.log('Sample log:', {
            action: response.data.auditLogs[0].action,
            actor: response.data.auditLogs[0].actor.name,
            role: response.data.auditLogs[0].actor.role
          });
        }
      } else {
        console.log('⚠️ No staff users found to test with');
      }
      
    } catch (error) {
      console.error('❌ Error testing combined filters:', error.response?.data || error.message);
    }

    console.log('\n🎉 Role-based staff filtering test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the test
testRoleStaffFilter();


























