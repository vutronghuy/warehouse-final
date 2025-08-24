<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex justify-between items-center">
      <div>
        <h2 class="text-2xl font-bold text-gray-900">Export Products</h2>
        <p class="text-sm text-gray-600">Create export receipts for products</p>
      </div>

      <div>
        <button @click="openCreateModal" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Create Export</button>
      </div>
    </div>

    <!-- Create Export Form is now modal; list below remains -->
    <div class="bg-white shadow rounded-lg p-6">
      <h3 class="text-lg font-medium text-gray-900 mb-4">My Export Receipts</h3>

      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Receipt #</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="receipt in exportReceipts" :key="receipt._id" class="hover:bg-gray-50">
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{{ receipt.receiptNumber }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ receipt.customerName }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${{ safeAmount(receipt.totalAmount) }}</td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span :class="getStatusClass(receipt.status)" class="inline-flex px-2 py-1 text-xs font-semibold rounded-full">
                  {{ getStatusText(receipt.status) }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ formatDate(receipt.createdAt) }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button @click="openViewModal(receipt)" class="text-blue-600 hover:text-blue-900 mr-3">View</button>
                <button v-if="receipt.status === 'created' || receipt.status === 'rejected'" @click="openEditModal(receipt)" class="text-green-600 hover:text-green-900">Edit</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Global Messages -->
    <div v-if="message" :class="messageClass" class="p-4 rounded-lg">{{ message }}</div>

    <!-- Modals -->
    <CreateExportModal
      :visible="showCreateModal"
      :available-products="modalProductsForCreate"
      :is-submitting="isCreating"
      :get-product-price="getProductPrice"
      @close="closeCreateModal"
      @submit="handleCreateSubmit"
      @error="showMessage"
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
  </div>
</template>

<script>
import axios from 'axios';
import CreateExportModal from './modal/CreateExportModal.vue';
import ViewExportModal from './modal/ViewExportModal.vue';
import EditExportModal from './modal/EditExportModal.vue';

export default {
  name: 'ExportProduct',
  components: {
    CreateExportModal,
    ViewExportModal,
    EditExportModal,
  },
  data() {
    return {
      isLoading: false,
      isCreating: false,
      isUpdating: false,
      message: '',
      messageType: '',
      products: [],
      exportReceipts: [],
      // modal states
      showCreateModal: false,
      showViewModal: false,
      showEditModal: false,
      selectedReceipt: null,
    };
  },
  computed: {
    messageClass() {
      return this.messageType === 'success'
        ? 'bg-green-50 text-green-800 border border-green-200'
        : 'bg-red-50 text-red-800 border border-red-200';
    },
    // available products for create: all products that have stock > 0
    modalProductsForCreate() {
      return this.products.slice(); // parent gives full list (create modal will filter by quantity)
    },
    // available products for edit: include products list plus any products referenced in selectedReceipt.details
    modalProductsForEdit() {
      // clone original products to avoid mutating
      const list = this.products.slice();
      if (this.selectedReceipt && Array.isArray(this.selectedReceipt.details)) {
        this.selectedReceipt.details.forEach(d => {
          const pid = typeof d.productId === 'object' ? (d.productId._id || d.productId.id) : d.productId;
          if (pid && !list.find(p => p._id === pid)) {
            // if receipt used a product object, try to include it
            if (typeof d.productId === 'object') {
              const p = {
                _id: d.productId._id || d.productId.id,
                name: d.productId.name || `Product (${pid})`,
                sku: d.productId.sku || '',
                quantity: d.productId.quantity ?? 0,
                basePrice: d.productId.basePrice ?? d.productId.price ?? 0
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
      (this.exportReceipts || []).forEach(r => {
        (r.details || []).forEach(d => {
          const pid = typeof d.productId === 'object' ? (d.productId._id || d.productId.id) : d.productId;
          if (pid && !list.find(p => p._id === pid)) {
            if (typeof d.productId === 'object') {
              list.push({
                _id: d.productId._id || d.productId.id,
                name: d.productId.name || `Product (${pid})`,
                sku: d.productId.sku || '',
                quantity: d.productId.quantity ?? 0,
                basePrice: d.productId.basePrice ?? d.productId.price ?? 0
              });
            } else {
              list.push({ _id: pid, name: `Product (${pid})`, sku: '', quantity: 0, basePrice: 0 });
            }
          }
        });
      });
      return list;
    }
  },
  mounted() {
    this.fetchProducts();
    this.fetchExportReceipts();
  },
  methods: {
    // --- API calls ---
    async fetchProducts() {
      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        const resp = await axios.get('/api/products', {
          params: { all: 'true' },
          headers: { Authorization: token ? `Bearer ${token}` : undefined }
        });
        this.products = resp.data.products || [];
      } catch (err) {
        console.error('Error fetching products:', err);
        this.showMessage('Failed to load products', 'error');
      }
    },

    async fetchExportReceipts() {
      this.isLoading = true;
      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        const resp = await axios.get('/api/export-receipts', {
          headers: { Authorization: token ? `Bearer ${token}` : undefined }
        });
        this.exportReceipts = resp.data.exportReceipts || [];
      } catch (err) {
        console.error('Error fetching export receipts:', err);
        this.showMessage('Failed to load export receipts', 'error');
      } finally {
        this.isLoading = false;
      }
    },

    // Create
    openCreateModal() { this.showCreateModal = true; }
    ,
    closeCreateModal() { this.showCreateModal = false; },

    async handleCreateSubmit(payload) {
      // payload from CreateExportModal: { customerName, customerPhone, customerAddress, notes, details: [{productId, quantity}] }
      this.isCreating = true;
      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        const resp = await axios.post('/api/export-receipts', payload, {
          headers: { Authorization: token ? `Bearer ${token}` : undefined }
        });
        if (resp.data?.success) {
          this.showMessage('Export receipt created successfully!', 'success');
          this.closeCreateModal();
          await this.fetchExportReceipts();
          await this.fetchProducts();
        } else {
          this.showMessage(resp.data?.message || 'Create failed', 'error');
        }
      } catch (err) {
        console.error('Create export error:', err);
        this.showMessage(err.response?.data?.message || 'Failed to create export receipt', 'error');
      } finally {
        this.isCreating = false;
      }
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
          headers: { Authorization: token ? `Bearer ${token}` : undefined }
        });
        if (resp.data?.success) {
          const isResubmit = this.selectedReceipt.status === 'rejected';
          this.showMessage(isResubmit ? 'Export receipt resubmitted!' : 'Export receipt updated!', 'success');
          this.closeEditModal();
          await this.fetchExportReceipts();
          await this.fetchProducts();
        } else {
          this.showMessage(resp.data?.message || 'Update failed', 'error');
        }
      } catch (err) {
        console.error('Update export error:', err);
        this.showMessage(err.response?.data?.message || 'Failed to update export receipt', 'error');
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
      const p = this.products.find(x => x._id === pid);
      if (p) {
        const val = p.basePrice ?? p.price ?? 0;
        return Number(val).toFixed(2);
      }
      // try to find in exportReceipts' details (if product object present there)
      for (const r of this.exportReceipts) {
        for (const d of (r.details || [])) {
          const did = typeof d.productId === 'object' ? (d.productId._id || d.productId.id) : d.productId;
          if (did === pid && typeof d.productId === 'object') {
            const val = d.productId.basePrice ?? d.productId.price ?? 0;
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
      const p = this.products.find(x => x._id === product);
      return p ? p.name : `Product (${product})`;
    },

    getProductSku(product) {
      if (!product) return 'N/A';
      if (typeof product === 'object') return product.sku || 'N/A';
      const p = this.products.find(x => x._id === product);
      return p ? p.sku || 'N/A' : 'N/A';
    },

    getStatusClass(status) {
      const classes = {
        created: 'bg-yellow-100 text-yellow-800',
        reviewed: 'bg-blue-100 text-blue-800',
        approved: 'bg-green-100 text-green-800',
        rejected: 'bg-red-100 text-red-800'
      };
      return classes[status] || 'bg-gray-100 text-gray-800';
    },

    getStatusText(status) {
      const texts = {
        created: 'Pending',
        reviewed: 'Reviewed',
        approved: 'Approved',
        rejected: 'Rejected'
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

    showMessage(text, type = 'success') {
      this.message = text;
      this.messageType = type;
      setTimeout(() => { this.message = ''; }, 5000);
    }
  }
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
