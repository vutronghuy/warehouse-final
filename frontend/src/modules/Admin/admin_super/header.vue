<template>
  <div class="bg-white shadow-sm border-b border-gray-200">
    <div class="flex justify-between items-center px-8 py-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Super Admin Management</h1>
        <p class="text-sm text-gray-600">Welcome back, {{ userFullName }}</p>
      </div>

      <div class="flex items-center gap-4">
        <!-- Notifications: Low stock -->
        <div class="relative">
          <div
            @click="toggleNotif"
            class="relative p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#6A4C93] focus:ring-opacity-50"
            aria-label="Low stock notifications"
          >
            <BellOutlined class="w-6 h-6 text-gray-600" />
            <span
              v-if="unreadLowStockCount > 0"
              class="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-red-600 rounded-full min-w-[20px]"
            >
              {{ unreadLowStockCount }}
            </span>
          </div>

          <!-- Notifications Dropdown -->
          <transition
            enter-active-class="transition ease-out duration-200"
            enter-from-class="opacity-0 scale-95"
            enter-to-class="opacity-100 scale-100"
            leave-active-class="transition ease-in duration-150"
            leave-from-class="opacity-100 scale-100"
            leave-to-class="opacity-0 scale-95"
          >
            <div
              v-if="isNotifOpen"
              class="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50"
            >
              <div class="px-4 py-2 text-sm font-semibold text-gray-700">Notifications</div>

              <!-- Real-time Notifications -->
              <div
                v-if="notificationStore.getUnreadNotifications.length > 0"
                class="border-b border-gray-100"
              >
                <div class="px-4 py-2 text-xs font-medium text-gray-600 bg-blue-50">
                  🔔 New notifications
                </div>
                <ul class="max-h-40 overflow-auto">
                  <li
                    v-for="notification in notificationStore.getUnreadNotifications"
                    :key="notification.id"
                    class="px-4 py-3 hover:bg-gray-50 border-l-2 border-blue-200"
                  >
                    <div class="flex items-center justify-between text-sm">
                      <div
                        class="font-medium text-gray-800 truncate flex-1 cursor-pointer"
                        @click="markNotificationAsRead(notification.id)"
                      >
                        {{ notification.title }}
                      </div>
                      <div class="flex items-center gap-2">
                        <span
                          class="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 animate-pulse"
                          >New</span
                        >
                        <button
                          @click="deleteNotification(notification.id)"
                          class="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50"
                          title="Delete notification"
                        >
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <div class="text-xs text-gray-600 mt-1 cursor-pointer" @click="markNotificationAsRead(notification.id)">{{ notification.message }}</div>
                    <div class="text-xs text-gray-400 mt-1">{{ formatTime(notification.timestamp) }}</div>
                  </li>
                </ul>
              </div>

              <!-- Low Stock Products -->
              <div v-if="lowStockProducts.length > 0" class="border-b border-gray-100">
                <div class="px-4 py-2 text-xs font-medium text-gray-600 bg-yellow-50">
                  Low stock alert
                </div>
                <ul class="max-h-40 overflow-auto">
                  <li v-for="p in lowStockProducts" :key="p._id" class="px-4 py-2 hover:bg-gray-50">
                    <div class="flex items-center justify-between text-sm">
                      <div class="font-medium text-gray-800 truncate flex-1">{{ p.name || p.productName }}</div>
                      <div class="flex items-center gap-2">
                        <span class="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">{{ (p.quantity ?? 0) }}/{{ (p.minStockLevel ?? 0) }}</span>
                        <button
                          @click="deleteLowStockProduct(p._id)"
                          class="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50"
                          title="Delete product"
                        >
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <div class="text-xs text-gray-500">SKU: {{ p.sku || p.code || p._id }}</div>
                  </li>
                </ul>
              </div>

              <div
                v-if="!notificationStore.getUnreadNotifications.length && !lowStockProducts.length"
                class="px-4 py-3 text-sm text-gray-500"
              >
                No new notifications
              </div>

              <div class="px-4 py-2 border-t border-gray-100 flex justify-between">
                <router-link to="/Superadmin/products" class="text-sm text-[#6A4C93] hover:underline">View products</router-link>
                <button
                  v-if="notificationStore.unreadCount > 0"
                  @click="markAllNotificationsAsRead"
                  class="text-sm text-gray-600 hover:text-gray-800"
                >
                  Mark all as read
                </button>
              </div>
            </div>
          </transition>
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
            <div class="text-xs text-gray-500">Super Admin</div>
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
  </div>
  <div v-if="isDropdownOpen" @click="closeDropdown" class="fixed inset-0 z-40"></div>
  <div v-if="isNotifOpen" @click="isNotifOpen = false" class="fixed inset-0 z-30"></div>
</template>

<script>
import axios from 'axios';
import { BellOutlined } from '@ant-design/icons-vue';
import { useNotificationStore } from '@/store/modules/notification/slice';
import socketService from '@/services/socketService';
export default {
  name: 'Headers',
  components: {
    BellOutlined,
  },
  setup() {
    const notificationStore = useNotificationStore();
    return {
      notificationStore,
    };
  },
  data() {
    return {
      isDropdownOpen: false,
      currentUser: null, // Cache user info
      isNotifOpen: false,
      lowStockProducts: [],
      isFirstLoad: true, // Track if this is the first load after page reload
      hasViewedNotifications: false, // Track if user has viewed notifications
      pollTimer: null,
    };
  },
  computed: {
    userFullName() {
      // Use cached user or load from storage
      const u = this.currentUser || this._loadUserFromStorage();
      if (!u) return 'Super Admin';

      // Check for different user roles
      if (u.admin && u.admin.fullName) return u.admin.fullName;
      if (u.manager && u.manager.fullName) return u.manager.fullName;
      if (u.staff && u.staff.fullName) return u.staff.fullName;
      if (u.accounter && u.accounter.fullName) return u.accounter.fullName;

      // Fallback to direct properties
      if (u.fullName) return u.fullName;
      if (u.name) return u.name;

      return 'Super Admin';
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
    unreadLowStockCount() {
      // Only show notification count (do not add lowStockProducts)
      return this.notificationStore.unreadCount;
    },
  },
  mounted() {
    // Clear all notifications on page load/reload
    this.notificationStore.clearOnPageLoad();

    // Load user info when component mounts
    this.currentUser = this._loadUserFromStorage();
    this.fetchLowStockProducts();

    // Initialize Socket.IO connection
    this.initializeSocket();
  },
  beforeUnmount() {
    // Disconnect Socket.IO
    socketService.disconnect();

    // Clear polling timer if exists
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  },
  methods: {
    toggleDropdown() {
      this.isDropdownOpen = !this.isDropdownOpen;
    },
    toggleNotif() {
      this.isNotifOpen = !this.isNotifOpen;
      if (this.isNotifOpen) {
        // Mark all notifications as read when user opens notification panel
        this.markAllNotificationsAsRead();
        // Reset notification store unread count to 0
        this.notificationStore.unreadCount = 0;
        // Mark as viewed so old data won't create new notifications
        this.hasViewedNotifications = true;
        // Reset first load flag so old data won't create notifications
        this.isFirstLoad = true;
      }
    },
    markNotificationAsRead(notificationId) {
      this.notificationStore.markAsRead(notificationId);
    },
    markAllNotificationsAsRead() {
      this.notificationStore.markAllAsRead();
    },
    deleteNotification(notificationId) {
      this.notificationStore.deleteNotification(notificationId);
    },
    deleteLowStockProduct(productId) {
      // Remove product from low stock list
      this.lowStockProducts = this.lowStockProducts.filter(p => p._id !== productId);
      // Unread count will update automatically through computed property
    },
    formatTime(timestamp) {
      const now = new Date();
      const time = new Date(timestamp);
      const diffInMinutes = Math.floor((now - time) / (1000 * 60));

      if (diffInMinutes < 1) return 'Just now';
      if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
      if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`;
      return `${Math.floor(diffInMinutes / 1440)} days ago`;
    },
    closeDropdown() {
      this.isDropdownOpen = false;
    },
    _loadUserFromStorage() {
      try {
        const raw = localStorage.getItem('user') || sessionStorage.getItem('user');
        if (!raw) return null;

        const user = JSON.parse(raw);
        console.log('📱 Loaded user from storage:', user);

        // Cache the user info
        if (!this.currentUser) {
          this.currentUser = user;
        }

        return user;
      } catch (e) {
        console.error('❌ Error loading user from storage:', e);
        return null;
      }
    },
    initializeSocket() {
      // Connect to Socket.IO
      const socket = socketService.connect();

      // Join admin super room
      if (socket) {
        socket.emit('join-room', 'admin_super');
      }

      // Listen for low-stock events
      socketService.on('low-stock', (data) => {
        console.log('Admin Super received low-stock:', data);
        this.notificationStore.addNotification({
          type: 'low_stock',
          title: '⚠️ Low Stock Alert',
          message: `${data.productName} only has ${data.quantity} left`,
          data: data,
        });
      });

      // If Socket.IO not available, fallback to polling
      if (!socket || socketService.isFallbackMode()) {
        console.log('🔄 Socket.IO not available, using polling fallback');
        this.enablePollingFallback();
      }
    },

    enablePollingFallback() {
      // Fallback polling every 30 seconds
      this.pollTimer = setInterval(() => {
        this.fetchLowStockProducts();
      }, 30000);
    },

    async fetchLowStockProducts() {
      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        const response = await axios.get('/api/products', {
          params: { all: 'true' },
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const products = response.data?.products || [];
        // Low stock when quantity <= minStockLevel (safety stock)
        this.lowStockProducts = products.filter((p) => {
          const qty = Number(p.quantity || 0);
          const min = Number(p.minStockLevel || 0);
          return qty <= min;
        }).slice(0, 20);
      } catch (e) {
        console.warn('Failed to load low stock products', e);
      }
    },
    async handleLogout() {
      try {
        await axios.post('/api/auth/logout');
      } catch (err) {
        console.warn('Logout request failed (ignored):', err);
      } finally {
        try {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          sessionStorage.removeItem('token');
          sessionStorage.removeItem('user');
        } catch (e) {
          /* ignore */
        }

        delete axios.defaults.headers.common['Authorization'];

        // Reset notification store on logout
        try {
          if (this.notificationStore && typeof this.notificationStore.resetStore === 'function') {
            this.notificationStore.resetStore();
          }
        } catch (error) {
          console.warn('Failed to reset notification store:', error);
        }

        if (this.$router) this.$router.push('/login');
      }
    },
  },
};
</script>
