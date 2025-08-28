<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Sidebar -->
    <AdminSidebar />

    <!-- Main Content with left margin to avoid sidebar overlap -->
    <HeadBar />
    <div class="ml-64 py-8">
      <!-- Page Content -->
      <main class="flex-1 overflow-auto bg-gray-50 p-6">
        <!-- Filters and Actions -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div class="flex flex-col lg:flex-row gap-4 items-end">
            <!-- Search -->
            <div class="flex-1">
              <label class="block text-sm font-medium text-gray-700 mb-2">Search Products</label>
              <input
                v-model="search"
                type="text"
                placeholder="Search by name or SKU..."
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <!-- Status Filter -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                v-model="statusFilter"
                class="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Status</option>
                <option value="in stock">In Stock</option>
                <option value="out of stock">Out of Stock</option>
              </select>
            </div>

            <!-- Category Filter -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                v-model="categoryFilter"
                class="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Categories</option>
                <option v-for="category in categories" :key="category._id" :value="category._id">
                  {{ category.name }}
                </option>
              </select>
            </div>

            <!-- Quick Status Change Actions -->
            <div v-if="statusChangeProducts.length > 0">
              <label class="block text-sm font-medium text-gray-700 mb-2">Quick Status Change</label>
              <div class="flex space-x-2">
                <button
                  @click="markSelectedInStock"
                  class="px-3 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700"
                >
                  Mark In Stock ({{ statusChangeProducts.length }})
                </button>
                <button
                  @click="markSelectedOutOfStock"
                  class="px-3 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700"
                >
                  Mark Out of Stock ({{ statusChangeProducts.length }})
                </button>
              </div>
            </div>
          </div>

          <!-- Selected Products Info -->
          <div v-if="statusChangeProducts.length > 0" class="mt-4">
            <div class="p-3 bg-orange-50 rounded-lg">
              <p class="text-sm text-orange-700">
                <strong>Quick Status Change:</strong> {{ statusChangeProducts.length }} product{{
                  statusChangeProducts.length !== 1 ? 's' : ''
                }}
                selected
              </p>
            </div>
          </div>
        </div>

        <!-- Products Table -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200">
          <!-- Table Header -->
          <div class="px-6 py-4 border-b border-gray-200">
            <div class="flex items-center justify-between">
              <h2 class="text-lg font-medium text-gray-900">Products</h2>
              <div class="text-sm text-gray-500">
                {{ filteredProducts.length }} product{{ filteredProducts.length !== 1 ? 's' : '' }}
              </div>
            </div>
          </div>

          <!-- Loading -->
          <div v-if="isLoading" class="flex justify-center items-center py-12">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>

          <!-- Table -->
          <div v-else class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th
                    class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"
                  >
                    #
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Warehouse
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Current Quantity
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Min Stock Level
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div class="flex items-center">
                      Quick Change
                      <div class="ml-1 relative group">
                        <div
                          class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10"
                        >
                          Select products to quickly change their status
                        </div>
                      </div>
                    </div>
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock Alert
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-for="(product, index) in paginatedProducts" :key="product._id" class="hover:bg-gray-50">
                  <!-- Product Info -->
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {{ (currentPage - 1) * pageSize + index + 1 }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div class="text-sm font-medium text-gray-900">{{ product.name }}</div>
                      <div class="text-sm text-gray-500">SKU: {{ product.sku }}</div>
                      <div v-if="product.description" class="text-xs text-gray-400 mt-1 max-w-xs truncate">
                        {{ product.description }}
                      </div>
                    </div>
                  </td>

                  <!-- Category -->
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">{{ product.categoryId?.name || 'N/A' }}</div>
                  </td>

                  <!-- Warehouse -->
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">{{ product.warehouseId?.name || 'N/A' }}</div>
                    <div class="text-sm text-gray-500">{{ product.warehouseId?.location || '' }}</div>
                  </td>

                  <!-- Current Quantity -->
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">{{ product.quantity || 0 }}</div>
                    <div class="text-xs text-gray-500">{{ product.unit }}</div>
                  </td>

                  <!-- Min Stock Level -->
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">{{ product.minStockLevel || 0 }}</div>
                    <div class="text-xs text-gray-500">{{ product.unit }}</div>
                  </td>

                  <!-- Status -->
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span
                      :class="getStockStatusClass(product)"
                      class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                    >
                      {{ getStockStatusText(product) }}
                    </span>
                  </td>

                  <!-- Quick Status Change -->
                  <td class="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      :value="product._id"
                      v-model="statusChangeProducts"
                      @change="debugCheckboxChange(product._id, $event)"
                      class="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                    />
                  </td>

                  <!-- Stock Alert -->
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span
                      :class="getStockAlertClass(product)"
                      class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                    >
                      {{ getStockAlertText(product) }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Empty State -->
          <div v-if="!isLoading && filteredProducts.length === 0" class="text-center py-12">
            <svg
              class="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m0 0V9a1 1 0 011-1h1m-1 1v4h1m0-4h1"
              />
            </svg>
            <h3 class="mt-2 text-sm font-medium text-gray-900">No products found</h3>
            <p class="mt-1 text-sm text-gray-500">No products match your current filters.</p>
          </div>

          <!-- Pagination -->
          <div
            v-if="!isLoading && filteredProducts.length > 0"
            class="px-6 py-4 border-t border-gray-200 bg-gray-50"
          >
            <div class="flex items-center justify-between">
              <div class="text-sm text-gray-700">
                Showing {{ (currentPage - 1) * pageSize + 1 }} to
                {{ Math.min(currentPage * pageSize, filteredProducts.length) }} of
                {{ filteredProducts.length }} results
              </div>

              <div class="flex items-center space-x-2">
                <button
                  @click="prevPage"
                  :disabled="currentPage === 1"
                  class="px-3 py-1 rounded-md border border-gray-300 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>

                <span class="text-sm text-gray-700"> Page {{ currentPage }} of {{ totalPages }} </span>

                <button
                  @click="nextPage"
                  :disabled="currentPage === totalPages"
                  class="px-3 py-1 rounded-md border border-gray-300 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Success/Error Messages -->
        <div
          v-if="message"
          class="fixed bottom-4 right-4 p-4 rounded-md shadow-lg"
          :class="messageType === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'"
        >
          {{ message }}
        </div>
      </main>
    </div>
  </div>
  <div v-if="isDropdownOpen" @click="closeDropDown" class="fixed inset-0 z-40"></div>
</template>

<script>
import axios from 'axios';
import AdminSidebar from './sidebar.vue';
import HeadBar from './headbar.vue';

export default {
  name: 'AdminProductManagement',
  components: {
    AdminSidebar,
    HeadBar,
  },
  data() {
    return {
      products: [],
      categories: [],
      selectedProducts: [],
      statusChangeProducts: [], // For quick status change
      search: '',
      isDropdownOpen: false,
      statusFilter: '',
      categoryFilter: '',
      isLoading: false,
      currentPage: 1,
      pageSize: 10,
      message: '',
      messageType: 'success',
      showUserMenu: false,
    };
  },
  computed: {
    filteredProducts() {
      let filtered = this.products;

      if (this.search.trim()) {
        const searchTerm = this.search.toLowerCase();
        filtered = filtered.filter(
          (product) =>
            product.name.toLowerCase().includes(searchTerm) ||
            product.sku.toLowerCase().includes(searchTerm) ||
            (product.description && product.description.toLowerCase().includes(searchTerm)),
        );
      }

      if (this.statusFilter) {
        filtered = filtered.filter((product) => product.status === this.statusFilter);
      }

      if (this.categoryFilter) {
        filtered = filtered.filter((product) => product.categoryId?._id === this.categoryFilter);
      }

      return filtered;
    },

    totalPages() {
      return Math.max(1, Math.ceil(this.filteredProducts.length / this.pageSize));
    },

    paginatedProducts() {
      const start = (this.currentPage - 1) * this.pageSize;
      return this.filteredProducts.slice(start, start + this.pageSize);
    },

    userFullName() {
      try {
        const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          const role = user.role;
          return user[role]?.fullName || user[role]?.username || 'Admin';
        }
      } catch (error) {
        console.error('Error getting user name:', error);
      }
      return 'Admin';
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
  watch: {
    search() {
      this.currentPage = 1;
    },
    statusFilter() {
      this.currentPage = 1;
    },
    categoryFilter() {
      this.currentPage = 1;
    },
    statusChangeProducts: {
      handler(newVal, oldVal) {
        console.log('🔄 statusChangeProducts changed:', {
          old: oldVal,
          new: newVal,
          length: newVal.length,
        });
      },
      deep: true,
    },
  },
  mounted() {
    // Set axios baseURL
    axios.defaults.baseURL = 'http://localhost:3003';

    // Ensure Authorization header exists if token present
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      this.$router.push('/login');
      return;
    }

    this.fetchData();
    document.addEventListener('click', this.handleDocClick);
  },
  beforeUnmount() {
    document.removeEventListener('click', this.handleDocClick);
  },
  methods: {
    toggleDropdown() {
      this.isDropdownOpen = !this.isDropdownOpen;
    },
    closeDropDown() {
      this.isDropdownOpen = false;
    },
    async fetchData() {
      await Promise.all([this.fetchProducts(), this.fetchCategories()]);
      // Debug: Check all product IDs after fetching
      this.debugProductIds();
    },

    debugProductIds() {
      console.log('🔍 Debugging all product IDs:');
      this.products.forEach((product, index) => {
        const isValid = this.validateProductId(product._id);
        console.log(`Product ${index + 1}:`, {
          name: product.name,
          id: product._id,
          type: typeof product._id,
          length: product._id?.length,
          isValid: isValid,
        });
        if (!isValid) {
          console.error('❌ Invalid product found:', product);
        }
      });
      console.log('✅ Product ID debug complete');
    },

    async fetchProducts() {
      this.isLoading = true;
      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        console.log('🔍 Fetching products for admin...');

        const response = await axios.get('/api/products', {
          params: {
            all: 'true',
            _t: Date.now(), // Cache-busting timestamp
          },
          headers: {
            Authorization: `Bearer ${token}`,
            'Cache-Control': 'no-cache',
            Pragma: 'no-cache',
          },
        });

        this.products = response.data.products || [];
        console.log('📦 Fetched products:', {
          total: this.products.length,
          sample: this.products.slice(0, 5).map((p) => ({
            id: p._id,
            name: p.name,
            status: p.status,
            idType: typeof p._id,
            idLength: p._id?.length,
            isValidObjectId: /^[0-9a-fA-F]{24}$/.test(p._id),
          })),
          allIds: this.products.map((p) => p._id),
        });
      } catch (error) {
        console.error('❌ Error fetching products:', error);
        this.showMessage('Failed to load products', 'error');
      } finally {
        this.isLoading = false;
      }
    },

    async fetchCategories() {
      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        const response = await axios.get('/api/categories/active', {
          headers: { Authorization: `Bearer ${token}` },
        });
        this.categories = response.data.categories || [];
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    },
    async markSelectedInStock() {
      if (this.statusChangeProducts.length === 0) {
        this.showMessage('No products selected for status change', 'error');
        return;
      }

      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');

        if (!token) {
          this.showMessage('Authentication token not found', 'error');
          return;
        }

        // Convert Proxy array to plain array first and ensure clean strings
        const plainProductIds = JSON.parse(JSON.stringify(this.statusChangeProducts));

        // Validate product IDs before sending (using same logic as backend)
        const invalidIds = plainProductIds.filter((id) => !this.validateProductId(id));

        if (invalidIds.length > 0) {
          console.error('❌ Invalid product IDs found:', invalidIds);
          console.error('❌ All product IDs:', plainProductIds);
          console.error(
            '❌ Invalid IDs details:',
            invalidIds.map((id) => ({
              id,
              type: typeof id,
              length: id?.length,
              isString: typeof id === 'string',
              matchesRegex: /^[0-9a-fA-F]{24}$/.test(id),
              isAllZeros: id === '000000000000000000000000',
            })),
          );
          this.showMessage('Some product IDs are invalid. Please refresh the page and try again.', 'error');
          return;
        }

        const requestData = {
          productIds: plainProductIds,
          status: 'in stock',
        };

        const response = await axios.put('/api/products/bulk-status', requestData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.data.success) {
          this.showMessage(`Marked ${response.data.modifiedCount} products as in stock`, 'success');
          this.statusChangeProducts = [];
          await this.fetchProducts();
        } else {
          this.showMessage(response.data.message || 'Failed to update product status', 'error');
        }
      } catch (error) {
        console.error('❌ Error updating product status:', error);

        if (error.response) {
          this.showMessage(error.response.data?.message || `Server error: ${error.response.status}`, 'error');
        } else if (error.request) {
          this.showMessage('Network error - please check your connection', 'error');
        } else {
          this.showMessage('An unexpected error occurred', 'error');
        }
      }
    },

    async markSelectedOutOfStock() {
      console.log('🚀 markSelectedOutOfStock method called!');
      console.log('📊 statusChangeProducts:', this.statusChangeProducts);
      console.log('📊 statusChangeProducts length:', this.statusChangeProducts.length);
      console.log('📊 statusChangeProducts type:', typeof this.statusChangeProducts);
      console.log('📊 statusChangeProducts constructor:', this.statusChangeProducts.constructor.name);

      if (this.statusChangeProducts.length === 0) {
        console.log('❌ No products selected - showing error message');
        this.showMessage('No products selected for status change', 'error');
        return;
      }

      console.log('🔍 Marking products out of stock:', {
        productIds: this.statusChangeProducts,
        count: this.statusChangeProducts.length,
        types: this.statusChangeProducts.map((id) => ({ id, type: typeof id, length: id?.length })),
        rawArray: JSON.stringify(this.statusChangeProducts),
        isArray: Array.isArray(this.statusChangeProducts),
        constructor: this.statusChangeProducts.constructor.name,
      });

      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');

        if (!token) {
          this.showMessage('Authentication token not found', 'error');
          return;
        }

        // Convert Proxy array to plain array first and ensure clean strings
        const plainProductIds = JSON.parse(JSON.stringify(this.statusChangeProducts));

        console.log('🔍 Converting Proxy to plain array:', {
          original: this.statusChangeProducts,
          plain: plainProductIds,
          originalType: typeof this.statusChangeProducts,
          plainType: typeof plainProductIds,
          plainDetails: plainProductIds.map((id) => ({
            id,
            type: typeof id,
            length: id?.length,
            isString: typeof id === 'string',
            stringValue: String(id),
            jsonStringify: JSON.stringify(id),
          })),
        });

        // Validate product IDs before sending (using same logic as backend)
        const invalidIds = plainProductIds.filter((id) => !this.validateProductId(id));

        if (invalidIds.length > 0) {
          console.error('❌ Invalid product IDs found:', invalidIds);
          console.error('❌ All product IDs:', plainProductIds);
          console.error(
            '❌ Invalid IDs details:',
            invalidIds.map((id) => ({
              id,
              type: typeof id,
              length: id?.length,
              isString: typeof id === 'string',
              matchesRegex: /^[0-9a-fA-F]{24}$/.test(id),
              isAllZeros: id === '000000000000000000000000',
            })),
          );
          this.showMessage('Some product IDs are invalid. Please refresh the page and try again.', 'error');
          return;
        }

        const requestData = {
          productIds: plainProductIds,
          status: 'out of stock',
        };

        console.log('📤 Sending request:', requestData);
        console.log('📤 Plain product IDs:', plainProductIds);
        console.log('📤 Request JSON:', JSON.stringify(requestData, null, 2));

        // Test each ID individually
        plainProductIds.forEach((id, index) => {
          console.log(`📤 ID ${index}:`, {
            value: id,
            type: typeof id,
            length: id.length,
            isString: typeof id === 'string',
            regexTest: /^[0-9a-fA-F]{24}$/.test(id),
            charCodes: Array.from(id).map((char) => char.charCodeAt(0)),
          });
        });

        // Test axios config
        const axiosConfig = {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        };
        console.log('📤 Axios config:', axiosConfig);
        console.log('📤 Token preview:', token ? token.substring(0, 20) + '...' : 'No token');

        // Test auth first
        try {
          const authTest = await axios.get('/api/products/stats', {
            headers: { Authorization: `Bearer ${token}` },
          });
          console.log('✅ Auth test passed:', authTest.status);
        } catch (authError) {
          console.error('❌ Auth test failed:', authError.response?.status, authError.response?.data);
        }

        const response = await axios.put('/api/products/bulk-status', requestData, axiosConfig);

        console.log('📥 Response:', response.data);

        if (response.data.success) {
          this.showMessage(`Marked ${response.data.modifiedCount} products as out of stock`, 'success');
          this.statusChangeProducts = [];
          await this.fetchProducts();
        } else {
          this.showMessage(response.data.message || 'Failed to update product status', 'error');
        }
      } catch (error) {
        console.error('❌ Error updating product status:', error);

        if (error.response) {
          console.error('Response data:', error.response.data);
          console.error('Response status:', error.response.status);
          this.showMessage(error.response.data?.message || `Server error: ${error.response.status}`, 'error');
        } else if (error.request) {
          console.error('Request error:', error.request);
          this.showMessage('Network error - please check your connection', 'error');
        } else {
          console.error('Error message:', error.message);
          this.showMessage('An unexpected error occurred', 'error');
        }
      }
    },

    getStockStatusClass(product) {
      // Ưu tiên kiểm tra trường status trước
      if (product.status === 'out of stock') {
        return 'bg-red-100 text-red-800';
      }
      if (product.status === 'in stock') {
        return 'bg-green-100 text-green-800';
      }

      // Nếu không có status hoặc status không rõ ràng, kiểm tra quantity
      const quantity = product.quantity || 0;
      const minStock = product.minStockLevel || 0;

      if (quantity === 0) return 'bg-red-100 text-red-800';
      if (quantity <= minStock) return 'bg-yellow-100 text-yellow-800';
      return 'bg-green-100 text-green-800';
    },

    getStockStatusText(product) {
      // Ưu tiên kiểm tra trường status trước
      if (product.status === 'out of stock') {
        return 'Out of Stock';
      }
      if (product.status === 'in stock') {
        return 'In Stock';
      }

      // Nếu không có status hoặc status không rõ ràng, kiểm tra quantity
      const quantity = product.quantity || 0;
      const minStock = product.minStockLevel || 0;

      if (quantity === 0) return 'Out of Stock';
      if (quantity <= minStock) return 'Low Stock';
      return 'In Stock';
    },

    getStockAlertClass(product) {
      // Ưu tiên kiểm tra trường status trước
      if (product.status === 'out of stock') {
        return 'bg-red-100 text-red-800';
      }
      if (product.status === 'in stock') {
        return 'bg-green-100 text-green-800';
      }

      // Nếu không có status hoặc status không rõ ràng, kiểm tra quantity
      const quantity = product.quantity || 0;
      const minStock = product.minStockLevel || 0;

      if (quantity === 0) return 'bg-red-100 text-red-800';
      if (quantity <= minStock) return 'bg-yellow-100 text-yellow-800';
      return 'bg-green-100 text-green-800';
    },

    getStockAlertText(product) {
      // Ưu tiên kiểm tra trường status trước
      if (product.status === 'out of stock') {
        return 'Out of Stock';
      }
      if (product.status === 'in stock') {
        return 'Good Stock';
      }

      // Nếu không có status hoặc status không rõ ràng, kiểm tra quantity
      const quantity = product.quantity || 0;
      const minStock = product.minStockLevel || 0;

      if (quantity === 0) return 'No Stock';
      if (quantity <= minStock) return 'Low Stock';
      return 'Good Stock';
    },

    debugCheckboxChange(productId, event) {
      console.log('🔍 CHECKBOX CHANGE EVENT TRIGGERED!');
      console.log('🔍 Product ID:', productId);
      console.log('🔍 Event target checked:', event.target.checked);
      console.log('🔍 Current statusChangeProducts BEFORE:', [...this.statusChangeProducts]);

      const isValidId = this.validateProductId(productId);

      console.log('🔍 Checkbox change details:', {
        productId: productId,
        checked: event.target.checked,
        type: typeof productId,
        length: productId?.length,
        isValidObjectId: /^[0-9a-fA-F]{24}$/.test(productId),
        isValidId: isValidId,
        currentSelection: [...this.statusChangeProducts],
        currentSelectionLength: this.statusChangeProducts.length,
      });

      // If invalid ID and trying to check, prevent it
      if (event.target.checked && !isValidId) {
        console.error('❌ Attempting to select invalid product ID:', productId);
        event.preventDefault();
        event.target.checked = false;
        this.showMessage('Invalid product ID detected. Please refresh the page.', 'error');
        return false;
      }

      // Log successful selection/deselection
      if (event.target.checked) {
        console.log('✅ Product being selected:', productId);
        // Check if already in array
        if (this.statusChangeProducts.includes(productId)) {
          console.log('⚠️ Product already in selection');
        } else {
          console.log('✅ Product will be added to selection');
        }
      } else {
        console.log('❌ Product being deselected:', productId);
        // Check if in array
        if (this.statusChangeProducts.includes(productId)) {
          console.log('✅ Product will be removed from selection');
        } else {
          console.log('⚠️ Product not in selection');
        }
      }

      // Log after a short delay to see the result
      setTimeout(() => {
        console.log('🔍 statusChangeProducts AFTER:', [...this.statusChangeProducts]);
        console.log('🔍 statusChangeProducts length AFTER:', this.statusChangeProducts.length);
      }, 100);
    },

    validateProductId(id) {
      if (!id || typeof id !== 'string') {
        console.log('❌ Invalid ID - not string:', id, typeof id);
        return false;
      }
      if (!/^[0-9a-fA-F]{24}$/.test(id)) {
        console.log('❌ Invalid ID - wrong format:', id);
        return false;
      }
      if (id === '000000000000000000000000') {
        console.log('❌ Invalid ID - null ObjectId:', id);
        return false;
      }
      console.log('✅ Valid ID:', id);
      return true;
    },

    showMessage(text, type = 'success') {
      this.message = text;
      this.messageType = type;
      setTimeout(() => {
        this.message = '';
      }, 3000);
    },

    prevPage() {
      if (this.currentPage > 1) this.currentPage--;
    },

    nextPage() {
      if (this.currentPage < this.totalPages) this.currentPage++;
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
