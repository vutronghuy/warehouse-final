// Test audit API endpoints
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const AuditLog = require('./models/AuditLog');
const axios = require('axios');

async function testAuditAPI() {
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

    // Test 1: Get audit logs without filters
    console.log('\n📋 Test 1: Get audit logs without filters');
    try {
      const response = await axios.get('http://localhost:3001/api/audit/logs', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('✅ Audit logs fetched successfully');
      console.log('Total logs:', response.data.pagination.total);
      console.log('Current page:', response.data.pagination.page);
      console.log('Total pages:', response.data.pagination.pages);
      
      if (response.data.auditLogs.length > 0) {
        console.log('Sample log:', {
          action: response.data.auditLogs[0].action,
          actor: response.data.auditLogs[0].actor.name,
          outcome: response.data.auditLogs[0].outcome
        });
      }
    } catch (error) {
      console.error('❌ Error fetching audit logs:', error.response?.data || error.message);
    }

    // Test 2: Get audit logs with role filter
    console.log('\n📋 Test 2: Get audit logs with role filter (staff)');
    try {
      const response = await axios.get('http://localhost:3001/api/audit/logs?role=staff', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('✅ Filtered audit logs fetched successfully');
      console.log('Total logs (staff only):', response.data.pagination.total);
      
      if (response.data.auditLogs.length > 0) {
        console.log('Sample staff log:', {
          action: response.data.auditLogs[0].action,
          actor: response.data.auditLogs[0].actor.name,
          role: response.data.auditLogs[0].actor.role
        });
      }
    } catch (error) {
      console.error('❌ Error fetching filtered audit logs:', error.response?.data || error.message);
    }

    // Test 3: Get audit logs with action filter
    console.log('\n📋 Test 3: Get audit logs with action filter');
    try {
      const response = await axios.get('http://localhost:3001/api/audit/logs?action=CREATE_INVOICE', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('✅ Action-filtered audit logs fetched successfully');
      console.log('Total logs (CREATE_INVOICE only):', response.data.pagination.total);
    } catch (error) {
      console.error('❌ Error fetching action-filtered audit logs:', error.response?.data || error.message);
    }

    // Test 4: Get audit statistics
    console.log('\n📊 Test 4: Get audit statistics');
    try {
      const response = await axios.get('http://localhost:3001/api/audit/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('✅ Audit statistics fetched successfully');
      console.log('Stats:', response.data.stats);
    } catch (error) {
      console.error('❌ Error fetching audit stats:', error.response?.data || error.message);
    }

    // Test 5: Create sample audit log
    console.log('\n📝 Test 5: Create sample audit log');
    try {
      const sampleLog = new AuditLog({
        category: 'BUSINESS',
        action: 'TEST_ACTION',
        actor: {
          id: new mongoose.Types.ObjectId(),
          email: 'test@example.com',
          name: 'Test User',
          role: 'staff'
        },
        target: {
          type: 'TestTarget',
          id: new mongoose.Types.ObjectId()
        },
        before: { status: 'old' },
        after: { status: 'new' },
        reason: 'Test audit log creation',
        outcome: 'SUCCESS',
        meta: { test: true }
      });

      await sampleLog.save();
      console.log('✅ Sample audit log created successfully');
      
      // Clean up
      await AuditLog.deleteOne({ _id: sampleLog._id });
      console.log('✅ Sample audit log cleaned up');
    } catch (error) {
      console.error('❌ Error creating sample audit log:', error.message);
    }

    console.log('\n🎉 All audit API tests completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the test
testAuditAPI();


























