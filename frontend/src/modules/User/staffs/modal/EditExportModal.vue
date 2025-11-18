<template>
  <div
    v-if="visible"
    class="fixed inset-0 bg-gray-600 bg-opacity-50 z-50 flex items-center justify-center p-4"
  >
    <div class="w-full max-w-6xl max-h-[90vh] bg-white rounded-lg shadow-lg overflow-hidden flex flex-col">
      <!-- Modal Header - Fixed -->
      <div class="flex justify-between items-center p-6 border-b border-gray-200 bg-white">
        <h3 class="text-lg font-medium text-gray-900">{{ isResubmit ? 'Resubmit Export Receipt' : 'Edit Export Receipt' }}</h3>
        <button @click="$emit('close')" class="text-gray-400 hover:text-gray-600">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <!-- Modal Content - Scrollable -->
      <div class="flex-1 overflow-y-auto p-6">
        <div class="space-y-4">
        <!-- Warehouse Selection -->
        <div v-if="availableWarehouses.length > 0">
          <label class="block text-sm font-medium text-gray-700 mb-2">Warehouse *</label>
          <select
            v-model="local.warehouseId"
            @change="onWarehouseChange"
            :class="[
              'w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500',
              fieldErrors.warehouse ? 'border-red-500' : 'border-gray-300'
            ]"
          >
            <option value="">Select warehouse...</option>
            <option v-for="warehouse in availableWarehouses" :key="warehouse._id" :value="warehouse._id">
              {{ warehouse.name }}
            </option>
          </select>
          <p v-if="fieldErrors.warehouse" class="mt-1 text-sm text-red-600">{{ fieldErrors.warehouse }}</p>
        </div>

        <!-- Date Selection -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Export Date *</label>
            <input
              v-model="local.exportDate"
              type="date"
              :min="minDate"
              :max="maxDate"
              @blur="validateField('exportDate')"
              @input="clearFieldError('exportDate')"
              :class="[
                'w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500',
                fieldErrors.exportDate ? 'border-red-500' : 'border-gray-300'
              ]"
            />
            <p v-if="fieldErrors.exportDate" class="mt-1 text-sm text-red-600">{{ fieldErrors.exportDate }}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Target Amount</label>
            <input
              v-model.number="local.targetAmount"
              type="number"
              min="0"
              step="0.01"
              @blur="validateField('targetAmount')"
              @input="clearFieldError('targetAmount')"
              :class="[
                'w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500',
                fieldErrors.targetAmount ? 'border-red-500' : 'border-gray-300'
              ]"
              placeholder="0.00"
            />
            <p v-if="fieldErrors.targetAmount" class="mt-1 text-sm text-red-600">{{ fieldErrors.targetAmount }}</p>
          </div>
        </div>

        <!-- customer -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700">Customer Name *</label>
            <input
              v-model="local.customerName"
              type="text"
              @blur="validateField('customerName')"
              @input="clearFieldError('customerName')"
              :class="[
                'w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500',
                fieldErrors.customerName ? 'border-red-500' : 'border-gray-300'
              ]"
            />
            <p v-if="fieldErrors.customerName" class="mt-1 text-sm text-red-600">{{ fieldErrors.customerName }}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Customer Phone</label>
            <input
              v-model="local.customerPhone"
              type="tel"
              @blur="validateField('customerPhone')"
              @input="clearFieldError('customerPhone')"
              :class="[
                'w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500',
                fieldErrors.customerPhone ? 'border-red-500' : 'border-gray-300'
              ]"
            />
            <p v-if="fieldErrors.customerPhone" class="mt-1 text-sm text-red-600">{{ fieldErrors.customerPhone }}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Customer Address</label>
            <input
              v-model="local.customerAddress"
              type="text"
              @blur="validateField('customerAddress')"
              @input="clearFieldError('customerAddress')"
              :class="[
                'w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500',
                fieldErrors.customerAddress ? 'border-red-500' : 'border-gray-300'
              ]"
            />
            <p v-if="fieldErrors.customerAddress" class="mt-1 text-sm text-red-600">{{ fieldErrors.customerAddress }}</p>
          </div>
        </div>

        <!-- products -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Products</label>
          <div class="space-y-3">
            <div v-for="(d, idx) in local.details" :key="idx" class="flex items-center space-x-3 p-3 border rounded">
              <div class="flex-1">
                <select v-model="d.productId" @change="onProductChange(idx)" class="w-full px-3 py-2 border rounded">
                  <option value="">Select a product...</option>
                  <option v-for="p in availableProducts" :key="p._id" :value="p._id">
                    {{ p.name }} ({{ p.sku }}) - Stock: {{ p.quantity }}
                  </option>
                </select>
              </div>

              <div class="w-28">
                <label class="block text-xs text-gray-500 mb-1">Quantity</label>
                <input
                  v-model.number="d.quantity"
                  type="number"
                  min="1"
                  :max="getMaxQuantity(d.productId)"
                  @input="validateQuantityInput(d, $event)"
                  @blur="validateQuantityInput(d, $event)"
                  class="w-full px-3 py-2 border rounded"
                  :class="{ 'border-red-500': isQuantityInvalid(d) }"
                />
                <div v-if="isQuantityInvalid(d)" class="text-xs text-red-500 mt-1">
                  Max: {{ getMaxQuantity(d.productId) }}
                </div>
              </div>

              <div class="w-24 text-sm text-gray-700">${{ calculateProductPrice(d.productId) }}</div>

              <button @click="removeLine(idx)" class="text-red-600 hover:text-red-800" type="button">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6"/>
                </svg>
              </button>
            </div>
          </div>

          <button @click="addLine" type="button" class="mt-3 px-3 py-2 border rounded inline-flex items-center">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
            </svg>
            Add Product
          </button>
        </div>

        <!-- notes -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Notes</label>
          <textarea v-model="local.notes" rows="3" class="w-full px-3 py-2 border rounded"></textarea>
        </div>

        <!-- total -->
        <div class="p-3 bg-gray-50 rounded flex justify-between items-center">
          <div class="font-medium">Total Amount</div>
          <div class="text-xl font-bold text-blue-600">${{ totalAmount }}</div>
        </div>

        <!-- actions -->
        <div class="flex justify-end space-x-3">
          <button @click="$emit('close')" type="button" class="px-4 py-2 border rounded">Cancel</button>
          <button @click="onSubmit" :disabled="isSubmitting" type="button" class="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50">
            {{ isSubmitting ? (isResubmit ? 'Resubmitting...' : 'Updating...') : (isResubmit ? 'Resubmit Receipt' : 'Update Receipt') }}
          </button>
        </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'EditExportModal',
  emits: ['close', 'submit', 'error', 'success'],
  props: {
    visible: { type: Boolean, default: false },
    receipt: { type: Object, default: null },
    availableProducts: { type: Array, default: () => [] }, // should include selected products even if out of stock
    availableWarehouses: { type: Array, default: () => [] }, // warehouses for selection
    isSubmitting: { type: Boolean, default: false },
    getProductPrice: { type: Function, default: null }
  },
  data() {
    return {
      local: {
        warehouseId: '',
        exportDate: '',
        targetAmount: 0,
        customerName: '',
        customerPhone: '',
        customerAddress: '',
        details: [],
        notes: ''
      },
      fieldErrors: {},
      validationErrors: [],
      scrollY: 0, // Store scroll position for body scroll prevention
    };
  },
  computed: {
    totalAmount() {
      return this.local.details.reduce((sum, d) => {
        const p = this.availableProducts.find(x => x._id === d.productId);
        const price = p ? (p.basePrice ?? p.price ?? 0) : 0;
        return sum + (Number(d.quantity || 0) * Number(price || 0));
      }, 0).toFixed(2);
    },
    isResubmit() {
      return this.receipt && this.receipt.status === 'rejected';
    },
    minDate() {
      return '2000-01-01';
    },
    maxDate() {
      const today = new Date();
      return today.toISOString().split('T')[0];
    }
  },
  watch: {
    receipt: {
      immediate: true,
      handler(r) {
        if (!r) {
          this.resetForm();
          return;
        }
        this.local.warehouseId = r.warehouseId || '';
        this.local.exportDate = r.exportDate || new Date().toISOString().split('T')[0];
        this.local.targetAmount = r.targetAmount || 0;
        this.local.customerName = r.customerName || '';
        this.local.customerPhone = r.customerPhone || '';
        this.local.customerAddress = r.customerAddress || '';
        this.local.notes = r.notes || '';
        // normalize details: if productId is object, extract id
        this.local.details = (r.details || []).map(d => ({
          productId: (typeof d.productId === 'object' ? (d.productId._id || d.productId.id) : d.productId),
          quantity: d.quantity
        }));
        if (!this.local.details.length) this.local.details = [{ productId: '', quantity: 1 }];
      }
    },
    visible(val) {
      if (val) {
        // Prevent body scroll when modal opens
        this.preventBodyScroll();
      } else {
        // Allow body scroll when modal closes
        this.allowBodyScroll();
        this.resetForm();
      }
    }
  },
  methods: {
    addLine() {
      this.local.details.push({ productId: '', quantity: 1 });
    },
    removeLine(idx) {
      if (this.local.details.length > 1) this.local.details.splice(idx, 1);
    },
    onProductChange(idx) {
      this.local.details[idx].quantity = 1;
    },
    getMaxQuantity(productId) {
      const p = this.availableProducts.find(x => x._id === productId);
      return p ? p.quantity : 0;
    },

    // Get max quantity for edit (considering current reserved quantity)
    // Backend should expose endpoint to get reliable available quantity for editing
    async getMaxQuantityForEdit(productId, currentQuantity) {
      const p = this.availableProducts.find(x => x._id === productId);
      if (!p) return 0;

      try {
        // Call backend endpoint to get reliable available quantity
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        const response = await fetch(`/api/products/${productId}/available-quantity`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          return data.availableQuantity || 0;
        }
      } catch (error) {
        console.warn('Failed to fetch available quantity from backend:', error);
      }

      // Fallback to frontend calculation
      const originalDetail = this.receipt?.details?.find(d => {
        const pid = typeof d.productId === 'object' ? d.productId._id : d.productId;
        return pid === productId;
      });

      const originalQuantity = originalDetail ? originalDetail.quantity : 0;
      return p.quantity + originalQuantity;
    },
    calculateProductPrice(productId) {
      if (this.getProductPrice) return this.getProductPrice(productId);
      const p = this.availableProducts.find(x => x._id === productId);
      return p ? (Number(p.finalPrice ?? p.basePrice ?? p.price ?? 0).toFixed(2)) : '0.00';
    },

    // Field validation methods
    validateField(fieldName) {
      this.clearFieldError(fieldName);

      switch (fieldName) {
        case 'warehouse':
          if (!this.local.warehouseId) {
            this.fieldErrors.warehouse = 'Warehouse is required';
          }
          break;
        case 'exportDate':
          if (!this.local.exportDate) {
            this.fieldErrors.exportDate = 'Export date is required';
          } else {
            const date = new Date(this.local.exportDate);
            const year = date.getFullYear();
            if (year < 2000) {
              this.fieldErrors.exportDate = 'Year must be 2000 or later';
            }
          }
          break;
        case 'targetAmount':
          if (this.local.targetAmount === null || this.local.targetAmount === undefined || isNaN(this.local.targetAmount)) {
            this.fieldErrors.targetAmount = 'Amount must be a valid number';
          } else if (this.local.targetAmount < 0) {
            this.fieldErrors.targetAmount = 'Amount must be 0 or greater';
          }
          break;
        case 'customerName':
          if (!this.local.customerName.trim()) {
            this.fieldErrors.customerName = 'Customer name is required';
          }
          break;
        case 'customerPhone':
          if (this.local.customerPhone && this.local.customerPhone.trim()) {
            const phoneRegex = /^[+]?[0-9\s\-()]{8,}$/;
            if (!phoneRegex.test(this.local.customerPhone.trim())) {
              this.fieldErrors.customerPhone = 'Please enter a valid phone number';
            }
          }
          break;
        case 'customerAddress':
          // Address is optional, no validation needed
          break;
      }
    },

    clearFieldError(fieldName) {
      if (this.fieldErrors[fieldName]) {
        this.$delete(this.fieldErrors, fieldName);
      }
    },

    onWarehouseChange() {
      this.validateField('warehouse');
    },

    resetForm() {
      this.local = {
        warehouseId: '',
        exportDate: new Date().toISOString().split('T')[0],
        targetAmount: 0,
        customerName: '',
        customerPhone: '',
        customerAddress: '',
        details: [{ productId: '', quantity: 1 }],
        notes: ''
      };
      this.fieldErrors = {};
      this.validationErrors = [];
    },
    validate() {
      // Clear previous errors
      this.validationErrors = [];
      this.fieldErrors = {};

      // Validate all fields
      this.validateField('warehouse');
      this.validateField('exportDate');
      this.validateField('targetAmount');
      this.validateField('customerName');
      this.validateField('customerPhone');

      // Check if any field has errors
      const hasFieldErrors = Object.keys(this.fieldErrors).length > 0;

      if (hasFieldErrors) {
        this.validationErrors.push('Please fix the highlighted fields above');
        this.$emit('error', 'Please fix the highlighted fields above');
        return false;
      }

      // Validate at least one product with quantity > 0
      const validDetails = this.local.details.filter(d => d.productId && d.quantity > 0);
      if (!validDetails.length) {
        this.validationErrors.push('Add at least one product with quantity > 0');
        this.$emit('error', 'Add at least one product with quantity > 0');
        return false;
      }

      // Validate quantity constraints: 1 ≤ quantity ≤ available stock
      const invalid = validDetails.some(d => {
        const maxQty = this.getMaxQuantity(d.productId);
        return Number(d.quantity) < 1 || Number(d.quantity) > maxQty;
      });
      if (invalid) {
        this.validationErrors.push('Quantities must be between 1 and available stock');
        this.$emit('error', 'Quantities must be between 1 and available stock');
        return false;
      }

      return true;
    },

    // Validate quantity input in real-time
    // Enforce constraints: 1 ≤ quantity ≤ available stock
    validateQuantityInput(detail, event) {
      const maxQty = this.getMaxQuantity(detail.productId);
      const inputValue = parseInt(event.target.value) || 0;

      if (inputValue > maxQty) {
        // Reset to max available quantity
        detail.quantity = maxQty;
        event.target.value = maxQty;
        event.target.setCustomValidity(`Maximum ${maxQty} available`);
        this.$emit('error', `Maximum available quantity for this product is ${maxQty}`);
      } else if (inputValue < 1) {
        // Reset to minimum quantity
        detail.quantity = 1;
        event.target.value = 1;
        event.target.setCustomValidity('Minimum quantity is 1');
      } else {
        // Clear any validation errors
        event.target.setCustomValidity('');
      }
    },

    // Check if quantity is invalid
    isQuantityInvalid(detail) {
      if (!detail.productId) return false;
      const maxQty = this.getMaxQuantity(detail.productId);
      return detail.quantity > maxQty || detail.quantity < 1;
    },
    async onSubmit() {
      if (!this.validate()) return;

      const payload = {
        warehouseId: this.local.warehouseId,
        exportDate: this.local.exportDate,
        targetAmount: Number(this.local.targetAmount),
        customerName: this.local.customerName,
        customerPhone: this.local.customerPhone,
        customerAddress: this.local.customerAddress,
        notes: this.local.notes,
        details: this.local.details.map(d => ({ productId: d.productId, quantity: Number(d.quantity) }))
      };

      try {
        this.$emit('submit', payload);
        // Reset form after success (Frontend only)
        this.resetForm();
        this.$emit('success', 'Export receipt updated successfully');
      } catch (error) {
        this.$emit('error', 'Failed to update export receipt');
      }
    },

    // Methods to handle body scroll
    preventBodyScroll() {
      // Store current scroll position
      this.scrollY = window.scrollY;
      // Apply styles to prevent scrolling
      document.body.style.position = 'fixed';
      document.body.style.top = `-${this.scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
    },

    allowBodyScroll() {
      // Remove fixed positioning
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
      // Restore scroll position
      if (this.scrollY !== undefined) {
        window.scrollTo(0, this.scrollY);
      }
    },
  },
  mounted() {
    // Prevent body scroll if modal is already visible
    if (this.visible) {
      this.preventBodyScroll();
    }
  },
  beforeUnmount() {
    // Ensure body scroll is restored when component is destroyed
    this.allowBodyScroll();
  },
};
</script>
