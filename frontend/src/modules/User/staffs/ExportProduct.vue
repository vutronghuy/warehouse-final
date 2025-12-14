<template>

    <!-- Header -->
    <div class="flex justify-between items-center">
      <div>
        <h2 class="text-2xl font-bold text-gray-900">Export Products</h2>
        <p class="text-sm text-gray-600">Create export receipts for products</p>
      </div>

      <div>
        <button
          @click="openCreateModal"
          class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Create Export
        </button>
      </div>
    </div>

    <!-- Filters -->
    <div class="bg-white shadow rounded-lg p-6 mb-6">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Status</label>
          <select
            v-model="filters.status"
            @change="onStatusChange"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Status</option>
            <option value="created">Pending</option>
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

    <!-- Create Export Form is now modal; list below remains -->
    <div class="bg-white shadow rounded-lg p-6">
      <h3 class="text-lg font-medium text-gray-900 mb-4">My Export Receipts</h3>

      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Receipt #
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Customer
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Phone
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
                {{ (receipt.customerPhone) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                ${{ safeAmount(receipt.totalAmount) }}
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
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button @click="openViewModal(receipt)" class="text-blue-600 hover:text-blue-900 mr-3">
                  View
                </button>
                <button
                  v-if="receipt.status === 'created' || receipt.status === 'rejected'"
                  @click="openEditModal(receipt)"
                  class="text-green-600 hover:text-green-900"
                >
                  Edit
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
    </div>

    <!-- Global Messages -->
    <div v-if="message" :class="messageClass" class="p-4 rounded-lg">{{ message }}</div>

    <!-- Modals -->
    <CreateExportModal
      :visible="showCreateModal"
      :available-products="modalProductsForCreate"
      :available-categories="categories"
      :available-customers="customers"
      :is-submitting="isCreating"
      :get-product-price="getProductPrice"
      @close="closeCreateModal"
      @submit="handleCreateSubmit"
      @error="showMessage"
      @customer-created="handleCustomerCreated"
      @customer-exists="handleCustomerExists"
      @customer-saved-locally="handleCustomerSavedLocally"
    />

    <ViewExportModal
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
      @open-edit="openEditFromView"
    />

    <EditExportModal
      :visible="showEditModal"
      :receipt="selectedReceipt"
      :available-products="modalProductsForEdit"
      :is-submitting="isUpdating"
      :get-product-price="getProductPrice"
      @close="closeEditModal"
      @submit="handleEditSubmit"
      @error="showMessage"
    />

</template>

<script>
import axios from 'axios';
import CreateExportModal from './modal/CreateExportModal.vue';
import ViewExportModal from './modal/ViewExportModal.vue';
import EditExportModal from './modal/EditExportModal.vue';
import { useNotificationStore } from '@/store/modules/notification/slice';
import { useToast } from 'vue-toastification';

export default {
  name: 'ExportProduct',
  components: {
    CreateExportModal,
    ViewExportModal,
    EditExportModal,
  },
  setup() {
    const notificationStore = useNotificationStore();
    const toast = useToast();
    return {
      notificationStore,
      toast,
    };
  },
  data() {
    return {
      isLoading: false,
      isCreating: false,
      isUpdating: false,
      message: '',
      messageType: '',
      products: [],
      categories: [], // Thêm categories
      customers: [], // Thêm customers
      exportReceipts: [],
      pagination: null,
      currentPage: 1,
      filters: {
        status: '',
        search: '',
      },
      searchTimeout: null,
      // modal states
      showCreateModal: false,
      showViewModal: false,
      showEditModal: false,
      selectedReceipt: null,
    };
  },
  computed: {
    messageClass() {
      if (this.messageType === 'success') {
        return 'bg-green-50 text-green-800 border border-green-200';
      } else if (this.messageType === 'info') {
        return 'bg-blue-50 text-blue-800 border border-blue-200';
      } else {
        return 'bg-red-50 text-red-800 border border-red-200';
      }
    },
    // available products for create: all products that are not out of stock
    modalProductsForCreate() {
      return this.products
        .filter((product) => {
          // Lọc bỏ các sản phẩm có status "out of stock"
          return product.status !== 'out of stock';
        })
        .map((product) => {
          // Đảm bảo categoryId được populate đúng cách
          if (product.categoryId && typeof product.categoryId === 'string') {
            const category = this.categories.find((cat) => cat._id === product.categoryId);
            if (category) {
              product.categoryId = category;
            }
          }
          return product;
        });
    },
    // available products for edit: include products list plus any products referenced in selectedReceipt.details
    modalProductsForEdit() {
      // clone original products to avoid mutating
      const list = this.products.slice();
      if (this.selectedReceipt && Array.isArray(this.selectedReceipt.details)) {
        this.selectedReceipt.details.forEach((d) => {
          const pid = typeof d.productId === 'object' ? d.productId._id || d.productId.id : d.productId;
          if (pid && !list.find((p) => p._id === pid)) {
            // if receipt used a product object, try to include it
            if (typeof d.productId === 'object') {
              const p = {
                _id: d.productId._id || d.productId.id,
                name: d.productId.name || `Product (${pid})`,
                sku: d.productId.sku || '',
                quantity: d.productId.quantity ?? 0,
                basePrice: d.productId.basePrice ?? d.productId.price ?? 0,
              };
              list.push(p);
            } else {
              // add minimal placeholder
              list.push({ _id: pid, name: `Product (${pid})`, sku: '', quantity: 0, basePrice: 0 });
            }
          }
        });
      }
      return list;
    },
    // small helper: all products union receipts referenced products so create modal can display selected products if needed
    modalProductsAll() {
      const list = this.products.slice();
      (this.exportReceipts || []).forEach((r) => {
        (r.details || []).forEach((d) => {
          const pid = typeof d.productId === 'object' ? d.productId._id || d.productId.id : d.productId;
          if (pid && !list.find((p) => p._id === pid)) {
            if (typeof d.productId === 'object') {
              list.push({
                _id: d.productId._id || d.productId.id,
                name: d.productId.name || `Product (${pid})`,
                sku: d.productId.sku || '',
                quantity: d.productId.quantity ?? 0,
                basePrice: d.productId.basePrice ?? d.productId.price ?? 0,
              });
            } else {
              list.push({ _id: pid, name: `Product (${pid})`, sku: '', quantity: 0, basePrice: 0 });
            }
          }
        });
      });
      return list;
    },
  },
  mounted() {
    this.fetchProducts();
    this.fetchCategories();
    this.fetchCustomers();
    this.fetchExportReceipts();
  },
  methods: {
    // --- API calls ---
    async fetchProducts() {
      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        const resp = await axios.get('/api/products', {
          params: { all: 'true' },
          headers: { Authorization: token ? `Bearer ${token}` : undefined },
        });
        this.products = resp.data.products || [];
      } catch (err) {
        console.error('Error fetching products:', err);
        this.showMessage('Failed to load products', 'error');
      }
    },

    async fetchCategories() {
      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        const resp = await axios.get('/api/categories/active', {
          headers: { Authorization: token ? `Bearer ${token}` : undefined },
        });
        this.categories = resp.data.categories || [];
      } catch (err) {
        console.error('Error fetching categories:', err);
        this.showMessage('Failed to load categories', 'error');
      }
    },

    async fetchCustomers() {
      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        const resp = await axios.get('/api/customers/active', {
          headers: { Authorization: token ? `Bearer ${token}` : undefined },
        });

        // Get customers from API
        const apiCustomers = resp.data.customers || [];

        // Get customers from localStorage
        const localCustomers = this.getLocalCustomers();

        // Merge customers (API customers first, then local customers that don't exist in API)
        const allCustomers = [...apiCustomers];
        localCustomers.forEach(localCustomer => {
          const existsInAPI = apiCustomers.some(apiCustomer => apiCustomer.phone === localCustomer.phone);
          if (!existsInAPI) {
            allCustomers.push(localCustomer);
          }
        });

        this.customers = allCustomers;
        console.log(`📋 Loaded ${apiCustomers.length} API customers + ${localCustomers.length} local customers`);
      } catch (err) {
        console.error('Error fetching customers:', err);

        // Fallback to localStorage only
        this.customers = this.getLocalCustomers();
        this.showMessage('Using local customers only. API unavailable.', 'info');
      }
    },

    // Get customers from localStorage
    getLocalCustomers() {
      try {
        const localCustomers = JSON.parse(localStorage.getItem('localCustomers') || '[]');
        return localCustomers.filter(customer => customer && customer.name && customer.phone);
      } catch (error) {
        console.error('Error loading local customers:', error);
        return [];
      }
    },

    async fetchExportReceipts() {
      this.isLoading = true;
      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        const params = { page: this.currentPage, limit: 8 }; // 8 items per page
        if (this.filters.status) params.status = this.filters.status;
        if (this.filters.search) params.search = this.filters.search;

        const resp = await axios.get('/api/export-receipts', {
          params,
          headers: { Authorization: token ? `Bearer ${token}` : undefined },
        });
        this.exportReceipts = resp.data.exportReceipts || [];
        this.pagination = resp.data.pagination;
      } catch (err) {
        console.error('Error fetching export receipts:', err);
        this.showMessage('Failed to load export receipts', 'error');
      } finally {
        this.isLoading = false;
      }
    },

    // Create
    openCreateModal() {
      this.showCreateModal = true;
    },
    closeCreateModal() {
      this.showCreateModal = false;
    },

    async handleCreateSubmit(payload) {
      // payload from CreateExportModal: { customerName, customerPhone, customerAddress, notes, details: [{productId, quantity}] }
      this.isCreating = true;
      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        console.log('Token for export creation:', token ? 'Present' : 'Missing');
        console.log('Token value:', token);
        const headers = {};
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }
        console.log('Headers being sent:', headers);

        // Fallback: try to get token from axios defaults
        if (!token && axios.defaults.headers.common['Authorization']) {
          console.log('Using token from axios defaults');
          headers.Authorization = axios.defaults.headers.common['Authorization'];
        }

        // Final fallback: use axios defaults without explicit headers
        if (!headers.Authorization) {
          console.log('No token found, using axios defaults');
          const resp = await axios.post('/api/export-receipts', payload);
          return resp;
        }
        const resp = await axios.post('/api/export-receipts', payload, {
          headers,
        });
        if (resp.data?.success) {
          // Hiển thị toast notification thành công
          this.showToast('The export note has been successfully created!', 'success');

          // Send notification to manager
          this.notificationStore.notifyExportCreated(resp.data.exportReceipt);

          this.closeCreateModal();
          this.currentPage = 1; // Reset to first page
          await this.fetchExportReceipts();
          await this.fetchProducts();
        } else {
          // Hiển thị toast notification lỗi
          this.showToast(resp.data?.message || 'The export note creation failed!', 'error');
        }
      } catch (err) {
        console.error('Create export error:', err);
        // Hiển thị toast notification lỗi cho catch block
        this.showToast(err.response?.data?.message || 'Unable to create a export note. Please try again!', 'error');
      } finally {
        this.isCreating = false;
      }
    },

    // Handle customer created event
    async handleCustomerCreated(customer) {
      console.log('✅ New customer created:', customer.name);
      this.showToast(`The customer "${customer.name}" has been successfully saved!`, 'success');
      // Refresh customer list
      await this.fetchCustomers();
    },

    // Handle customer exists event
    handleCustomerExists(existingCustomer) {
      console.log('ℹ️ Customer already exists:', existingCustomer.name);
      this.showToast(`The customer "${existingCustomer.name}" already exists in the database.`, 'info');
    },

    // Handle customer saved locally event
    handleCustomerSavedLocally(customer) {
      console.log('💾 Customer saved locally:', customer.name);
      this.showToast(`The customer "${customer.name}" has been saved locally for later use.`, 'info');
      // Refresh customer list to include the new local customer
      this.fetchCustomers();
    },

    // View
    openViewModal(receipt) {
      this.selectedReceipt = receipt;
      this.showViewModal = true;
    },
    closeViewModal() {
      this.showViewModal = false;
      // keep selectedReceipt if you want; clear to avoid stale data:
      this.selectedReceipt = null;
    },

    // Edit (direct from list)
    openEditModal(receipt) {
      this.selectedReceipt = receipt;
      this.showEditModal = true;
    },
    // Edit opened from view modal
    openEditFromView() {
      // keep selectedReceipt assigned by view; close view and open edit
      const r = this.selectedReceipt;
      this.showViewModal = false;
      this.showEditModal = true;
      this.selectedReceipt = r; // ensure still set
    },
    closeEditModal() {
      this.showEditModal = false;
      this.selectedReceipt = null;
    },

    async handleEditSubmit(payload) {
      if (!this.selectedReceipt) return;
      this.isUpdating = true;
      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        const resp = await axios.put(`/api/export-receipts/${this.selectedReceipt._id}`, payload, {
          headers: { Authorization: token ? `Bearer ${token}` : undefined },
        });
        if (resp.data?.success) {
          const isResubmit = this.selectedReceipt.status === 'rejected';
          this.showToast(isResubmit ? 'The export note has been successfully sent!' : 'The export note has been successfully updated!', 'success');
          this.closeEditModal();
          this.currentPage = 1; // Reset to first page
          await this.fetchExportReceipts();
          await this.fetchProducts();
        } else {
          this.showToast(resp.data?.message || 'Update failed delivery slip!', 'error');
        }
      } catch (err) {
        console.error('Update export error:', err);
        this.showToast(err.response?.data?.message || 'Unable to update the export note. Please try again!', 'error');
      } finally {
        this.isUpdating = false;
      }
    },

    // --- Helpers & small utilities ---
    safeAmount(a) {
      if (a === null || a === undefined) return '0.00';
      const n = Number(a);
      return !isNaN(n) ? n.toFixed(2) : '0.00';
    },

    getProductPrice(productIdOrObj) {
      let pid = productIdOrObj;
      if (typeof productIdOrObj === 'object') {
        pid = productIdOrObj._id || productIdOrObj.id;
      }
      const p = this.products.find((x) => x._id === pid);
      if (p) {
        const val = p.finalPrice ?? p.basePrice ?? p.price ?? 0;
        return Number(val).toFixed(2);
      }
      // try to find in exportReceipts' details (if product object present there)
      for (const r of this.exportReceipts) {
        for (const d of r.details || []) {
          const did = typeof d.productId === 'object' ? d.productId._id || d.productId.id : d.productId;
          if (did === pid && typeof d.productId === 'object') {
            const val = d.productId.finalPrice ?? d.productId.basePrice ?? d.productId.price ?? 0;
            return Number(val).toFixed(2);
          }
        }
      }
      return '0.00';
    },

    getProductName(product) {
      if (!product) return 'Unknown Product';
      if (typeof product === 'object') {
        return product.name || `Product (${product._id || product.id || ''})`;
      }
      const p = this.products.find((x) => x._id === product);
      return p ? p.name : `Product (${product})`;
    },

    getProductSku(product) {
      if (!product) return 'N/A';
      if (typeof product === 'object') return product.sku || 'N/A';
      const p = this.products.find((x) => x._id === product);
      return p ? p.sku || 'N/A' : 'N/A';
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
        created: 'Pending',
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
        return staff.fullName || staff.name || 'Unknown Staff';
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

    getUserInitials(name) {
      if (!name) return 'NA';
      return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
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

    onStatusChange() {
      this.currentPage = 1; // Reset to first page when status changes
      this.fetchExportReceipts();
    },

    debounceSearch() {
      if (this.searchTimeout) {
        clearTimeout(this.searchTimeout);
      }
      this.searchTimeout = setTimeout(() => {
        this.currentPage = 1; // Reset to first page when searching
        this.fetchExportReceipts();
      }, 500);
    },

    resetFilters() {
      this.filters.status = '';
      this.filters.search = '';
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

    showMessage(text, type = 'success') {
      this.message = text;
      this.messageType = type;
      setTimeout(() => {
        this.message = '';
      }, 5000);
    },

    // Helper method để hiển thị toast với cấu hình mặc định
    showToast(message, type = 'success') {
      const toastOptions = {
        position: 'top-right',
        timeout: type === 'error' ? 5000 : 4000,
        closeOnClick: true,
        pauseOnFocusLoss: true,
        pauseOnHover: true,
        draggable: true,
        draggablePercent: 0.6,
        showCloseButtonOnHover: false,
        hideProgressBar: false,
        closeButton: "button",
        icon: true,
        rtl: false
      };

      switch (type) {
        case 'success':
          this.toast.success(message, toastOptions);
          break;
        case 'error':
          this.toast.error(message, toastOptions);
          break;
        case 'info':
          this.toast.info(message, toastOptions);
          break;
        case 'warning':
          this.toast.warning(message, toastOptions);
          break;
        default:
          this.toast(message, toastOptions);
      }
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
