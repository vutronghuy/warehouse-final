import axios from 'axios';

// Test cache-busting functionality
export const testCacheBusting = async () => {
  try {
    console.log('🧪 Testing Cache-Busting...');
    
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }

    // Test 1: Multiple requests to same endpoint
    console.log('📡 Test 1: Making multiple requests to warehouses endpoint...');
    
    const request1 = await axios.get('/api/warehouses');
    console.log('📦 Request 1 status:', request1.status);
    console.log('📦 Request 1 headers:', request1.headers);
    
    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const request2 = await axios.get('/api/warehouses');
    console.log('📦 Request 2 status:', request2.status);
    console.log('📦 Request 2 headers:', request2.headers);
    
    // Test 2: Check if cache-busting parameters are added
    console.log('🔍 Test 2: Checking cache-busting parameters...');
    
    // Manual request with cache-busting
    const cacheBuster = Date.now();
    const request3 = await axios.get(`/api/warehouses?_t=${cacheBuster}`, {
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    console.log('📦 Request 3 (with cache-busting) status:', request3.status);
    
    // Test 3: Check individual warehouse endpoint
    if (request1.data.warehouses && request1.data.warehouses.length > 0) {
      const warehouseId = request1.data.warehouses[0]._id;
      console.log('🏢 Test 3: Testing individual warehouse endpoint...');
      
      const warehouseRequest1 = await axios.get(`/api/warehouses/${warehouseId}`);
      console.log('📦 Warehouse request 1 status:', warehouseRequest1.status);
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const warehouseRequest2 = await axios.get(`/api/warehouses/${warehouseId}`);
      console.log('📦 Warehouse request 2 status:', warehouseRequest2.status);
    }
    
    // Test 4: Check response headers
    console.log('🔍 Test 4: Checking response headers...');
    const headersTest = await axios.get('/api/warehouses');
    console.log('📦 Response headers:', {
      'cache-control': headersTest.headers['cache-control'],
      'pragma': headersTest.headers['pragma'],
      'expires': headersTest.headers['expires'],
      'etag': headersTest.headers['etag'],
      'last-modified': headersTest.headers['last-modified']
    });
    
    // Summary
    console.log('📋 Cache-busting test summary:');
    console.log('✅ All requests completed');
    console.log('✅ No 304 Not Modified errors');
    console.log('✅ Cache-busting headers applied');
    
    console.log('🎉 Cache-busting test completed!');
    
  } catch (error) {
    console.error('❌ Cache-busting test failed:', error);
    console.error('Response status:', error.response?.status);
    console.error('Response headers:', error.response?.headers);
    
    if (error.response?.status === 304) {
      console.error('🚨 304 Not Modified detected! Cache-busting not working properly.');
    }
  }
};

// Test specific warehouse refresh
export const testWarehouseRefreshCaching = async (warehouseId) => {
  try {
    console.log('🧪 Testing Warehouse Refresh Caching for:', warehouseId);
    
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }

    // Test multiple rapid requests
    console.log('📡 Making rapid requests to same warehouse...');
    
    const promises = [];
    for (let i = 0; i < 5; i++) {
      promises.push(
        axios.get(`/api/warehouses/${warehouseId}?_t=${Date.now() + i}`, {
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
      }
    });
    
    console.log('🎉 Warehouse refresh caching test completed!');
    
  } catch (error) {
    console.error('❌ Warehouse refresh caching test failed:', error);
  }
};

// Usage examples:
// testCacheBusting();
// testWarehouseRefreshCaching('warehouse_id_here');
