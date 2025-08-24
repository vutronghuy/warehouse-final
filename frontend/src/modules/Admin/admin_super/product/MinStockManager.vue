<template>
  <div class="flex h-screen bg-gray-50">
    <!-- Sidebar -->
    <Sidebar />
    <!-- Main Content -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <!-- Header -->
      <Headers />

      <!-- Page Content -->
      <main class="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <!-- Filters -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <!-- Warehouse Filter -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Warehouse</label>
              <select
                v-model="selectedWarehouse"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Warehouses</option>
                <option v-for="warehouse in warehouses" :key="warehouse._id" :value="warehouse._id">
                  {{ warehouse.name }} - {{ warehouse.location }}
                </option>
              </select>
            </div>

            <!-- Product Search -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Search Product</label>
              <input
                v-model="searchProduct"
                type="text"
                placeholder="Search by name or SKU..."
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <!-- Category Filter -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                v-model="selectedCategory"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Categories</option>
                <option v-for="category in categories" :key="category._id" :value="category._id">
                  {{ category.name }}
                </option>
              </select>
            </div>
          </div>

          <!-- Quick Set Min Stock Form -->
          <div class="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 class="text-md font-medium text-gray-900 mb-4">Quick Set Min Stock Level</h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Select Product</label>
                <select
                  v-model="selectedProduct"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Choose a product...</option>
                  <option v-for="product in filteredProducts" :key="product._id" :value="product._id">
                    {{ product.name }} ({{ product.sku }}) - {{ product.warehouseId?.name }}
                  </option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Min Stock Level</label>
                <input
                  v-model.number="newMinStock"
                  type="number"
                  min="0"
                  placeholder="Enter min stock level"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div class="flex items-end">
                <button
                  @click="updateMinStock"
                  :disabled="!selectedProduct || newMinStock === null || isUpdating"
                  class="w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {{ isUpdating ? 'Updating...' : 'Update Min Stock' }}
                </button>
              </div>
            </div>
          </div>

          <!-- Products Table -->
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    #
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Warehouse
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Min Stock
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-for="(product, idx) in paginatedProducts" :key="product._id" class="hover:bg-gray-50">
                  <td class="px-6 py-4 whitespace-nowrap">
                       {{ (currentPage - 1) * pageSize + idx + 1 }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div class="text-sm font-medium text-gray-900">{{ product.name }}</div>
                      <div class="text-sm text-gray-500">SKU: {{ product.sku }}</div>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">{{ product.warehouseId?.name || 'N/A' }}</div>
                    <div class="text-sm text-gray-500">{{ product.warehouseId?.location || '' }}</div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">{{ product.categoryId?.name || 'N/A' }}</div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">{{ product.quantity || 0 }}</div>
                    <div class="text-xs text-gray-500">{{ product.unit }}</div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">{{ product.minStockLevel || 0 }}</div>
                    <div class="text-xs text-gray-500">{{ product.unit }}</div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span
                      :class="getStockStatusClass(product)"
                      class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                    >
                      {{ getStockStatusText(product) }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <div v-if="filteredProducts.length > pageSize" class="mt-6 flex items-center justify-between">
            <div class="text-sm text-gray-700">
              Showing {{ (currentPage - 1) * pageSize + 1 }} to
              {{ Math.min(currentPage * pageSize, filteredProducts.length) }} of
              {{ filteredProducts.length }} results
            </div>

            <div class="flex items-center space-x-2">
              <button
                @click="prevPage"
                :disabled="currentPage === 1"
                class="px-3 py-2 rounded-md border border-gray-300 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>

              <span class="text-sm text-gray-700"> Page {{ currentPage }} of {{ totalPages }} </span>

              <button
                @click="nextPage"
                :disabled="currentPage === totalPages"
                class="px-3 py-2 rounded-md border border-gray-300 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>

          <!-- Success/Error Messages -->
          <div
            v-if="message"
            class="mt-4 p-4 rounded-md"
            :class="messageType === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'"
          >
            {{ message }}
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import Sidebar from '../Sidebar.vue';
import Headers from '../header.vue';
export default {
  name: 'MinStockManager',
  components: { Sidebar, Headers },
  data() {
    return {
      products: [],
      warehouses: [],
      categories: [],
      selectedWarehouse: '',
      selectedCategory: '',
      searchProduct: '',
      selectedProduct: '',
      newMinStock: null,
      isUpdating: false,
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

      if (this.selectedWarehouse) {
        filtered = filtered.filter((p) => p.warehouseId?._id === this.selectedWarehouse);
      }

      if (this.selectedCategory) {
        filtered = filtered.filter((p) => p.categoryId?._id === this.selectedCategory);
      }

      if (this.searchProduct.trim()) {
        const search = this.searchProduct.toLowerCase();
        filtered = filtered.filter(
          (p) => p.name.toLowerCase().includes(search) || p.sku.toLowerCase().includes(search),
        );
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
          return user[role]?.fullName || 'Super Admin';
        }
      } catch (error) {
        console.error('Error getting user name:', error);
      }
      return 'Super Admin';
    },
  },
  watch: {
    selectedWarehouse() {
      this.currentPage = 1;
    },
    selectedCategory() {
      this.currentPage = 1;
    },
    searchProduct() {
      this.currentPage = 1;
    },
  },
  mounted() {
    // Fetch initial data
    this.fetchData();

    // Close user menu when clicking outside
    document.addEventListener('click', (e) => {
      if (this.$refs.userArea && !this.$refs.userArea.contains(e.target)) {
        this.showUserMenu = false;
      }
    });
  },
  beforeUnmount() {
    // Clean up event listener
    document.removeEventListener('click', this.handleClickOutside);
  },
  methods: {
    async fetchData() {
      await Promise.all([this.fetchProducts(), this.fetchWarehouses(), this.fetchCategories()]);
    },

    async fetchProducts() {
      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        const response = await axios.get('/api/products', {
          params: { all: 'true' },
          headers: { Authorization: `Bearer ${token}` },
        });
        this.products = response.data.products || [];
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    },

    async fetchWarehouses() {
      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        const response = await axios.get('/api/warehouses/active', {
          headers: { Authorization: `Bearer ${token}` },
        });
        this.warehouses = response.data.warehouses || [];
      } catch (error) {
        console.error('Error fetching warehouses:', error);
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

    async updateMinStock() {
      // Validation
      if (!this.selectedProduct) {
        this.message = 'Please select a product';
        this.messageType = 'error';
        return;
      }

      if (this.newMinStock === null || this.newMinStock === undefined || this.newMinStock === '') {
        this.message = 'Please enter a valid min stock level';
        this.messageType = 'error';
        return;
      }

      const minStockValue = parseInt(this.newMinStock);
      if (isNaN(minStockValue) || minStockValue < 0) {
        this.message = 'Min stock level must be a non-negative number';
        this.messageType = 'error';
        return;
      }

      this.isUpdating = true;
      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');

        const requestData = {
          productId: this.selectedProduct,
          minStockLevel: minStockValue,
        };

        console.log('🔄 Sending min stock update request:', requestData);

        const response = await axios.put('/api/products/min-stock', requestData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        console.log('✅ Min stock update response:', response.data);

        if (response.data.success) {
          this.message = 'Min stock level updated successfully!';
          this.messageType = 'success';
          this.selectedProduct = '';
          this.newMinStock = null;
          await this.fetchProducts();
        } else {
          this.message = response.data.message || 'Failed to update min stock level';
          this.messageType = 'error';
        }
      } catch (error) {
        console.error('❌ Error updating min stock:', error);
        console.error('❌ Error response:', error.response?.data);
        console.error('❌ Error status:', error.response?.status);

        this.message = error.response?.data?.message || 'Failed to update min stock level';
        this.messageType = 'error';
      } finally {
        this.isUpdating = false;
        setTimeout(() => {
          this.message = '';
        }, 3000);
      }
    },

    getStockStatusClass(product) {
      const quantity = product.quantity || 0;
      const minStock = product.minStockLevel || 0;

      if (quantity === 0) return 'bg-red-100 text-red-800';
      if (quantity <= minStock) return 'bg-yellow-100 text-yellow-800';
      return 'bg-green-100 text-green-800';
    },

    getStockStatusText(product) {
      const quantity = product.quantity || 0;
      const minStock = product.minStockLevel || 0;

      if (quantity === 0) return 'Out of Stock';
      if (quantity <= minStock) return 'Low Stock';
      return 'In Stock';
    },

    prevPage() {
      if (this.currentPage > 1) this.currentPage--;
    },

    nextPage() {
      if (this.currentPage < this.totalPages) this.currentPage++;
    },

    toggleUserMenu() {
      this.showUserMenu = !this.showUserMenu;
    },

    async handleLogout() {
      try {
        await axios.post('/api/auth/logout');
      } catch (error) {
        console.warn('Logout request failed:', error);
      } finally {
        // Clear storage
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');

        // Clear axios default headers
        delete axios.defaults.headers.common['Authorization'];

        // Redirect to login
        this.$router.push('/login');
      }
    },
  },
};
</script>
