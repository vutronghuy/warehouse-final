import axios from 'axios';

// Test warehouse display issue
export const testWarehouseDisplay = async () => {
  try {
    console.log('🧪 Testing Warehouse Display Issue...');
    
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }

    // Step 1: Get all warehouses
    console.log('📦 Step 1: Fetching all warehouses...');
    const warehousesResponse = await axios.get('/api/warehouses');
    console.log('📦 Warehouses response:', warehousesResponse.data);
    
    const warehouses = warehousesResponse.data.warehouses || warehousesResponse.data || [];
    console.log('📦 Number of warehouses:', warehouses.length);
    
    if (warehouses.length === 0) {
      console.log('⚠️ No warehouses found. Please create a warehouse first.');
      return;
    }

    // Step 2: Check first warehouse structure
    const firstWarehouse = warehouses[0];
    console.log('🔍 Step 2: First warehouse structure:', firstWarehouse);
    console.log('🔍 Manager ID:', firstWarehouse.managerId);
    console.log('🔍 Admin ID:', firstWarehouse.adminId);
    console.log('🔍 Accounter ID:', firstWarehouse.accounterId);
    console.log('🔍 Staff IDs:', firstWarehouse.staffIds);

    // Step 3: Get all users to see who should be assigned
    console.log('👥 Step 3: Fetching all users...');
    const usersResponse = await axios.get('/api/users');
    console.log('👥 Users response:', usersResponse.data);
    
    const users = usersResponse.data.users || usersResponse.data || [];
    console.log('👥 Number of users:', users.length);

    // Step 4: Find users assigned to first warehouse
    const warehouseId = firstWarehouse._id;
    console.log(`🔍 Step 4: Finding users assigned to warehouse ${warehouseId}...`);
    
    const assignedUsers = {
      managers: users.filter(user => 
        user.role === 'manager' && 
        user.manager && 
        user.manager.warehouseId === warehouseId
      ),
      admins: users.filter(user => 
        user.role === 'admin' && 
        user.admin && 
        user.admin.managedWarehouses && 
        user.admin.managedWarehouses.includes(warehouseId)
      ),
      accounters: users.filter(user => 
        user.role === 'accounter' && 
        user.accounter && 
        user.accounter.warehouseId === warehouseId
      ),
      staff: users.filter(user => 
        user.role === 'staff' && 
        user.staff && 
        user.staff.warehouseId === warehouseId
      )
    };

    console.log('👨‍💼 Managers assigned to warehouse:', assignedUsers.managers);
    console.log('👨‍💻 Admins assigned to warehouse:', assignedUsers.admins);
    console.log('📊 Accounters assigned to warehouse:', assignedUsers.accounters);
    console.log('👥 Staff assigned to warehouse:', assignedUsers.staff);

    // Step 5: Compare with warehouse data
    console.log('🔍 Step 5: Comparing assigned users with warehouse data...');
    
    const expectedManager = assignedUsers.managers[0];
    const expectedAdmin = assignedUsers.admins[0];
    const expectedAccounter = assignedUsers.accounters[0];
    
    console.log('Expected vs Actual:');
    console.log('Manager - Expected:', expectedManager?._id, 'Actual:', firstWarehouse.managerId?._id);
    console.log('Admin - Expected:', expectedAdmin?._id, 'Actual:', firstWarehouse.adminId?._id);
    console.log('Accounter - Expected:', expectedAccounter?._id, 'Actual:', firstWarehouse.accounterId?._id);
    console.log('Staff - Expected:', assignedUsers.staff.length, 'Actual:', firstWarehouse.staffIds?.length || 0);

    // Step 6: Test sync API
    console.log('🔄 Step 6: Testing sync API...');
    const syncResponse = await axios.post('/api/warehouses/sync');
    console.log('✅ Sync response:', syncResponse.data);

    // Step 7: Fetch warehouses again after sync
    console.log('📦 Step 7: Fetching warehouses after sync...');
    const afterSyncResponse = await axios.get('/api/warehouses');
    const afterSyncWarehouses = afterSyncResponse.data.warehouses || afterSyncResponse.data || [];
    const afterSyncWarehouse = afterSyncWarehouses.find(w => w._id === warehouseId);
    
    console.log('📦 Warehouse after sync:', afterSyncWarehouse);
    console.log('🔍 Manager after sync:', afterSyncWarehouse?.managerId);
    console.log('🔍 Admin after sync:', afterSyncWarehouse?.adminId);
    console.log('🔍 Accounter after sync:', afterSyncWarehouse?.accounterId);
    console.log('🔍 Staff after sync:', afterSyncWarehouse?.staffIds);

    // Step 8: Test individual warehouse API
    console.log('🔍 Step 8: Testing individual warehouse API...');
    const individualResponse = await axios.get(`/api/warehouses/${warehouseId}`);
    console.log('📦 Individual warehouse response:', individualResponse.data);

    // Step 9: Summary
    console.log('📋 Step 9: Summary...');
    const issues = [];
    
    if (expectedManager && !afterSyncWarehouse?.managerId) {
      issues.push('Manager not showing in warehouse despite being assigned');
    }
    
    if (expectedAdmin && !afterSyncWarehouse?.adminId) {
      issues.push('Admin not showing in warehouse despite being assigned');
    }
    
    if (expectedAccounter && !afterSyncWarehouse?.accounterId) {
      issues.push('Accounter not showing in warehouse despite being assigned');
    }
    
    if (assignedUsers.staff.length > 0 && (!afterSyncWarehouse?.staffIds || afterSyncWarehouse.staffIds.length === 0)) {
      issues.push('Staff not showing in warehouse despite being assigned');
    }

    if (issues.length === 0) {
      console.log('🎉 SUCCESS: All assignments are working correctly!');
    } else {
      console.log('❌ ISSUES FOUND:');
      issues.forEach((issue, index) => {
        console.log(`${index + 1}. ${issue}`);
      });
    }

    console.log('🎉 Warehouse display test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Response:', error.response?.data);
  }
};

// Usage: testWarehouseDisplay()
