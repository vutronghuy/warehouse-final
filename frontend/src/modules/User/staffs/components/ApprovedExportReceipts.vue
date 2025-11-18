<template>
  <div>
    <div class="mb-4">
      <h3 class="text-lg font-medium text-gray-900 mb-2">Approved Export Receipts Ready for Invoice</h3>
      <p class="text-sm text-gray-600">Select an approved export receipt to create an invoice</p>
    </div>

    <!-- Search and Filter -->
    <div class="mb-4 flex gap-4">
      <div class="flex-1">
        <input
          v-model="exportSearch"
          @input="debounceSearch"
          type="text"
          placeholder="Search by receipt number or customer name..."
          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <select
        v-model="invoiceFilter"
        @change="loadConfirmedExports"
        class="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="all">All Export Receipts</option>
        <option value="with-invoice">With Invoice</option>
        <option value="without-invoice">Without Invoice</option>
      </select>
      <button
        @click="resetSearch"
        class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        Reset
      </button>
    </div>

    <!-- Export Receipts Table -->
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Receipt Number
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Customer
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Phone
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Date
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Invoice Status
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-for="receipt in confirmedExports" :key="receipt._id" :class="hasInvoice(receipt._id) ? 'bg-gray-50' : ''">
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
              <div class="flex items-center gap-2">
                <div class="flex items-center gap-1">
                  <span v-if="hasInvoice(receipt._id)" class="text-green-600">✓</span>
                  <span v-else class="text-gray-400">○</span>
                  {{ receipt.receiptNumber }}
                </div>
                <span v-if="hasInvoice(receipt._id)" class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Invoice Created
                </span>
              </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="flex items-center gap-3">
                <div
                  :class="[
                    'w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold',
                    hasInvoice(receipt._id)
                      ? 'bg-gray-400'
                      : 'bg-gradient-to-br from-[#6A4C93] to-[#8E63B9]'
                  ]"
                >
                  {{ getUserInitials(receipt.customerName) }}
                </div>
                <div class="text-sm font-medium text-gray-900">{{ receipt.customerName }}</div>
              </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              <div class="text-sm text-gray-500">{{ receipt.customerPhone }}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {{ formatDate(receipt.createdAt) }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span
                class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800"
              >
                {{ receipt.status }}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span
                v-if="hasInvoice(receipt._id)"
                class="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800"
              >
                ✓ {{ getInvoiceStatus(receipt._id) }}
              </span>
              <span
                v-else
                class="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-600"
              >
                ⏳ Pending
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
              <div class="flex items-center gap-2">
                <button
                  @click="$emit('create-invoice', receipt)"
                  :disabled="hasInvoice(receipt._id)"
                  :class="[
                    'px-4 py-2 rounded-md text-sm font-medium transition-all duration-200',
                    hasInvoice(receipt._id)
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed border border-gray-300'
                      : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md',
                  ]"
                >
                  <span v-if="hasInvoice(receipt._id)" class="flex items-center gap-1">
                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                    </svg>
                    Already Created
                  </span>
                  <span v-else class="flex items-center gap-1">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Create Invoice
                  </span>
                </button>
                <div v-if="hasInvoice(receipt._id)" class="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                  {{ getInvoiceNumber(receipt._id) }}
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Simple Pagination -->
    <div v-if="pagination && pagination.totalPages > 1" class="px-6 py-4 border-t border-gray-200">
      <div class="flex items-center justify-between">
        <div class="text-sm text-gray-700">
          Showing {{ (pagination.currentPage - 1) * 8 + 1 }} to
          {{ Math.min(pagination.currentPage * 8, pagination.totalReceipts) }} of
          {{ pagination.totalReceipts }} results
        </div>
        <div class="flex items-center space-x-4">
          <span class="text-sm text-gray-700">
            Page {{ pagination.currentPage }} of {{ pagination.totalPages }}
          </span>
          <div class="flex space-x-2">
            <button
              @click="changePage(pagination.currentPage - 1)"
              :disabled="!pagination.hasPrev"
              class="px-3 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              @click="changePage(pagination.currentPage + 1)"
              :disabled="!pagination.hasNext"
              class="px-3 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="confirmedExports.length === 0 && !isLoading" class="text-center py-8">
      <div class="text-gray-400 mb-4">
        <svg class="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      </div>
      <p class="text-gray-500 text-lg font-medium">No approved export receipts available</p>
      <p class="text-gray-400 text-sm mt-2">
        Export receipts must be approved before you can create invoices from them.
      </p>
    </div>

    <div v-if="isLoading" class="text-center py-8 text-gray-500">
      Loading approved export receipts...
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import axios from 'axios';

// Props
const props = defineProps({
  myInvoices: {
    type: Array,
    default: () => [],
  },
});

// Emits
const emit = defineEmits(['create-invoice', 'error']);

// Reactive data
const confirmedExports = ref([]);
const exportSearch = ref('');
const isLoading = ref(false);
const pagination = ref(null);
const currentPage = ref(1);
const searchTimeout = ref(null);
const invoiceFilter = ref('all');

// Computed properties
const invoiceStatusMap = computed(() => {
  const map = new Map();
  if (props.myInvoices && props.myInvoices.length > 0) {
    props.myInvoices.forEach((invoice) => {
      const rid = invoice.exportReceiptId ? invoice.exportReceiptId._id || invoice.exportReceiptId : null;
      if (rid) {
        map.set(String(rid), {
          invoiceId: invoice._id,
          invoiceNumber: invoice.invoiceNumber,
          status: invoice.status,
          createdAt: invoice.createdAt,
        });
      }
    });
  }
  console.log('Invoice status map updated:', map);
  return map;
});

// Watch for changes in myInvoices prop
watch(
  () => props.myInvoices,
  (newInvoices) => {
    console.log('myInvoices prop updated:', newInvoices);
  },
  { deep: true, immediate: true },
);

// Methods
const getUserInitials = (name) => {
  if (!name) return 'NA';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('vi-VN');
};

const hasInvoice = (exportReceiptId) => {
  const hasInvoiceResult = invoiceStatusMap.value.has(String(exportReceiptId));
  // Removed console.log to avoid spam - only log when debugging is needed
  return hasInvoiceResult;
};

const getInvoiceNumber = (exportReceiptId) => {
  const invoiceData = invoiceStatusMap.value.get(String(exportReceiptId));
  return invoiceData ? invoiceData.invoiceNumber : '';
};

const getInvoiceStatus = (exportReceiptId) => {
  const invoiceData = invoiceStatusMap.value.get(String(exportReceiptId));

  if (!invoiceData) return 'Not Created';

  switch (invoiceData.status) {
    case 'pending_review':
      return 'Pending Review';
    case 'approved':
      return 'Approved';
    case 'rejected':
      return 'Rejected';
    case 'paid':
      return 'Paid';
    default:
      return 'Created';
  }
};

const debounceSearch = () => {
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value);
  }
  searchTimeout.value = setTimeout(() => {
    currentPage.value = 1; // Reset to first page when searching
    loadConfirmedExports();
  }, 500);
};

const resetSearch = () => {
  exportSearch.value = '';
  invoiceFilter.value = 'all';
  currentPage.value = 1;
  loadConfirmedExports();
};

const changePage = (page) => {
  if (!pagination.value) return;
  if (page >= 1 && page <= pagination.value.totalPages) {
    currentPage.value = page;
    loadConfirmedExports();
  }
};

const loadConfirmedExports = async () => {
  isLoading.value = true;
  try {
    const params = { page: currentPage.value, limit: 8 }; // 8 items per page
    if (exportSearch.value) params.search = exportSearch.value;

    const response = await axios.get('/api/export-receipts/confirmed', { params });
    if (response.data?.success) {
      let exports = response.data.exportReceipts || [];

      // Apply invoice filter
      if (invoiceFilter.value === 'with-invoice') {
        exports = exports.filter((receipt) => hasInvoice(receipt._id));
      } else if (invoiceFilter.value === 'without-invoice') {
        exports = exports.filter((receipt) => !hasInvoice(receipt._id));
      }

      confirmedExports.value = exports;
      pagination.value = response.data.pagination;
    } else {
      console.warn('API returned success: false for confirmed exports');
    }
  } catch (error) {
    console.error('Error loading approved exports:', error);
    emit('error', 'Failed to load approved export receipts');
  } finally {
    isLoading.value = false;
  }
};

// Lifecycle
onMounted(() => {
  loadConfirmedExports();
});

// Expose methods for parent component
defineExpose({
  loadConfirmedExports,
  refreshInvoiceStatus: () => {
    // Force recomputation of invoice status map
    console.log('Refreshing invoice status...');
  },
});
</script>
