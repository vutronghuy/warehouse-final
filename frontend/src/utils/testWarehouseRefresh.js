// Test warehouse refresh after user update
import axios from 'axios';
import { notifyWarehouseUpdate } from './warehouseUtils.js';

export const testWarehouseRefresh = async () => {
  try {
    console.log('🧪 Testing Warehouse Refresh After User Update...');

    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }

    // Step 1: Get all warehouses and users
    console.log('📦 Step 1: Getting warehouses and users...');
    const warehousesResponse = await axios.get('/api/warehouses');
    const usersResponse = await axios.get('/api/users');

    const warehouses = warehousesResponse.data.warehouses || warehousesResponse.data || [];
    const users = usersResponse.data.users || usersResponse.data || [];

    console.log('📦 Found warehouses:', warehouses.length);
    console.log('👥 Found users:', users.length);

    if (warehouses.length === 0) {
      console.log('⚠️ No warehouses found. Please create a warehouse first.');
      return;
    }

    // Step 2: Find a user with warehouse assignment
    const assignedUser = users.find(user => {
      if (user.role === 'manager' && user.manager?.warehouseId) return true;
      if (user.role === 'staff' && user.staff?.warehouseId) return true;
      if (user.role === 'accounter' && user.accounter?.warehouseId) return true;
      if (user.role === 'admin' && user.admin?.managedWarehouses?.length > 0) return true;
      return false;
    });

    if (!assignedUser) {
      console.log('⚠️ No users with warehouse assignments found. Please assign a user to a warehouse first.');
      return;
    }

    console.log('👤 Found assigned user:', assignedUser._id, assignedUser.role);

    // Step 3: Get current warehouse assignment
    let currentWarehouseId;
    if (assignedUser.role === 'admin') {
      currentWarehouseId = assignedUser.admin.managedWarehouses[0];
    } else {
      currentWarehouseId = assignedUser[assignedUser.role]?.warehouseId;
    }

    console.log('🏢 Current warehouse ID:', currentWarehouseId);

    // Step 4: Update user (change fullName to trigger refresh)
    console.log('🔄 Step 4: Updating user to trigger warehouse refresh...');
    const originalFullName = assignedUser[assignedUser.role]?.fullName;
    const newFullName = originalFullName + ' (Updated)';

    const updatePayload = {
      role: assignedUser.role,
      [assignedUser.role]: {
        ...assignedUser[assignedUser.role],
        fullName: newFullName
      }
    };

    console.log('📝 Update payload:', updatePayload);

    const updateResponse = await axios.put(`/api/users/${assignedUser._id}`, updatePayload);
    console.log('✅ User update response:', updateResponse.data);

    // Step 5: Wait for warehouse refresh (debounce is 500ms)
    console.log('⏰ Step 5: Waiting for warehouse refresh...');
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Step 6: Check warehouse after update
    console.log('📦 Step 6: Checking warehouse after user update...');
    const refreshedWarehouseResponse = await axios.get(`/api/warehouses/${currentWarehouseId}`);
    const refreshedWarehouse = refreshedWarehouseResponse.data.warehouse;

    console.log('📦 Refreshed warehouse:', refreshedWarehouse.name);
    console.log('👨‍💼 Manager after update:', refreshedWarehouse.managerId);
    console.log('👨‍💻 Admin after update:', refreshedWarehouse.adminId);
    console.log('📊 Accounter after update:', refreshedWarehouse.accounterId);
    console.log('👥 Staff after update:', refreshedWarehouse.staffIds);

    // Step 7: Test manual notification
    console.log('🔔 Step 7: Testing manual warehouse notification...');
    notifyWarehouseUpdate(currentWarehouseId);

    console.log('🎉 Warehouse refresh test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Response:', error.response?.data);
  }
};

// Usage: testWarehouseRefresh()
