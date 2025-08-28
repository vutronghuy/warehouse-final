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
              Actions
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-for="receipt in confirmedExports" :key="receipt._id">
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
              {{ receipt.receiptNumber }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="flex items-center gap-3">
                <div
                  class="w-10 h-10 bg-gradient-to-br from-[#6A4C93] to-[#8E63B9] rounded-full flex items-center justify-center text-white font-semibold"
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
                >{{ receipt.status }}</span
              >
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
              <button
                @click="$emit('create-invoice', receipt)"
                :disabled="hasInvoice(receipt._id)"
                :class="[
                  'px-3 py-1 rounded text-sm',
                  hasInvoice(receipt._id)
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700',
                ]"
              >
                {{ hasInvoice(receipt._id) ? 'Invoice Created' : 'Create Invoice' }}
              </button>
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
import { ref, onMounted } from 'vue';
import axios from 'axios';

// Props
const props = defineProps({
  myInvoices: {
    type: Array,
    default: () => []
  }
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
  return props.myInvoices.some((invoice) => {
    const rid = invoice.exportReceiptId ? invoice.exportReceiptId._id || invoice.exportReceiptId : null;
    return rid && String(rid) === String(exportReceiptId);
  });
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
      confirmedExports.value = response.data.exportReceipts || [];
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
  loadConfirmedExports
});
</script>
