import axios from 'axios';

// Test admin warehouse assignment
export const testAdminWarehouse = async () => {
  try {
    console.log('🧪 Testing Admin Warehouse Assignment...');
    
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }

    // Step 1: Create a warehouse
    console.log('📝 Step 1: Creating test warehouse...');
    const warehouseResponse = await axios.post('/api/warehouses/create', {
      name: 'Admin Test Warehouse ' + Date.now(),
      location: 'Test Location for Admin'
    });
    
    if (!warehouseResponse.data.success) {
      throw new Error('Failed to create warehouse');
    }
    
    const warehouseId = warehouseResponse.data.warehouse._id;
    console.log('✅ Warehouse created:', warehouseId);

    // Step 2: Create an admin for this warehouse
    console.log('👨‍💻 Step 2: Creating admin for warehouse...');
    const adminResponse = await axios.post('/api/users/create', {
      role: 'admin',
      admin: {
        username: 'testadmin' + Date.now(),
        password: 'password123',
        fullName: 'Test Admin',
        email: 'testadmin@example.com',
        managedWarehouses: [warehouseId] // Admin manages this warehouse
      }
    });
    
    if (!adminResponse.data.user) {
      throw new Error('Failed to create admin');
    }
    
    const adminId = adminResponse.data.user._id;
    console.log('✅ Admin created:', adminId);
    console.log('📋 Admin data:', adminResponse.data.user.admin);

    // Step 3: Check warehouse before sync
    console.log('🔍 Step 3: Checking warehouse before sync...');
    const beforeSync = await axios.get(`/api/warehouses/${warehouseId}`);
    console.log('📦 Warehouse before sync:', {
      managerId: beforeSync.data.warehouse.managerId,
      adminId: beforeSync.data.warehouse.adminId,
      accounterId: beforeSync.data.warehouse.accounterId,
      staffIds: beforeSync.data.warehouse.staffIds
    });

    // Step 4: Debug warehouse staff
    console.log('🐛 Step 4: Debug warehouse staff...');
    const debugResponse = await axios.get(`/api/warehouses/${warehouseId}/debug`);
    console.log('🔍 Debug info:', debugResponse.data.debug);

    // Step 5: Sync warehouses
    console.log('🔄 Step 5: Syncing warehouses...');
    const syncResponse = await axios.post('/api/warehouses/sync');
    console.log('✅ Sync response:', syncResponse.data);

    // Step 6: Check warehouse after sync
    console.log('🔍 Step 6: Checking warehouse after sync...');
    const afterSync = await axios.get(`/api/warehouses/${warehouseId}`);
    console.log('📦 Warehouse after sync:', {
      managerId: afterSync.data.warehouse.managerId,
      adminId: afterSync.data.warehouse.adminId,
      accounterId: afterSync.data.warehouse.accounterId,
      staffIds: afterSync.data.warehouse.staffIds
    });

    // Step 7: Verify admin is in warehouse
    const adminInWarehouse = afterSync.data.warehouse.adminId;
    if (adminInWarehouse && adminInWarehouse._id === adminId) {
      console.log('🎉 SUCCESS: Admin correctly assigned to warehouse!');
    } else {
      console.log('❌ FAILED: Admin not found in warehouse');
      console.log('Expected admin ID:', adminId);
      console.log('Found admin in warehouse:', adminInWarehouse);
      
      // Additional debug
      console.log('🔍 Let\'s check all users with this warehouse in managedWarehouses...');
      const allUsersResponse = await axios.get('/api/users');
      const usersWithWarehouse = allUsersResponse.data.users.filter(user => 
        user.role === 'admin' && 
        user.admin && 
        user.admin.managedWarehouses && 
        user.admin.managedWarehouses.includes(warehouseId)
      );
      console.log('👥 Users managing this warehouse:', usersWithWarehouse);
    }

    // Cleanup
    console.log('🧹 Cleaning up test data...');
    await axios.delete(`/api/warehouses/${warehouseId}?force=true`);
    await axios.delete(`/api/users/${adminId}`);
    console.log('✅ Cleanup completed');

    console.log('🎉 Admin warehouse test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Response:', error.response?.data);
  }
};

// Usage: testAdminWarehouse()
