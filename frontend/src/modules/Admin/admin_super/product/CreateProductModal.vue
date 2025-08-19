<template>
  <div v-if="show" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
    <div class="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
      <div class="mt-3">
        <!-- Header -->
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-lg font-medium text-gray-900">Create New Product</h3>
          <button
            @click="closeModal"
            class="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Error Message -->
        <div v-if="errorMessage" class="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p class="text-sm text-red-600">{{ errorMessage }}</p>
        </div>

        <!-- Form -->
        <form @submit.prevent="handleSubmit" class="space-y-6">
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

          <!-- Form Actions -->
          <div class="flex justify-end space-x-4 pt-6 border-t">
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
              {{ isLoading ? 'Creating...' : 'Create Product' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'CreateProductModal',
  props: {
    show: {
      type: Boolean,
      default: false
    }
  },
  emits: ['close', 'created'],
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
        primarySupplierId: ''
      }
    };
  },
  watch: {
    show(newVal) {
      if (newVal) {
        this.loadDropdownData();
      }
    },
    'form.name'(newName) {
      // Auto-generate SKU from name
      if (newName && !this.form.sku) {
        this.form.sku = newName
          .toUpperCase()
          .replace(/[^A-Z0-9]/g, '')
          .substring(0, 10);
      }
    }
  },
  methods: {
    closeModal() {
      this.resetForm();
      this.$emit('close');
    },
    resetForm() {
      this.form = {
        name: '',
        sku: '',
        description: '',
        unit: '',
        basePrice: 0,
        minStockLevel: 0,
        expiryDate: '',
        categoryId: '',
        primarySupplierId: ''
      };
      this.errorMessage = '';
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

        const response = await axios.post('/api/products', this.form);

        if (response.data.success) {
          this.$emit('created', response.data.product);
          this.closeModal();
        }
      } catch (error) {
        console.error('Error creating product:', error);
        this.errorMessage = error.response?.data?.message || 'Failed to create product. Please try again.';
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
