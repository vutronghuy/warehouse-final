import axios from 'axios';

// Test warehouse CRUD operations
export const testWarehouseOperations = async () => {
  try {
    console.log('🧪 Testing Warehouse CRUD Operations...');
    
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }

    // Test 1: Create warehouse
    console.log('📝 Test 1: Creating warehouse...');
    const createResponse = await axios.post('/api/warehouses/create', {
      name: 'Test Warehouse ' + Date.now(),
      location: 'Test Location 123'
    });
    
    if (createResponse.data.success) {
      console.log('✅ Warehouse created:', createResponse.data.warehouse);
      const warehouseId = createResponse.data.warehouse._id;
      
      // Test 2: Get warehouse
      console.log('📖 Test 2: Getting warehouse...');
      const getResponse = await axios.get(`/api/warehouses/${warehouseId}`);
      console.log('📦 Warehouse data:', getResponse.data.warehouse);
      
      // Test 3: Update warehouse
      console.log('✏️ Test 3: Updating warehouse...');
      const updateResponse = await axios.put(`/api/warehouses/${warehouseId}`, {
        name: 'Updated Test Warehouse',
        location: 'Updated Location',
        status: 'active'
      });
      console.log('🔄 Updated warehouse:', updateResponse.data.warehouse);
      
      // Test 4: Delete warehouse
      console.log('🗑️ Test 4: Deleting warehouse...');
      const deleteResponse = await axios.delete(`/api/warehouses/${warehouseId}`);
      console.log('✅ Delete response:', deleteResponse.data);
      
      // Test 5: Verify soft delete
      console.log('🔍 Test 5: Verifying soft delete...');
      try {
        await axios.get(`/api/warehouses/${warehouseId}`);
        console.log('❌ Warehouse should be deleted but still accessible');
      } catch (error) {
        if (error.response?.status === 404) {
          console.log('✅ Warehouse properly soft deleted');
        } else {
          console.log('❓ Unexpected error:', error.response?.data);
        }
      }
      
      console.log('🎉 All tests completed!');
      
    } else {
      console.log('❌ Failed to create warehouse:', createResponse.data);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Response:', error.response?.data);
  }
};

// Usage: testWarehouseOperations()
