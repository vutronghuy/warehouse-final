<template>
  <!-- Modal Overlay -->
  <div v-if="visible" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" @click="closeModal">
    <div class="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white" @click.stop>
      <!-- Modal Header -->
      <div class="flex items-center justify-between pb-4 border-b">
        <h3 class="text-lg font-semibold text-gray-900">
          Import Receipt Details
        </h3>
        <button @click="closeModal" class="text-gray-400 hover:text-gray-600">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>

      <!-- Modal Content -->
      <div v-if="loading" class="flex justify-center items-center py-8">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span class="ml-2 text-gray-600">Loading...</span>
      </div>

      <div v-else-if="error" class="py-8 text-center">
        <div class="text-red-600 mb-4">{{ error }}</div>
        <button @click="fetchReceiptDetail" class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
          Retry
        </button>
      </div>

      <div v-else-if="receipt" class="py-4 max-h-96 overflow-y-auto">
        <!-- Receipt Info -->
        <div class="bg-white rounded-lg shadow mb-6">
          <div class="px-6 py-4 border-b border-gray-200">
            <h3 class="text-lg font-semibold text-gray-800">Receipt Information</h3>
          </div>

          <div class="p-6">
            <div class="grid grid-cols-2 gap-6">
              <div>
                <label class="block text-sm font-medium text-gray-500">Receipt No.</label>
                <p class="mt-1 text-sm text-gray-900 font-semibold">{{ receipt.receiptNumber }}</p>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-500">Created At</label>
                <p class="mt-1 text-sm text-gray-900">{{ formatDate(receipt.createdAt) }}</p>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-500">Created By</label>
                <p class="mt-1 text-sm text-gray-900">{{ receipt.createdByStaff?.staff?.fullName || 'N/A' }}</p>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-500">Status</label>
                <span :class="getStatusClass(receipt.status)" class="mt-1 px-2 inline-flex text-xs leading-5 font-semibold rounded-full">
                  {{ getStatusText(receipt.status) }}
                </span>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-500">Supplier</label>
                <p class="mt-1 text-sm text-gray-900">{{ getMainSupplier() }}</p>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-500">Warehouse</label>
                <p class="mt-1 text-sm text-gray-900">{{ receipt.warehouseId?.name || 'N/A' }}</p>
              </div>
            </div>

            <div v-if="receipt.notes" class="mt-4">
              <label class="block text-sm font-medium text-gray-500">Notes</label>
              <p class="mt-1 text-sm text-gray-900">{{ receipt.notes }}</p>
            </div>

            <!-- Import metadata from Excel -->
            <div v-if="receipt.importMetadata" class="mt-4 p-4 bg-blue-50 rounded-lg">
              <label class="block text-sm font-medium text-blue-700 mb-2">Imported Excel Info</label>
              <div class="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span class="font-medium text-gray-600">File:</span>
                  <span class="ml-2 text-gray-900">{{ receipt.importMetadata.fileName || 'N/A' }}</span>
                </div>
                <div>
                  <span class="font-medium text-gray-600">Import Date:</span>
                  <span class="ml-2 text-gray-900">{{ formatDate(receipt.importMetadata.importDate) }}</span>
                </div>
                <div>
                  <span class="font-medium text-gray-600">Total Rows:</span>
                  <span class="ml-2 text-gray-900">{{ receipt.importMetadata.totalRows || 0 }}</span>
                </div>
                <div>
                  <span class="font-medium text-gray-600">Successful:</span>
                  <span class="ml-2 text-green-600 font-medium">{{ receipt.importMetadata.successfulRows || 0 }}</span>
                </div>
                <div>
                  <span class="font-medium text-gray-600">Failed:</span>
                  <span class="ml-2 text-red-600 font-medium">{{ receipt.importMetadata.failedRows || 0 }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Products Table -->
        <div class="bg-white rounded-lg shadow overflow-hidden">
          <div class="px-6 py-4 border-b border-gray-200">
            <h3 class="text-lg font-semibold text-gray-800">Product List</h3>
          </div>

          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    SKU
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Supplier
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Unit Price (USD)
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount (USD)
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-for="detail in receipt.details" :key="detail._id" class="hover:bg-gray-50">
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">
                      {{ detail.productName || detail.productId?.name || 'N/A' }}
                    </div>
                    <div v-if="detail.productName && detail.productId?.name && detail.productName !== detail.productId?.name" class="text-xs text-gray-500">
                      DB: {{ detail.productId?.name }}
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {{ detail.productSku || detail.productId?.sku || 'N/A' }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {{ detail.quantity }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div class="text-sm text-gray-900">
                      {{ detail.supplierName || detail.supplierId?.name || 'None' }}
                    </div>
                    <div v-if="detail.supplierName && detail.supplierId?.name && detail.supplierName !== detail.supplierId?.name" class="text-xs text-gray-400">
                      DB: {{ detail.supplierId?.name }}
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {{ formatCurrency(detail.unitPrice) }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                    {{ formatCurrency(detail.totalPrice || (detail.quantity * detail.unitPrice)) }}
                  </td>
                </tr>
              </tbody>
              <tfoot class="bg-gray-50">
                <tr>
                  <td colspan="5" class="px-6 py-4 text-right text-sm font-medium text-gray-900">
                    Total (USD):
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                    {{ formatCurrency(receipt.totalAmount) }}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      <!-- Modal Footer -->
      <div class="flex justify-end pt-4 border-t">
        <button @click="closeModal" class="bg-gray-500 text-white px-4 py-2 rounded mr-2 hover:bg-gray-600">
          Close
        </button>
        <!-- <button v-if="receipt" @click="printReceipt" class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
          Print Receipt
        </button> -->
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import { handleAuthError, getAuthHeaders } from '@/utils/auth';

export default {
  name: 'ImportReceiptDetailModal',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    receiptId: {
      type: String,
      default: null
    }
  },
  emits: ['close'],
  data() {
    return {
      receipt: null,
      loading: false,
      error: null
    };
  },
  watch: {
    visible(newVal) {
      if (newVal && this.receiptId) {
        this.fetchReceiptDetail();
      }
    },
    receiptId(newVal) {
      if (newVal && this.visible) {
        this.fetchReceiptDetail();
      }
    }
  },
  methods: {
    async fetchReceiptDetail() {
      if (!this.receiptId) return;

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

        const response = await axios.get(`/api/import/receipts/${this.receiptId}`, {
          headers: authHeaders
        });

        if (response.data.success) {
          this.receipt = response.data.importReceipt;
        } else {
          this.error = response.data.message || 'Unable to load import receipt details';
        }
      } catch (error) {
        console.error('Error fetching receipt detail:', error);

        // Handle auth errors using utility
        if (handleAuthError(error, this.$router)) {
          return; // Auth error was handled, stop processing
        }

        this.error = error.response?.data?.message || 'An error occurred while fetching data';
      } finally {
        this.loading = false;
      }
    },

    closeModal() {
      this.$emit('close');
      this.receipt = null;
      this.error = null;
    },

    getMainSupplier() {
      if (!this.receipt || !this.receipt.details || this.receipt.details.length === 0) {
        return 'No supplier available';
      }

      // Try to get supplier from receipt level first
      if (this.receipt.supplierId?.name) {
        return this.receipt.supplierId.name;
      }

      // Get suppliers from Excel data in details
      const suppliersFromExcel = this.receipt.details
        .map(detail => detail.supplierName)
        .filter(name => name && name !== 'Unknown Supplier');

      if (suppliersFromExcel.length > 0) {
        // Get the most common supplier
        const supplierCounts = {};
        suppliersFromExcel.forEach(supplier => {
          supplierCounts[supplier] = (supplierCounts[supplier] || 0) + 1;
        });

        const mostCommonSupplier = Object.keys(supplierCounts).reduce((a, b) =>
          supplierCounts[a] > supplierCounts[b] ? a : b
        );

        return mostCommonSupplier;
      }

      // Fallback to database supplier from details
      const suppliersFromDB = this.receipt.details
        .map(detail => detail.supplierId?.name)
        .filter(name => name);

      if (suppliersFromDB.length > 0) {
        return suppliersFromDB[0];
      }

      return 'Multiple suppliers';
    },

    // printReceipt() {
    //   window.print();
    // },

    formatDate(dateString) {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
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
