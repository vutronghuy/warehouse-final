<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Sidebar -->
    <AdminSidebar />

    <!-- Main Content with left margin to avoid sidebar overlap -->
      <HeadBar />

    <div class="ml-64 py-8">
      <main class="flex-1 overflow-auto bg-gray-50 p-8">
        <div class="max-w-7xl mx-auto">
          <!-- Header -->
          <div class="mb-8">
            <h1 class="text-3xl font-bold text-gray-900">Export Receipt Approval</h1>
            <p class="text-gray-600">Approve export receipts reviewed by managers</p>
          </div>

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
                  <option value="reviewed">Pending Approval</option>
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
              <h3 class="text-lg font-medium text-gray-900">Export Receipts for Approval</h3>
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
                    <th
                      class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Receipt #
                    </th>
                    <th
                      class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Customer
                    </th>
                    <th
                      class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Staff
                    </th>
                    <th
                      class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Manager
                    </th>
                    <th
                      class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Total
                    </th>
                    <th
                      class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Status
                    </th>
                    <th
                      class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Reviewed
                    </th>
                    <th
                      class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  <tr v-for="receipt in exportReceipts" :key="receipt._id" class="hover:bg-gray-50">
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {{ receipt.receiptNumber }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="text-sm font-medium text-gray-900">{{ receipt.customerName }}</div>
                      <div class="text-sm text-gray-500">{{ receipt.customerPhone }}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {{ getStaffName(receipt.createdByStaff) }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {{ getManagerName(receipt.managerReview?.reviewedBy) }}
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
                      {{ formatDate(receipt.managerReview?.reviewedAt) }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <button @click="viewReceipt(receipt)" class="text-blue-600 hover:text-blue-900">
                        View
                      </button>
                      <button
                        v-if="receipt.status === 'reviewed'"
                        @click="approveReceipt(receipt, 'approve')"
                        class="text-green-600 hover:text-green-900"
                      >
                        Approve
                      </button>
                      <button
                        v-if="receipt.status === 'reviewed'"
                        @click="approveReceipt(receipt, 'reject')"
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

          <!-- Approval Modal -->
          <div
            v-if="showApprovalModal"
            class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
          >
            <div
              class="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white"
            >
              <div class="mt-3">
                <h3 class="text-lg font-medium text-gray-900 mb-4">
                  {{ approvalAction === 'approve' ? 'Approve' : 'Reject' }} Export Receipt
                </h3>

                <!-- Receipt Details -->
                <div v-if="selectedReceipt" class="mb-6 p-4 bg-gray-50 rounded-lg">
                  <div class="grid grid-cols-2 gap-4 text-sm">
                    <div><strong>Receipt #:</strong> {{ selectedReceipt.receiptNumber }}</div>
                    <div><strong>Customer:</strong> {{ selectedReceipt.customerName }}</div>
                    <div><strong>Total:</strong> ${{ selectedReceipt.totalAmount.toFixed(2) }}</div>
                    <div><strong>Staff:</strong> {{ getStaffName(selectedReceipt.createdByStaff) }}</div>
                  </div>

                  <!-- Manager Review -->
                  <div v-if="selectedReceipt.managerReview" class="mt-4 p-3 bg-blue-50 rounded">
                    <strong class="text-sm text-blue-800">Manager Review:</strong>
                    <div class="text-sm text-blue-700 mt-1">
                      <div>
                        <strong>Reviewed by:</strong>
                        {{ getManagerName(selectedReceipt.managerReview.reviewedBy) }}
                      </div>
                      <div>
                        <strong>Date:</strong> {{ formatDateTime(selectedReceipt.managerReview.reviewedAt) }}
                      </div>
                      <div>
                        <strong>Comment:</strong> {{ selectedReceipt.managerReview.comment || 'No comment' }}
                      </div>
                    </div>
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

                <!-- Warning for Approval -->
                <div
                  v-if="approvalAction === 'approve'"
                  class="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg"
                >
                  <div class="flex">
                    <svg class="w-5 h-5 text-yellow-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fill-rule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                        clip-rule="evenodd"
                      />
                    </svg>
                    <div>
                      <h4 class="text-sm font-medium text-yellow-800">Important Notice</h4>
                      <p class="text-sm text-yellow-700 mt-1">
                        Approving this export receipt will automatically deduct the product quantities from
                        inventory. This action cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>

                <!-- Comment -->
                <div class="mb-4">
                  <label class="block text-sm font-medium text-gray-700 mb-2">Admin Comment</label>
                  <textarea
                    v-model="approvalComment"
                    rows="3"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    :placeholder="`Enter ${approvalAction} comment...`"
                  ></textarea>
                </div>

                <!-- Actions -->
                <div class="flex justify-end space-x-3">
                  <button
                    @click="closeApprovalModal"
                    class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    @click="submitApproval"
                    :disabled="isSubmitting"
                    :class="
                      approvalAction === 'approve'
                        ? 'bg-green-600 hover:bg-green-700'
                        : 'bg-red-600 hover:bg-red-700'
                    "
                    class="px-4 py-2 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50"
                  >
                    {{
                      isSubmitting
                        ? 'Processing...'
                        : approvalAction === 'approve'
                          ? 'Approve & Update Inventory'
                          : 'Reject'
                    }}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- View Receipt Modal (reuse from Manager component) -->
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
                        <p class="mt-1 text-sm text-gray-900">
                          {{ selectedReceipt.customerAddress || 'N/A' }}
                        </p>
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
                              Current Stock
                            </th>
                            <th
                              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Export Qty
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
                              {{ getProductStock(detail.productId) }}
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
                  <div class="border-t pt-4 space-y-4">
                    <label class="block text-sm font-medium text-gray-700">Review History</label>

                    <!-- Manager Review -->
                    <div v-if="selectedReceipt.managerReview?.reviewedBy" class="bg-blue-50 p-4 rounded-lg">
                      <div class="text-sm">
                        <strong class="text-blue-800">Manager Review:</strong>
                        {{ getManagerName(selectedReceipt.managerReview.reviewedBy) }}
                        <br />
                        <strong class="text-blue-800">Date:</strong>
                        {{ formatDateTime(selectedReceipt.managerReview.reviewedAt) }}
                        <br />
                        <strong class="text-blue-800">Comment:</strong>
                        {{ selectedReceipt.managerReview.comment || 'No comment' }}
                      </div>
                    </div>

                    <!-- Admin Approval -->
                    <div v-if="selectedReceipt.adminApproval?.approvedBy" class="bg-green-50 p-4 rounded-lg">
                      <div class="text-sm">
                        <strong class="text-green-800">Admin Approval:</strong>
                        {{ getAdminName(selectedReceipt.adminApproval.approvedBy) }}
                        <br />
                        <strong class="text-green-800">Date:</strong>
                        {{ formatDateTime(selectedReceipt.adminApproval.approvedAt) }}
                        <br />
                        <strong class="text-green-800">Comment:</strong>
                        {{ selectedReceipt.adminApproval.comment || 'No comment' }}
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
      </main>
    </div>
  </div>
  <div v-if="isDropdownOpen" @click="closeDropdown" class="fixed inset-0 z-40"></div>
</template>

<script>
import axios from 'axios';
import AdminSidebar from './sidebar.vue';
import HeadBar from './headbar.vue';

export default {
  name: 'ExportApproval',
  components: {
    AdminSidebar,
    HeadBar,
  },
  data() {
    return {
      isLoading: false,
      isSubmitting: false,
      message: '',
      messageType: '',
      isDropdownOpen: false,
      exportReceipts: [],
      pagination: null,
      currentPage: 1,
      filters: {
        status: 'reviewed', // Default to pending approval
        search: '',
      },
      searchTimeout: null,
      showApprovalModal: false,
      showViewModal: false,
      selectedReceipt: null,
      approvalAction: '',
      approvalComment: '',
      // User menu
      showUserMenu: false,
      currentUserObj: null,
    };
  },
  computed: {
    messageClass() {
      return this.messageType === 'success'
        ? 'bg-green-50 text-green-800 border border-green-200'
        : 'bg-red-50 text-red-800 border border-red-200';
    },
    userFullName() {
      const u = this.currentUserObj || this._loadUserFromStorage();
      if (!u) return 'User';
      if (u.admin && u.admin.fullName) return u.admin.fullName;
      if (u.manager && u.manager.fullName) return u.manager.fullName;
      if (u.staff && u.staff.fullName) return u.staff.fullName;
      if (u.accounter && u.accounter.fullName) return u.accounter.fullName;
      if (u.fullName) return u.fullName;
      if (u.name) return u.name;
      return 'User';
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
  created() {
    // Load current user object
    try {
      const rawUser = localStorage.getItem('user') || sessionStorage.getItem('user');
      if (rawUser) this.currentUserObj = JSON.parse(rawUser);
    } catch (e) {
      this.currentUserObj = null;
    }
  },
  mounted() {
    this.fetchExportReceipts();
    document.addEventListener('click', this.handleDocClick);
  },
  beforeUnmount() {
    document.removeEventListener('click', this.handleDocClick);
  },

  methods: {
    toggleDropdown() {
      this.isDropdownOpen = !this.isDropdownOpen;
    },
    closeDropdown() {
      this.isDropdownOpen = false;
    },
    _loadUserFromStorage() {
      try {
        const raw = localStorage.getItem('user') || sessionStorage.getItem('user');
        return raw ? JSON.parse(raw) : null;
      } catch (e) {
        return null;
      }
    },

    handleDocClick(e) {
      const ua = this.$refs.userArea;
      if (!ua) return;
      if (!ua.contains(e.target)) {
        this.showUserMenu = false;
      }
    },

    toggleUserMenu() {
      this.showUserMenu = !this.showUserMenu;
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
        status: 'reviewed',
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

    approveReceipt(receipt, action) {
      this.selectedReceipt = receipt;
      this.approvalAction = action;
      this.approvalComment = '';
      this.showApprovalModal = true;
    },

    closeApprovalModal() {
      this.showApprovalModal = false;
      this.selectedReceipt = null;
      this.approvalAction = '';
      this.approvalComment = '';
    },

    async submitApproval() {
      if (!this.selectedReceipt || !this.approvalAction) return;

      this.isSubmitting = true;
      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');

        const response = await axios.put(
          `/api/export-receipts/${this.selectedReceipt._id}/admin-approve`,
          {
            action: this.approvalAction,
            comment: this.approvalComment.trim(),
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        if (response.data.success) {
          this.showMessage(response.data.message, 'success');
          this.closeApprovalModal();
          this.fetchExportReceipts();
        }
      } catch (error) {
        console.error('Error submitting approval:', error);
        this.showMessage(error.response?.data?.message || 'Failed to submit approval', 'error');
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
        reviewed: 'Pending Approval',
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

    getAdminName(admin) {
      if (typeof admin === 'object' && admin?.admin?.fullName) {
        return admin.admin.fullName;
      }
      return 'Unknown Admin';
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

    getProductStock(product) {
      if (typeof product === 'object' && product?.quantity !== undefined) {
        return product.quantity;
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
      if (!dateString) return 'N/A';
      return new Date(dateString).toLocaleDateString();
    },

    formatDateTime(dateString) {
      if (!dateString) return 'N/A';
      return new Date(dateString).toLocaleString();
    },

    showMessage(text, type) {
      this.message = text;
      this.messageType = type;
      setTimeout(() => {
        this.message = '';
      }, 5000);
    },
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
