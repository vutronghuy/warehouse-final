<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <div class="ml-[159px] mr-[158px] bg-white shadow-sm border-b border-gray-200">
      <div class="flex justify-between items-center px-8 py-4">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Accounter</h1>
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
            @click="activeTab = 'review'"
            :class="[
              activeTab === 'review'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
              'whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm',
            ]"
          >
            Invoice Review
          </button>
          <button
            @click="activeTab = 'accepted'"
            :class="[
              activeTab === 'accepted'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
              'whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm',
            ]"
          >
            Accounter Dashboard
          </button>
        </nav>
      </div>

      <!-- Tab Content -->
      <div class="px-4 sm:px-0">
        <!-- Invoice Review Tab -->
        <div v-if="activeTab === 'review'">
          <InvoiceReview />
        </div>

        <!-- Accepted Invoices Tab -->
        <div v-if="activeTab === 'accepted'">
          <AcceptedInvoices />
        </div>
      </div>
    </main>
  </div>
  <div v-if="isDropdownOpen" @click="closeDropDown" class="fixed inset-0 z-40"></div>
</template>

<script>
import InvoiceReview from './InvoiceReview.vue';
import AcceptedInvoices from './AccounterDashboardSimple.vue';
import axios from 'axios';

export default {
  name: 'AccounterDashboard',
  components: {
    InvoiceReview,
    AcceptedInvoices,
  },
  data() {
    return {
      activeTab: 'review',
      isDropdownOpen: false,
      userInfo: null,
      showUserMenu: false,
    };
  },
  computed: {
    userFullName() {
      if (!this.userInfo) return 'Accounter User';

      // Check for accounter fullName first
      if (this.userInfo.accounter && this.userInfo.accounter.fullName) {
        return this.userInfo.accounter.fullName;
      }

      // Check direct fullName property
      if (this.userInfo.fullName) {
        return this.userInfo.fullName;
      }

      return 'Accounter User';
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
  async mounted() {
    await this.loadUserInfo();

    // Add click outside listener for user menu
    document.addEventListener('click', this.handleClickOutside);
  },
  beforeUnmount() {
    // Remove click outside listener
    document.removeEventListener('click', this.handleClickOutside);
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
            } else {
              // Fallback to token payload
              this.userInfo = payload;
            }
          } catch (apiError) {
            console.warn('Failed to fetch user from API, using token payload:', apiError);
            // Fallback to token payload
            const payload = JSON.parse(atob(token.split('.')[1]));
            this.userInfo = payload;
          }
        }
      } catch (error) {
        console.error('Error loading user info:', error);
        // Redirect to login if token is invalid
        this.$router.push('/login');
      }
    },

    toggleUserMenu() {
      this.showUserMenu = !this.showUserMenu;
    },

    handleClickOutside(event) {
      if (this.$refs.userArea && !this.$refs.userArea.contains(event.target)) {
        this.showUserMenu = false;
      }
    },

    async handleLogout() {
      this.showUserMenu = false;

      try {
        await axios.post('/api/auth/logout');
      } catch (error) {
        console.warn('Logout request failed:', error);
      } finally {
        // Clear local storage
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
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
