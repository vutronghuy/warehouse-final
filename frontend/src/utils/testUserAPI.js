import axios from 'axios';

// Test user API endpoints with cache-busting
export const testUserAPI = async () => {
  try {
    console.log('🧪 Testing User API Endpoints with Cache-Busting...');

    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      console.log('⚠️ No token found. Please login first.');
      return;
    }

    // Test 1: Get all users with cache-busting
    console.log('📡 Test 1: GET /api/users with cache-busting');
    try {
      const cacheBuster = Date.now();
      const allUsersResponse = await axios.get('/api/users', {
        params: { _t: cacheBuster },
        headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
      });
      console.log('✅ All users response:', allUsersResponse.status);
      console.log('📊 Users count:', allUsersResponse.data.users?.length || 0);

      if (allUsersResponse.status === 304) {
        console.error('🚨 304 Not Modified detected for all users!');
      }
    } catch (error) {
      console.error('❌ All users failed:', error.response?.status, error.response?.data);
    }

    // Test 2: Get users by role - manager with cache-busting
    console.log('📡 Test 2: GET /api/users?role=manager with cache-busting');
    try {
      const cacheBuster2 = Date.now() + 1;
      const managersResponse = await axios.get('/api/users', {
        params: { role: 'manager', _t: cacheBuster2 },
        headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
      });
      console.log('✅ Managers response:', managersResponse.status);
      console.log('👨‍💼 Managers count:', managersResponse.data.users?.length || 0);

      if (managersResponse.status === 304) {
        console.error('🚨 304 Not Modified detected for managers!');
      }
    } catch (error) {
      console.error('❌ Managers failed:', error.response?.status, error.response?.data);
    }

    // Test 3: Get users by role - staff with cache-busting
    console.log('📡 Test 3: GET /api/users?role=staff with cache-busting');
    try {
      const cacheBuster3 = Date.now() + 2;
      const staffResponse = await axios.get('/api/users', {
        params: { role: 'staff', _t: cacheBuster3 },
        headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
      });
      console.log('✅ Staff response:', staffResponse.status);
      console.log('👨‍💻 Staff count:', staffResponse.data.users?.length || 0);

      if (staffResponse.status === 304) {
        console.error('🚨 304 Not Modified detected for staff!');
      }
    } catch (error) {
      console.error('❌ Staff failed:', error.response?.status, error.response?.data);
    }

    // Test 4: Get users by role - accounter with cache-busting
    console.log('📡 Test 4: GET /api/users?role=accounter with cache-busting');
    try {
      const cacheBuster4 = Date.now() + 3;
      const accountersResponse = await axios.get('/api/users', {
        params: { role: 'accounter', _t: cacheBuster4 },
        headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
      });
      console.log('✅ Accounters response:', accountersResponse.status);
      console.log('📊 Accounters count:', accountersResponse.data.users?.length || 0);

      if (accountersResponse.status === 304) {
        console.error('🚨 304 Not Modified detected for accounters!');
      }
    } catch (error) {
      console.error('❌ Accounters failed:', error.response?.status, error.response?.data);
    }

    // Test 5: Get users by role - admin
    console.log('📡 Test 5: GET /api/users?role=admin');
    try {
      const adminsResponse = await axios.get('/api/users', { params: { role: 'admin' } });
      console.log('✅ Admins response:', adminsResponse.status);
      console.log('👨‍💻 Admins count:', adminsResponse.data.users?.length || 0);
    } catch (error) {
      console.error('❌ Admins failed:', error.response?.status, error.response?.data);
    }

    // Test 6: Get current user info
    console.log('📡 Test 6: GET /api/users/me/info');
    try {
      const currentUserResponse = await axios.get('/api/users/me/info');
      console.log('✅ Current user response:', currentUserResponse.status);
      console.log('👤 Current user role:', currentUserResponse.data.user?.role);
    } catch (error) {
      console.error('❌ Current user failed:', error.response?.status, error.response?.data);
    }

    console.log('🎉 User API test completed!');

  } catch (error) {
    console.error('❌ User API test failed:', error);
  }
};

// Test specific role filtering
export const testRoleFiltering = async () => {
  try {
    console.log('🧪 Testing Role Filtering...');

    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }

    const roles = ['manager', 'staff', 'accounter', 'admin'];

    for (const role of roles) {
      console.log(`📡 Testing role: ${role}`);
      try {
        const response = await axios.get('/api/users', { params: { role } });
        const users = response.data.users || [];

        console.log(`✅ ${role}: ${users.length} users found`);

        // Verify all returned users have the correct role
        const wrongRoleUsers = users.filter(user => user.role !== role);
        if (wrongRoleUsers.length > 0) {
          console.error(`❌ Found ${wrongRoleUsers.length} users with wrong role for ${role} filter`);
        } else {
          console.log(`✅ All users have correct role: ${role}`);
        }

      } catch (error) {
        console.error(`❌ Role ${role} failed:`, error.response?.status, error.response?.data);
      }
    }

    console.log('🎉 Role filtering test completed!');

  } catch (error) {
    console.error('❌ Role filtering test failed:', error);
  }
};

// Test rapid requests to detect 304 issues
export const testRapidUserRequests = async () => {
  try {
    console.log('🧪 Testing Rapid User Requests for 304 Issues...');

    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }

    // Test rapid requests to same endpoint
    console.log('📡 Making 5 rapid requests to /api/users?role=manager...');

    const promises = [];
    for (let i = 0; i < 5; i++) {
      promises.push(
        axios.get('/api/users', {
          params: { role: 'manager', _t: Date.now() + i },
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        })
      );
    }

    const results = await Promise.all(promises);

    results.forEach((result, index) => {
      console.log(`📦 Request ${index + 1} status:`, result.status);
      if (result.status === 304) {
        console.error(`🚨 Request ${index + 1} returned 304 Not Modified!`);
      } else {
        console.log(`✅ Request ${index + 1} returned fresh data`);
      }
    });

    // Check if all requests returned 200
    const all200 = results.every(r => r.status === 200);
    if (all200) {
      console.log('🎉 All rapid requests returned 200 OK - cache-busting working!');
    } else {
      console.error('❌ Some requests returned 304 - cache-busting not working properly');
    }

    console.log('🎉 Rapid user requests test completed!');

  } catch (error) {
    console.error('❌ Rapid user requests test failed:', error);
  }
};

// Usage examples:
// testUserAPI();
// testRoleFiltering();
// testRapidUserRequests();
