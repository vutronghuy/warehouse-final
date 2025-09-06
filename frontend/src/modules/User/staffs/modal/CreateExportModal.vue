<template>
  <div v-if="visible" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
    <div class="relative top-10 mx-auto p-6 border w-11/12 md:w-3/4 lg:w-2/3 shadow-lg rounded-md bg-white">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-medium text-gray-900">Create Export Receipt</h3>
        <button @click="$emit('close')" class="text-gray-400 hover:text-gray-600">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

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
                  type="text"
                  required
                  class="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter customer name"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Customer Phone *</label>
                <input
                  v-model="form.customerPhone"
                  type="tel"
                  required
                  class="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter phone"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Customer Address *</label>
                <input
                  v-model="form.customerAddress"
                  type="text"
                  required
                  class="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter address"
                />
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
                  class="w-full px-3 py-2 border rounded"
                />
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
    getProductPrice: { type: Function, required: false }, // optional helper
  },
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
      selectedCustomer: null,
      showNewCustomerForm: false,
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
      return p ? Number(p.finalPrice ?? p.basePrice ?? p.price ?? 0).toFixed(2) : '0.00';
    },
    validate() {
      if (!this.form.customerName.trim()) {
        this.$emit('error', 'Customer name is required');
        return false;
      }
      if (!this.form.customerPhone.trim()) {
        this.$emit('error', 'Customer phone is required');
        return false;
      }
      if (!this.form.customerAddress.trim()) {
        this.$emit('error', 'Customer address is required');
        return false;
      }
      const validDetails = this.form.details.filter((d) => d.productId && d.quantity > 0);
      if (!validDetails.length) {
        this.$emit('error', 'Add at least one product with quantity > 0');
        return false;
      }
      // validate stock
      const invalid = validDetails.some((d) => {
        const p = this.availableProducts.find((x) => x._id === d.productId);
        return !p || Number(d.quantity) > Number(p.quantity);
      });
      if (invalid) {
        this.$emit('error', 'One or more quantities exceed available stock');
        return false;
      }
      return true;
    },
    onSubmit() {
      if (!this.validate()) return;
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
  },
  watch: {
    visible(val) {
      if (!val) {
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
};
</script>
