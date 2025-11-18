<template>
  <div class="ml-64 bg-white shadow-sm border-b border-gray-200">
    <div class="flex justify-between items-center px-8 py-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Accounter</h1>
        <p class="text-sm text-gray-600">
          Welcome back, <span class="text-blue-700">{{ userFullName }}</span>
        </p>
      </div>

      <div class="flex items-center gap-4">
        <!-- Notifications: Invoices awaiting accounter approval -->
        <div class="relative">
          <div
            @click="toggleNotif"
            class="relative p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#6A4C93] focus:ring-opacity-50 flex items-center justify-center"
            aria-label="Invoice approval notifications"
          >
            <BellOutlined class="w-6 h-5 text-gray-600" />

            <!-- Badge count -->
            <span
              v-if="unreadInvoiceCount > 0"
              class="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-red-600 rounded-full min-w-[20px]"
            >
              {{ unreadInvoiceCount }}
            </span>

            <!-- Green dot indicator -->
            <span
              v-if="(showNewNotice && !isNotifOpen) || notificationStore.unreadCount > 0"
              class="absolute -bottom-1 -right-1 block w-2 h-2 bg-green-500 rounded-full animate-pulse"
            ></span>
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
              class="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50"
            >
              <div class="px-4 py-2 text-sm font-semibold text-gray-700">Notifications</div>

              <!-- Real-time Notifications -->
              <div
                v-if="notificationStore.getUnreadNotifications.length > 0"
                class="border-b border-gray-100"
              >
                <div class="px-4 py-2 text-xs font-medium text-gray-600 bg-blue-50">
                  🔔 New notifications from Staff
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
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              stroke-width="2"
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <div
                      class="text-xs text-gray-600 mt-1 cursor-pointer"
                      @click="markNotificationAsRead(notification.id)"
                    >
                      {{ notification.message }}
                    </div>
                    <div class="text-xs text-gray-400 mt-1">{{ formatTime(notification.timestamp) }}</div>
                  </li>
                </ul>
              </div>

              <!-- Pending Invoices -->
              <div v-if="pendingInvoices.length > 0" class="border-b border-gray-100">
                <div class="px-4 py-2 text-xs font-medium text-gray-600 bg-yellow-50">
                  Invoices pending review ({{ pendingInvoices.length }})
                </div>
                <ul class="max-h-40 overflow-auto">
                  <li v-for="inv in pendingInvoices" :key="inv._id" class="px-4 py-2 hover:bg-gray-50">
                    <div class="flex items-center justify-between text-sm">
                      <div class="font-medium text-gray-800 truncate flex-1">
                        {{ inv.invoiceNumber || `Invoice #${inv._id.slice(-6)}` }}
                      </div>
                      <div class="flex items-center gap-2">
                        <span
                          class="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800"
                          >pending</span
                        >
                        <button
                          @click="deleteInvoice(inv._id)"
                          class="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50"
                          title="Delete invoice"
                        >
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              stroke-width="2"
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <div class="text-xs text-gray-500">Customer: {{ inv.customerName || 'N/A' }}</div>
                    <div v-if="inv.createdAt" class="text-gray-400 mt-1">📅 {{ formatTime(inv.createdAt) }}</div>
                  </li>
                </ul>
              </div>

              <div
                v-if="!notificationStore.getUnreadNotifications.length && !pendingInvoices.length"
                class="px-4 py-3 text-sm text-gray-500"
              >
                No new notifications
              </div>

              <div class="px-4 py-2 border-t border-gray-100 flex justify-between">
                <router-link to="/accounter/invoices-review" class="text-sm text-[#6A4C93] hover:underline"
                  >Go to review page</router-link
                >
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
              <div class="text-xs text-gray-500">Accounter</div>
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
              class="absolute left-3 mt-2 w-[160px] bg-slate-100 rounded-lg shadow-lg border border-gray-200 py-2 z-50 cursor-pointer"
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
      userInfo: null,
      isDropdownOpen: false,
      isNotifOpen: false,
      pendingInvoices: [],
      pollTimer: null,
      previousCount: 0,
      showNewNotice: false,
      isFirstLoad: true, // Track if this is the first load after page reload
      hasViewedNotifications: this.getViewedNotificationsState(), // Track if user has viewed notifications
      lastCheckTime: Date.now(), // Track last check time
    };
  },
  computed: {
    userFullName() {
      // Get fullName from role-specific object
      if (this.userInfo?.role === 'accounter' && this.userInfo.accounter?.fullName) {
        return this.userInfo.accounter.fullName;
      }
      // Fallback: get from localStorage if available
      const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user');
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          if (parsed.accounter?.fullName) {
            return parsed.accounter.fullName;
          }
        } catch (e) {
          console.warn('Error parsing stored user:', e);
        }
      }
      return 'Accounter';
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
    unreadInvoiceCount() {
      // Chỉ hiển thị count khi user chưa đọc (chưa mở notification dropdown)
      if (this.hasViewedNotifications) {
        return 0;
      }

      const pendingCount = this.pendingInvoices.length;

      console.log('Count calculation:', {
        pendingCount,
        hasViewedNotifications: this.hasViewedNotifications,
        actualPendingInvoices: this.pendingInvoices.length,
      });

      return pendingCount;
    },
  },
  mounted() {
    // Load user info first
    this.loadUserInfo();

    // Don't clear notifications on page load - keep count persistent
    // this.notificationStore.clearOnPageLoad();

    this.fetchPendingInvoices();

    // Initialize Socket.IO connection
    this.initializeSocket();

    // Redirect to dashboard if on root accounter path
    if (this.$route.path === '/accounter') {
      this.$router.push('/accounter/dashboard');
    }

    // Watch for notification changes
    this.$watch(
      () => this.notificationStore.unreadCount,
      (newCount, oldCount) => {
        if (newCount > oldCount) {
          this.showNewNotice = true;
        }
      },
    );

    // Watch for pending invoices changes to update count
    this.$watch(
      () => this.pendingInvoices.length,
      (newCount) => {
        console.log('Pending invoices count changed:', newCount);
        // Update notification store count based on actual pending invoices
        this.updateNotificationCount();
      },
    );
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
        // clear new indicator when user opens the list
        this.showNewNotice = false;
        // Mark all notifications as read when user opens notification panel
        this.markAllNotificationsAsRead();
        // Mark as viewed so count will disappear
        this.hasViewedNotifications = true;
        // Save viewed state to localStorage
        this.saveViewedNotificationsState(true);
        // Reset first load flag so old data won't create notifications
        this.isFirstLoad = true;

        // Update count to reflect actual pending invoices
        this.updateNotificationCount();
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
    deleteInvoice(invoiceId) {
      // Remove invoice from pending list
      this.pendingInvoices = this.pendingInvoices.filter((inv) => inv._id !== invoiceId);
      // Unread count will update automatically through computed property
    },

    // Method to handle when invoices are approved/rejected
    handleInvoiceProcessed(invoiceId) {
      // Remove invoice from pending list
      this.pendingInvoices = this.pendingInvoices.filter((inv) => inv._id !== invoiceId);
      console.log('Invoice processed, removed from pending list:', invoiceId);
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
        return raw ? JSON.parse(raw) : null;
      } catch (e) {
        return null;
      }
    },
    initializeSocket() {
      // Connect to Socket.IO
      const socket = socketService.connect();

      // Join accounter room
      if (socket) {
        socket.emit('join-room', 'accounters');
      }

      // Listen for invoice-created events
      socketService.on('invoice-created', (data) => {
        console.log('Accounter received invoice-created:', data);
        this.showNewNotice = true;
        // Reset viewed state when new invoice is created
        this.resetViewedNotificationsState();

        // Add notification to store
        this.notificationStore.notifyInvoiceCreated(data.data);

        // Refresh pending invoices to get updated count
        this.fetchPendingInvoices();
      });

      // Listen for invoice-deleted events
      socketService.on('invoice-deleted', (data) => {
        console.log('Accounter received invoice-deleted:', data);

        // Remove notification for this invoice
        const invoiceNotifications = this.notificationStore.notifications.filter(
          (n) => n.type === 'invoice_created' && n.data?._id === data.data?._id,
        );
        invoiceNotifications.forEach((notification) => {
          this.notificationStore.deleteNotification(notification.id);
        });

        // Remove from pending invoices list
        this.pendingInvoices = this.pendingInvoices.filter((inv) => inv._id !== data.data?._id);

        // Update notification count
        this.updateNotificationCount();

        this.showNewNotice = true;
        // Reset viewed state when invoice is deleted
        this.resetViewedNotificationsState();
      });

      // Listen for invoice-approved events (real-time update)
      socketService.on('invoice-approved', (data) => {
        console.log('Accounter received invoice-approved:', data);

        // Remove from pending invoices list
        this.pendingInvoices = this.pendingInvoices.filter((inv) => inv._id !== data.data?._id);

        // Update notification count
        this.updateNotificationCount();
      });

      // Listen for invoice-rejected events (real-time update)
      socketService.on('invoice-rejected', (data) => {
        console.log('Accounter received invoice-rejected:', data);

        // Remove from pending invoices list
        this.pendingInvoices = this.pendingInvoices.filter((inv) => inv._id !== data.data?._id);

        // Update notification count
        this.updateNotificationCount();
      });

      // If Socket.IO not available, fallback to polling
      if (!socket || socketService.isFallbackMode()) {
        console.log('🔄 Socket.IO not available, using polling fallback');
        this.enablePollingFallback();
      }
    },

    enablePollingFallback() {
      // Fallback polling every 10 seconds for more responsive updates
      this.pollTimer = setInterval(() => {
        console.log('🔄 Polling fallback: fetching pending invoices...');
        this.fetchPendingInvoices();
      }, 10000);
    },

    async loadUserInfo() {
      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (!token) {
          console.warn('No token found');
          return;
        }

        const response = await axios.get('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data.success) {
          this.userInfo = response.data.user;
        }
      } catch (error) {
        console.error('❌ Error loading user info:', error);
        // Fallback: try to get user info from localStorage
        const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user');
        if (storedUser) {
          try {
            this.userInfo = JSON.parse(storedUser);
          } catch (e) {
            console.error('Error parsing stored user:', e);
          }
        }
      }
    },

    async fetchPendingInvoices() {
      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        const response = await axios.get('/api/invoices', {
          params: { status: 'pending_review', limit: 20 },
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const list = response.data?.invoices || [];
        this.pendingInvoices = list;

        // Update notification count after fetching
        this.updateNotificationCount();
      } catch (e) {
        console.warn('Failed to load pending invoices', e);
      }
    },

    updateNotificationCount() {
      // Count is now directly based on pending invoices, no need to sync
      // This method is kept for compatibility but doesn't need to do anything
      console.log('Count updated automatically based on pending invoices:', this.pendingInvoices.length);
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
          localStorage.removeItem('accounter_viewed_notifications');
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

    // Methods to persist viewed notifications state
    getViewedNotificationsState() {
      try {
        const stored = localStorage.getItem('accounter_viewed_notifications');
        return stored === 'true';
      } catch (e) {
        return false;
      }
    },

    saveViewedNotificationsState(viewed) {
      try {
        localStorage.setItem('accounter_viewed_notifications', viewed.toString());
      } catch (e) {
        console.warn('Failed to save viewed notifications state:', e);
      }
    },

    resetViewedNotificationsState() {
      this.hasViewedNotifications = false;
      this.saveViewedNotificationsState(false);
    },
  },
};
</script>
