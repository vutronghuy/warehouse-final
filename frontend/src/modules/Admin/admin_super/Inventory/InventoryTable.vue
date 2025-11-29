<template>
  <div class="flex h-screen bg-gray-50" v-if="!hasError">
    <!-- Sidebar -->
    <Sidebar />
    <!-- Main Content -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <!-- Header -->
      <Headers />
      <!-- Page Content -->
      <main class="flex-1 overflow-auto bg-gray-50 p-8">
        <!-- Page Header -->
        <div class="flex items-center justify-between mb-8">
          <h2 class="text-3xl font-bold text-gray-900">Inventory Management</h2>
          <div class="flex gap-3">
            <button
              @click="handleAdjustButtonClick"
              class="inline-flex items-center px-4 py-2.5 bg-slate-800 text-white text-sm font-medium rounded-lg hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-colors duration-150"
            >
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              Adjust Inventory
            </button>
          </div>
        </div>

        <!-- Stats Cards -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6" v-if="stats">
          <div class="bg-white rounded-lg shadow p-4">
            <div class="text-sm text-gray-600 mb-1">Total Products</div>
            <div class="text-2xl font-bold text-gray-900">{{ stats.totalProducts || 0 }}</div>
          </div>
          <div class="bg-white rounded-lg shadow p-4">
            <div class="text-sm text-gray-600 mb-1">Total Quantity</div>
            <div class="text-2xl font-bold text-blue-600">{{ formatNumber(stats.totalQuantity || 0) }}</div>
          </div>
          <div class="bg-white rounded-lg shadow p-4">
            <div class="text-sm text-gray-600 mb-1">Low Stock</div>
            <div class="text-2xl font-bold text-orange-600">{{ stats.lowStockCount || 0 }}</div>
          </div>
          <div class="bg-white rounded-lg shadow p-4">
            <div class="text-sm text-gray-600 mb-1">Out of Stock</div>
            <div class="text-2xl font-bold text-red-600">{{ stats.outOfStockCount || 0 }}</div>
          </div>
        </div>

        <!-- Search and Filter Bar -->
        <div class="mb-6 flex flex-col sm:flex-row gap-4">
          <div class="relative flex-1 max-w-md">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <input
              v-model="search"
              type="text"
              placeholder="Search by product name, SKU..."
              class="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-colors duration-150"
            />
          </div>

          <div class="flex gap-2">
            <select
              v-model="warehouseFilter"
              class="px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Warehouses</option>
              <option v-for="wh in warehouses" :key="wh._id" :value="wh._id">{{ wh.name }}</option>
            </select>

            <select
              v-model="quantityFilter"
              class="px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Quantities</option>
              <option value="low">Low Stock (&lt;= 10)</option>
              <option value="out">Out of Stock (= 0)</option>
              <option value="in">In Stock (&gt; 0)</option>
            </select>
          </div>
        </div>

        <!-- Inventory Table -->
        <div class="bg-white shadow-sm border border-gray-200 rounded-xl overflow-hidden">
          <div v-if="isLoading" class="flex justify-center items-center py-12">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>

          <div v-else-if="paginatedInventories.length === 0" class="text-center py-12">
            <svg
              class="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
            <h3 class="mt-2 text-sm font-medium text-gray-900">No inventory found</h3>
            <p class="mt-1 text-sm text-gray-500">Try adjusting your filters or sync inventory.</p>
          </div>

          <div v-else class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Product</th>
                  <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Warehouse</th>
                  <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">SKU</th>
                  <th class="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Quantity</th>
                  <th class="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Min Stock</th>
                  <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Last Updated</th>
                  <th class="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-for="inventory in paginatedInventories" :key="inventory._id" class="hover:bg-gray-50">
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">
                      {{ inventory.productId?.name || 'N/A' }}
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">{{ inventory.warehouseId?.name || 'N/A' }}</div>
                    <div class="text-xs text-gray-500">{{ inventory.warehouseId?.location || '' }}</div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">{{ inventory.productId?.sku || 'N/A' }}</div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-right">
                    <span
                      :class="[
                        'text-sm font-semibold',
                        inventory.quantity === 0 ? 'text-red-600' : inventory.quantity < (inventory.productId?.minStockLevel || 0) ? 'text-orange-600' : 'text-green-600'
                      ]"
                    >
                      {{ formatNumber(inventory.quantity || 0) }}
                    </span>
                    <span class="text-xs text-gray-500 ml-1">{{ inventory.productId?.unit || '' }}</span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-right">
                    <span class="text-sm text-gray-900">{{ formatNumber(inventory.productId?.minStockLevel || 0) }}</span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span
                      :class="[
                        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                        inventory.quantity === 0
                          ? 'bg-red-100 text-red-800'
                          : inventory.quantity < (inventory.productId?.minStockLevel || 0)
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-green-100 text-green-800'
                      ]"
                    >
                      {{
                        inventory.quantity === 0
                          ? 'Out of Stock'
                          : inventory.quantity < (inventory.productId?.minStockLevel || 0)
                          ? 'Low Stock'
                          : 'In Stock'
                      }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">{{ formatDate(inventory.lastUpdated) }}</div>
                    <div class="text-xs text-gray-500" v-if="inventory.updatedBy">
                      by {{ getUpdatedByName(inventory.updatedBy) }}
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      @click="openAdjustModal(inventory)"
                      class="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      Adjust
                    </button>
                    <router-link
                      :to="`/Superadmin/inventory/transactions?productId=${inventory.productId?._id}&warehouseId=${inventory.warehouseId?._id}`"
                      class="text-purple-600 hover:text-purple-900"
                    >
                      History
                    </router-link>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <div v-if="totalPages > 1" class="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div class="flex-1 flex justify-between sm:hidden">
              <button
                @click="currentPage = Math.max(1, currentPage - 1)"
                :disabled="currentPage === 1"
                class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                @click="currentPage = Math.min(totalPages, currentPage + 1)"
                :disabled="currentPage === totalPages"
                class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
            <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p class="text-sm text-gray-700">
                  Showing
                  <span class="font-medium">{{ (currentPage - 1) * pageSize + 1 }}</span>
                  to
                  <span class="font-medium">{{ Math.min(currentPage * pageSize, total) }}</span>
                  of
                  <span class="font-medium">{{ total }}</span>
                  results
                </p>
              </div>
              <div>
                <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    @click="currentPage = Math.max(1, currentPage - 1)"
                    :disabled="currentPage === 1"
                    class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span class="sr-only">Previous</span>
                    <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
                    </svg>
                  </button>
                  <button
                    v-for="page in visiblePages"
                    :key="page"
                    @click="typeof page === 'number' && (currentPage = page)"
                    :disabled="typeof page !== 'number'"
                    :class="[
                      'relative inline-flex items-center px-4 py-2 border text-sm font-medium',
                      page === currentPage
                        ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50',
                      typeof page !== 'number' ? 'cursor-default' : 'cursor-pointer'
                    ]"
                  >
                    {{ page }}
                  </button>
                  <button
                    @click="currentPage = Math.min(totalPages, currentPage + 1)"
                    :disabled="currentPage === totalPages"
                    class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span class="sr-only">Next</span>
                    <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                    </svg>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>

    <!-- Adjust Inventory Modal -->
    <AdjustInventoryModal
      :show="showAdjustModal"
      :inventory="selectedInventory"
      :warehouses="warehouses"
      @close="showAdjustModal = false"
      @updated="handleInventoryUpdated"
      @inventory-selected="handleInventorySelected"
    />
  </div>

  <!-- Error Display -->
  <div v-else class="flex h-screen bg-gray-50 items-center justify-center">
    <div class="text-center">
      <h2 class="text-2xl font-bold text-red-600 mb-4">Error Loading Inventory</h2>
      <p class="text-gray-600 mb-4">{{ errorMessage }}</p>
      <button
        @click="retryLoad"
        class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        Retry
      </button>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import Sidebar from '../Sidebar.vue';
import Headers from '../header.vue';
import { inventoryService } from '@/services/inventoryService';
import AdjustInventoryModal from './AdjustInventoryModal.vue';

axios.defaults.baseURL = 'http://localhost:3003';
axios.defaults.withCredentials = true;

export default {
  name: 'InventoryTable',
  components: {
    Sidebar,
    Headers,
    AdjustInventoryModal,
  },
  data() {
    return {
      inventories: [],
      warehouses: [],
      stats: null,
      search: '',
      warehouseFilter: '',
      quantityFilter: '',
      isLoading: false,
      showAdjustModal: false,
      selectedInventory: null,
      currentPage: 1,
      pageSize: 20,
      total: 0,
      hasError: false,
      errorMessage: '',
    };
  },
  computed: {
    filteredInventories() {
      let filtered = this.inventories || [];

      // Search filter
      if (this.search && this.search.trim()) {
        const searchTerm = this.search.toLowerCase();
        filtered = filtered.filter(
          (inv) =>
            (inv.productId?.name || '').toLowerCase().includes(searchTerm) ||
            (inv.productId?.sku || '').toLowerCase().includes(searchTerm) ||
            (inv.warehouseId?.name || '').toLowerCase().includes(searchTerm)
        );
      }

      // Warehouse filter
      if (this.warehouseFilter) {
        filtered = filtered.filter(
          (inv) => String(inv.warehouseId?._id) === String(this.warehouseFilter)
        );
      }

      // Quantity filter
      if (this.quantityFilter === 'low') {
        filtered = filtered.filter(
          (inv) => inv.quantity > 0 && inv.quantity < (inv.productId?.minStockLevel || 10)
        );
      } else if (this.quantityFilter === 'out') {
        filtered = filtered.filter((inv) => inv.quantity === 0);
      } else if (this.quantityFilter === 'in') {
        filtered = filtered.filter((inv) => inv.quantity > 0);
      }

      return filtered;
    },
    totalPages() {
      try {
        const total = this.total || 0;
        const pageSize = this.pageSize || 20;
        return Math.max(1, Math.ceil(total / pageSize));
      } catch (error) {
        console.error('Error in totalPages computed:', error);
        return 1;
      }
    },
    paginatedInventories() {
      try {
        const filtered = this.filteredInventories || [];
        const start = ((this.currentPage || 1) - 1) * (this.pageSize || 20);
        return filtered.slice(start, start + (this.pageSize || 20));
      } catch (error) {
        console.error('Error in paginatedInventories computed:', error);
        return [];
      }
    },
    visiblePages() {
      const pages = [];
      const total = this.totalPages;
      const current = this.currentPage;

      if (total <= 7) {
        for (let i = 1; i <= total; i++) pages.push(i);
      } else {
        if (current <= 4) {
          for (let i = 1; i <= 5; i++) pages.push(i);
          pages.push('...');
          pages.push(total);
        } else if (current >= total - 3) {
          pages.push(1);
          pages.push('...');
          for (let i = total - 4; i <= total; i++) pages.push(i);
        } else {
          pages.push(1);
          pages.push('...');
          for (let i = current - 1; i <= current + 1; i++) pages.push(i);
          pages.push('...');
          pages.push(total);
        }
      }
      return pages;
    },
  },
  watch: {
    warehouseFilter() {
      this.currentPage = 1;
      this.fetchInventories();
    },
    quantityFilter() {
      this.currentPage = 1;
    },
    search: {
      handler() {
        this.currentPage = 1;
      },
    },
  },
  async mounted() {
    // Persistent logging
    const persistentLog = (msg, data = null) => {
      try {
        const logs = JSON.parse(localStorage.getItem('component_logs') || '[]');
        logs.push({ timestamp: new Date().toISOString(), message: msg, data });
        if (logs.length > 100) logs.shift();
        localStorage.setItem('component_logs', JSON.stringify(logs));
      } catch (e) {
        // Ignore storage errors - logging is not critical
        console.warn('Failed to persist log:', e);
      }
      console.log(msg, data || '');
    };

    persistentLog('🚀 InventoryTable component mounted');
    try {
      persistentLog('📦 InventoryTable mounted, fetching data...');
      this.hasError = false;
      this.errorMessage = '';

      // Fetch data sequentially to avoid race conditions
      persistentLog('1️⃣ Fetching warehouses...');
      await this.fetchWarehouses();
      persistentLog('2️⃣ Fetching inventories...');
      await this.fetchInventories();
      persistentLog('3️⃣ Fetching stats...');
      await this.fetchStats();
      persistentLog('✅ InventoryTable data loaded successfully');
    } catch (error) {
      persistentLog('❌ Error in InventoryTable mounted', {
        message: error?.message,
        stack: error?.stack,
        name: error?.name
      });
      console.error('❌ Error in InventoryTable mounted:', error);
      console.error('Error stack:', error?.stack);
      this.hasError = true;
      this.errorMessage = error?.message || 'Failed to load inventory page. Please check console for details.';
    }
  },
  beforeUnmount() {
    console.log('🛑 InventoryTable component unmounting');
  },
  errorCaptured(err, instance, info) {
    try {
      const logs = JSON.parse(localStorage.getItem('component_logs') || '[]');
      logs.push({
        timestamp: new Date().toISOString(),
        message: '❌ Error captured in InventoryTable',
        error: { message: err?.message, stack: err?.stack, name: err?.name },
        info
      });
      if (logs.length > 100) logs.shift();
      localStorage.setItem('component_logs', JSON.stringify(logs));
    } catch (e) {
      // Ignore storage errors - logging is not critical
      console.warn('Failed to persist error log:', e);
    }
    console.error('Error captured in InventoryTable:', err, info);
    this.hasError = true;
    this.errorMessage = err?.message || 'An error occurred while rendering the page.';
    return false; // Prevent error from propagating
  },
  methods: {
    async fetchWarehouses() {
      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        const response = await axios.get('/api/warehouses/active', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.data.warehouses) {
          this.warehouses = response.data.warehouses;
        }
      } catch (error) {
        console.error('Error fetching warehouses:', error);
      }
    },
    async fetchInventories() {
      this.isLoading = true;
      try {
        const params = {
          page: this.currentPage,
          limit: this.pageSize,
        };
        if (this.warehouseFilter) {
          params.warehouseId = this.warehouseFilter;
        }

        console.log('📡 Fetching inventories with params:', params);
        const response = await inventoryService.getAllInventory(params);
        console.log('📥 Inventory response:', response);

        // httpClient returns { success, data, rawResponse, ... } structure
        // Backend returns { success: true, inventories: [...], pagination: {...} }
        // httpClient puts resData.data into response.data, but backend doesn't have 'data' field
        // So we need to check rawResponse.data or response.data
        if (response?.success) {
          // Try to get data from rawResponse first (original server response)
          const rawData = response.rawResponse?.data || response.data;

          if (rawData) {
            this.inventories = rawData.inventories || [];
            this.total = rawData.pagination?.total || 0;
            console.log('✅ Inventories loaded:', this.inventories.length, 'Total:', this.total);
          } else {
            console.warn('⚠️ No data in response:', response);
            this.inventories = [];
            this.total = 0;
          }
        } else {
          console.warn('⚠️ Inventory response not successful:', response);
          // Set empty arrays to prevent errors
          this.inventories = [];
          this.total = 0;
        }
      } catch (error) {
        console.error('❌ Error fetching inventories:', error);
        if (error?.response) {
          console.error('❌ Error response status:', error.response.status);
          console.error('❌ Error response data:', error.response.data);
        }
        // Set empty arrays to prevent errors
        this.inventories = [];
        this.total = 0;
        // Try to show toast, but don't fail if it's not available
        try {
          this.$toast?.error(error.response?.data?.message || 'Failed to load inventory');
        } catch (toastError) {
          console.warn('Toast not available:', toastError);
        }
      } finally {
        this.isLoading = false;
        console.log('🏁 fetchInventories completed');
      }
    },
    async fetchStats() {
      try {
        const params = this.warehouseFilter ? { warehouseId: this.warehouseFilter } : {};
        console.log('📊 Fetching stats with params:', params);
        const response = await inventoryService.getInventoryStats(params);
        console.log('📊 Stats response:', response);

        // httpClient returns { success, data, rawResponse, ... } structure
        // Backend returns { success: true, stats: {...} }
        // httpClient puts resData.data into response.data, but backend doesn't have 'data' field
        // So we need to check rawResponse.data or response.data
        if (response?.success) {
          // Try to get data from rawResponse first (original server response)
          const rawData = response.rawResponse?.data || response.data;

          if (rawData) {
            this.stats = rawData.stats || rawData;
            console.log('✅ Stats loaded:', this.stats);
          } else {
            console.warn('⚠️ No stats data in response:', response);
          }
        } else {
          console.warn('⚠️ Stats response not successful:', response);
        }
      } catch (error) {
        console.error('❌ Error fetching stats:', error);
        if (error?.response) {
          console.error('❌ Error response:', error.response);
        }
      }
    },

    openAdjustModal(inventory) {
      console.log('🔧 Opening adjust modal for inventory:', inventory);
      this.selectedInventory = inventory;
      this.showAdjustModal = true;
    },
    handleAdjustButtonClick() {
      // When clicking "Adjust Inventory" button in header, open modal with null inventory
      // Modal will show form to select product and warehouse
      console.log('🔧 Opening adjust modal from header button');
      this.selectedInventory = null;
      this.showAdjustModal = true;
    },
    handleInventorySelected(inventory) {
      // When inventory is selected from modal (product + warehouse selection)
      this.selectedInventory = inventory;
      console.log('✅ Inventory selected in modal:', inventory);
    },
    handleInventoryUpdated() {
      this.showAdjustModal = false;
      this.selectedInventory = null;
      this.fetchInventories();
      this.fetchStats();
    },
    formatNumber(num) {
      return new Intl.NumberFormat('vi-VN').format(num);
    },
    formatDate(date) {
      if (!date) return 'N/A';
      return new Date(date).toLocaleString('vi-VN');
    },
    getUpdatedByName(user) {
      if (!user) return 'N/A';
      return user.admin?.fullName || user.manager?.fullName || user.staff?.fullName || user.accounter?.fullName || 'N/A';
    },
    async retryLoad() {
      this.hasError = false;
      this.errorMessage = '';
      try {
        await this.fetchWarehouses();
        await this.fetchInventories();
        await this.fetchStats();
      } catch (error) {
        console.error('Error retrying load:', error);
        this.hasError = true;
        this.errorMessage = error?.message || 'Failed to load inventory page.';
      }
    },
  },
};
</script>

<style scoped>
/* Custom styles if needed */
</style>

