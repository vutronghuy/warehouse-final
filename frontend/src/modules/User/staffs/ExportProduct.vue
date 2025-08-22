<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex justify-between items-center">
      <div>
        <h2 class="text-2xl font-bold text-gray-900">Export Products</h2>
        <p class="text-sm text-gray-600">Create export receipts for products</p>
      </div>
    </div>

    <!-- Create Export Form -->
    <div class="bg-white shadow rounded-lg p-6">
      <h3 class="text-lg font-medium text-gray-900 mb-4">Create Export Receipt</h3>

      <!-- Customer Information -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Customer Name *</label>
          <input
            v-model="form.customerName"
            type="text"
            required
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter customer name"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Customer Phone</label>
          <input
            v-model="form.customerPhone"
            type="tel"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter phone number"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Customer Address</label>
          <input
            v-model="form.customerAddress"
            type="text"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter address"
          />
        </div>
      </div>

      <!-- Product Selection -->
      <div class="mb-6">
        <h4 class="text-md font-medium text-gray-900 mb-3">Select Products</h4>
        <div class="space-y-3">
          <div v-for="(detail, index) in form.details" :key="index" class="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
            <div class="flex-1">
              <select
                v-model="detail.productId"
                @change="updateProductInfo(index)"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select a product...</option>
                <option v-for="product in availableProducts" :key="product._id" :value="product._id">
                  {{ product.name }} ({{ product.sku }}) - Stock: {{ product.quantity }}
                </option>
              </select>
            </div>
            <div class="w-32">
              <input
                v-model.number="detail.quantity"
                type="number"
                min="1"
                :max="getMaxQuantity(detail.productId)"
                placeholder="Qty"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div class="w-24 text-sm text-gray-600">
              ${{ getProductPrice(detail.productId) }}
            </div>
            <button
              @click="removeProduct(index)"
              class="text-red-600 hover:text-red-800"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
            </button>
          </div>
        </div>

        <button
          @click="addProduct"
          class="mt-3 inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
          </svg>
          Add Product
        </button>
      </div>

      <!-- Notes -->
      <div class="mb-6">
        <label class="block text-sm font-medium text-gray-700 mb-2">Notes</label>
        <textarea
          v-model="form.notes"
          rows="3"
          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Enter any additional notes..."
        ></textarea>
      </div>

      <!-- Total Amount -->
      <div class="mb-6 p-4 bg-gray-50 rounded-lg">
        <div class="flex justify-between items-center">
          <span class="text-lg font-medium text-gray-900">Total Amount:</span>
          <span class="text-xl font-bold text-blue-600">${{ totalAmount.toFixed(2) }}</span>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex justify-end space-x-3">
        <button
          @click="resetForm"
          type="button"
          class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Reset
        </button>
        <button
          @click="createExportReceipt"
          :disabled="!canSubmit || isLoading"
          class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {{ isLoading ? 'Creating...' : 'Create Export Receipt' }}
        </button>
      </div>
    </div>

    <!-- Export Receipts List -->
    <div class="bg-white shadow rounded-lg">
      <div class="px-6 py-4 border-b border-gray-200">
        <h3 class="text-lg font-medium text-gray-900">My Export Receipts</h3>
      </div>

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
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {{ receipt.receiptNumber }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ receipt.customerName }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                ${{ receipt.totalAmount.toFixed(2) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span :class="getStatusClass(receipt.status)" class="inline-flex px-2 py-1 text-xs font-semibold rounded-full">
                  {{ getStatusText(receipt.status) }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ formatDate(receipt.createdAt) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button
                  @click="viewReceipt(receipt)"
                  class="text-blue-600 hover:text-blue-900 mr-3"
                >
                  View
                </button>
                <button
                  v-if="receipt.status === 'created' || receipt.status === 'rejected'"
                  @click="editReceipt(receipt)"
                  class="text-green-600 hover:text-green-900"
                >
                  Edit
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Edit Receipt Modal -->
    <div v-if="showEditModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div class="relative top-10 mx-auto p-5 border w-11/12 md:w-4/5 lg:w-3/4 shadow-lg rounded-md bg-white">
        <div class="mt-3">
          <div class="flex justify-between items-center mb-4">
            <div>
              <h3 class="text-lg font-medium text-gray-900">
                {{ selectedReceipt?.status === 'rejected' ? 'Resubmit Export Receipt' : 'Edit Export Receipt' }}
              </h3>
              <p v-if="selectedReceipt?.status === 'rejected'" class="text-sm text-red-600 mt-1">
                This receipt was rejected. Make necessary changes and resubmit for review.
              </p>
            </div>
            <button @click="closeEditModal" class="text-gray-400 hover:text-gray-600">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <div class="space-y-6">
            <!-- Customer Information -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Customer Name *</label>
                <input
                  v-model="editForm.customerName"
                  type="text"
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter customer name"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Customer Phone</label>
                <input
                  v-model="editForm.customerPhone"
                  type="tel"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter phone number"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Customer Address</label>
                <input
                  v-model="editForm.customerAddress"
                  type="text"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter address"
                />
              </div>
            </div>

            <!-- Product Selection -->
            <div>
              <h4 class="text-md font-medium text-gray-900 mb-3">Select Products</h4>
              <div class="space-y-3">
                <div v-for="(detail, index) in editForm.details" :key="index" class="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
                  <div class="flex-1">
                    <select
                      v-model="detail.productId"
                      @change="updateEditProductInfo(index)"
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select a product...</option>
                      <option v-for="product in availableProducts" :key="product._id" :value="product._id">
                        {{ product.name }} ({{ product.sku }}) - Stock: {{ product.quantity }}
                      </option>
                    </select>
                  </div>
                  <div class="w-32">
                    <input
                      v-model.number="detail.quantity"
                      type="number"
                      min="1"
                      :max="getMaxQuantity(detail.productId)"
                      placeholder="Qty"
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div class="w-24 text-sm text-gray-600">
                    ${{ getProductPrice(detail.productId) }}
                  </div>
                  <button
                    @click="removeEditProduct(index)"
                    class="text-red-600 hover:text-red-800"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                  </button>
                </div>
              </div>

              <button
                @click="addEditProduct"
                class="mt-3 inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                </svg>
                Add Product
              </button>
            </div>

            <!-- Notes -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Notes</label>
              <textarea
                v-model="editForm.notes"
                rows="3"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter any additional notes..."
              ></textarea>
            </div>

            <!-- Total Amount -->
            <div class="p-4 bg-gray-50 rounded-lg">
              <div class="flex justify-between items-center">
                <span class="text-lg font-medium text-gray-900">Total Amount:</span>
                <span class="text-xl font-bold text-blue-600">${{ editTotalAmount.toFixed(2) }}</span>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex justify-end space-x-3">
              <button
                @click="closeEditModal"
                type="button"
                class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                @click="updateExportReceipt"
                :disabled="!canUpdateReceipt || isUpdating"
                class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {{ isUpdating
                    ? (selectedReceipt?.status === 'rejected' ? 'Resubmitting...' : 'Updating...')
                    : (selectedReceipt?.status === 'rejected' ? 'Resubmit Receipt' : 'Update Receipt')
                }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- View Receipt Modal -->
    <div v-if="showViewModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div class="relative top-10 mx-auto p-5 border w-11/12 md:w-4/5 lg:w-3/4 shadow-lg rounded-md bg-white">
        <div class="mt-3">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-medium text-gray-900">Export Receipt Details</h3>
            <button @click="closeViewModal" class="text-gray-400 hover:text-gray-600">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
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
                  <span :class="getStatusClass(selectedReceipt.status)" class="inline-flex px-2 py-1 text-xs font-semibold rounded-full">
                    {{ getStatusText(selectedReceipt.status) }}
                  </span>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700">Created At</label>
                  <p class="mt-1 text-sm text-gray-900">{{ formatDate(selectedReceipt.createdAt) }}</p>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700">Total Amount</label>
                  <p class="mt-1 text-lg font-semibold text-blue-600">${{ selectedReceipt.totalAmount.toFixed(2) }}</p>
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
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
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
                        ${{ (detail.quantity * parseFloat(getProductPrice(detail.productId))).toFixed(2) }}
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

            <!-- Manager Review (if exists) -->
            <div v-if="selectedReceipt.managerReview" class="border-t pt-4">
              <label class="block text-sm font-medium text-gray-700 mb-2">Manager Review</label>
              <div :class="selectedReceipt.status === 'rejected' ? 'bg-red-50 border border-red-200' : 'bg-blue-50 border border-blue-200'" class="p-4 rounded-lg">
                <div class="text-sm">
                  <div class="font-medium" :class="selectedReceipt.status === 'rejected' ? 'text-red-800' : 'text-blue-800'">
                    Status: {{ selectedReceipt.status === 'rejected' ? 'Rejected' : 'Approved' }}
                  </div>
                  <div class="mt-1 text-gray-700">
                    <strong>Reviewed At:</strong> {{ formatDate(selectedReceipt.managerReview.reviewedAt) }}
                  </div>
                  <div v-if="selectedReceipt.managerReview.comment" class="mt-2">
                    <strong>Comment:</strong> {{ selectedReceipt.managerReview.comment }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Success/Error Messages -->
    <div v-if="message" :class="messageClass" class="p-4 rounded-lg">
      {{ message }}
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'ExportProduct',
  emits: ['exported'],
  data() {
    return {
      isLoading: false,
      message: '',
      messageType: '',
      products: [],
      exportReceipts: [],
      form: {
        customerName: '',
        customerPhone: '',
        customerAddress: '',
        details: [
          { productId: '', quantity: 1 }
        ],
        notes: ''
      },
      // Modal states
      showViewModal: false,
      showEditModal: false,
      selectedReceipt: null,
      editForm: {
        customerName: '',
        customerPhone: '',
        customerAddress: '',
        details: [],
        notes: ''
      },
      isUpdating: false
    };
  },
  computed: {
    availableProducts() {
      return this.products.filter(product => product.quantity > 0);
    },
    totalAmount() {
      return this.form.details.reduce((total, detail) => {
        const product = this.products.find(p => p._id === detail.productId);
        if (product && detail.quantity) {
          return total + (product.basePrice * detail.quantity);
        }
        return total;
      }, 0);
    },
    canSubmit() {
      return this.form.customerName.trim() &&
             this.form.details.some(detail => detail.productId && detail.quantity > 0);
    },
    messageClass() {
      return this.messageType === 'success'
        ? 'bg-green-50 text-green-800 border border-green-200'
        : 'bg-red-50 text-red-800 border border-red-200';
    },
    editTotalAmount() {
      return this.editForm.details.reduce((total, detail) => {
        const product = this.products.find(p => p._id === detail.productId);
        if (product && detail.quantity) {
          return total + (product.basePrice * detail.quantity);
        }
        return total;
      }, 0);
    },
    canUpdateReceipt() {
      return this.editForm.customerName.trim() &&
             this.editForm.details.some(detail => detail.productId && detail.quantity > 0) &&
             this.selectedReceipt &&
             (this.selectedReceipt.status === 'created' || this.selectedReceipt.status === 'rejected');
    }
  },
  mounted() {
    this.fetchProducts();
    this.fetchExportReceipts();
  },
  methods: {
    async fetchProducts() {
      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        const response = await axios.get('/api/products', {
          params: { all: 'true' },
          headers: { Authorization: `Bearer ${token}` }
        });
        this.products = response.data.products || [];
      } catch (error) {
        console.error('Error fetching products:', error);
        this.showMessage('Failed to load products', 'error');
      }
    },

    async fetchExportReceipts() {
      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        const response = await axios.get('/api/export-receipts', {
          headers: { Authorization: `Bearer ${token}` }
        });
        this.exportReceipts = response.data.exportReceipts || [];
      } catch (error) {
        console.error('Error fetching export receipts:', error);
      }
    },

    addProduct() {
      this.form.details.push({ productId: '', quantity: 1 });
    },

    removeProduct(index) {
      if (this.form.details.length > 1) {
        this.form.details.splice(index, 1);
      }
    },

    updateProductInfo(index) {
      // Reset quantity when product changes
      this.form.details[index].quantity = 1;
    },

    getMaxQuantity(productId) {
      const product = this.products.find(p => p._id === productId);
      return product ? product.quantity : 0;
    },

    getProductPrice(productId) {
      const product = this.products.find(p => p._id === productId);
      return product ? product.basePrice.toFixed(2) : '0.00';
    },

    async createExportReceipt() {
      if (!this.canSubmit) return;

      this.isLoading = true;
      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');

        // Filter out empty details
        const validDetails = this.form.details.filter(detail =>
          detail.productId && detail.quantity > 0
        );

        const response = await axios.post('/api/export-receipts', {
          ...this.form,
          details: validDetails
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data.success) {
          this.showMessage('Export receipt created successfully!', 'success');
          this.resetForm();
          this.fetchExportReceipts();
          this.fetchProducts(); // Refresh to get updated stock
          this.$emit('exported');
        }
      } catch (error) {
        console.error('Error creating export receipt:', error);
        this.showMessage(error.response?.data?.message || 'Failed to create export receipt', 'error');
      } finally {
        this.isLoading = false;
      }
    },

    resetForm() {
      this.form = {
        customerName: '',
        customerPhone: '',
        customerAddress: '',
        details: [
          { productId: '', quantity: 1 }
        ],
        notes: ''
      };
    },

    getStatusClass(status) {
      const classes = {
        'created': 'bg-yellow-100 text-yellow-800',
        'reviewed': 'bg-blue-100 text-blue-800',
        'approved': 'bg-green-100 text-green-800',
        'rejected': 'bg-red-100 text-red-800'
      };
      return classes[status] || 'bg-gray-100 text-gray-800';
    },

    getStatusText(status) {
      const texts = {
        'created': 'Pending',
        'reviewed': 'Reviewed',
        'approved': 'Approved',
        'rejected': 'Rejected'
      };
      return texts[status] || status;
    },

    formatDate(dateString) {
      return new Date(dateString).toLocaleDateString();
    },

    viewReceipt(receipt) {
      this.selectedReceipt = receipt;
      this.showViewModal = true;
    },

    closeViewModal() {
      this.showViewModal = false;
      this.selectedReceipt = null;
    },

    editReceipt(receipt) {
      this.selectedReceipt = receipt;
      // Populate edit form with receipt data
      this.editForm = {
        customerName: receipt.customerName,
        customerPhone: receipt.customerPhone || '',
        customerAddress: receipt.customerAddress || '',
        details: receipt.details.map(detail => ({
          productId: detail.productId._id || detail.productId,
          quantity: detail.quantity
        })),
        notes: receipt.notes || ''
      };
      this.showEditModal = true;
    },

    closeEditModal() {
      this.showEditModal = false;
      this.selectedReceipt = null;
      this.editForm = {
        customerName: '',
        customerPhone: '',
        customerAddress: '',
        details: [],
        notes: ''
      };
    },

    addEditProduct() {
      this.editForm.details.push({ productId: '', quantity: 1 });
    },

    removeEditProduct(index) {
      if (this.editForm.details.length > 1) {
        this.editForm.details.splice(index, 1);
      }
    },

    updateEditProductInfo(index) {
      // Reset quantity when product changes
      this.editForm.details[index].quantity = 1;
    },

    async updateExportReceipt() {
      if (!this.canUpdateReceipt || !this.selectedReceipt) return;

      this.isUpdating = true;
      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');

        // Filter out empty details
        const validDetails = this.editForm.details.filter(detail =>
          detail.productId && detail.quantity > 0
        );

        const response = await axios.put(`/api/export-receipts/${this.selectedReceipt._id}`, {
          ...this.editForm,
          details: validDetails
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data.success) {
          const isResubmit = this.selectedReceipt.status === 'rejected';
          const message = isResubmit
            ? 'Export receipt updated and resubmitted for review!'
            : 'Export receipt updated successfully!';

          this.showMessage(message, 'success');
          this.closeEditModal();
          this.fetchExportReceipts();
          this.fetchProducts(); // Refresh to get updated stock
          this.$emit('exported');
        }
      } catch (error) {
        console.error('Error updating export receipt:', error);
        this.showMessage(error.response?.data?.message || 'Failed to update export receipt', 'error');
      } finally {
        this.isUpdating = false;
      }
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

    showMessage(text, type) {
      this.message = text;
      this.messageType = type;
      setTimeout(() => {
        this.message = '';
      }, 5000);
    }
  }
};
</script>
