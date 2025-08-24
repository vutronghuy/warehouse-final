<template>
  <div v-if="show" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
      <!-- Header -->
      <div class="flex items-center justify-between p-6 border-b border-gray-200">
        <h3 class="text-lg font-medium text-gray-900">Edit Product</h3>
        <button
          @click="closeModal"
          class="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Form -->
      <form @submit.prevent="handleSubmit" class="p-6 space-y-6">
        <!-- Basic Information -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Product Name <span class="text-red-500">*</span>
            </label>
            <input
              v-model="form.name"
              type="text"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter product name"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              SKU <span class="text-red-500">*</span>
            </label>
            <input
              v-model="form.sku"
              type="text"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter SKU (e.g., PROD001)"
              style="text-transform: uppercase"
            />
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Description</label>
          <textarea
            v-model="form.description"
            rows="3"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter product description..."
          ></textarea>
        </div>

        <!-- Product Details -->
        <div class="border-t pt-6">
          <h4 class="text-md font-medium text-gray-900 mb-4">Product Details</h4>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Unit <span class="text-red-500">*</span>
              </label>
              <select
                v-model="form.unit"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select unit</option>
                <option value="pcs">Pieces (pcs)</option>
                <option value="kg">Kilogram (kg)</option>
                <option value="liter">Liter</option>
                <option value="box">Box</option>
                <option value="pack">Pack</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Base Price</label>
              <input
                v-model.number="form.basePrice"
                type="number"
                min="0"
                step="0.01"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0.00"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Min Stock Level</label>
              <input
                v-model.number="form.minStockLevel"
                type="number"
                min="0"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Expiry Date</label>
              <input
                v-model="form.expiryDate"
                type="date"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        <!-- Category and Supplier -->
        <div class="border-t pt-6">
          <h4 class="text-md font-medium text-gray-900 mb-4">Category & Supplier</h4>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Category <span class="text-red-500">*</span>
              </label>
              <select
                v-model="form.categoryId"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select category</option>
                <option v-for="category in categories" :key="category._id" :value="category._id">
                  {{ category.name }}
                </option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Primary Supplier <span class="text-red-500">*</span>
              </label>
              <select
                v-model="form.primarySupplierId"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select supplier</option>
                <option v-for="supplier in suppliers" :key="supplier._id" :value="supplier._id">
                  {{ supplier.name }}
                </option>
              </select>
            </div>
          </div>
        </div>

        <!-- Status -->
        <div class="border-t pt-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              v-model="form.status"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="in stock">in stock</option>
              <option value="out of stock">out of stock</option>
            </select>
          </div>
        </div>

        <!-- Error Message -->
        <div v-if="errorMessage" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {{ errorMessage }}
        </div>

        <!-- Actions -->
        <div class="flex justify-end space-x-3 pt-6 border-t">
          <button
            type="button"
            @click="closeModal"
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            :disabled="isLoading"
            class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span v-if="isLoading">Updating...</span>
            <span v-else>Update Product</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'EditProductModal',
  props: {
    show: {
      type: Boolean,
      default: false
    },
    product: {
      type: Object,
      default: () => ({})
    }
  },
  emits: ['close', 'updated'],
  data() {
    return {
      isLoading: false,
      errorMessage: '',
      categories: [],
      suppliers: [],
      form: {
        name: '',
        sku: '',
        description: '',
        unit: '',
        basePrice: 0,
        minStockLevel: 0,
        expiryDate: '',
        categoryId: '',
        primarySupplierId: '',
        status: 'in stock'
      }
    };
  },
  watch: {
    show(newVal) {
      if (newVal) {
        this.loadDropdownData();
      }
    },
    product: {
      handler(newProduct) {
        if (newProduct && Object.keys(newProduct).length > 0) {
          this.populateForm(newProduct);
        }
      },
      immediate: true,
      deep: true
    }
  },
  methods: {
    populateForm(product) {
      // Handle populated categoryId (object) vs non-populated (string)
      let categoryId = '';
      if (typeof product.categoryId === 'object' && product.categoryId !== null) {
        categoryId = product.categoryId._id || '';
      } else {
        categoryId = product.categoryId || '';
      }

      // Handle populated primarySupplierId (object) vs non-populated (string)
      let primarySupplierId = '';
      if (typeof product.primarySupplierId === 'object' && product.primarySupplierId !== null) {
        primarySupplierId = product.primarySupplierId._id || '';
      } else {
        primarySupplierId = product.primarySupplierId || '';
      }

      this.form = {
        name: product.name || '',
        sku: product.sku || '',
        description: product.description || '',
        unit: product.unit || '',
        basePrice: product.basePrice || 0,
        minStockLevel: product.minStockLevel || 0,
        expiryDate: product.expiryDate ? product.expiryDate.split('T')[0] : '',
        categoryId: categoryId,
        primarySupplierId: primarySupplierId,
        status: product.status || 'in stock'
      };
    },
    closeModal() {
      this.errorMessage = '';
      this.$emit('close');
    },
    async loadDropdownData() {
      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (token) {
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }

        // Load categories and suppliers
        const [categoriesRes, suppliersRes] = await Promise.all([
          axios.get('/api/categories/active'),
          axios.get('/api/suppliers?status=cooperation')
        ]);

        this.categories = categoriesRes.data.categories || [];
        this.suppliers = suppliersRes.data.suppliers || [];
      } catch (error) {
        console.error('Error loading dropdown data:', error);
      }
    },
    async handleSubmit() {
      this.isLoading = true;
      this.errorMessage = '';

      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (token) {
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }

        const response = await axios.put(`/api/products/${this.product._id}`, this.form);

        if (response.data.success) {
          this.$emit('updated', response.data.product);
          this.closeModal();
        }
      } catch (error) {
        console.error('Error updating product:', error);
        this.errorMessage = error.response?.data?.message || 'Failed to update product. Please try again.';
      } finally {
        this.isLoading = false;
      }
    }
  }
};
</script>

<style scoped>
/* Auto uppercase for SKU input */
input[style*="text-transform: uppercase"] {
  text-transform: uppercase;
}
</style>
