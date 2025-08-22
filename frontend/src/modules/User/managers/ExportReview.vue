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
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                   #
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Staff
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-for="(receipt, idx) in exportReceipts" :key="receipt._id" class="hover:bg-gray-50">
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {{ idx + 1 }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">{{ receipt.customerName }}</div>
                    <div class="text-sm text-gray-500">{{ receipt.customerPhone }}</div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {{ getStaffName(receipt.createdByStaff) }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${{ receipt.totalAmount.toFixed(2) }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span
                      :class="getStatusClass(receipt.status)"
                      class="inline-flex px-2 py-1 text-xs font-semibold rounded-full"
                    >
                      {{ getStatusText(receipt.status) }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {{ formatDate(receipt.createdAt) }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <button @click="viewReceipt(receipt)" class="text-blue-600 hover:text-blue-900">
                      View
                    </button>
                    <button
                      v-if="receipt.status === 'created'"
                      @click="reviewReceipt(receipt, 'approve')"
                      class="text-green-600 hover:text-green-900"
                    >
                      Approve
                    </button>
                    <button
                      v-if="receipt.status === 'created'"
                      @click="reviewReceipt(receipt, 'reject')"
                      class="text-red-600 hover:text-red-900"
                    >
                      Reject
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <div v-if="pagination && pagination.totalPages > 1" class="px-6 py-4 border-t border-gray-200">
            <div class="flex items-center justify-between">
              <div class="text-sm text-gray-700">
                Showing {{ (pagination.currentPage - 1) * 10 + 1 }} to
                {{ Math.min(pagination.currentPage * 10, pagination.totalReceipts) }} of
                {{ pagination.totalReceipts }} results
              </div>
              <div class="flex space-x-2">
                <button
                  @click="changePage(pagination.currentPage - 1)"
                  :disabled="!pagination.hasPrev"
                  class="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  @click="changePage(pagination.currentPage + 1)"
                  :disabled="!pagination.hasNext"
                  class="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Review Modal -->
        <div
          v-if="showReviewModal"
          class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
        >
          <div
            class="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white"
          >
            <div class="mt-3">
              <h3 class="text-lg font-medium text-gray-900 mb-4">
                {{ reviewAction === 'approve' ? 'Approve' : 'Reject' }} Export Receipt
              </h3>

              <!-- Receipt Details -->
              <div v-if="selectedReceipt" class="mb-6 p-4 bg-gray-50 rounded-lg">
                <div class="grid grid-cols-2 gap-4 text-sm">
                  <div><strong>Receipt #:</strong> {{ selectedReceipt.receiptNumber }}</div>
                  <div><strong>Customer:</strong> {{ selectedReceipt.customerName }}</div>
                  <div><strong>Total:</strong> ${{ selectedReceipt.totalAmount.toFixed(2) }}</div>
                  <div><strong>Staff:</strong> {{ getStaffName(selectedReceipt.createdByStaff) }}</div>
                </div>

                <!-- Products -->
                <div class="mt-4">
                  <strong class="text-sm">Products:</strong>
                  <ul class="mt-2 space-y-1">
                    <li
                      v-for="detail in selectedReceipt.details"
                      :key="detail._id"
                      class="text-sm text-gray-600"
                    >
                      {{ getProductName(detail.productId) }} - Qty: {{ detail.quantity }}
                    </li>
                  </ul>
                </div>
              </div>

              <!-- Comment -->
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-2">Comment</label>
                <textarea
                  v-model="reviewComment"
                  rows="3"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  :placeholder="`Enter ${reviewAction} comment...`"
                ></textarea>
              </div>

              <!-- Actions -->
              <div class="flex justify-end space-x-3">
                <button
                  @click="closeReviewModal"
                  class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  @click="submitReview"
                  :disabled="isSubmitting"
                  :class="
                    reviewAction === 'approve'
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-red-600 hover:bg-red-700'
                  "
                  class="px-4 py-2 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50"
                >
                  {{ isSubmitting ? 'Processing...' : reviewAction === 'approve' ? 'Approve' : 'Reject' }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- View Receipt Modal -->
        <div
          v-if="showViewModal"
          class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
        >
          <div
            class="relative top-10 mx-auto p-5 border w-11/12 md:w-4/5 lg:w-3/4 shadow-lg rounded-md bg-white"
          >
            <div class="mt-3">
              <div class="flex justify-between items-center mb-4">
                <h3 class="text-lg font-medium text-gray-900">Export Receipt Details</h3>
                <button @click="closeViewModal" class="text-gray-400 hover:text-gray-600">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div v-if="selectedReceipt" class="space-y-6">
                <!-- Basic Info -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div class="space-y-4">
                    <div>
                      <label class="block text-sm font-medium text-gray-700">Receipt Number</label>
                      <p class="mt-1 text-sm text-gray-900">{{ selectedReceipt.receiptNumber }}</p>
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-gray-700">Customer Name</label>
                      <p class="mt-1 text-sm text-gray-900">{{ selectedReceipt.customerName }}</p>
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-gray-700">Customer Phone</label>
                      <p class="mt-1 text-sm text-gray-900">{{ selectedReceipt.customerPhone || 'N/A' }}</p>
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-gray-700">Customer Address</label>
                      <p class="mt-1 text-sm text-gray-900">{{ selectedReceipt.customerAddress || 'N/A' }}</p>
                    </div>
                  </div>
                  <div class="space-y-4">
                    <div>
                      <label class="block text-sm font-medium text-gray-700">Status</label>
                      <span
                        :class="getStatusClass(selectedReceipt.status)"
                        class="inline-flex px-2 py-1 text-xs font-semibold rounded-full"
                      >
                        {{ getStatusText(selectedReceipt.status) }}
                      </span>
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-gray-700">Created By</label>
                      <p class="mt-1 text-sm text-gray-900">
                        {{ getStaffName(selectedReceipt.createdByStaff) }}
                      </p>
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-gray-700">Created At</label>
                      <p class="mt-1 text-sm text-gray-900">
                        {{ formatDateTime(selectedReceipt.createdAt) }}
                      </p>
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-gray-700">Total Amount</label>
                      <p class="mt-1 text-lg font-semibold text-blue-600">
                        ${{ selectedReceipt.totalAmount.toFixed(2) }}
                      </p>
                    </div>
                  </div>
                </div>

                <!-- Products Table -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-3">Products</label>
                  <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200">
                      <thead class="bg-gray-50">
                        <tr>
                          <th
                            class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Product
                          </th>
                          <th
                            class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            SKU
                          </th>
                          <th
                            class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Quantity
                          </th>
                          <th
                            class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Unit Price
                          </th>
                          <th
                            class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Total
                          </th>
                        </tr>
                      </thead>
                      <tbody class="bg-white divide-y divide-gray-200">
                        <tr v-for="detail in selectedReceipt.details" :key="detail._id">
                          <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {{ getProductName(detail.productId) }}
                          </td>
                          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {{ getProductSku(detail.productId) }}
                          </td>
                          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {{ detail.quantity }}
                          </td>
                          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ${{ getProductPrice(detail.productId) }}
                          </td>
                          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ${{
                              (detail.quantity * parseFloat(getProductPrice(detail.productId))).toFixed(2)
                            }}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <!-- Notes -->
                <div v-if="selectedReceipt.notes">
                  <label class="block text-sm font-medium text-gray-700">Notes</label>
                  <p class="mt-1 text-sm text-gray-900">{{ selectedReceipt.notes }}</p>
                </div>

                <!-- Review History -->
                <div v-if="selectedReceipt.managerReview?.reviewedBy" class="border-t pt-4">
                  <label class="block text-sm font-medium text-gray-700 mb-2">Review History</label>
                  <div class="bg-gray-50 p-4 rounded-lg">
                    <div class="text-sm">
                      <strong>Manager Review:</strong>
                      {{ getManagerName(selectedReceipt.managerReview.reviewedBy) }}
                      <br />
                      <strong>Date:</strong> {{ formatDateTime(selectedReceipt.managerReview.reviewedAt) }}
                      <br />
                      <strong>Comment:</strong> {{ selectedReceipt.managerReview.comment || 'No comment' }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Success/Error Messages -->
        <div v-if="message" :class="messageClass" class="fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50">
          {{ message }}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import ManagerSidebar from './ManagerSidebar.vue';
import ManagerHeader from './managerHeader.vue';

export default {
  name: 'ExportReview',
  components: {
    ManagerSidebar,
    ManagerHeader,
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
    userFullName() {
      // Lấy fullName từ role-specific object
      if (this.userInfo?.role === 'manager' && this.userInfo.manager?.fullName) {
        return this.userInfo.manager.fullName;
      }
      // Fallback: lấy từ localStorage nếu có
      const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user');
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          if (parsed.manager?.fullName) {
            return parsed.manager.fullName;
          }
        } catch (e) {
          console.warn('Error parsing stored user:', e);
        }
      }
      return 'Manager';
    },

    userInitials() {
      const name = this.userFullName;
      return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    },
  },
  mounted() {
    this.loadUserInfo();
    this.fetchExportReceipts();
  },
  methods: {
    async loadUserInfo() {
      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (!token) return;

        const response = await axios.get('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data.success) {
          this.userInfo = response.data.user;
        }
      } catch (error) {
        console.error('❌ Error loading user info:', error);
        // Fallback: try to get user info from localStorage
        const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user');
        if (storedUser) {
          try {
            this.userInfo = JSON.parse(storedUser);
          } catch (e) {
            console.error('Error parsing stored user:', e);
          }
        }
      }
    },

    async fetchExportReceipts() {
      this.isLoading = true;
      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        const params = {
          page: this.currentPage,
          limit: 10,
        };

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
      this.filters = {
        status: '',
        search: '',
      };
      this.currentPage = 1;
      this.fetchExportReceipts();
    },

    changePage(page) {
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

    async submitReview() {
      if (!this.selectedReceipt || !this.reviewAction) return;

      this.isSubmitting = true;
      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');

        const response = await axios.put(
          `/api/export-receipts/${this.selectedReceipt._id}/manager-review`,
          {
            action: this.reviewAction,
            comment: this.reviewComment.trim(),
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        if (response.data.success) {
          this.showMessage(`Export receipt ${this.reviewAction}d successfully!`, 'success');
          this.closeReviewModal();
          this.fetchExportReceipts();
        }
      } catch (error) {
        console.error('Error submitting review:', error);
        this.showMessage(error.response?.data?.message || 'Failed to submit review', 'error');
      } finally {
        this.isSubmitting = false;
      }
    },

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
      if (typeof staff === 'object' && staff?.staff?.fullName) {
        return staff.staff.fullName;
      }
      return 'Unknown Staff';
    },

    getManagerName(manager) {
      if (typeof manager === 'object' && manager?.manager?.fullName) {
        return manager.manager.fullName;
      }
      return 'Unknown Manager';
    },

    getProductName(product) {
      if (typeof product === 'object' && product?.name) {
        return product.name;
      }
      return 'Unknown Product';
    },

    getProductSku(product) {
      if (typeof product === 'object' && product?.sku) {
        return product.sku;
      }
      return 'N/A';
    },

    getProductPrice(product) {
      if (typeof product === 'object' && product?.basePrice) {
        return product.basePrice.toFixed(2);
      }
      return '0.00';
    },

    formatDate(dateString) {
      return new Date(dateString).toLocaleDateString();
    },

    formatDateTime(dateString) {
      return new Date(dateString).toLocaleString();
    },

    showMessage(text, type) {
      this.message = text;
      this.messageType = type;
      setTimeout(() => {
        this.message = '';
      }, 5000);
    },

    async handleLogout() {
      this.closeDropdown();
      try {
        await axios.post('/api/auth/logout');
      } catch (error) {
        console.warn('Logout request failed:', error);
      } finally {
        // Clear local storage
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');

        // Clear axios default headers
        delete axios.defaults.headers.common['Authorization'];

        // Redirect to login
        this.$router.push('/login');
      }
    },
  },
};
</script>
