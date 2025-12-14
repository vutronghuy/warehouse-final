<template>
  <aside class="w-70 bg-white shadow-sm border-r border-gray-200">
    <div class="p-6 border-b border-gray-100">
      <div class="flex items-center space-x-3">
        <img src="/img/logo.png" alt="" class="w-10 h-10 rounded-full" />
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
          class="flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors duration-150 no-underline"
          :class="
            $route.path === '/Superadmin'
              ? 'text-blue-700 bg-blue-50'
              : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
          "
        >
          <svg
            class="w-5 h-5 mr-3"
            :class="$route.path === '/Superadmin' ? 'text-blue-500' : 'text-gray-400'"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"
            />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5v4M16 5v4" />
          </svg>
          Dashboard
        </router-link>

        <router-link
          to="/Superadmin/users"
          class="flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors duration-150 no-underline"
          :class="
            $route.path === '/Superadmin/users'
              ? 'text-purple-700 bg-purple-50'
              : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
          "
        >
          <svg
            class="w-5 h-5 mr-3"
            :class="$route.path === '/Superadmin/users' ? 'text-purple-500' : 'text-gray-400'"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
            />
          </svg>
          Users
        </router-link>

        <router-link
          to="/Superadmin/suppliers"
          class="flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors duration-150 no-underline"
          :class="
            $route.path === '/Superadmin/suppliers'
              ? 'text-green-700 bg-green-50'
              : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
          "
        >
          <svg
            class="w-5 h-5 mr-3"
            :class="$route.path === '/Superadmin/suppliers' ? 'text-green-500' : 'text-gray-400'"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M19 21V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m0 0H5m0 0h4M9 7h6m-6 4h6m-6 4h6"
            />
          </svg>
          Suppliers
        </router-link>

        <router-link
          to="/Superadmin/categories"
          class="flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors duration-150 no-underline"
          :class="
            $route.path === '/Superadmin/categories'
              ? 'text-orange-700 bg-orange-50'
              : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
          "
        >
          <svg
            class="w-5 h-5 mr-3"
            :class="$route.path === '/Superadmin/categories' ? 'text-orange-500' : 'text-gray-400'"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
          Categories
        </router-link>

        <router-link
          to="/Superadmin/target"
          class="flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors duration-150 no-underline"
          :class="
            $route.path === '/Superadmin/target'
              ? 'text-orange-700 bg-orange-50'
              : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
          "
        >
          <svg
            class="w-5 h-5 mr-3"
            :class="$route.path === '/Superadmin/target' ? 'text-orange-500' : 'text-gray-400'"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
          Target
        </router-link>

        <router-link
          to="/Superadmin/customers"
          class="flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors duration-150 no-underline"
          :class="
            $route.path === '/Superadmin/customers'
              ? 'text-pink-700 bg-pink-50'
              : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
          "
        >
          <svg
            class="w-5 h-5 mr-3"
            :class="$route.path === '/Superadmin/customers' ? 'text-pink-500' : 'text-gray-400'"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          Customers
        </router-link>

        <!-- Products Dropdown -->
        <div class="relative">
          <div
            @click="toggleProductsDropdown"
            class="flex items-center justify-between w-full px-3 py-2.5 text-sm font-medium rounded-lg transition-colors duration-150"
            :class="
              isProductsActive
                ? 'text-blue-700 bg-blue-50'
                : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
            "
          >
            <div class="flex items-center">
              <svg
                class="w-5 h-5 mr-3"
                :class="isProductsActive ? 'text-blue-500' : 'text-gray-400'"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
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
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>

          <!-- Dropdown Menu -->
          <div v-show="showProductsDropdown" class="mt-1 ml-8 space-y-1 transition-all duration-200">
            <router-link
              to="/Superadmin/products"
              class="flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-150 no-underline"
              :class="
                $route.path === '/Superadmin/products'
                  ? 'text-blue-700 bg-blue-50'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              "
            >
              <svg
                class="w-4 h-4 mr-2"
                :class="$route.path === '/Superadmin/products' ? 'text-blue-500' : 'text-gray-400'"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                />
              </svg>
              Product import
            </router-link>

            <router-link
              to="/Superadmin/products/table"
              class="flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-150 no-underline"
              :class="
                $route.path === '/Superadmin/products/table'
                  ? 'text-blue-700 bg-blue-50'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              "
            >
              <svg
                class="w-4 h-4 mr-2"
                :class="$route.path === '/Superadmin/products/table' ? 'text-blue-500' : 'text-gray-400'"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M3 10h18M3 14h18m-9-4v8m-7 0V4a1 1 0 011-1h12a1 1 0 011 1v16a1 1 0 01-1 1H5a1 1 0 01-1-1z"
                />
              </svg>
              Product Table
            </router-link>
          </div>
        </div>

        <router-link
          to="/Superadmin/warehouses"
          class="flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors duration-150 no-underline"
          :class="
            $route.path === '/Superadmin/warehouses'
              ? 'text-indigo-700 bg-indigo-50'
              : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
          "
        >
          <svg
            class="w-5 h-5 mr-3"
            :class="$route.path === '/Superadmin/warehouses' ? 'text-indigo-500' : 'text-gray-400'"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M19 21V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m0 0H5m0 0h4M9 7h6m-6 4h6m-6 4h6"
            />
          </svg>
          Warehouses
        </router-link>

        <!-- Inventory Dropdown -->
        <div class="relative">
          <div
            @click="toggleInventoryDropdown"
            class="flex items-center justify-between w-full px-3 py-2.5 text-sm font-medium rounded-lg transition-colors duration-150"
            :class="
              isInventoryActive
                ? 'text-teal-700 bg-teal-50'
                : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
            "
          >
            <div class="flex items-center">
              <svg
                class="w-5 h-5 mr-3"
                :class="isInventoryActive ? 'text-teal-500' : 'text-gray-400'"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
              Inventory
            </div>
            <svg
              class="w-4 h-4 transition-transform duration-200"
              :class="{ 'rotate-180': showInventoryDropdown }"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>

          <!-- Dropdown Menu -->
          <div v-show="showInventoryDropdown" class="mt-1 ml-8 space-y-1 transition-all duration-200">
            <router-link
              to="/Superadmin/inventory"
              class="flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-150 no-underline"
              :class="
                $route.path === '/Superadmin/inventory'
                  ? 'text-teal-700 bg-teal-50'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              "
            >
              <svg
                class="w-4 h-4 mr-2"
                :class="$route.path === '/Superadmin/inventory' ? 'text-teal-500' : 'text-gray-400'"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              Inventory Management
            </router-link>

            <router-link
              to="/Superadmin/inventory/transactions"
              class="flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-150 no-underline"
              :class="
                $route.path === '/Superadmin/inventory/transactions'
                  ? 'text-teal-700 bg-teal-50'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              "
            >
              <svg
                class="w-4 h-4 mr-2"
                :class="$route.path === '/Superadmin/inventory/transactions' ? 'text-teal-500' : 'text-gray-400'"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Transaction History
            </router-link>
          </div>
        </div>
      </nav>
    </div>
  </aside>
</template>

<script>
export default {
  name: 'Sidebar',
  data() {
    return {
      showProductsDropdown: false,
      showInventoryDropdown: false,
    };
  },
  computed: {
    isProductsActive() {
      return this.$route.path.startsWith('/Superadmin/products');
    },
    isInventoryActive() {
      return this.$route.path.startsWith('/Superadmin/inventory');
    },
  },
  methods: {
    toggleProductsDropdown() {
      this.showProductsDropdown = !this.showProductsDropdown;
    },
    toggleInventoryDropdown() {
      this.showInventoryDropdown = !this.showInventoryDropdown;
    },
  },
  watch: {
    $route() {
      // Auto-open dropdown if navigating to products page
      if (this.isProductsActive) {
        this.showProductsDropdown = true;
      }
      // Auto-open dropdown if navigating to inventory page
      if (this.isInventoryActive) {
        this.showInventoryDropdown = true;
      }
    },
  },
  mounted() {
    // Auto-open dropdown if already on products page
    if (this.isProductsActive) {
      this.showProductsDropdown = true;
    }
    // Auto-open dropdown if already on inventory page
    if (this.isInventoryActive) {
      this.showInventoryDropdown = true;
    }
  },
};
</script>

<style scoped>
/* optional small style adjustments */
</style>
