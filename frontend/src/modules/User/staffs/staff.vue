<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <div class="ml-[151px] mr-[153px] bg-white shadow-sm border-b border-gray-200">
      <div class="flex justify-between items-center px-8 py-4">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Staff</h1>
          <p class="text-sm text-gray-600">Welcome back, {{ userFullName }}</p>
        </div>

        <!-- User Dropdown -->
        <div class="relative">
          <div
            @click="toggleDropdown"
            class="flex items-center space-x-3 p-2 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#6A4C93] focus:ring-opacity-50 cursor-pointer"
          >
            <!-- User Avatar -->
            <div
              class="w-10 h-10 bg-gradient-to-br from-[#6A4C93] to-[#8E63B9] rounded-full flex items-center justify-center text-white text-sm font-semibold shadow-md"
            >
              {{ userInitials }}
            </div>
            <!-- User Info -->
            <div class="hidden md:block text-left">
              <div class="text-sm font-medium text-gray-900">{{ userFullName }}</div>
              <div class="text-xs text-gray-500">Manager</div>
            </div>
            <!-- Dropdown Arrow -->
            <svg
              class="w-4 h-4 text-gray-400 transition-transform duration-200"
              :class="{ 'rotate-180': isDropdownOpen }"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>

          <!-- Dropdown Menu -->
          <transition
            enter-active-class="transition ease-out duration-200"
            enter-from-class="opacity-0 scale-95"
            enter-to-class="opacity-100 scale-100"
            leave-active-class="transition ease-in duration-150"
            leave-from-class="opacity-100 scale-100"
            leave-to-class="opacity-0 scale-95"
          >
            <div
              v-if="isDropdownOpen"
              class="absolute left-3 mt-2 w-[160px] bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 cursor-pointer"
            >
              <!-- Logout Button -->
              <div
                @click="handleLogout"
                class="flex items-center w-full px-4 py-2 text-sm text-violet-600 hover:bg-violet-50 transition-colors duration-200"
              >
                <svg class="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                Logout
              </div>
            </div>
          </transition>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <!-- Navigation Tabs -->
      <div class="mb-6">
        <nav class="flex space-x-8" aria-label="Tabs">
          <button
            @click="activeTab = 'products'"
            :class="[
              activeTab === 'products'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
              'whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm',
            ]"
          >
            Products
          </button>
          <button
            @click="activeTab = 'import'"
            :class="[
              activeTab === 'import'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
              'whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm',
            ]"
          >
            Import Products
          </button>
          <button
            @click="activeTab = 'export'"
            :class="[
              activeTab === 'export'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
              'whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm',
            ]"
          >
            Export Products
          </button>
          <button
            @click="activeTab = 'invoices'"
            :class="[
              activeTab === 'invoices'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
              'whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm',
            ]"
          >
            Invoices
          </button>
        </nav>
      </div>

      <!-- Tab Content -->
      <div class="px-4 sm:px-0">
        <!-- Products Tab -->
        <div v-if="activeTab === 'products'">
          <ProductTable :refreshTrigger="refreshTrigger" @import="activeTab = 'import'" />
        </div>

        <!-- Import Tab -->
        <div v-if="activeTab === 'import'">
          <ImportProduct @imported="handleImported" />
        </div>

        <!-- Export Tab -->
        <div v-if="activeTab === 'export'">
          <ExportProduct @exported="handleExported" />
        </div>

        <!-- Invoices Tab -->
        <div v-if="activeTab === 'invoices'">
          <InvoiceManagement />
        </div>
      </div>
    </main>
  </div>
  <div v-if="isDropdownOpen" @click="closeDropDown" class="fixed inset-0 z-40"></div>
</template>

<script>
import ProductTable from './ProductTable.vue';
import ImportProduct from './ImportProduct.vue';
import ExportProduct from './ExportProduct.vue';
import InvoiceManagement from './InvoiceManagement.vue';
import axios from 'axios';

export default {
  name: 'StaffDashboard',
  components: {
    ProductTable,
    ImportProduct,
    ExportProduct,
    InvoiceManagement,
  },
  data() {
    return {
      activeTab: 'products',
      isDropdownOpen: false,
      refreshTrigger: 0,
      userInfo: null,
      showUserMenu: false,
    };
  },
  computed: {
    userFullName() {
      if (!this.userInfo) return 'Staff User';

      // Check for staff fullName first (since this is staff.vue)
      if (this.userInfo.staff && this.userInfo.staff.fullName) {
        return this.userInfo.staff.fullName;
      }

      // Check direct fullName property
      if (this.userInfo.fullName) {
        return this.userInfo.fullName;
      }

      // Check direct name property
      if (this.userInfo.name) {
        return this.userInfo.name;
      }

      // Check username
      if (this.userInfo.username) {
        return this.userInfo.username;
      }

      // Extract name from email
      if (this.userInfo.email) {
        return this.userInfo.email.split('@')[0];
      }

      // Fallback to other role fullNames
      if (this.userInfo.admin && this.userInfo.admin.fullName) {
        return this.userInfo.admin.fullName;
      }
      if (this.userInfo.manager && this.userInfo.manager.fullName) {
        return this.userInfo.manager.fullName;
      }
      if (this.userInfo.accounter && this.userInfo.accounter.fullName) {
        return this.userInfo.accounter.fullName;
      }

      return 'Staff User';
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
  mounted() {
    this.loadUserInfo();
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
    async loadUserInfo() {
      try {
        // First try to get from localStorage/sessionStorage
        const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
        if (userStr) {
          this.userInfo = JSON.parse(userStr);
          return;
        }

        // If no user in storage, try to get from token
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (token) {
          try {
            // Decode token to get user info
            const payload = JSON.parse(atob(token.split('.')[1]));

            // Try to fetch user details from API
            const response = await axios.get('/api/auth/me', {
              headers: { Authorization: `Bearer ${token}` },
            });

            if (response.data && response.data.user) {
              this.userInfo = response.data.user;

              // Save to storage for future use
              localStorage.setItem('user', JSON.stringify(this.userInfo));
            }
          } catch (apiError) {
            // Fallback to token payload
            this.userInfo = payload;
          }
        }
      } catch (error) {
        console.error('Error loading user info:', error);
        this.userInfo = null;
      }
    },

    toggleUserMenu() {
      this.showUserMenu = !this.showUserMenu;
    },

    handleDocClick(event) {
      if (this.$refs.userArea && !this.$refs.userArea.contains(event.target)) {
        this.showUserMenu = false;
      }
    },

    handleImported() {
      // Switch to products tab and refresh the list
      this.activeTab = 'products';
      this.refreshTrigger++;
    },

    handleExported() {
      // Switch to products tab and refresh the list
      this.activeTab = 'products';
      this.refreshTrigger++;
    },
    async handleLogout() {
      // Close dropdown
      this.showUserMenu = false;

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

<style scoped>
/* Dropdown transition */
.fade-enter-active,
.fade-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.fade-enter-to,
.fade-leave-from {
  opacity: 1;
  transform: translateY(0);
}

/* User menu button hover effect */
.user-menu-button:hover {
  background-color: rgba(0, 0, 0, 0.05);
}
</style>
