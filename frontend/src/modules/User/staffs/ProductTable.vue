<template>
  <div class="bg-white rounded-lg shadow-sm border border-gray-200">
    <!-- Header -->
    <div class="px-6 py-4 border-b border-gray-200">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-lg font-medium text-gray-900">Products</h2>
          <p v-if="!isLoading" class="text-sm text-gray-500 mt-1">
            {{ filteredProducts.length }} of {{ products.length }} product{{ products.length !== 1 ? 's' : '' }}
            (page {{ currentPage }} of {{ totalPages }})
          </p>
        </div>
        <button
          @click="$emit('import')"
          class="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
          </svg>
          Import Products
        </button>
      </div>
    </div>

    <!-- Load Message -->
    <div v-if="loadMessage" class="px-6 py-3 border-b border-gray-200" :class="loadMessage.includes('Failed') ? 'bg-red-50' : 'bg-green-50'">
      <div class="flex items-center">
        <svg v-if="!loadMessage.includes('Failed')" class="w-5 h-5 text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <svg v-else class="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span class="text-sm" :class="loadMessage.includes('Failed') ? 'text-red-700' : 'text-green-700'">
          {{ loadMessage }}
        </span>
      </div>
    </div>

    <!-- Filters -->
    <div class="px-6 py-4 border-b border-gray-200 bg-gray-50">
      <div class="flex flex-col sm:flex-row gap-4">
        <!-- Search -->
        <div class="flex-1">
          <input
            v-model="search"
            type="text"
            placeholder="Search products..."
            class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <!-- Status Filter -->
        <div>
          <select
            v-model="statusFilter"
            class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Status</option>
            <option value="in stock">In Stock</option>
            <option value="out of stock">Out of Stock</option>
          </select>
        </div>

        <!-- Category Filter -->
        <div>
          <select
            v-model="categoryFilter"
            class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Categories</option>
            <option v-for="category in categories" :key="category._id" :value="category._id">
              {{ category.name }}
            </option>
          </select>
        </div>
      </div>
    </div>



    <!-- Loading -->
    <div v-if="isLoading" class="flex flex-col justify-center items-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
      <p class="text-sm text-gray-500">Loading all products from database...</p>
    </div>

    <!-- Table -->
    <div v-else class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              #
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Product Info
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Category
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Supplier
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Price
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Quantity
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Import Date
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Min Stock Level
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
              <div class="text-sm text-gray-900">
                {{ product.categoryId?.name || 'N/A' }}
              </div>
            </td>

            <!-- Supplier -->
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="text-sm text-gray-900">
                {{ product.primarySupplierId?.name || 'N/A' }}
              </div>
            </td>

            <!-- Price -->
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="text-sm text-gray-900">
                ${{ product.basePrice?.toFixed(2) || '0.00' }}
              </div>
              <div class="text-xs text-gray-500">
                Unit: {{ product.unit || 'N/A' }}
              </div>
            </td>

            <!-- Quantity -->
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="text-sm font-medium text-gray-900">
                {{ product.quantity || 0 }}
              </div>
              <div class="text-xs text-gray-500">
                {{ product.unit || 'units' }}
              </div>
            </td>

            <!-- Import Date -->
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="text-sm text-gray-900">
                {{ formatDate(product.createdAt) }}
              </div>
              <div class="text-xs text-gray-500">
                {{ formatTime(product.createdAt) }}
              </div>
            </td>

            <!-- Status -->
            <td class="px-6 py-4 whitespace-nowrap">
              <span
                :class="getStatusClass(product.status)"
                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
              >
                {{ product.status === 'in stock' ? 'In Stock' : 'Out of Stock' }}
              </span>
            </td>

            <!-- Min Stock Level -->
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="text-sm text-gray-900">
                {{ product.minStockLevel || 0 }}
              </div>
              <div class="text-xs text-gray-500">
                {{ product.unit || 'units' }}
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Empty State -->
    <div v-if="!isLoading && filteredProducts.length === 0" class="text-center py-12">
      <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m0 0V9a1 1 0 011-1h1m-1 1v4h1m0-4h1" />
      </svg>
      <h3 class="mt-2 text-sm font-medium text-gray-900">No products found</h3>
      <p class="mt-1 text-sm text-gray-500">Get started by importing products from Excel.</p>
    </div>

    <!-- Pagination -->
    <div v-if="!isLoading && filteredProducts.length > 0" class="px-6 py-4 border-t border-gray-200 bg-gray-50">
      <div class="flex items-center justify-between">
        <div class="text-sm text-gray-700">
          Showing {{ ((currentPage - 1) * pageSize) + 1 }} to {{ Math.min(currentPage * pageSize, filteredProducts.length) }} of {{ filteredProducts.length }} results
          <span class="text-gray-500">({{ products.length }} total in database)</span>
        </div>

        <!-- Pagination Controls -->
        <div class="flex items-center space-x-1">
          <!-- Previous Button -->
          <button
            @click="prevPage"
            :disabled="currentPage === 1"
            class="px-3 py-2 rounded-md border border-gray-300 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          <!-- Page Numbers -->
          <template v-for="page in pageNumbers" :key="page">
            <button
              v-if="page !== '...'"
              @click="goToPage(page)"
              :class="[
                'px-3 py-2 rounded-md text-sm font-medium border',
                currentPage === page
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'text-gray-700 bg-white border-gray-300 hover:bg-gray-50'
              ]"
            >
              {{ page }}
            </button>
            <span
              v-else
              class="px-3 py-2 text-sm text-gray-500"
            >
              ...
            </span>
          </template>

          <!-- Next Button -->
          <button
            @click="nextPage"
            :disabled="currentPage === totalPages"
            class="px-3 py-2 rounded-md border border-gray-300 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'ProductTable',
  props: {
    refreshTrigger: {
      type: Number,
      default: 0
    }
  },
  emits: ['import'],
  data() {
    return {
      products: [],
      categories: [],
      isLoading: false,
      search: '',
      statusFilter: '',
      categoryFilter: '',
      currentPage: 1,
      pageSize: 10, // 10 products per page
      loadMessage: '' // Message to show after loading
    };
  },
  computed: {
    filteredProducts() {
      let filtered = this.products;

      // Search filter
      if (this.search.trim()) {
        const searchTerm = this.search.toLowerCase();
        filtered = filtered.filter(product =>
          product.name.toLowerCase().includes(searchTerm) ||
          product.sku.toLowerCase().includes(searchTerm) ||
          (product.description && product.description.toLowerCase().includes(searchTerm))
        );
      }

      // Status filter
      if (this.statusFilter) {
        filtered = filtered.filter(product => product.status === this.statusFilter);
      }

      // Category filter
      if (this.categoryFilter) {
        filtered = filtered.filter(product => product.categoryId?._id === this.categoryFilter);
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

    // Generate page numbers for pagination
    pageNumbers() {
      const pages = [];
      const total = this.totalPages;
      const current = this.currentPage;

      if (total <= 7) {
        // Show all pages if total is 7 or less
        for (let i = 1; i <= total; i++) {
          pages.push(i);
        }
      } else {
        // Show smart pagination
        if (current <= 4) {
          // Show first 5 pages + ... + last page
          for (let i = 1; i <= 5; i++) {
            pages.push(i);
          }
          pages.push('...');
          pages.push(total);
        } else if (current >= total - 3) {
          // Show first page + ... + last 5 pages
          pages.push(1);
          pages.push('...');
          for (let i = total - 4; i <= total; i++) {
            pages.push(i);
          }
        } else {
          // Show first + ... + current-1, current, current+1 + ... + last
          pages.push(1);
          pages.push('...');
          for (let i = current - 1; i <= current + 1; i++) {
            pages.push(i);
          }
          pages.push('...');
          pages.push(total);
        }
      }

      return pages;
    }
  },
  watch: {
    refreshTrigger() {
      this.fetchProducts();
    },
    search() {
      this.currentPage = 1;
    },
    statusFilter() {
      this.currentPage = 1;
    },
    categoryFilter() {
      this.currentPage = 1;
    }
  },
  mounted() {
    this.fetchProducts();
    this.fetchCategories();
  },
  methods: {
    async fetchProducts() {
      this.isLoading = true;
      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        const response = await axios.get('/api/products', {
          params: {
            all: 'true' // Get all products without pagination
          },
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        this.products = response.data.products || [];
        console.log(`✅ Loaded ${this.products.length} products from MongoDB`);

        // Show success message
        this.loadMessage = `Successfully loaded ${this.products.length} products from database`;
        setTimeout(() => {
          this.loadMessage = '';
        }, 3000);
      } catch (error) {
        console.error('❌ Error fetching products:', error);
        this.loadMessage = 'Failed to load products from database';
        setTimeout(() => {
          this.loadMessage = '';
        }, 5000);
      } finally {
        this.isLoading = false;
      }
    },

    async fetchCategories() {
      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        const response = await axios.get('/api/categories/active', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        this.categories = response.data.categories || [];
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    },

    formatDate(dateString) {
      if (!dateString) return 'N/A';
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    },

    formatTime(dateString) {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
    },

    getStatusClass(status) {
      switch (status) {
        case 'in stock':
          return 'bg-green-100 text-green-800';
        case 'out of stock':
          return 'bg-red-100 text-red-800';
        default:
          return 'bg-gray-100 text-gray-800';
      }
    },

    prevPage() {
      if (this.currentPage > 1) {
        this.currentPage--;
      }
    },

    nextPage() {
      if (this.currentPage < this.totalPages) {
        this.currentPage++;
      }
    },

    goToPage(page) {
      if (page !== '...' && page >= 1 && page <= this.totalPages) {
        this.currentPage = page;
        // Scroll to top of table
        this.$nextTick(() => {
          const tableElement = this.$el.querySelector('table');
          if (tableElement) {
            tableElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        });
      }
    }
  }
};
</script>
