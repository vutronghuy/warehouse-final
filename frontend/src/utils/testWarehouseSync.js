import axios from 'axios';

// Test warehouse sync functionality
export const testWarehouseSync = async () => {
  try {
    console.log('🧪 Testing Warehouse Sync...');
    
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }

    // Test 1: Create a warehouse
    console.log('📝 Step 1: Creating test warehouse...');
    const warehouseResponse = await axios.post('/api/warehouses/create', {
      name: 'Sync Test Warehouse ' + Date.now(),
      location: 'Test Location for Sync'
    });
    
    if (!warehouseResponse.data.success) {
      throw new Error('Failed to create warehouse');
    }
    
    const warehouseId = warehouseResponse.data.warehouse._id;
    console.log('✅ Warehouse created:', warehouseId);

    // Test 2: Create a manager for this warehouse
    console.log('👨‍💼 Step 2: Creating manager for warehouse...');
    const managerResponse = await axios.post('/api/users/create', {
      role: 'manager',
      manager: {
        username: 'testmanager' + Date.now(),
        password: 'password123',
        fullName: 'Test Manager',
        email: 'testmanager@example.com',
        warehouseId: warehouseId
      }
    });
    
    if (!managerResponse.data.user) {
      throw new Error('Failed to create manager');
    }
    
    console.log('✅ Manager created:', managerResponse.data.user._id);

    // Test 3: Check warehouse before sync
    console.log('🔍 Step 3: Checking warehouse before sync...');
    const beforeSync = await axios.get(`/api/warehouses/${warehouseId}`);
    console.log('📦 Warehouse before sync:', {
      managerId: beforeSync.data.warehouse.managerId,
      adminId: beforeSync.data.warehouse.adminId,
      accounterId: beforeSync.data.warehouse.accounterId,
      staffIds: beforeSync.data.warehouse.staffIds
    });

    // Test 4: Sync warehouses
    console.log('🔄 Step 4: Syncing warehouses...');
    const syncResponse = await axios.post('/api/warehouses/sync');
    console.log('✅ Sync response:', syncResponse.data);

    // Test 5: Check warehouse after sync
    console.log('🔍 Step 5: Checking warehouse after sync...');
    const afterSync = await axios.get(`/api/warehouses/${warehouseId}`);
    console.log('📦 Warehouse after sync:', {
      managerId: afterSync.data.warehouse.managerId,
      adminId: afterSync.data.warehouse.adminId,
      accounterId: afterSync.data.warehouse.accounterId,
      staffIds: afterSync.data.warehouse.staffIds
    });

    // Test 6: Verify manager is now in warehouse
    const managerInWarehouse = afterSync.data.warehouse.managerId;
    if (managerInWarehouse && managerInWarehouse._id === managerResponse.data.user._id) {
      console.log('🎉 SUCCESS: Manager correctly assigned to warehouse!');
    } else {
      console.log('❌ FAILED: Manager not found in warehouse');
      console.log('Expected:', managerResponse.data.user._id);
      console.log('Found:', managerInWarehouse);
    }

    // Cleanup
    console.log('🧹 Cleaning up test data...');
    await axios.delete(`/api/warehouses/${warehouseId}?force=true`);
    await axios.delete(`/api/users/${managerResponse.data.user._id}`);
    console.log('✅ Cleanup completed');

    console.log('🎉 Warehouse sync test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Response:', error.response?.data);
  }
};

// Usage: testWarehouseSync()
