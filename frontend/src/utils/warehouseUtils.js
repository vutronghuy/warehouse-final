import axios from 'axios';

// Utility function to refresh warehouse data after user updates
export const refreshWarehouseData = async (warehouseId) => {
  try {
    console.log('🔄 Refreshing warehouse data for:', warehouseId);

    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }

    // Add cache-busting parameter to force fresh data
    const cacheBuster = Date.now();
    console.log('📡 Calling warehouse GET API with cache buster:', cacheBuster);

    const response = await axios.get(`/api/warehouses/${warehouseId}?_t=${cacheBuster}`, {
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    console.log('📡 Warehouse response:', response.data);

    if (response.data.success) {
      console.log('✅ Warehouse refresh successful');
      return response.data.warehouse;
    } else {
      console.log('❌ Warehouse refresh failed:', response.data.message);
      return null;
    }
  } catch (error) {
    console.error('❌ Error refreshing warehouse data:', error);
    console.error('Response:', error.response?.data);
    return null;
  }
};

// Utility function to refresh all warehouses
export const refreshAllWarehouses = async () => {
  try {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }

    // Add cache-busting parameter
    const cacheBuster = Date.now();
    const response = await axios.get(`/api/warehouses?_t=${cacheBuster}`, {
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });

    if (response.data.success) {
      return response.data.warehouses;
    }
    return [];
  } catch (error) {
    console.error('Error refreshing warehouses:', error);
    return [];
  }
};

// Event bus for warehouse updates
class WarehouseEventBus {
  constructor() {
    this.listeners = {};
  }

  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  off(event, callback) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
  }

  emit(event, data) {
    if (!this.listeners[event]) return;
    this.listeners[event].forEach(callback => callback(data));
  }
}

export const warehouseEventBus = new WarehouseEventBus();

// Debounce map to prevent spam refreshing
const refreshDebounceMap = new Map();

// Function to notify warehouse updates (call this after user updates)
export const notifyWarehouseUpdate = (warehouseId) => {
  console.log('🔔 notifyWarehouseUpdate called for warehouse:', warehouseId);

  // Clear existing timeout for this warehouse
  if (refreshDebounceMap.has(warehouseId)) {
    console.log('🔄 Clearing existing timeout for warehouse:', warehouseId);
    clearTimeout(refreshDebounceMap.get(warehouseId));
  }

  // Set new timeout to debounce rapid updates
  const timeoutId = setTimeout(() => {
    console.log('🚀 Emitting warehouse-updated event for:', warehouseId);
    warehouseEventBus.emit('warehouse-updated', warehouseId);
    refreshDebounceMap.delete(warehouseId);
  }, 500); // 500ms debounce

  refreshDebounceMap.set(warehouseId, timeoutId);
  console.log('⏰ Set debounce timeout for warehouse:', warehouseId);
};
