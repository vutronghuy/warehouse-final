<template>
  <aside class="w-70 bg-white shadow-sm border-r border-gray-200">
    <div class="p-6 border-b border-gray-100">
      <div class="flex items-center space-x-3">
        <img src="/img/logo.png" alt="" class="w-10 h-10 rounded-full" >
        <h1 class="text-xl font-bold text-gray-800 mt-2">Admin Management</h1>
      </div>
    </div>

    <!-- Navigation Section -->
    <div class="p-4">
      <div class="mb-3">
        <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2">Navigation</p>
      </div>

      <nav class="space-y-1">
        <router-link
          to="/Superadmin"
          class="flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors duration-150"
          :class="$route.path === '/Superadmin' ? 'text-blue-700 bg-blue-50' : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 no-underline'"
        >
          <svg class="w-5 h-5 mr-3" :class="$route.path === '/Superadmin' ? 'text-blue-500' : 'text-gray-400'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"/>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5v4M16 5v4"/>
          </svg>
          Dashboard
        </router-link>

        <router-link
          to="/Superadmin/users"
          class="flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors duration-150"
          :class="$route.path === '/Superadmin/users' ? 'text-purple-700 bg-purple-50' : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 no-underline'"
        >
          <svg class="w-5 h-5 mr-3" :class="$route.path === '/Superadmin/users' ? 'text-purple-500' : 'text-gray-400'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"/>
          </svg>
          Users
        </router-link>

        <router-link
          to="/Superadmin/suppliers"
          class="flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors duration-150"
          :class="$route.path === '/Superadmin/suppliers' ? 'text-green-700 bg-green-50' : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 no-underline'"
        >
          <svg class="w-5 h-5 mr-3" :class="$route.path === '/Superadmin/suppliers' ? 'text-green-500' : 'text-gray-400'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m0 0H5m0 0h4M9 7h6m-6 4h6m-6 4h6"/>
          </svg>
          Suppliers
        </router-link>

        <router-link
          to="/Superadmin/categories"
          class="flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors duration-150"
          :class="$route.path === '/Superadmin/categories' ? 'text-orange-700 bg-orange-50' : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 no-underline'"
        >
          <svg class="w-5 h-5 mr-3" :class="$route.path === '/Superadmin/categories' ? 'text-orange-500' : 'text-gray-400'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
          </svg>
          Categories
        </router-link>

        <!-- Products Dropdown -->
        <div class="relative">
          <button
            @click="toggleProductsDropdown"
            class="flex items-center justify-between w-full px-3 py-2.5 text-sm font-medium rounded-lg transition-colors duration-150"
            :class="isProductsActive ? 'text-blue-700 bg-blue-50' : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'"
          >
            <div class="flex items-center">
              <svg class="w-5 h-5 mr-3" :class="isProductsActive ? 'text-blue-500' : 'text-gray-400'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
              </svg>
              Products
            </div>
            <svg
              class="w-4 h-4 transition-transform duration-200"
              :class="{ 'rotate-180': showProductsDropdown }"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
            </svg>
          </button>

          <!-- Dropdown Menu -->
          <div
            v-show="showProductsDropdown"
            class="mt-1 ml-8 space-y-1 transition-all duration-200"
          >
            <router-link
              to="/Superadmin/products"
              class="flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-150"
              :class="$route.path === '/Superadmin/products' ? 'text-blue-700 bg-blue-50' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 no-underline'"
            >
              <svg class="w-4 h-4 mr-2" :class="$route.path === '/Superadmin/products' ? 'text-blue-500' : 'text-gray-400'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
              </svg>
              Product import 
            </router-link>

            <router-link
              to="/Superadmin/products/table"
              class="flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-150"
              :class="$route.path === '/Superadmin/products/table' ? 'text-blue-700 bg-blue-50' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 no-underline'"
            >
              <svg class="w-4 h-4 mr-2" :class="$route.path === '/Superadmin/products/table' ? 'text-blue-500' : 'text-gray-400'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M3 14h18m-9-4v8m-7 0V4a1 1 0 011-1h12a1 1 0 011 1v16a1 1 0 01-1 1H5a1 1 0 01-1-1z"/>
              </svg>
              Product Table
            </router-link>
          </div>
        </div>

        <router-link
          to="/Superadmin/warehouses"
          class="flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors duration-150"
          :class="$route.path === '/Superadmin/warehouses' ? 'text-indigo-700 bg-indigo-50' : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 no-underline'"
        >
          <svg class="w-5 h-5 mr-3" :class="$route.path === '/Superadmin/warehouses' ? 'text-indigo-500' : 'text-gray-400'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m0 0H5m0 0h4M9 7h6m-6 4h6m-6 4h6"/>
          </svg>
          Warehouses
        </router-link>

        <router-link
          to="/admin/orders"
          class="flex items-center px-3 py-2.5 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 hover:text-gray-900 transition-colors duration-150 no-underline"
        >
          <svg class="w-5 h-5 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
          </svg>
          Orders
        </router-link>

        <router-link
          to="/admin/reports"
          class="flex items-center px-3 py-2.5 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 hover:text-gray-900 transition-colors duration-150 no-underline"
        >
          <svg class="w-5 h-5 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
          </svg>
          Reports
        </router-link>

        <router-link
          to="/admin/documents"
          class="flex items-center px-3 py-2.5 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 hover:text-gray-900 transition-colors duration-150 no-underline"
        >
          <svg class="w-5 h-5 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
          Documents
        </router-link>

        <router-link
          to="/admin/settings"
          class="flex items-center px-3 py-2.5 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 hover:text-gray-900 transition-colors duration-150 no-underline"
        >
          <svg class="w-5 h-5 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
          </svg>
          Settings
        </router-link>
      </nav>
    </div>
  </aside>
</template>

<script>
export default {
  name: 'Sidebar',
  data() {
    return {
      showProductsDropdown: false
    };
  },
  computed: {
    isProductsActive() {
      return this.$route.path.startsWith('/Superadmin/products');
    }
  },
  methods: {
    toggleProductsDropdown() {
      this.showProductsDropdown = !this.showProductsDropdown;
    }
  },
  watch: {
    '$route'() {
      // Auto-open dropdown if navigating to products page
      if (this.isProductsActive) {
        this.showProductsDropdown = true;
      }
    }
  },
  mounted() {
    // Auto-open dropdown if already on products page
    if (this.isProductsActive) {
      this.showProductsDropdown = true;
    }
  }
};
</script>

<style scoped>
/* optional small style adjustments */
</style>
