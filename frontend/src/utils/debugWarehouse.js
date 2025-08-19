import axios from 'axios';

// Debug function to check warehouse staff assignment
export const debugWarehouseStaff = async (warehouseId) => {
  try {
    console.log('🐛 Starting warehouse debug for:', warehouseId);
    
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }

    // Call debug endpoint
    const response = await axios.get(`/api/warehouses/${warehouseId}/debug`);
    
    if (response.data.success) {
      const debug = response.data.debug;
      
      console.log('🏢 Warehouse ID:', debug.warehouseId);
      console.log('👥 All users in database:');
      
      debug.allUsers.forEach(user => {
        console.log(`  📋 User ${user._id} (${user.role}):`);
        if (user.manager) {
          console.log(`    👨‍💼 Manager - Warehouse: ${user.manager.warehouseId}`);
        }
        if (user.staff) {
          console.log(`    👷 Staff - Warehouse: ${user.staff.warehouseId}`);
        }
        if (user.accounter) {
          console.log(`    📊 Accounter - Warehouse: ${user.accounter.warehouseId}`);
        }
        if (user.admin) {
          console.log(`    👨‍💻 Admin - Warehouses: ${JSON.stringify(user.admin.managedWarehouses)}`);
        }
      });
      
      console.log('🎯 Staff found for this warehouse:');
      console.log('  👨‍💼 Manager:', debug.staffForThisWarehouse.manager);
      console.log('  👨‍💻 Admin:', debug.staffForThisWarehouse.admin);
      console.log('  📊 Accounter:', debug.staffForThisWarehouse.accounter);
      console.log('  👥 Staff Members:', debug.staffForThisWarehouse.staffMembers);
      
      return debug;
    }
    
    return null;
  } catch (error) {
    console.error('❌ Debug failed:', error);
    return null;
  }
};

// Usage: debugWarehouseStaff('warehouse_id_here')
