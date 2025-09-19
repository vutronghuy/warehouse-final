<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <div class="ml-[159px] mr-[158px] bg-white shadow-sm border-b border-gray-200">
      <div class="flex justify-between items-center px-8 py-4">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Accounter</h1>
          <p class="text-sm text-gray-600">Welcome back, {{ userFullName }}</p>
        </div>

        <div class="flex items-center gap-4">
          <!-- Notifications: Invoices awaiting accounter approval -->
          <div class="relative">
            <button
              @click="toggleNotif"
              class="relative p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#6A4C93] focus:ring-opacity-50"
              :title="`${unreadInvoiceCount} thông báo chưa đọc`"
              aria-label="Invoice approval notifications"
            >
              <BellOutlined class="w-6 h-6 text-gray-600" />
              <span
                v-if="unreadInvoiceCount > 0"
                class="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-red-600 rounded-full min-w-[20px] animate-pulse"
                :title="`${unreadInvoiceCount} thông báo mới`"
              >
                {{ unreadInvoiceCount > 99 ? '99+' : unreadInvoiceCount }}
              </span>

              <!-- Indicator chấm xanh -->
              <span
                v-if="(showNewNotice && !isNotifOpen) || notificationStore.unreadCount > 0"
                class="absolute -bottom-1 -right-1 block w-2 h-2 bg-green-500 rounded-full animate-pulse"
                title="Có thông báo mới"
              ></span>
            </button>

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
                <div class="px-4 py-2 text-sm font-semibold text-gray-700 flex items-center justify-between">
                  <span>Thông báo</span>
                  <span v-if="unreadInvoiceCount > 0" class="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full">
                    {{ unreadInvoiceCount }} chưa đọc
                  </span>
                </div>

                <!-- Real-time Notifications -->
                <div
                  v-if="notificationStore.getUnreadNotifications.length > 0"
                  class="border-b border-gray-100"
                >
                  <div class="px-4 py-2 text-xs font-medium text-gray-600 bg-blue-50">
                    🔔 Thông báo mới từ Staff
                  </div>
                  <ul class="max-h-40 overflow-auto">
                    <li
                      v-for="notification in notificationStore.getUnreadNotifications"
                      :key="notification.id"
                      class="px-4 py-3 hover:bg-gray-50 border-l-2 border-blue-200"
                    >
                      <div class="flex items-center justify-between text-sm">
                        <div class="font-medium text-gray-800 truncate flex-1 cursor-pointer" @click="markNotificationAsRead(notification.id)">{{ notification.title }}</div>
                        <div class="flex items-center gap-2">
                          <span
                            class="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 animate-pulse"
                            >Mới</span
                          >
                          <button
                            @click="deleteNotification(notification.id)"
                            class="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50"
                            title="Xóa thông báo"
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

                <!-- Pending Invoices -->
                <div v-if="pendingInvoices.length > 0" class="border-b border-gray-100">
                  <div class="px-4 py-2 text-xs font-medium text-gray-600 bg-yellow-50 flex items-center justify-between">
                    <span>Invoice chờ duyệt</span>
                    <span class="bg-yellow-200 text-yellow-800 px-2 py-1 rounded-full text-xs font-semibold">
                      {{ pendingInvoices.length }} invoice
                    </span>
                  </div>
                  <ul class="max-h-40 overflow-auto">
                    <li v-for="inv in pendingInvoices" :key="inv._id" class="px-4 py-3 hover:bg-gray-50 border-l-2 border-yellow-200">
                      <div class="flex items-center justify-between text-sm">
                        <div class="font-medium text-gray-800 truncate flex-1">
                          {{ inv.invoiceNumber || `Invoice #${inv._id.slice(-6)}` }}
                        </div>
                        <div class="flex items-center gap-2">
                          <span class="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800 animate-pulse">
                            Chờ duyệt
                          </span>
                          <button
                            @click="deleteInvoice(inv._id)"
                            class="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50"
                            title="Xóa invoice"
                          >
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      <div class="text-xs text-gray-600 mt-1">
                        <div class="flex items-center gap-4">
                          <span>👤 {{ inv.customerName || 'Khách hàng chưa xác định' }}</span>
                          <span v-if="inv.totalAmount" class="text-green-600 font-medium">
                            💰 {{ formatCurrency(inv.totalAmount) }}
                          </span>
                        </div>
                        <div v-if="inv.createdAt" class="text-gray-400 mt-1">
                          📅 {{ formatTime(inv.createdAt) }}
                        </div>
                      </div>
                    </li>
                  </ul>
                </div>

                <div
                  v-if="!notificationStore.getUnreadNotifications.length && !pendingInvoices.length"
                  class="px-4 py-6 text-center text-gray-500"
                >
                  <div class="flex flex-col items-center">
                    <svg class="w-12 h-12 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-5 5-5-5h5v-5a7.5 7.5 0 1 0-15 0v5h5l-5 5-5-5h5v-5a7.5 7.5 0 1 1 15 0v5z" />
                    </svg>
                    <p class="text-sm font-medium text-gray-600 mb-1">Tất cả đã được xử lý!</p>
                    <p class="text-xs text-gray-400">Không có thông báo mới hoặc invoice chờ duyệt</p>
                  </div>
                </div>

                <div class="px-4 py-2 border-t border-gray-100 flex justify-between">
                  <button @click="goToReviewTab" class="text-sm text-[#6A4C93] hover:underline">Tới tab review</button>
                  <button
                    v-if="notificationStore.unreadCount > 0"
                    @click="markAllNotificationsAsRead"
                    class="text-sm text-gray-600 hover:text-gray-800"
                  >
                    Đánh dấu tất cả đã đọc
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
  <div v-if="isNotifOpen" @click="isNotifOpen = false" class="fixed inset-0 z-30"></div>
</template>

<script>
import InvoiceReview from './InvoiceReview.vue';
import AcceptedInvoices from './AccounterDashboardSimple.vue';
import axios from 'axios';
import { BellOutlined } from '@ant-design/icons-vue';
import { useNotificationStore } from '@/store/modules/notification/slice';
import socketService from '@/services/socketService';

export default {
  name: 'AccounterDashboard',
  components: {
    InvoiceReview,
    AcceptedInvoices,
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
      activeTab: 'review',
      isDropdownOpen: false,
      userInfo: null,
      showUserMenu: false,
      isNotifOpen: false,
      pendingInvoices: [],
      isFirstLoad: true, // Track if this is the first load after page reload
      hasViewedNotifications: false, // Track if user has viewed notifications
      pollTimer: null,
      previousInvoiceCount: 0,
      showNewNotice: false,
      lastCheckTime: Date.now(), // Track last check time
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
    unreadInvoiceCount() {
      // Chỉ hiển thị notification count (không cộng dồn với pendingInvoices)
      return this.notificationStore.unreadCount;
    },
  },
  async mounted() {
    // Clear all notifications on page load/reload
    this.notificationStore.clearOnPageLoad();

    await this.loadUserInfo();
    await this.fetchPendingInvoices();

    // Initialize Socket.IO connection
    this.initializeSocket();

    // Watch for notification changes
    this.$watch(
      () => this.notificationStore.unreadCount,
      (newCount, oldCount) => {
        if (newCount > oldCount) {
          this.showNewNotice = true;
        }
      },
    );

    // Add click outside listener for user menu
    document.addEventListener('click', this.handleClickOutside);
  },
  beforeUnmount() {
    // Disconnect Socket.IO
    socketService.disconnect();

    // Clear polling timer if exists
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }

    // Remove click outside listener
    document.removeEventListener('click', this.handleClickOutside);
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
    deleteInvoice(invoiceId) {
      // Xóa invoice khỏi danh sách pending
      this.pendingInvoices = this.pendingInvoices.filter((inv) => inv._id !== invoiceId);
      // Unread count sẽ tự động cập nhật thông qua computed property
    },
    formatTime(timestamp) {
      const now = new Date();
      const time = new Date(timestamp);
      const diffInMinutes = Math.floor((now - time) / (1000 * 60));

      if (diffInMinutes < 1) return 'Vừa xong';
      if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;
      if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} giờ trước`;
      return `${Math.floor(diffInMinutes / 1440)} ngày trước`;
    },
    formatCurrency(value) {
      if (value === null || value === undefined) return '0 VND';
      const n = Number(value) || 0;
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0
      }).format(n);
    },
    closeDropDown() {
      this.isDropdownOpen = false;
    },
    goToReviewTab() {
      this.activeTab = 'review';
      this.isNotifOpen = false;
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
        this.hasViewedNotifications = false;
      });

      // Listen for invoice-deleted events
      socketService.on('invoice-deleted', (data) => {
        console.log('Accounter received invoice-deleted:', data);

        // Remove notification for this invoice
        const invoiceNotifications = this.notificationStore.notifications.filter(
          n => n.type === 'invoice_created' && n.data?._id === data.data?._id
        );
        invoiceNotifications.forEach(notification => {
          this.notificationStore.deleteNotification(notification.id);
        });

        // Remove from pending invoices list
        this.pendingInvoices = this.pendingInvoices.filter(
          inv => inv._id !== data.data?._id
        );

        this.showNewNotice = true;
        this.hasViewedNotifications = false;
      });

      // Nếu Socket.IO không khả dụng, fallback về polling
      if (!socket || socketService.isFallbackMode()) {
        console.log('🔄 Socket.IO not available, using polling fallback');
        this.enablePollingFallback();
      }
    },

    enablePollingFallback() {
      // Fallback polling mỗi 30 giây
      this.pollTimer = setInterval(() => {
        this.fetchPendingInvoices();
      }, 30000);
    },

    async fetchPendingInvoices() {
      try {
        const response = await axios.get('/api/invoices', {
          params: { status: 'pending_review', limit: 20 },
        });
        const list = response.data?.invoices || [];
        this.pendingInvoices = list;
      } catch (error) {
        console.warn('Failed to load pending invoices', error);
        this.pendingInvoices = [];
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

        // Reset notification store on logout
        try {
          if (this.notificationStore && typeof this.notificationStore.resetStore === 'function') {
            this.notificationStore.resetStore();
          }
        } catch (error) {
          console.warn('Failed to reset notification store:', error);
        }

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
