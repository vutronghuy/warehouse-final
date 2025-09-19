<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <div class="ml-[151px] mr-[153px] bg-white shadow-sm border-b border-gray-200">
      <div class="flex justify-between items-center px-8 py-4">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Staff</h1>
          <p class="text-sm text-gray-600">Welcome back, {{ userFullName }}</p>
        </div>

        <div class="flex items-center gap-4">
          <!-- Notifications: Approved exports -->
          <div class="relative">
            <div
              @click="toggleNotif"
              class="relative p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#6A4C93] focus:ring-opacity-50"
              aria-label="Export approval notifications"
            >
              <BellOutlined class="w-6 h-6 text-gray-600 color-violet-500" />
              <span
                v-if="unreadExportCount > 0"
                class="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-red-600 rounded-full min-w-[20px]"
              >
                {{ unreadExportCount }}
              </span>

              <!-- Indicator chấm xanh -->
              <span
                v-if="(showNewNotice && !isNotifOpen) || unreadExportCount > 0"
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
                <div class="px-4 py-2 text-sm font-semibold text-gray-700">Thông báo</div>

                <!-- Real-time Notifications -->
                <div
                  v-if="
                    notificationStore.getUnreadNotifications.filter((n) => n.type === 'export_approved')
                      .length > 0
                  "
                  class="border-b border-gray-100"
                >
                  <div
                    v-if="
                      notificationStore.getUnreadNotifications.filter((n) => n.type === 'export_approved')
                        .length > 0
                    "
                    class="px-4 py-2 text-xs font-medium text-gray-600 bg-green-50"
                  >
                    ✅ Thông báo mới từ Admin
                  </div>
                  <ul class="max-h-40 overflow-auto">
                    <li
                      v-for="notification in notificationStore.getUnreadNotifications.filter(
                        (n) => n.type === 'export_approved',
                      )"
                      :key="notification.id"
                      class="px-4 py-3 hover:bg-gray-50 border-l-2 border-green-200"
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
                            class="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800 animate-pulse"
                            >Mới</span
                          >
                          <button
                            @click="deleteNotification(notification.id)"
                            class="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50"
                            title="Xóa thông báo"
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

                <!-- Approved Exports -->
                <div v-if="approvedExports.length > 0" class="border-b border-gray-100">
                  <div class="px-4 py-2 text-xs font-medium text-gray-600 bg-green-50">
                    Phiếu export đã duyệt
                  </div>
                  <ul class="max-h-40 overflow-auto">
                    <li v-for="exp in approvedExports" :key="exp._id" class="px-4 py-2 hover:bg-gray-50">
                      <div class="flex items-center justify-between text-sm">
                        <div class="font-medium text-gray-800 truncate flex-1">
                          {{ exp.receiptNumber || exp._id }}
                        </div>
                        <div class="flex items-center gap-2">
                          <span
                            class="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800"
                            >Approved</span
                          >
                          <button
                            @click="deleteExport(exp._id)"
                            class="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50"
                            title="Xóa phiếu export"
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
                      <div class="text-xs text-gray-500">Khách hàng: {{ exp.customerName || 'N/A' }}</div>
                      <div v-if="exp.createdAt" class="text-gray-400 mt-1">
                        📅 {{ formatTime(exp.createdAt) }}
                      </div>
                    </li>
                  </ul>
                </div>

                <div
                  v-if="unreadExportCount === 0 && !approvedExports.length"
                  class="px-4 py-3 text-sm text-gray-500"
                >
                  Không có thông báo mới
                </div>

                <div class="px-4 py-2 border-t border-gray-100 flex justify-between">
                  <button @click="goToInvoicesTab" class="text-sm text-[#6A4C93] hover:underline">
                    Tới tab invoices
                  </button>
                  <button
                    v-if="unreadExportCount > 0"
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
                <div class="text-xs text-gray-500">Staff</div>
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
            @click="activeTab = 'import-receipts'"
            :class="[
              activeTab === 'import-receipts'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
              'whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm',
            ]"
          >
            Import Receipts
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

        <!-- Import Receipts Tab -->
        <div v-if="activeTab === 'import-receipts'">
          <ImportReceiptList />
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
  <div v-if="isNotifOpen" @click="isNotifOpen = false" class="fixed inset-0 z-30"></div>
</template>

<script>
import ProductTable from './ProductTable.vue';
import ImportProduct from './ImportProduct.vue';
import ImportReceiptList from './ImportReceiptList.vue';
import ExportProduct from './ExportProduct.vue';
import InvoiceManagement from './InvoiceManagement.vue';
import axios from 'axios';
import { BellOutlined } from '@ant-design/icons-vue';
import { useNotificationStore } from '@/store/modules/notification/slice';
import socketService from '@/services/socketService';

export default {
  name: 'StaffDashboard',
  components: {
    ProductTable,
    ImportProduct,
    ImportReceiptList,
    ExportProduct,
    InvoiceManagement,
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
      activeTab: 'products',
      isDropdownOpen: false,
      refreshTrigger: 0,
      userInfo: null,
      showUserMenu: false,
      isNotifOpen: false,
      approvedExports: [],
      pollTimer: null,
      previousExportCount: 0,
      showNewNotice: false,
      isFirstLoad: true,
      hasViewedNotifications: false,
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
    unreadExportCount() {
      // Chỉ đếm notifications về export được approve
      return this.notificationStore.notifications.filter(
        (notification) => notification.type === 'export_approved' && !notification.read,
      ).length;
    },
  },
  mounted() {
    // Clear all notifications on page load/reload
    this.notificationStore.clearOnPageLoad();

    this.loadUserInfo();
    this.fetchApprovedExports();

    // Initialize Socket.IO connection
    this.initializeSocket();

    // Watch for export approved notification changes
    this.$watch(
      () => this.unreadExportCount,
      (newCount, oldCount) => {
        if (newCount > oldCount) {
          this.showNewNotice = true;
        }
      },
    );

    document.addEventListener('click', this.handleDocClick);
  },
  beforeUnmount() {
    // Disconnect Socket.IO
    socketService.disconnect();

    // Clear polling timer if exists
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }

    document.removeEventListener('click', this.handleDocClick);
  },
  methods: {
    toggleDropdown() {
      this.isDropdownOpen = !this.isDropdownOpen;
    },
    closeDropDown() {
      this.isDropdownOpen = false;
    },
    toggleNotif() {
      this.isNotifOpen = !this.isNotifOpen;
      if (this.isNotifOpen) {
        // clear new indicator when user opens the list
        this.showNewNotice = false;
        // Mark only export approved notifications as read when user opens notification panel
        this.notificationStore.notifications
          .filter((n) => n.type === 'export_approved' && !n.read)
          .forEach((n) => this.notificationStore.markAsRead(n.id));
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
      // Only mark export approved notifications as read
      this.notificationStore.notifications
        .filter((n) => n.type === 'export_approved' && !n.read)
        .forEach((n) => this.notificationStore.markAsRead(n.id));
    },
    deleteNotification(notificationId) {
      this.notificationStore.deleteNotification(notificationId);
    },
    deleteExport(exportId) {
      // Xóa export khỏi danh sách approved
      this.approvedExports = this.approvedExports.filter((exp) => exp._id !== exportId);
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
    goToInvoicesTab() {
      this.activeTab = 'invoices';
      this.isNotifOpen = false;
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
    initializeSocket() {
      // Connect to Socket.IO
      const socket = socketService.connect();

      // Join staff room
      if (socket) {
        socket.emit('join-room', 'staff');
      }

      // Listen for export-approved events
      socketService.on('export-approved', (data) => {
        console.log('Staff received export-approved:', data);
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
      // Fallback polling mỗi 30 giây thay vì 15 giây
      this.pollTimer = setInterval(() => {
        this.fetchApprovedExports();
      }, 30000);
    },

    async fetchApprovedExports() {
      try {
        const response = await axios.get('/api/export-receipts', {
          params: { status: 'approved', limit: 20 },
        });
        const list = response.data?.exportReceipts || [];
        this.approvedExports = list;
      } catch (error) {
        console.warn('Failed to load approved exports', error);
        this.approvedExports = [];
      }
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
