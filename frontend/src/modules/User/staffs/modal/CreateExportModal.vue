<template>
  <div
    v-if="visible"
    class="fixed inset-0 bg-gray-600 bg-opacity-50 z-50 flex items-center justify-center p-4"
  >
    <div class="w-full max-w-6xl max-h-[90vh] bg-white rounded-lg shadow-lg overflow-hidden flex flex-col">
      <!-- Modal Header - Fixed -->
      <div class="flex justify-between items-center p-6 border-b border-gray-200 bg-white">
        <h3 class="text-lg font-medium text-gray-900">Create Export Receipt</h3>
        <button @click="$emit('close')" class="text-gray-400 hover:text-gray-600">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Modal Content - Scrollable -->
      <div class="flex-1 overflow-y-auto p-6">
        <div class="space-y-4">
          <!-- Customer info -->
          <div class="space-y-4">
            <!-- Customer Selection -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Customer *</label>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <select
                    v-model="selectedCustomerId"
                    @change="onCustomerChange"
                    class="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select existing customer...</option>
                    <option v-for="customer in availableCustomers" :key="customer._id" :value="customer._id">
                      {{ customer.name }} - {{ customer.phone }}
                    </option>
                  </select>
                </div>
                <div>
                  <button
                    type="button"
                    @click="toggleNewCustomer"
                    class="w-full px-3 py-2 border border-dashed border-gray-300 rounded text-gray-600 hover:border-blue-500 hover:text-blue-600"
                  >
                    {{ showNewCustomerForm ? 'Select Existing Customer' : 'Add New Customer' }}
                  </button>
                </div>
              </div>
            </div>

            <!-- New Customer Form (when adding new) -->
            <div v-if="showNewCustomerForm" class="bg-gray-50 p-4 rounded-lg">
              <h4 class="text-sm font-medium text-gray-700 mb-3">New Customer Information</h4>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Customer Name *</label>
                  <input
                    v-model="form.customerName"
                    @blur="validateField('customerName')"
                    @input="clearFieldError('customerName')"
                    type="text"
                    required
                    :class="[
                      'w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500',
                      fieldErrors.customerName ? 'border-red-500' : 'border-gray-300',
                    ]"
                    placeholder="Enter customer name"
                  />
                  <p v-if="fieldErrors.customerName" class="mt-1 text-sm text-red-600">
                    {{ fieldErrors.customerName }}
                  </p>
                  <p v-if="form.customerName && !fieldErrors.customerName" class="mt-1 text-xs text-gray-500">
                    Customer name validated on server
                  </p>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Customer Phone *</label>
                  <input
                    v-model="form.customerPhone"
                    @blur="validateField('customerPhone')"
                    @input="clearFieldError('customerPhone')"
                    type="tel"
                    required
                    :class="[
                      'w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500',
                      fieldErrors.customerPhone ? 'border-red-500' : 'border-gray-300',
                    ]"
                    placeholder="Enter phone"
                  />
                  <p v-if="fieldErrors.customerPhone" class="mt-1 text-sm text-red-600">
                    {{ fieldErrors.customerPhone }}
                  </p>
                  <p v-if="form.customerPhone && !fieldErrors.customerPhone" class="mt-1 text-xs text-gray-500">
                    Phone format validated on server
                  </p>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Customer Address *</label>
                  <input
                    v-model="form.customerAddress"
                    @blur="validateField('customerAddress')"
                    @input="clearFieldError('customerAddress')"
                    type="text"
                    required
                    :class="[
                      'w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500',
                      fieldErrors.customerAddress ? 'border-red-500' : 'border-gray-300',
                    ]"
                    placeholder="Enter address"
                  />
                  <p v-if="fieldErrors.customerAddress" class="mt-1 text-sm text-red-600">
                    {{ fieldErrors.customerAddress }}
                  </p>
                  <p
                    v-if="form.customerAddress && !fieldErrors.customerAddress"
                    class="mt-1 text-xs text-gray-500"
                  >
                    Address validated on server
                  </p>
                </div>
              </div>
            </div>

            <!-- Selected Customer Info (when existing customer selected) -->
            <div v-else-if="selectedCustomer" class="bg-blue-50 p-4 rounded-lg">
              <h4 class="text-sm font-medium text-gray-700 mb-2">Selected Customer</h4>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span class="font-medium text-gray-600">Name:</span>
                  <div class="text-gray-900">{{ selectedCustomer.name }}</div>
                </div>
                <div>
                  <span class="font-medium text-gray-600">Phone:</span>
                  <div class="text-gray-900">{{ selectedCustomer.phone }}</div>
                </div>
                <div>
                  <span class="font-medium text-gray-600">Address:</span>
                  <div class="text-gray-900">{{ selectedCustomer.address }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Product Search and Filter -->
          <div class="bg-gray-50 p-4 rounded-lg">
            <h4 class="text-sm font-medium text-gray-700 mb-3">Add Products</h4>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <!-- Search -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Search Products</label>
                <input
                  v-model="productSearch"
                  type="text"
                  placeholder="Search by name or SKU..."
                  class="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <!-- Category Filter -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  v-model="categoryFilter"
                  class="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Categories</option>
                  <option v-for="category in categoriesForFilter" :key="category._id" :value="category._id">
                    {{ category.name }}
                  </option>
                </select>
              </div>

              <!-- Product Selection -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Select Product</label>
                <select
                  v-model="selectedProductToAdd"
                  @change="addSelectedProduct"
                  class="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Choose a product...</option>
                  <option v-for="p in filteredAvailableProducts" :key="p._id" :value="p._id">
                    {{ p.name }} ({{ p.sku }}) - Stock: {{ p.quantity }}
                  </option>
                </select>
              </div>
            </div>
          </div>

          <!-- Selected Products -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Selected Products</label>
            <div
              v-if="form.details.length === 0"
              class="text-gray-500 text-center py-8 border-2 border-dashed border-gray-300 rounded"
            >
              No products selected. Use the search above to add products.
            </div>
            <div v-else class="space-y-3">
              <div
                v-for="(line, idx) in form.details"
                :key="line.productId"
                class="flex items-center space-x-3 p-3 border rounded bg-white"
              >
                <div class="flex-1">
                  <div class="font-medium">{{ getProductName(line.productId) }}</div>
                  <div class="text-sm text-gray-500">
                    SKU: {{ getProductSku(line.productId) }} | Stock: {{ getProductStock(line.productId) }}
                  </div>
                </div>

                <div class="w-28">
                  <label class="block text-xs text-gray-500 mb-1">Quantity</label>
                  <input
                    v-model.number="line.quantity"
                    type="number"
                    min="1"
                    :max="getMaxQuantity(line.productId)"
                    @input="validateQuantityInput(line, $event)"
                    @blur="validateQuantityInput(line, $event)"
                    :class="[
                      'w-full px-3 py-2 border rounded',
                      isQuantityInvalid(line) ? 'border-red-500' : 'border-gray-300',
                    ]"
                  />
                  <div v-if="isQuantityInvalid(line)" class="text-xs text-red-500 mt-1">
                    Exceeds stock: {{ getMaxQuantity(line.productId) }} available
                  </div>
                  <div v-else-if="line.quantity > 0" class="text-xs text-green-600 mt-1">✓ Stock available</div>
                </div>

                <div class="w-24 text-sm text-gray-700">
                  <div class="text-xs text-gray-500">Price</div>
                  <div>${{ calculateProductPrice(line.productId) }}</div>
                </div>

                <button
                  @click="removeLine(idx)"
                  class="text-red-600 hover:text-red-800"
                  type="button"
                  title="Remove"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <!-- notes -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Notes</label>
            <textarea
              v-model="form.notes"
              rows="3"
              class="w-full px-3 py-2 border rounded"
              placeholder="Optional notes..."
            ></textarea>
          </div>

          <!-- total -->
          <div class="p-3 bg-gray-50 rounded flex justify-between items-center">
            <div class="font-medium">Total Amount</div>
            <div class="text-xl font-bold text-blue-600">${{ totalAmount }}</div>
          </div>

          <!-- actions -->
          <div class="flex justify-end space-x-3">
            <button @click="$emit('close')" type="button" class="px-4 py-2 border rounded">Cancel</button>
            <button
              @click="onSubmit"
              :disabled="isSubmitting"
              type="button"
              class="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
            >
              {{ isSubmitting ? 'Creating...' : 'Create Export Receipt' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'CreateExportModal',
  props: {
    visible: { type: Boolean, default: false },
    availableProducts: { type: Array, default: () => [] }, // parent should include products (including selected ones)
    availableCategories: { type: Array, default: () => [] }, // categories for filtering
    availableCustomers: { type: Array, default: () => [] }, // customers for dropdown
    isSubmitting: { type: Boolean, default: false },
    getProductPrice: { type: Function, default: null }, // optional helper
  },
  emits: ['close', 'submit', 'error', 'customer-created', 'customer-exists', 'customer-saved-locally'],
  data() {
    return {
      form: {
        customerName: '',
        customerPhone: '',
        customerAddress: '',
        details: [], // Bắt đầu với mảng rỗng
        notes: '',
      },
      productSearch: '',
      categoryFilter: '',
      selectedProductToAdd: '',
      selectedCustomerId: '',
      fieldErrors: {}, // For field-specific validation errors
      validationErrors: [], // For general form errors
      selectedCustomer: null,
      showNewCustomerForm: false,
      scrollY: 0, // Store scroll position for body scroll prevention
    };
  },
  computed: {
    // Lọc sản phẩm có thể chọn (loại bỏ out of stock và đã chọn)
    filteredAvailableProducts() {
      let filtered = this.availableProducts.filter((p) => {
        // Loại bỏ sản phẩm out of stock
        if (p.status === 'out of stock') return false;
        // Loại bỏ sản phẩm đã được chọn
        if (this.form.details.some((detail) => detail.productId === p._id)) return false;
        return true;
      });

      // Lọc theo search
      if (this.productSearch.trim()) {
        const searchTerm = this.productSearch.toLowerCase();
        filtered = filtered.filter(
          (p) => p.name.toLowerCase().includes(searchTerm) || p.sku.toLowerCase().includes(searchTerm),
        );
      }

      // Lọc theo category
      if (this.categoryFilter) {
        filtered = filtered.filter(
          (p) =>
            p.categoryId === this.categoryFilter ||
            (p.categoryId && p.categoryId._id === this.categoryFilter),
        );
      }

      return filtered;
    },

    // Sử dụng categories từ prop, fallback về tính toán từ products nếu cần
    categoriesForFilter() {
      if (this.availableCategories && this.availableCategories.length > 0) {
        return this.availableCategories;
      }

      // Fallback: lấy từ availableProducts
      const categories = [];
      const categoryIds = new Set();

      this.availableProducts.forEach((p) => {
        if (p.categoryId) {
          const category = typeof p.categoryId === 'object' ? p.categoryId : null;
          if (category && !categoryIds.has(category._id)) {
            categories.push(category);
            categoryIds.add(category._id);
          }
        }
      });

      return categories;
    },

    totalAmount() {
      // Tính tổng các sản phẩm
      const total = this.form.details.reduce((sum, d) => {
        // Tìm thông tin sản phẩm
        const prod = this.availableProducts.find((p) => p._id === d.productId);

        // Lấy giá (ưu tiên finalPrice, fallback về price hoặc 0)
        const price = prod ? (prod.finalPrice ?? prod.basePrice ?? prod.price ?? 0) : 0;

        // Đảm bảo số lượng là số dương
        const quantity = Math.max(0, Number(d.quantity) || 0);

        // Tính tổng cho sản phẩm này
        const lineTotal = price * quantity;

        return sum + lineTotal;
      }, 0);

      // Format với 2 số thập phân
      return Number(total).toFixed(2);
    },
  },
  methods: {
    // Thêm sản phẩm được chọn vào danh sách
    addSelectedProduct() {
      if (!this.selectedProductToAdd) return;

      // Kiểm tra xem sản phẩm đã có trong danh sách chưa
      const existingIndex = this.form.details.findIndex(
        (detail) => detail.productId === this.selectedProductToAdd,
      );

      if (existingIndex !== -1) {
        // Nếu đã có, tăng số lượng lên 1
        this.form.details[existingIndex].quantity += 1;
      } else {
        // Nếu chưa có, thêm mới với số lượng 1
        this.form.details.push({
          productId: this.selectedProductToAdd,
          quantity: 1,
        });
      }

      // Reset selection
      this.selectedProductToAdd = '';
    },

    removeLine(idx) {
      this.form.details.splice(idx, 1);
    },

    // Helper methods để hiển thị thông tin sản phẩm
    getProductName(productId) {
      const product = this.availableProducts.find((p) => p._id === productId);
      return product ? product.name : 'Unknown Product';
    },

    getProductSku(productId) {
      const product = this.availableProducts.find((p) => p._id === productId);
      return product ? product.sku : 'N/A';
    },

    getProductStock(productId) {
      const product = this.availableProducts.find((p) => p._id === productId);
      return product ? product.quantity : 0;
    },

    // Customer handling methods
    onCustomerChange() {
      if (this.selectedCustomerId) {
        this.selectedCustomer = this.availableCustomers.find((c) => c._id === this.selectedCustomerId);
        if (this.selectedCustomer) {
          // Auto-fill customer info
          this.form.customerName = this.selectedCustomer.name;
          this.form.customerPhone = this.selectedCustomer.phone;
          this.form.customerAddress = this.selectedCustomer.address;
          this.showNewCustomerForm = false;
        }
      } else {
        this.selectedCustomer = null;
        this.clearCustomerForm();
      }
    },

    toggleNewCustomer() {
      this.showNewCustomerForm = !this.showNewCustomerForm;
      if (this.showNewCustomerForm) {
        // Clear selection when switching to new customer
        this.selectedCustomerId = '';
        this.selectedCustomer = null;
        this.clearCustomerForm();
      }
    },

    clearCustomerForm() {
      this.form.customerName = '';
      this.form.customerPhone = '';
      this.form.customerAddress = '';
    },
    getMaxQuantity(productId) {
      const p = this.availableProducts.find((x) => x._id === productId);
      return p ? p.quantity : 0;
    },
    calculateProductPrice(productId) {
      if (this.getProductPrice) return this.getProductPrice(productId);
      const p = this.availableProducts.find((x) => x._id === productId);
      return p ? Number(p.finalPrice ?? 0).toFixed(2) : '0.00';
    },
    // Frontend validation methods
    validateField(fieldName) {
      this.clearFieldError(fieldName);

      switch (fieldName) {
        case 'customerName':
          if (!this.form.customerName.trim()) {
            this.fieldErrors.customerName = 'Customer name is required';
          }
          break;
        case 'customerPhone':
          if (!this.form.customerPhone.trim()) {
            this.fieldErrors.customerPhone = 'Customer phone is required';
          } else {
            // Basic phone format validation
            const phoneRegex = /^[+]?[0-9\s\-()]{8,}$/;
            if (!phoneRegex.test(this.form.customerPhone.trim())) {
              this.fieldErrors.customerPhone = 'Please enter a valid phone number';
            }
          }
          break;
        case 'customerAddress':
          if (!this.form.customerAddress.trim()) {
            this.fieldErrors.customerAddress = 'Customer address is required';
          }
          break;
      }
    },

    clearFieldError(fieldName) {
      if (this.fieldErrors[fieldName]) {
        this.$delete(this.fieldErrors, fieldName);
      }
    },


    validate() {
      // Clear previous errors
      this.validationErrors = [];
      this.fieldErrors = {};

      // Validate customer fields
      this.validateField('customerName');
      this.validateField('customerPhone');
      this.validateField('customerAddress');

      // Check if any field has errors
      const hasFieldErrors = Object.keys(this.fieldErrors).length > 0;

      if (hasFieldErrors) {
        this.validationErrors.push('Please fix the highlighted fields above');
        this.$emit('error', 'Please fix the highlighted fields above');
        return false;
      }

      // Validate at least one product with quantity > 0
      const validDetails = this.form.details.filter((d) => d.productId && d.quantity > 0);
      if (!validDetails.length) {
        this.validationErrors.push('Add at least one product with quantity > 0');
        this.$emit('error', 'Add at least one product with quantity > 0');
        return false;
      }

      // Validate stock availability (frontend check for UX)
      const invalid = validDetails.some((d) => {
        const p = this.availableProducts.find((x) => x._id === d.productId);
        return !p || Number(d.quantity) > Number(p.quantity);
      });
      if (invalid) {
        this.validationErrors.push('One or more quantities exceed available stock');
        this.$emit('error', 'One or more quantities exceed available stock');
        return false;
      }

      return true;
    },
    async onSubmit() {
      if (!this.validate()) return;

      // If adding new customer, try to save to database (optional)
      if (
        this.showNewCustomerForm &&
        this.form.customerName &&
        this.form.customerPhone &&
        this.form.customerAddress
      ) {
        try {
          await this.saveNewCustomer();
        } catch (error) {
          console.warn('⚠️ Could not save customer to database:', error.message);
          // Don't block the export receipt creation if customer save fails
          // Customer info will still be saved in the export receipt
          this.$emit(
            'error',
            `Note: Customer info will be saved in export receipt only. Database save failed: ${error.message}`,
          );
        }
      }

      // emit payload for parent to call API
      const payload = {
        customerName: this.form.customerName,
        customerPhone: this.form.customerPhone,
        customerAddress: this.form.customerAddress,
        notes: this.form.notes,
        details: this.form.details.map((d) => ({ productId: d.productId, quantity: Number(d.quantity) })),
      };
      this.$emit('submit', payload);
    },

    // Validate quantity input in real-time
    validateQuantityInput(line, event) {
      const maxQty = this.getMaxQuantity(line.productId);
      const inputValue = parseInt(event.target.value) || 0;

      if (inputValue > maxQty) {
        // Reset to max available quantity
        line.quantity = maxQty;
        event.target.value = maxQty;
        event.target.setCustomValidity(`Maximum ${maxQty} available`);
        // Show error message
        this.$emit('error', `Maximum available quantity for this product is ${maxQty}`);
      } else if (inputValue < 1) {
        // Reset to minimum quantity
        line.quantity = 1;
        event.target.value = 1;
        event.target.setCustomValidity('Minimum quantity is 1');
      } else {
        // Clear any validation errors
        event.target.setCustomValidity('');
      }
    },

    // Check if quantity is invalid
    isQuantityInvalid(line) {
      if (!line.productId) return false;
      const maxQty = this.getMaxQuantity(line.productId);
      return line.quantity > maxQty || line.quantity < 1;
    },

    // Save new customer to database
    async saveNewCustomer() {
      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');

        if (!token) {
          throw new Error('No authentication token found');
        }

        const customerData = {
          name: this.form.customerName.trim(),
          phone: this.form.customerPhone.trim(),
          address: this.form.customerAddress.trim(),
        };

        console.log('🔄 Saving customer:', customerData);

        const response = await fetch('/api/customers/staff', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(customerData),
        });

        console.log('📡 Response status:', response.status);
        console.log('📡 Response headers:', response.headers);

        // Check if response is ok
        if (!response.ok) {
          let errorText;
          try {
            errorText = await response.text();
          } catch (e) {
            errorText = 'Could not read error response';
          }
          console.error('❌ Response error:', errorText);

          // Provide more specific error messages
          if (response.status === 404) {
            throw new Error(
              'Customer creation endpoint not available. Customer info will be saved in export receipt only.',
            );
          } else if (response.status === 401) {
            throw new Error('Authentication required for customer creation.');
          } else if (response.status === 403) {
            throw new Error('Permission denied for customer creation.');
          } else {
            throw new Error(`HTTP ${response.status}: ${errorText || 'Unknown error'}`);
          }
        }

        // Try to parse JSON
        let result;
        try {
          result = await response.json();
        } catch (jsonError) {
          console.error('❌ JSON parse error:', jsonError);
          const responseText = await response.text();
          throw new Error(`Invalid JSON response: ${responseText}`);
        }

        console.log('📡 Response data:', result);

        if (result.success) {
          // Emit event to parent to refresh customer list
          this.$emit('customer-created', result.customer);
          console.log('✅ Customer saved successfully:', result.customer.name);

          // Also save to local storage for future use
          this.saveCustomerToLocalStorage(result.customer);
        } else {
          // If customer already exists, we can still proceed
          if (result.existingCustomer) {
            console.log('ℹ️ Customer already exists:', result.existingCustomer.name);
            this.$emit('customer-exists', result.existingCustomer);

            // Save existing customer to local storage
            this.saveCustomerToLocalStorage(result.existingCustomer);
          } else {
            throw new Error(result.message || 'Failed to save customer');
          }
        }
      } catch (error) {
        console.error('❌ Error saving customer:', error);

        // If API fails, save to localStorage as fallback
        const fallbackCustomer = {
          _id: `local_${Date.now()}`,
          name: customerData.name,
          phone: customerData.phone,
          address: customerData.address,
          status: 'active',
          isLocal: true,
        };

        this.saveCustomerToLocalStorage(fallbackCustomer);
        console.log('💾 Customer saved to localStorage as fallback');

        throw error;
      }
    },

    // Save customer to localStorage for future use
    saveCustomerToLocalStorage(customer) {
      try {
        const existingCustomers = JSON.parse(localStorage.getItem('localCustomers') || '[]');

        // Check if customer already exists (by phone)
        const existingIndex = existingCustomers.findIndex((c) => c.phone === customer.phone);

        if (existingIndex >= 0) {
          // Update existing customer
          existingCustomers[existingIndex] = customer;
        } else {
          // Add new customer
          existingCustomers.push(customer);
        }

        // Keep only last 50 customers to avoid localStorage bloat
        if (existingCustomers.length > 50) {
          existingCustomers.splice(0, existingCustomers.length - 50);
        }

        localStorage.setItem('localCustomers', JSON.stringify(existingCustomers));
        console.log('💾 Customer saved to localStorage:', customer.name);

        // Emit event to parent to update customer list
        this.$emit('customer-saved-locally', customer);
      } catch (error) {
        console.error('❌ Error saving customer to localStorage:', error);
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
  watch: {
    visible(val) {
      if (val) {
        // Prevent body scroll when modal opens
        this.preventBodyScroll();
      } else {
        // Allow body scroll when modal closes
        this.allowBodyScroll();
        // reset form when closed
        this.form = {
          customerName: '',
          customerPhone: '',
          customerAddress: '',
          details: [], // Reset về mảng rỗng
          notes: '',
        };
        this.productSearch = '';
        this.categoryFilter = '';
        this.selectedProductToAdd = '';
        this.selectedCustomerId = '';
        this.selectedCustomer = null;
        this.showNewCustomerForm = false;
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
