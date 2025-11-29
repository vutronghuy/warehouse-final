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
          <h2 class="text-3xl font-bold text-gray-900">Inventory Transaction History</h2>
        </div>

        <!-- Stats Cards -->
        <div class="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6" v-if="transactionStats">
          <div class="bg-white rounded-lg shadow p-4">
            <div class="text-sm text-gray-600 mb-1">Total Transactions</div>
            <div class="text-2xl font-bold text-gray-900">{{ transactionStats.total?.totalTransactions || 0 }}</div>
          </div>
          <div
            v-for="stat in transactionStats.byType"
            :key="stat._id"
            class="bg-white rounded-lg shadow p-4"
          >
            <div class="text-sm text-gray-600 mb-1">{{ stat._id.toUpperCase() }}</div>
            <div class="text-2xl font-bold" :class="getTypeColor(stat._id)">
              {{ stat.count || 0 }}
            </div>
            <div class="text-xs text-gray-500 mt-1">
              {{ stat.totalQuantityChange > 0 ? '+' : '' }}{{ formatNumber(stat.totalQuantityChange) }}
            </div>
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
              placeholder="Search by product name, SKU, reference..."
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
              v-model="transactionTypeFilter"
              class="px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Types</option>
              <option value="import">Import</option>
              <option value="export">Export</option>
              <option value="adjustment">Adjustment</option>
              <option value="reservation">Reservation</option>
              <option value="release">Release</option>
            </select>

            <input
              v-model="startDate"
              type="date"
              class="px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Start Date"
            />

            <input
              v-model="endDate"
              type="date"
              class="px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="End Date"
            />
          </div>
        </div>

        <!-- Transactions Table -->
        <div class="bg-white shadow-sm border border-gray-200 rounded-xl overflow-hidden">
          <div v-if="isLoading" class="flex justify-center items-center py-12">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>

          <div v-else-if="paginatedTransactions.length === 0" class="text-center py-12">
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
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 class="mt-2 text-sm font-medium text-gray-900">No transactions found</h3>
            <p class="mt-1 text-sm text-gray-500">Try adjusting your filters.</p>
          </div>

          <div v-else class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                  <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Type</th>
                  <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Product</th>
                  <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Warehouse</th>
                  <th class="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Before</th>
                  <th class="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Change</th>
                  <th class="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">After</th>
                  <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Reference</th>
                  <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Created By</th>
                  <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Notes</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-for="transaction in paginatedTransactions" :key="transaction._id" class="hover:bg-gray-50">
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">{{ formatDate(transaction.createdAt) }}</div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span
                      :class="[
                        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                        getTypeBadgeClass(transaction.transactionType)
                      ]"
                    >
                      {{ transaction.transactionType.toUpperCase() }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">
                      {{ transaction.productId?.name || 'N/A' }}
                    </div>
                    <div class="text-xs text-gray-500">{{ transaction.productId?.sku || '' }}</div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">{{ transaction.warehouseId?.name || 'N/A' }}</div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-right">
                    <span class="text-sm text-gray-900">{{ formatNumber(transaction.quantityBefore) }}</span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-right">
                    <span
                      :class="[
                        'text-sm font-semibold',
                        transaction.quantityChange > 0 ? 'text-green-600' : transaction.quantityChange < 0 ? 'text-red-600' : 'text-gray-600'
                      ]"
                    >
                      {{ transaction.quantityChange > 0 ? '+' : '' }}{{ formatNumber(transaction.quantityChange) }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-right">
                    <span class="text-sm text-gray-900">{{ formatNumber(transaction.quantityAfter) }}</span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">{{ transaction.referenceId || 'N/A' }}</div>
                    <div v-if="transaction.batchNumber" class="text-xs text-gray-500">
                      Batch: {{ transaction.batchNumber }}
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">
                      {{ getCreatedByName(transaction.createdBy) }}
                    </div>
                  </td>
                  <td class="px-6 py-4">
                    <div class="text-sm text-gray-500 max-w-xs truncate" :title="transaction.notes">
                      {{ transaction.notes || '-' }}
                    </div>
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
  </div>

  <!-- Error Display -->
  <div v-else class="flex h-screen bg-gray-50 items-center justify-center">
    <div class="text-center">
      <h2 class="text-2xl font-bold text-red-600 mb-4">Error Loading Transaction History</h2>
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

axios.defaults.baseURL = 'http://localhost:3003';
axios.defaults.withCredentials = true;

export default {
  name: 'InventoryTransactionTable',
  components: {
    Sidebar,
    Headers,
  },
  data() {
    return {
      transactions: [],
      warehouses: [],
      transactionStats: null,
      search: '',
      warehouseFilter: '',
      transactionTypeFilter: '',
      startDate: '',
      endDate: '',
      isLoading: false,
      currentPage: 1,
      pageSize: 20,
      total: 0,
      hasError: false,
      errorMessage: '',
    };
  },
  computed: {
    filteredTransactions() {
      let filtered = this.transactions || [];

      // Search filter
      if (this.search && this.search.trim()) {
        const searchTerm = this.search.toLowerCase();
        filtered = filtered.filter(
          (t) =>
            (t.productId?.name || '').toLowerCase().includes(searchTerm) ||
            (t.productId?.sku || '').toLowerCase().includes(searchTerm) ||
            (t.referenceId || '').toLowerCase().includes(searchTerm) ||
            (t.notes || '').toLowerCase().includes(searchTerm)
        );
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
    paginatedTransactions() {
      try {
        const filtered = this.filteredTransactions || [];
        const start = ((this.currentPage || 1) - 1) * (this.pageSize || 20);
        return filtered.slice(start, start + (this.pageSize || 20));
      } catch (error) {
        console.error('Error in paginatedTransactions computed:', error);
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
      this.fetchTransactions();
    },
    transactionTypeFilter() {
      this.currentPage = 1;
      this.fetchTransactions();
    },
    startDate() {
      this.currentPage = 1;
      this.fetchTransactions();
    },
    endDate() {
      this.currentPage = 1;
      this.fetchTransactions();
    },
    search: {
      handler() {
        this.currentPage = 1;
      },
    },
    $route: {
      handler(to) {
        // Lấy filters từ query params
        if (to.query.productId) {
          // productId will be validated in fetchTransactions
        }
        if (to.query.warehouseId) {
          const warehouseId = String(to.query.warehouseId).trim();
          // Validate warehouseId before setting
          if (warehouseId && /^[0-9a-fA-F]{24}$/.test(warehouseId)) {
            this.warehouseFilter = warehouseId;
          } else {
            console.warn('⚠️ Invalid warehouseId in route query, ignoring:', warehouseId);
            this.warehouseFilter = '';
          }
        }
        this.fetchTransactions();
      },
      immediate: true,
    },
  },
  async mounted() {
    try {
      console.log('InventoryTransactionTable mounted, fetching data...');
      this.hasError = false;
      this.errorMessage = '';
      await this.fetchWarehouses();
      await this.fetchTransactions();
      await this.fetchTransactionStats();
      console.log('InventoryTransactionTable data loaded successfully');
    } catch (error) {
      console.error('Error in InventoryTransactionTable mounted:', error);
      this.hasError = true;
      this.errorMessage = error?.message || 'Failed to load transaction history page. Please check console for details.';
    }
  },
  errorCaptured(err, instance, info) {
    console.error('Error captured in InventoryTransactionTable:', err, info);
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
    async fetchTransactions() {
      this.isLoading = true;
      try {
        const params = {
          page: this.currentPage,
          limit: this.pageSize,
        };

        // Validate and add warehouseId
        if (this.warehouseFilter) {
          const warehouseId = String(this.warehouseFilter).trim();
          // Basic validation: should be a valid MongoDB ObjectId format (24 hex characters)
          if (warehouseId && warehouseId !== '' && /^[0-9a-fA-F]{24}$/.test(warehouseId)) {
            params.warehouseId = warehouseId;
            console.log('✅ Valid warehouseId:', warehouseId);
          } else {
            console.warn('⚠️ Invalid warehouseId format, ignoring:', warehouseId, 'Type:', typeof warehouseId, 'Length:', warehouseId?.length);
            // Don't add invalid warehouseId to params
          }
        } else {
          console.log('ℹ️ No warehouseFilter set');
        }

        if (this.transactionTypeFilter) {
          params.transactionType = this.transactionTypeFilter;
        }
        if (this.startDate) {
          params.startDate = this.startDate;
        }
        if (this.endDate) {
          params.endDate = this.endDate;
        }

        // Only add productId if it's a valid non-empty string and valid ObjectId format
        if (this.$route.query.productId) {
          const productId = String(this.$route.query.productId).trim();
          // Basic validation: should be a valid MongoDB ObjectId format (24 hex characters)
          if (productId && /^[0-9a-fA-F]{24}$/.test(productId)) {
            params.productId = productId;
          } else {
            console.warn('⚠️ Invalid productId format in query, ignoring:', productId);
          }
        }

        console.log('📡 Fetching transactions with params:', params);
        console.log('📡 Params details:', {
          page: params.page,
          limit: params.limit,
          warehouseId: params.warehouseId,
          productId: params.productId,
          transactionType: params.transactionType,
          startDate: params.startDate,
          endDate: params.endDate,
          warehouseIdValid: params.warehouseId ? /^[0-9a-fA-F]{24}$/.test(params.warehouseId) : 'N/A',
          productIdValid: params.productId ? /^[0-9a-fA-F]{24}$/.test(params.productId) : 'N/A'
        });
        const response = await inventoryService.getAllTransactions(params);
        console.log('📥 Transaction response:', response);

        // httpClient returns { success, data, rawResponse, ... } structure
        // Backend returns { success: true, transactions: [...], pagination: {...} }
        // httpClient puts resData.data into response.data, but backend doesn't have 'data' field
        // So we need to check rawResponse.data or response.data
        if (response?.success) {
          // Try to get data from rawResponse first (original server response)
          const rawData = response.rawResponse?.data || response.data;

          if (rawData) {
            this.transactions = rawData.transactions || [];
            this.total = rawData.pagination?.total || 0;
            console.log('✅ Transactions loaded:', this.transactions.length, 'Total:', this.total);
          } else {
            console.warn('⚠️ No transaction data in response:', response);
            this.transactions = [];
            this.total = 0;
          }
        } else {
          console.warn('⚠️ Transaction response not successful:', response);
          console.warn('⚠️ Response message:', response?.message);
          console.warn('⚠️ Response statusCode:', response?.statusCode);
          // Set empty arrays to prevent errors
          this.transactions = [];
          this.total = 0;

          // Show error message if available
          if (response?.message) {
            try {
              this.$toast?.error(response.message);
            } catch (toastError) {
              console.warn('Toast not available:', toastError);
            }
          }
        }
      } catch (error) {
        console.error('❌ Error fetching transactions:', error);
        if (error?.response) {
          console.error('❌ Error response status:', error.response.status);
          console.error('❌ Error response data:', error.response.data);
          console.error('❌ Error response headers:', error.response.headers);
        }
        // Set empty arrays to prevent errors
        this.transactions = [];
        this.total = 0;
        // Try to show toast, but don't fail if it's not available
        try {
          const errorMessage = error.response?.data?.message || error?.message || 'Failed to load transactions';
          this.$toast?.error(errorMessage);
          console.error('❌ Error message:', errorMessage);
        } catch (toastError) {
          console.warn('Toast not available:', toastError);
        }
      } finally {
        this.isLoading = false;
        console.log('🏁 fetchTransactions completed');
      }
    },
    async fetchTransactionStats() {
      try {
        const params = {};
        if (this.warehouseFilter) {
          params.warehouseId = this.warehouseFilter;
        }
        if (this.startDate) {
          params.startDate = this.startDate;
        }
        if (this.endDate) {
          params.endDate = this.endDate;
        }

        console.log('📊 Fetching transaction stats with params:', params);
        const response = await inventoryService.getTransactionStats(params);
        console.log('📊 Transaction stats response:', response);

        // httpClient returns { success, data, rawResponse, ... } structure
        // Backend returns { success: true, stats: {...} }
        // httpClient puts resData.data into response.data, but backend doesn't have 'data' field
        // So we need to check rawResponse.data or response.data
        if (response?.success) {
          // Try to get data from rawResponse first (original server response)
          const rawData = response.rawResponse?.data || response.data;

          if (rawData) {
            this.transactionStats = rawData.stats || rawData;
            console.log('✅ Transaction stats loaded:', this.transactionStats);
          } else {
            console.warn('⚠️ No stats data in response:', response);
          }
        } else {
          console.warn('⚠️ Transaction stats response not successful:', response);
        }
      } catch (error) {
        console.error('❌ Error fetching transaction stats:', error);
        if (error?.response) {
          console.error('❌ Error response:', error.response);
        }
      }
    },
    getTypeBadgeClass(type) {
      const classes = {
        import: 'bg-green-100 text-green-800',
        export: 'bg-red-100 text-red-800',
        adjustment: 'bg-blue-100 text-blue-800',
        reservation: 'bg-yellow-100 text-yellow-800',
        release: 'bg-purple-100 text-purple-800',
      };
      return classes[type] || 'bg-gray-100 text-gray-800';
    },
    getTypeColor(type) {
      const colors = {
        import: 'text-green-600',
        export: 'text-red-600',
        adjustment: 'text-blue-600',
        reservation: 'text-yellow-600',
        release: 'text-purple-600',
      };
      return colors[type] || 'text-gray-600';
    },
    formatNumber(num) {
      return new Intl.NumberFormat('vi-VN').format(num);
    },
    formatDate(date) {
      if (!date) return 'N/A';
      return new Date(date).toLocaleString('vi-VN');
    },
    getCreatedByName(user) {
      if (!user) return 'N/A';
      return user.admin?.fullName || user.manager?.fullName || user.staff?.fullName || user.accounter?.fullName || 'N/A';
    },
    async retryLoad() {
      this.hasError = false;
      this.errorMessage = '';
      try {
        await this.fetchWarehouses();
        await this.fetchTransactions();
        await this.fetchTransactionStats();
      } catch (error) {
        console.error('Error retrying load:', error);
        this.hasError = true;
        this.errorMessage = error?.message || 'Failed to load transaction history page.';
      }
    },
  },
};
</script>

<style scoped>
/* Custom styles if needed */
</style>

