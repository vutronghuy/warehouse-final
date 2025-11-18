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

        <!-- Validation Errors -->
        <div v-if="validationErrors.length > 0" class="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <h4 class="text-sm font-medium text-red-800 mb-2">Please fix the following errors:</h4>
          <ul class="text-sm text-red-600 space-y-1">
            <li v-for="error in validationErrors" :key="error" class="flex items-center">
              <span class="w-1 h-1 bg-red-500 rounded-full mr-2"></span>
              {{ error }}
            </li>
          </ul>
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
                @blur="validateField('name')"
                @input="clearFieldError('name')"
                type="text"
                required
                :class="[
                  'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                  fieldErrors.name ? 'border-red-500' : 'border-gray-300'
                ]"
                placeholder="Enter product name"
              />
              <p v-if="fieldErrors.name" class="mt-1 text-sm text-red-600">{{ fieldErrors.name }}</p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                SKU <span class="text-red-500">*</span>
              </label>
              <input
                v-model="form.sku"
                @blur="validateField('sku')"
                @input="clearFieldError('sku')"
                type="text"
                required
                :class="[
                  'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                  fieldErrors.sku ? 'border-red-500' : 'border-gray-300'
                ]"
                placeholder="Enter SKU (e.g., PROD001)"
                style="text-transform: uppercase"
              />
              <p v-if="fieldErrors.sku" class="mt-1 text-sm text-red-600">{{ fieldErrors.sku }}</p>
              <p v-if="form.sku && !fieldErrors.sku" class="mt-1 text-xs text-gray-500">
                SKU will be normalized to uppercase and checked for uniqueness
              </p>
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
                  @blur="validateField('unit')"
                  @change="clearFieldError('unit')"
                  required
                  :class="[
                    'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                    fieldErrors.unit ? 'border-red-500' : 'border-gray-300'
                  ]"
                >
                  <option value="">Select unit</option>
                  <option value="pcs">Pieces (pcs)</option>
                  <option value="kg">Kilogram (kg)</option>
                  <option value="liter">Liter</option>
                  <option value="box">Box</option>
                  <option value="pack">Pack</option>
                </select>
                <p v-if="fieldErrors.unit" class="mt-1 text-sm text-red-600">{{ fieldErrors.unit }}</p>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Base Price</label>
                <input
                  v-model.number="form.basePrice"
                  @blur="validateField('basePrice')"
                  @input="clearFieldError('basePrice')"
                  type="number"
                  min="0"
                  step="0.01"
                  :class="[
                    'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                    fieldErrors.basePrice ? 'border-red-500' : 'border-gray-300'
                  ]"
                  placeholder="0.00"
                />
                <p v-if="fieldErrors.basePrice" class="mt-1 text-sm text-red-600">{{ fieldErrors.basePrice }}</p>
                <p v-if="form.basePrice && !fieldErrors.basePrice" class="mt-1 text-xs text-gray-500">
                  Must be ≥ 0 (validated on server)
                </p>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Min Stock Level</label>
                <input
                  v-model.number="form.minStockLevel"
                  @blur="validateField('minStockLevel')"
                  @input="clearFieldError('minStockLevel')"
                  type="number"
                  min="0"
                  :class="[
                    'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                    fieldErrors.minStockLevel ? 'border-red-500' : 'border-gray-300'
                  ]"
                  placeholder="0"
                />
                <p v-if="fieldErrors.minStockLevel" class="mt-1 text-sm text-red-600">{{ fieldErrors.minStockLevel }}</p>
                <p v-if="form.minStockLevel && !fieldErrors.minStockLevel" class="mt-1 text-xs text-gray-500">
                  Must be ≥ 0 (validated on server)
                </p>
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
                  @blur="validateField('categoryId')"
                  @change="clearFieldError('categoryId')"
                  required
                  :class="[
                    'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                    fieldErrors.categoryId ? 'border-red-500' : 'border-gray-300'
                  ]"
                >
                  <option value="">Select category</option>
                  <option v-for="category in categories" :key="category._id" :value="category._id">
                    {{ category.name }}
                  </option>
                </select>
                <p v-if="fieldErrors.categoryId" class="mt-1 text-sm text-red-600">{{ fieldErrors.categoryId }}</p>
                <p v-if="form.categoryId && !fieldErrors.categoryId" class="mt-1 text-xs text-gray-500">
                  Category existence and permissions verified on server
                </p>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Primary Supplier <span class="text-red-500">*</span>
                </label>
                <select
                  v-model="form.primarySupplierId"
                  @blur="validateField('primarySupplierId')"
                  @change="clearFieldError('primarySupplierId')"
                  required
                  :class="[
                    'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                    fieldErrors.primarySupplierId ? 'border-red-500' : 'border-gray-300'
                  ]"
                >
                  <option value="">Select supplier</option>
                  <option v-for="supplier in suppliers" :key="supplier._id" :value="supplier._id">
                    {{ supplier.name }}
                  </option>
                </select>
                <p v-if="fieldErrors.primarySupplierId" class="mt-1 text-sm text-red-600">{{ fieldErrors.primarySupplierId }}</p>
                <p v-if="form.primarySupplierId && !fieldErrors.primarySupplierId" class="mt-1 text-xs text-gray-500">
                  Supplier existence and permissions verified on server
                </p>
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
      validationErrors: [],
      fieldErrors: {},
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
      // Auto-generate SKU from name (Frontend UX only)
      if (newName && !this.form.sku) {
        this.form.sku = newName
          .toUpperCase()
          .replace(/[^A-Z0-9]/g, '')
          .substring(0, 10);
      }
    },
    'form.sku'(newSku) {
      // Normalize SKU to uppercase (Frontend UX)
      if (newSku) {
        this.form.sku = newSku.toUpperCase();
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
      this.validationErrors = [];
      this.fieldErrors = {};
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

    // Frontend validation methods
    validateField(fieldName) {
      this.clearFieldError(fieldName);

      switch (fieldName) {
        case 'name':
          if (!this.form.name.trim()) {
            this.fieldErrors.name = 'Product name is required';
          }
          break;

        case 'sku':
          if (!this.form.sku.trim()) {
            this.fieldErrors.sku = 'SKU is required';
          } else if (this.form.sku.length < 2) {
            this.fieldErrors.sku = 'SKU must be at least 2 characters';
          }
          break;

        case 'unit':
          if (!this.form.unit) {
            this.fieldErrors.unit = 'Unit is required';
          }
          break;

        case 'basePrice':
          if (this.form.basePrice < 0) {
            this.fieldErrors.basePrice = 'Base price must be ≥ 0';
          } else if (isNaN(this.form.basePrice)) {
            this.fieldErrors.basePrice = 'Base price must be a valid number';
          }
          break;

        case 'minStockLevel':
          if (this.form.minStockLevel < 0) {
            this.fieldErrors.minStockLevel = 'Min stock level must be ≥ 0';
          } else if (isNaN(this.form.minStockLevel)) {
            this.fieldErrors.minStockLevel = 'Min stock level must be a valid number';
          }
          break;

        case 'categoryId':
          if (!this.form.categoryId) {
            this.fieldErrors.categoryId = 'Category is required';
          }
          break;

        case 'primarySupplierId':
          if (!this.form.primarySupplierId) {
            this.fieldErrors.primarySupplierId = 'Primary supplier is required';
          }
          break;
      }
    },

    clearFieldError(fieldName) {
      if (this.fieldErrors[fieldName]) {
        this.$delete(this.fieldErrors, fieldName);
      }
    },

    validateForm() {
      this.validationErrors = [];
      this.fieldErrors = {};

      // Validate all required fields
      const requiredFields = ['name', 'sku', 'unit', 'categoryId', 'primarySupplierId'];
      requiredFields.forEach(field => {
        this.validateField(field);
      });

      // Validate numeric fields
      this.validateField('basePrice');
      this.validateField('minStockLevel');

      // Check if any field has errors
      const hasFieldErrors = Object.keys(this.fieldErrors).length > 0;

      if (hasFieldErrors) {
        this.validationErrors.push('Please fix the highlighted fields above');
        return false;
      }

      return true;
    },
    async handleSubmit() {
      // Frontend validation first (UX)
      if (!this.validateForm()) {
        return;
      }

      this.isLoading = true;
      this.errorMessage = '';
      this.validationErrors = [];

      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (token) {
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }

        // Prepare data for backend (normalize SKU)
        const formData = {
          ...this.form,
          sku: this.form.sku.toUpperCase().trim()
        };

        const response = await axios.post('/api/products', formData);

        if (response.data.success) {
          this.$emit('created', response.data.product);
          this.closeModal();
        }
      } catch (error) {
        console.error('Error creating product:', error);

        // Handle server validation errors
        if (error.response?.data?.errors) {
          this.validationErrors = error.response.data.errors;
        } else if (error.response?.data?.message) {
          this.errorMessage = error.response.data.message;
        } else {
          this.errorMessage = 'Failed to create product. Please try again.';
        }
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
