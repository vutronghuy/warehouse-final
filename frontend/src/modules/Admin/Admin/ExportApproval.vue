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
                      Phone
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
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {{ getStaffName(receipt.createdByStaff) }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {{ getManagerName(receipt.managerReview?.reviewedBy) }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${{
                        receipt.totalAmount && typeof receipt.totalAmount === 'number'
                          ? receipt.totalAmount.toFixed(2)
                          : receipt.totalAmount
                            ? parseFloat(receipt.totalAmount).toFixed(2)
                            : '0.00'
                      }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span
                        :class="getStatusClass(receipt.status)"
                        class="inline-flex px-2 py-1 text-xs font-semibold rounded-full"
                        >{{ getStatusText(receipt.status) }}</span
                      >
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

          <!-- View Receipt Modal (component) -->
          <ViewReceiptModal
            :visible="showViewModal"
            :receipt="selectedReceipt"
            :get-staff-name="getStaffName"
            :get-manager-name="getManagerName"
            :get-admin-name="getAdminName"
            :get-product-name="getProductName"
            :get-product-sku="getProductSku"
            :get-product-stock="getProductStock"
            :get-product-price="getProductPrice"
            :format-date-time="formatDateTime"
            :get-status-class="getStatusClass"
            :get-status-text="getStatusText"
            @close="closeViewModal"
            @open-approval="openApprovalFromView"
          />

          <!-- Approval Modal (component) -->
          <ApprovalModal
            :visible="showApprovalModal"
            :receipt="selectedReceipt"
            :action="approvalAction"
            :is-submitting="isSubmitting"
            :get-staff-name="getStaffName"
            :get-manager-name="getManagerName"
            :format-date-time="formatDateTime"
            @close="closeApprovalModal"
            @submit="onApprovalSubmit"
          />

        </div>
      </main>
    </div>
  </div>
  <div v-if="isDropdownOpen" @click="closeDropdown" class="fixed inset-0 z-40"></div>
</template>

<script>
import axios from 'axios';
import { useToast } from 'vue-toastification';
import AdminSidebar from './sidebar.vue';
import HeadBar from './headbar.vue';
import ViewReceiptModal from './ViewReceiptModal.vue';
import ApprovalModal from './ApprovalModal.vue';
import socketService from '@/services/socketService';

export default {
  name: 'ExportApproval',
  components: {
    AdminSidebar,
    HeadBar,
    ViewReceiptModal,
    ApprovalModal,
  },
  setup() {
    const toast = useToast();
    return { toast };
  },
  data() {
    return {
      isLoading: false,
      isSubmitting: false,
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
    // Initialize Socket.IO connection
    this.initializeSocket();
  },
  beforeUnmount() {
    document.removeEventListener('click', this.handleDocClick);
    // Disconnect Socket.IO
    socketService.disconnect();
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
        this.toast.error('Không thể tải danh sách phiếu xuất');
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

    // New: open approval modal when requested from ViewReceiptModal
    openApprovalFromView(action) {
      this.approvalAction = action;
      this.showApprovalModal = true;
      // keep selectedReceipt (from view modal) as-is
    },

    // New: handler for submit event from ApprovalModal
    async onApprovalSubmit({ action, comment }) {
      this.approvalAction = action;
      this.approvalComment = comment;
      await this.submitApproval();
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
          this.toast.success(
            `Phiếu xuất đã được ${this.approvalAction === 'approve' ? 'duyệt' : 'từ chối'} thành công!`
          );
          this.closeApprovalModal();
          this.fetchExportReceipts();
        } else {
          this.toast.error(response.data.message || 'Thao tác thất bại');
        }
      } catch (error) {
        console.error('Error submitting approval:', error);
        this.toast.error(error.response?.data?.message || 'Không thể gửi phê duyệt');
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

    getUserInitials(name) {
      if (!name) return 'NA';
      return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
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

    getProductStock(product) {
      if (!product) return 'N/A';
      if (typeof product === 'object' && product?.quantity !== undefined) return product.quantity;
      return 'N/A';
    },

    getProductPrice(product) {
      if (!product) return '0.00';
      if (typeof product === 'object') {
        const price = product.finalPrice ?? product.basePrice;
        if (price !== undefined) {
          return price.toFixed
            ? price.toFixed(2)
            : (parseFloat(price) || 0).toFixed(2);
        }
      }
      if (typeof product === 'number') return product.toFixed(2);
      if (typeof product === 'string' && !isNaN(parseFloat(product))) return parseFloat(product).toFixed(2);
      return '0.00';
    },

    formatDate(dateString) {
      if (!dateString) return 'N/A';
      const d = new Date(dateString);
      if (isNaN(d)) return 'N/A';
      return d.toLocaleDateString();
    },

    formatDateTime(dateString) {
      if (!dateString) return 'N/A';
      const d = new Date(dateString);
      if (isNaN(d)) return 'N/A';
      return d.toLocaleString();
    },


    initializeSocket() {
      console.log('🚀 Initializing Socket.IO for ExportApproval...');
      // Connect to Socket.IO
      const socket = socketService.connect();

      // Join admin room
      if (socket) {
        console.log('🏠 Joining admin room...');
        socket.emit('join-room', 'admins');
      } else {
        console.warn('⚠️ Socket not available, export receipts will not update in real-time');
      }

      // Listen for export-created events (new exports from staff)
      socketService.on('export-created', (data) => {
        console.log('📦 ExportApproval - Export created:', data);
        // Refresh export receipts list
        this.fetchExportReceipts();
      });

      // Listen for export-status-changed events (when manager reviews)
      socketService.on('export-status-changed', (data) => {
        console.log('📦 ExportApproval - Export status changed:', data);
        // Refresh export receipts list
        this.fetchExportReceipts();
      });

      // Listen for export-approved events (when admin approves)
      socketService.on('export-approved', (data) => {
        console.log('✅ ExportApproval - Export approved:', data);
        // Refresh export receipts list
        this.fetchExportReceipts();
      });
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
