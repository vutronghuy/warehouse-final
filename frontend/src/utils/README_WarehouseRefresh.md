# Warehouse Refresh Utility

## Mục đích
Utility này giúp refresh warehouse data khi có thay đổi staff assignment từ User Management.

## Cách sử dụng

### 1. Trong User Create/Update Modal

```javascript
// UserCreateModal.vue hoặc UserEditModal.vue
import { notifyWarehouseUpdate } from '@/utils/warehouseUtils.js';

export default {
  methods: {
    async handleSubmit() {
      try {
        // Save user data
        const response = await axios.post('/api/users', this.form);
        
        if (response.data.success) {
          // Notify warehouse update if user has warehouse assignment
          if (this.form.warehouseId) {
            notifyWarehouseUpdate(this.form.warehouseId);
          }
          
          // If updating existing user and warehouse changed
          if (this.isEdit && this.originalWarehouseId && 
              this.originalWarehouseId !== this.form.warehouseId) {
            notifyWarehouseUpdate(this.originalWarehouseId);
          }
          
          this.$emit('created', response.data.user);
          this.closeModal();
        }
      } catch (error) {
        console.error('Error saving user:', error);
      }
    }
  }
};
```

### 2. Trong User Controller (Backend)

```javascript
// UserController.js
const { refreshWarehouseStaff } = require('./WarehouseController');

exports.updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Get old user data to check warehouse changes
    const oldUser = await User.findById(id);
    const oldWarehouseId = oldUser?.manager?.warehouseId || 
                          oldUser?.staff?.warehouseId || 
                          oldUser?.accounter?.warehouseId;
    
    // Update user
    const updatedUser = await User.findByIdAndUpdate(id, updateData, { new: true });
    
    // Get new warehouse ID
    const newWarehouseId = updatedUser?.manager?.warehouseId || 
                          updatedUser?.staff?.warehouseId || 
                          updatedUser?.accounter?.warehouseId;
    
    // Refresh warehouse data if warehouse assignment changed
    if (oldWarehouseId && oldWarehouseId.toString() !== newWarehouseId?.toString()) {
      // Refresh old warehouse
      await refreshWarehouseStaff(oldWarehouseId);
    }
    
    if (newWarehouseId) {
      // Refresh new warehouse
      await refreshWarehouseStaff(newWarehouseId);
    }
    
    res.json({
      success: true,
      message: 'User updated successfully',
      user: updatedUser
    });
  } catch (error) {
    next(error);
  }
};
```

### 3. Trong bất kỳ component nào cần refresh warehouse

```javascript
import { refreshWarehouseData, refreshAllWarehouses } from '@/utils/warehouseUtils.js';

export default {
  methods: {
    async refreshSingleWarehouse(warehouseId) {
      const warehouse = await refreshWarehouseData(warehouseId);
      if (warehouse) {
        // Update local data
        this.updateWarehouseInList(warehouse);
      }
    },
    
    async refreshAllWarehouses() {
      const warehouses = await refreshAllWarehouses();
      this.warehouses = warehouses;
    }
  }
};
```

## Events

### warehouse-updated
Được emit khi có warehouse cần refresh.

```javascript
import { warehouseEventBus } from '@/utils/warehouseUtils.js';

// Listen for updates
warehouseEventBus.on('warehouse-updated', (warehouseId) => {
  console.log('Warehouse updated:', warehouseId);
  this.refreshWarehouse(warehouseId);
});

// Emit update
warehouseEventBus.emit('warehouse-updated', 'warehouse_id_here');
```

## Workflow

1. **User được tạo/cập nhật** với warehouse assignment
2. **Frontend** gọi `notifyWarehouseUpdate(warehouseId)`
3. **Event bus** emit event `warehouse-updated`
4. **WarehouseTable** listen event và refresh data
5. **UI** hiển thị staff assignment mới

## Benefits

- ✅ Real-time updates
- ✅ Automatic refresh
- ✅ No manual page reload needed
- ✅ Consistent data across components
- ✅ Event-driven architecture
