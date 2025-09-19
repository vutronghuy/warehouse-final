<template>
  <div class="import-receipt-list">
    <!-- Header -->
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold text-gray-800">Import Receipts</h2>
      <div class="flex gap-3">
        <!-- Status Filter -->
        <select
          v-model="selectedStatus"
          @change="loadImportReceipts"
          class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All statuses</option>
          <option value="created">Created</option>
        </select>

        <!-- Refresh Button -->
        <button
          @click="loadImportReceipts"
          :disabled="loading"
          class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
        >
          <i class="fas fa-sync-alt" :class="{ 'animate-spin': loading }"></i>
          Refresh
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <span class="ml-2 text-gray-600">Loading...</span>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
      <div>
        <div class="flex">
          <i class="fas fa-exclamation-circle text-red-400 mr-2 mt-0.5"></i>
          <div>
            <h3 class="text-sm font-medium text-red-800">An error occurred</h3>
            <p class="text-sm text-red-700 mt-1">{{ error }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Import Receipts Table -->
    <div v-else class="bg-white rounded-lg shadow overflow-hidden">
      <div v-if="importReceipts.length === 0" class="text-center py-8 text-gray-500">
        <i class="fas fa-inbox text-4xl mb-4"></i>
        <p>No import receipts</p>
      </div>

      <table v-else class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Receipt No.
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Supplier
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Created By
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Created At
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Total Amount (USD)
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-for="receipt in importReceipts" :key="receipt._id" class="hover:bg-gray-50">
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
              {{ receipt.receiptNumber }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {{ getReceiptSupplier(receipt) }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {{ receipt.createdByStaff?.staff?.fullName || 'N/A' }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {{ formatDate(receipt.createdAt) }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span :class="getStatusClass(receipt.status)" class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full">
                {{ getStatusText(receipt.status) }}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {{ formatCurrency(calculateTotalAmount(receipt)) }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
              <button
                @click="openReceiptModal(receipt._id)"
                class="text-blue-600 hover:text-blue-900 mr-3"
              >
                <i class="fas fa-eye"></i> View
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div v-if="pagination && pagination.pages > 1" class="mt-6 flex justify-between items-center">
      <div class="text-sm text-gray-700">
        Showing {{ (pagination.current - 1) * pagination.limit + 1 }} -
        {{ Math.min(pagination.current * pagination.limit, pagination.total) }}
        of {{ pagination.total }} receipts
      </div>

      <div class="flex gap-2">
        <button
          @click="changePage(pagination.current - 1)"
          :disabled="pagination.current <= 1"
          class="px-3 py-2 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
        >
          Previous
        </button>

        <span class="px-3 py-2 text-sm text-gray-700">
          Page {{ pagination.current }} / {{ pagination.pages }}
        </span>

        <button
          @click="changePage(pagination.current + 1)"
          :disabled="pagination.current >= pagination.pages"
          class="px-3 py-2 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
        >
          Next
        </button>
      </div>
    </div>

    <!-- Import Receipt Detail Modal -->
    <ImportReceiptDetailModal
      :visible="showReceiptModal"
      :receiptId="selectedReceiptId"
      @close="closeReceiptModal"
    />
  </div>
</template>

<script>
import axios from 'axios';
import ImportReceiptDetailModal from './modal/ImportReceiptDetailModal.vue';
import { handleAuthError, getAuthHeaders } from '@/utils/auth';

export default {
  name: 'ImportReceiptList',
  components: {
    ImportReceiptDetailModal
  },
  data() {
    return {
      importReceipts: [],
      loading: false,
      error: null,
      selectedStatus: '',
      pagination: null,
      currentPage: 1,
      showReceiptModal: false,
      selectedReceiptId: null
    };
  },
  mounted() {
    this.loadImportReceipts();
  },
  methods: {
    async loadImportReceipts() {
      this.loading = true;
      this.error = null;

      try {
        // Try auth utility first, fallback to manual token retrieval
        let authHeaders = getAuthHeaders();
        if (!authHeaders) {
          console.log('⚠️ Auth utility failed, trying manual token retrieval');
          const token = localStorage.getItem('token') || sessionStorage.getItem('token');
          if (token) {
            authHeaders = { Authorization: `Bearer ${token}` };
            console.log('✅ Found token manually:', token.substring(0, 20) + '...');
          } else {
            this.error = 'Authentication token not found. Please log in again.';
            console.error('❌ No token found in localStorage or sessionStorage');
            this.$router.push('/login');
            return;
          }
        }

        const params = {
          page: this.currentPage,
          limit: 10
        };

        if (this.selectedStatus) {
          params.status = this.selectedStatus;
        }

        const response = await axios.get('/api/import/receipts', {
          headers: authHeaders,
          params
        });

        if (response.data.success) {
          this.importReceipts = response.data.importReceipts;
          this.pagination = response.data.pagination;
        } else {
          this.error = response.data.message || 'Unable to load import receipts';
        }
      } catch (error) {
        console.error('Error loading import receipts:', error);

        // Handle auth errors using utility
        if (handleAuthError(error, this.$router)) {
          return; // Auth error was handled, stop processing
        }

        this.error = error.response?.data?.message || 'An error occurred while fetching data';
      } finally {
        this.loading = false;
      }
    },

    changePage(page) {
      if (page >= 1 && page <= this.pagination.pages) {
        this.currentPage = page;
        this.loadImportReceipts();
      }
    },

    openReceiptModal(receiptId) {
      this.selectedReceiptId = receiptId;
      this.showReceiptModal = true;
    },

    closeReceiptModal() {
      this.showReceiptModal = false;
      this.selectedReceiptId = null;
    },

    getReceiptSupplier(receipt) {
      // Try receipt level supplier first
      if (receipt.supplierId?.name) {
        return receipt.supplierId.name;
      }

      // Get suppliers from details (Excel data)
      if (receipt.details && receipt.details.length > 0) {
        const suppliersFromExcel = receipt.details
          .map(detail => detail.supplierName)
          .filter(name => name && name !== 'Unknown Supplier');

        if (suppliersFromExcel.length > 0) {
          // Get unique suppliers
          const uniqueSuppliers = [...new Set(suppliersFromExcel)];

          if (uniqueSuppliers.length === 1) {
            return uniqueSuppliers[0];
          } else if (uniqueSuppliers.length > 1) {
            return `${uniqueSuppliers[0]} (+${uniqueSuppliers.length - 1})`;
          }
        }

        // Fallback to database supplier from details
        const suppliersFromDB = receipt.details
          .map(detail => detail.supplierId?.name)
          .filter(name => name);

        if (suppliersFromDB.length > 0) {
          const uniqueDBSuppliers = [...new Set(suppliersFromDB)];
          if (uniqueDBSuppliers.length === 1) {
            return uniqueDBSuppliers[0];
          } else if (uniqueDBSuppliers.length > 1) {
            return `${uniqueDBSuppliers[0]} (+${uniqueDBSuppliers.length - 1})`;
          }
        }
      }

      return 'No supplier available';
    },

    formatDate(dateString) {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    },

    formatCurrency(amount) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(amount || 0);
    },

    // Calculate total amount from details (unitPrice × quantity)
    calculateTotalAmount(receipt) {
      if (!receipt.details || !Array.isArray(receipt.details)) {
        return 0;
      }

      return receipt.details.reduce((total, detail) => {
        const unitPrice = detail.unitPrice || 0;
        const quantity = detail.quantity || 0;
        return total + (unitPrice * quantity);
      }, 0);
    },

    getStatusText(status) {
      const statusMap = {
        created: 'Created'
      };
      return statusMap[status] || status;
    },

    getStatusClass(status) {
      const classMap = {
        created: 'bg-green-100 text-green-800'
      };
      return classMap[status] || 'bg-gray-100 text-gray-800';
    }
  }
};
</script>

<style scoped>
.import-receipt-list {
  padding: 1rem;
}

@media (max-width: 768px) {
  .import-receipt-list {
    padding: 0.5rem;
  }

  table {
    font-size: 0.875rem;
  }

  .px-6 {
    padding-left: 0.75rem;
    padding-right: 0.75rem;
  }
}
</style>
