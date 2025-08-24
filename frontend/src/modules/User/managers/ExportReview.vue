<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Sidebar -->
    <ManagerSidebar />

    <!-- Top Header -->
    <ManagerHeader />
    <div class="ml-64 py-8">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Filters -->
        <div class="bg-white shadow rounded-lg p-6 mb-6">
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                v-model="filters.status"
                @change="fetchExportReceipts"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Status</option>
                <option value="created">Pending Review</option>
                <option value="reviewed">Reviewed</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <input
                v-model="filters.search"
                @input="debounceSearch"
                type="text"
                placeholder="Receipt number or customer..."
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div class="flex items-end">
              <button
                @click="resetFilters"
                class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        <!-- Export Receipts Table -->
        <div class="bg-white shadow rounded-lg overflow-hidden">
          <div class="px-6 py-4 border-b border-gray-200">
            <h3 class="text-lg font-medium text-gray-900">Export Receipts</h3>
          </div>

          <div v-if="isLoading" class="p-8 text-center">
            <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p class="mt-2 text-gray-600">Loading export receipts...</p>
          </div>

          <div v-else-if="exportReceipts.length === 0" class="p-8 text-center text-gray-500">
            No export receipts found.
          </div>

          <div v-else class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Staff</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                  <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-for="(receipt, idx) in exportReceipts" :key="receipt._id" class="hover:bg-gray-50">
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{{ idx + 1 }}</td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">{{ receipt.customerName }}</div>
                    <div class="text-sm text-gray-500">{{ receipt.customerPhone }}</div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ getStaffName(receipt.createdByStaff) }}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${{ safeAmount(receipt.totalAmount) }}</td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span :class="getStatusClass(receipt.status)" class="inline-flex px-2 py-1 text-xs font-semibold rounded-full">
                      {{ getStatusText(receipt.status) }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ formatDate(receipt.createdAt) }}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <button @click="viewReceipt(receipt)" class="text-blue-600 hover:text-blue-900">View</button>
                    <button v-if="receipt.status === 'created'" @click="reviewReceipt(receipt, 'approve')" class="text-green-600 hover:text-green-900">Approve</button>
                    <button v-if="receipt.status === 'created'" @click="reviewReceipt(receipt, 'reject')" class="text-red-600 hover:text-red-900">Reject</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <div v-if="pagination && pagination.totalPages > 1" class="px-6 py-4 border-t border-gray-200">
            <div class="flex items-center justify-between">
              <div class="text-sm text-gray-700">Showing {{ (pagination.currentPage - 1) * 10 + 1 }} to {{ Math.min(pagination.currentPage * 10, pagination.totalReceipts) }} of {{ pagination.totalReceipts }} results</div>
              <div class="flex space-x-2">
                <button @click="changePage(pagination.currentPage - 1)" :disabled="!pagination.hasPrev" class="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">Previous</button>
                <button @click="changePage(pagination.currentPage + 1)" :disabled="!pagination.hasNext" class="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">Next</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Reusable Modals -->
        <ViewReceiptModal
          :visible="showViewModal"
          :receipt="selectedReceipt"
          :get-staff-name="getStaffName"
          :get-manager-name="getManagerName"
          :get-admin-name="getAdminName"
          :get-product-name="getProductName"
          :get-product-sku="getProductSku"
          :get-product-price="getProductPrice"
          :format-date-time="formatDateTime"
          :get-status-class="getStatusClass"
          :get-status-text="getStatusText"
          @close="closeViewModal"
          @open-review="openReviewFromView"
        />

        <ReviewModal
          :visible="showReviewModal"
          :receipt="selectedReceipt"
          :action="reviewAction"
          :is-submitting="isSubmitting"
          :get-staff-name="getStaffName"
          :get-product-name="getProductName"
          :get-manager-name="getManagerName"
          :format-date-time="formatDateTime"
          @close="closeReviewModal"
          @submit="onReviewSubmit"
        />

        <!-- Success/Error Messages -->
        <div v-if="message" :class="messageClass" class="fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50">{{ message }}</div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import ManagerSidebar from './ManagerSidebar.vue';
import ManagerHeader from './managerHeader.vue';
import ViewReceiptModal from './ViewReceiptModal.vue';
import ReviewModal from './ReviewModal.vue';

export default {
  name: 'ExportReview',
  components: {
    ManagerSidebar,
    ManagerHeader,
    ViewReceiptModal,
    ReviewModal,
  },
  data() {
    return {
      isLoading: false,
      isSubmitting: false,
      message: '',
      messageType: '',
      userInfo: null,
      exportReceipts: [],
      pagination: null,
      currentPage: 1,
      filters: {
        status: '',
        search: '',
      },
      searchTimeout: null,
      showReviewModal: false,
      showViewModal: false,
      selectedReceipt: null,
      reviewAction: '',
      reviewComment: '',
    };
  },
  computed: {
    messageClass() {
      return this.messageType === 'success'
        ? 'bg-green-50 text-green-800 border border-green-200'
        : 'bg-red-50 text-red-800 border border-red-200';
    },
  },
  mounted() {
    this.loadUserInfo();
    this.fetchExportReceipts();
  },
  beforeUnmount() {
    if (this.searchTimeout) clearTimeout(this.searchTimeout);
  },
  methods: {
    async loadUserInfo() {
      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (!token) return;

        const response = await axios.get('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } });
        if (response.data?.success) {
          this.userInfo = response.data.user;
        }
      } catch (error) {
        console.error('❌ Error loading user info:', error);
        const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user');
        if (storedUser) {
          try { this.userInfo = JSON.parse(storedUser); } catch (e) { console.error(e); }
        }
      }
    },

    async fetchExportReceipts() {
      this.isLoading = true;
      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        const params = { page: this.currentPage, limit: 10 };
        if (this.filters.status) params.status = this.filters.status;
        if (this.filters.search) params.search = this.filters.search;

        const response = await axios.get('/api/export-receipts', {
          params,
          headers: { Authorization: `Bearer ${token}` },
        });

        this.exportReceipts = response.data.exportReceipts || [];
        this.pagination = response.data.pagination;
      } catch (error) {
        console.error('Error fetching export receipts:', error);
        this.showMessage('Failed to load export receipts', 'error');
      } finally {
        this.isLoading = false;
      }
    },

    debounceSearch() {
      clearTimeout(this.searchTimeout);
      this.searchTimeout = setTimeout(() => {
        this.currentPage = 1;
        this.fetchExportReceipts();
      }, 500);
    },

    resetFilters() {
      this.filters = { status: '', search: '' };
      this.currentPage = 1;
      this.fetchExportReceipts();
    },

    changePage(page) {
      if (!this.pagination) return;
      if (page >= 1 && page <= this.pagination.totalPages) {
        this.currentPage = page;
        this.fetchExportReceipts();
      }
    },

    viewReceipt(receipt) {
      this.selectedReceipt = receipt;
      this.showViewModal = true;
    },

    closeViewModal() {
      this.showViewModal = false;
      this.selectedReceipt = null;
    },

    reviewReceipt(receipt, action) {
      this.selectedReceipt = receipt;
      this.reviewAction = action;
      this.reviewComment = '';
      this.showReviewModal = true;
    },

    closeReviewModal() {
      this.showReviewModal = false;
      this.selectedReceipt = null;
      this.reviewAction = '';
      this.reviewComment = '';
    },

    // open review from inside view modal
    openReviewFromView(action) {
      this.reviewAction = action;
      this.showReviewModal = true;
      // keep selectedReceipt (already set by viewReceipt)
    },

    // handler for submit event from ReviewModal
    async onReviewSubmit({ action, comment }) {
      this.reviewAction = action;
      this.reviewComment = comment;
      await this.submitReview();
    },

    async submitReview() {
      if (!this.selectedReceipt || !this.reviewAction) return;

      this.isSubmitting = true;
      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');

        const response = await axios.put(
          `/api/export-receipts/${this.selectedReceipt._id}/manager-review`,
          { action: this.reviewAction, comment: this.reviewComment.trim() },
          { headers: { Authorization: `Bearer ${token}` } },
        );

        if (response.data?.success) {
          this.showMessage(`Export receipt ${this.reviewAction}d successfully!`, 'success');
          this.closeReviewModal();
          this.fetchExportReceipts();
        } else {
          this.showMessage(response.data?.message || 'Operation failed', 'error');
        }
      } catch (error) {
        console.error('Error submitting review:', error);
        this.showMessage(error.response?.data?.message || 'Failed to submit review', 'error');
      } finally {
        this.isSubmitting = false;
      }
    },

    /* Helpers (safe and flexible) */
    getStatusClass(status) {
      const classes = {
        created: 'bg-yellow-100 text-yellow-800',
        reviewed: 'bg-blue-100 text-blue-800',
        approved: 'bg-green-100 text-green-800',
        rejected: 'bg-red-100 text-red-800',
      };
      return classes[status] || 'bg-gray-100 text-gray-800';
    },
    getStatusText(status) {
      const texts = {
        created: 'Pending Review',
        reviewed: 'Reviewed',
        approved: 'Approved',
        rejected: 'Rejected',
      };
      return texts[status] || status;
    },
    getStaffName(staff) {
      if (!staff) return 'Unknown Staff';
      if (typeof staff === 'string') return staff;
      if (typeof staff === 'object') {
        if (staff.fullName) return staff.fullName;
        if (staff.staff?.fullName) return staff.staff.fullName;
        if (staff.name) return staff.name;
      }
      return 'Unknown Staff';
    },
    getManagerName(manager) {
      if (!manager) return 'Unknown Manager';
      if (typeof manager === 'string') return manager;
      if (typeof manager === 'object') {
        if (manager.fullName) return manager.fullName;
        if (manager.manager?.fullName) return manager.manager.fullName;
        if (manager.name) return manager.name;
      }
      return 'Unknown Manager';
    },
    getAdminName(admin) {
      if (!admin) return 'Unknown Admin';
      if (typeof admin === 'string') return admin;
      if (typeof admin === 'object') {
        if (admin.fullName) return admin.fullName;
        if (admin.admin?.fullName) return admin.admin.fullName;
        if (admin.name) return admin.name;
      }
      return 'Unknown Admin';
    },
    getProductName(product) {
      if (!product) return 'Unknown Product';
      if (typeof product === 'string') return product;
      if (typeof product === 'object' && product?.name) return product.name;
      return 'Unknown Product';
    },
    getProductSku(product) {
      if (!product) return 'N/A';
      if (typeof product === 'object' && product?.sku) return product.sku;
      return 'N/A';
    },
    getProductPrice(product) {
      if (!product) return '0.00';
      if (typeof product === 'object') {
        const p = product.basePrice ?? product.price ?? product.amount;
        return (p !== undefined && !isNaN(parseFloat(p))) ? parseFloat(p).toFixed(2) : '0.00';
      }
      if (typeof product === 'number') return product.toFixed(2);
      if (typeof product === 'string' && !isNaN(parseFloat(product))) return parseFloat(product).toFixed(2);
      return '0.00';
    },

    safeAmount(a) {
      if (a === null || a === undefined) return '0.00';
      const n = Number(a);
      return !isNaN(n) ? n.toFixed(2) : '0.00';
    },

    formatDate(dateString) {
      if (!dateString) return 'N/A';
      const d = new Date(dateString);
      return isNaN(d) ? 'N/A' : d.toLocaleDateString();
    },
    formatDateTime(dateString) {
      if (!dateString) return 'N/A';
      const d = new Date(dateString);
      return isNaN(d) ? 'N/A' : d.toLocaleString();
    },

    showMessage(text, type) {
      this.message = text;
      this.messageType = type;
      setTimeout(() => { this.message = ''; }, 5000);
    },

    // defensive closeDropdown in case other parts call it (prevents undefined)
    closeDropdown() { /* noop or toggle user menu if exists */ },
  },
};
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.12s ease;
}
.fade-enter,
.fade-leave-to {
  opacity: 0;
}
</style>
