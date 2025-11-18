<template>
  <div>
    <div class="mb-4">
      <h3 class="text-lg font-medium text-gray-900 mb-2">My Invoices</h3>
      <p class="text-sm text-gray-600">Manage your created invoices</p>
    </div>

    <!-- Search and Filter -->
    <div class="mb-4 flex gap-4">
      <div class="flex-1">
        <input
          v-model="invoiceSearch"
          @input="debounceSearch"
          type="text"
          placeholder="Search by invoice number or customer name..."
          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <select
        v-model="statusFilter"
        @change="onStatusChange"
        class="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">All Status</option>
        <option value="pending_review">Pending Review</option>
        <option value="approved">Approved</option>
        <option value="rejected">Rejected</option>
      </select>
      <button
        @click="resetFilters"
        class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        Reset
      </button>
    </div>

    <!-- Invoices Table -->
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Invoice Number
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Customer
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Phone
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Amount
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Due Date
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-for="invoice in localInvoices" :key="invoice._id">
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
              {{ invoice.invoiceNumber }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="flex items-center gap-3">
                <div
                  class="w-10 h-10 bg-gradient-to-br from-[#6A4C93] to-[#8E63B9] rounded-full flex items-center justify-center text-white font-semibold"
                >
                  {{ getUserInitials(invoice.customerName) }}
                </div>
                <div class="text-sm font-medium text-gray-900">{{ invoice.customerName }}</div>
              </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              <div class="text-sm text-gray-500">{{ invoice.customerPhone }}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {{ formatCurrency(invoice.finalAmount, invoice.currency) }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span :class="getStatusClass(invoice.status)">{{ formatStatus(invoice.status) }}</span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {{ formatDate(invoice.dueDate) }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
              <button @click="$emit('view-invoice', invoice)" class="text-blue-600 hover:text-blue-900">
                View
              </button>
              <button
                v-if="canEdit(invoice.status)"
                @click="$emit('edit-invoice', invoice)"
                class="text-green-600 hover:text-green-900"
              >
                Edit
              </button>
              <button
                v-if="canDelete(invoice.status)"
                @click="$emit('delete-invoice', invoice)"
                class="text-red-600 hover:text-red-900"
              >
                Delete
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
          {{ Math.min(pagination.currentPage * 8, pagination.totalItems) }} of
          {{ pagination.totalItems }} results
        </div>
        <div class="flex items-center space-x-4">
          <span class="text-sm text-gray-700">
            Page {{ pagination.currentPage }} of {{ pagination.totalPages }}
          </span>
          <div class="flex space-x-2">
            <button
              @click="changePage(pagination.currentPage - 1)"
              :disabled="pagination.currentPage <= 1"
              class="px-3 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              @click="changePage(pagination.currentPage + 1)"
              :disabled="pagination.currentPage >= pagination.totalPages"
              class="px-3 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="localInvoices.length === 0 && !isLoading" class="text-center py-8">
      <p class="text-gray-500">No invoices created yet</p>
    </div>

    <div v-if="isLoading" class="text-center py-8 text-gray-500">Loading invoices...</div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';

// Props
defineProps({
  myInvoices: {
    type: Array,
    default: () => [],
  },
});

// Emits
const emit = defineEmits(['view-invoice', 'edit-invoice', 'delete-invoice', 'error', 'invoices-loaded']);

// Reactive data
const invoiceSearch = ref('');
const statusFilter = ref('');
const isLoading = ref(false);
const pagination = ref(null);
const currentPage = ref(1);
const searchTimeout = ref(null);
const localInvoices = ref([]);

// Methods
const debounceSearch = () => {
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value);
  }
  searchTimeout.value = setTimeout(() => {
    currentPage.value = 1; // Reset to first page when searching
    loadMyInvoices();
  }, 500);
};

const onStatusChange = () => {
  currentPage.value = 1; // Reset to first page when status changes
  loadMyInvoices();
};

const resetFilters = () => {
  invoiceSearch.value = '';
  statusFilter.value = '';
  currentPage.value = 1;
  loadMyInvoices();
};

const changePage = (page) => {
  console.log('changePage called with:', page);
  console.log('Current pagination:', pagination.value);
  if (!pagination.value) return;
  if (page >= 1 && page <= pagination.value.totalPages) {
    currentPage.value = page;
    console.log('Changing to page:', page);
    loadMyInvoices();
  }
};
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

const formatCurrency = (amount, currency = 'VND') => {
  const n = Number(amount || 0);
  try {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency }).format(n);
  } catch (e) {
    return new Intl.NumberFormat('vi-VN').format(n) + (currency ? ` ${currency}` : '');
  }
};

const formatStatus = (status) => {
  const statusMap = {
    draft: 'Draft',
    pending_review: 'Pending Review',
    approved: 'Approved',
    rejected: 'Rejected',
    paid: 'Paid',
  };
  return statusMap[status] || status;
};

const getStatusClass = (status) => {
  const baseClass = 'inline-flex px-2 py-1 text-xs font-semibold rounded-full';
  switch (status) {
    case 'draft':
      return `${baseClass} bg-gray-100 text-gray-800`;
    case 'pending_review':
      return `${baseClass} bg-yellow-100 text-yellow-800`;
    case 'approved':
      return `${baseClass} bg-green-100 text-green-800`;
    case 'rejected':
      return `${baseClass} bg-red-100 text-red-800`;
    case 'paid':
      return `${baseClass} bg-blue-100 text-blue-800`;
    default:
      return `${baseClass} bg-gray-100 text-gray-800`;
  }
};

const canEdit = (status) => ['draft', 'rejected'].includes(status);
const canDelete = (status) => ['draft', 'rejected'].includes(status);

const loadMyInvoices = async () => {
  isLoading.value = true;
  try {
    const params = { page: currentPage.value, limit: 8 }; // 8 items per page
    if (invoiceSearch.value) params.search = invoiceSearch.value;
    if (statusFilter.value) params.status = statusFilter.value;

    const response = await axios.get('/api/invoices', { params });
    if (response.data?.success) {
      const invoices = response.data.invoices || [];
      localInvoices.value = invoices;
      pagination.value = response.data.pagination;
      console.log('Pagination data:', response.data.pagination);
      emit('invoices-loaded', invoices);
    }
  } catch (error) {
    console.error('Error loading invoices:', error);
    emit('error', 'Failed to load invoices');
  } finally {
    isLoading.value = false;
  }
};

// Lifecycle
onMounted(() => {
  loadMyInvoices();
});

// Expose methods for parent component
defineExpose({
  loadMyInvoices,
});
</script>
