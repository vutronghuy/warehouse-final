<template>
  <div class="ml-64 bg-white shadow-sm border-b border-gray-200">
    <div class="flex justify-between items-center px-8 py-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Admin</h1>
        <p class="text-sm text-gray-600">
          Welcome back, <span class="text-blue-700">{{ userFullName }}</span>
        </p>
      </div>

      <div class="flex items-center gap-4">
        <!-- Notifications: Export receipts awaiting admin approval -->
        <div class="relative">
          <div
            @click="toggleNotif"
            class="relative p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#6A4C93] focus:ring-opacity-50"
            aria-label="Export approval notifications"
          >
            <BellOutlined class="w-6 h-5 text-gray-600" />
            <span
              v-if="unreadApprovalCount > 0"
              class="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-red-600 rounded-full min-w-[20px]"
            >
              {{ unreadApprovalCount }}
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
              class="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50"
            >
              <div class="px-4 py-2 text-sm font-semibold text-gray-700">Thông báo</div>

              <!-- Real-time Notifications -->
              <div
                v-if="notificationStore.getUnreadNotifications.length > 0"
                class="border-b border-gray-100"
              >
                <div class="px-4 py-2 text-xs font-medium text-gray-600 bg-blue-50">🔔 Thông báo mới</div>
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

              <!-- Pending Approvals -->
              <div v-if="pendingApprovals.length > 0" class="border-b border-gray-100">
                <div class="px-4 py-2 text-xs font-medium text-gray-600 bg-yellow-50">
                  Phiếu export chờ duyệt
                </div>
                <ul class="max-h-40 overflow-auto">
                  <li v-for="r in pendingApprovals" :key="r._id" class="px-4 py-2 hover:bg-gray-50">
                    <div class="flex items-center justify-between text-sm">
                      <div class="font-medium text-gray-800 truncate flex-1">
                        {{ r.receiptNumber || r._id }}
                      </div>
                      <div class="flex items-center gap-2">
                        <span
                          class="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800"
                          >Reviewed</span
                        >
                        <button
                          @click="deletePendingApproval(r._id)"
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
                    <div class="text-xs text-gray-500">Khách hàng: {{ r.customerName || 'N/A' }}</div>
                    <div v-if="r.createdAt" class="text-gray-400 mt-1">📅 {{ formatTime(r.createdAt) }}</div>
                  </li>
                </ul>
              </div>

              <div
                v-if="!notificationStore.getUnreadNotifications.length && !pendingApprovals.length"
                class="px-4 py-3 text-sm text-gray-500"
              >
                Không có thông báo mới
              </div>

              <div class="px-4 py-2 border-t border-gray-100 flex justify-between">
                <router-link to="/admin/export-approval" class="text-sm text-[#6A4C93] hover:underline"
                  >Tới trang duyệt</router-link
                >
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
              <div class="text-xs text-gray-500">Admin</div>
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
      isNotifOpen: false,
      pendingApprovals: [],
      isFirstLoad: true, // Track if this is the first load after page reload
      hasViewedNotifications: false, // Track if user has viewed notifications
      previousCount: 0, // Track previous count for detecting new approvals
      pollTimer: null, // Polling timer
      showNewNotice: false, // Show new notice indicator
      lastApprovalIds: new Set(), // Track IDs of approvals we've already seen
    };
  },
  computed: {
    userFullName() {
      const u = this.currentUserObj || this._loadUserFromStorage();
      if (!u) return 'User';
      if (u.admin && u.admin.fullName) return u.admin.fullName;
      if (u.manager && u.manager.fullName) return u.manager.fullName;
      if (u.staff && u.staff.fullName) return u.staff.fullName;
      if (u.accounter && u.accounter.fullName) return u.accounter.fullName;
      if (u.fullName) return u.fullName;
      if (u.name) return u.name;
      return 'User';
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
    unreadApprovalCount() {
      // Chỉ hiển thị notification count (không cộng dồn với pendingApprovals)
      const count = this.notificationStore.unreadCount;
      console.log('📊 unreadApprovalCount computed:', count);
      return count;
    },
  },
  mounted() {
    console.log('🚀 headbar.vue mounted - unreadCount:', this.notificationStore.unreadCount);

    // Clear all notifications on page load/reload
    this.notificationStore.clearOnPageLoad();

    this.fetchPendingApprovals();

    // Initialize Socket.IO connection
    this.initializeSocket();

    // Watch for notification changes
    this.$watch(
      () => this.notificationStore.unreadCount,
      (newCount, oldCount) => {
        console.log('👀 Notification count changed:', oldCount, '->', newCount);
        if (newCount > oldCount) {
          this.showNewNotice = true;
        }
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
    deletePendingApproval(approvalId) {
      this.pendingApprovals = this.pendingApprovals.filter((r) => r._id !== approvalId);
    },
    deleteNotification(notificationId) {
      this.notificationStore.deleteNotification(notificationId);
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

      // Join admin room
      if (socket) {
        socket.emit('join-room', 'admins');
      }

      // Listen for export-created events (new exports from staff)
      socketService.on('export-created', (data) => {
        console.log('Admin received export-created:', data);
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
        this.fetchPendingApprovals();
      }, 30000);
    },

    async fetchPendingApprovals() {
      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        const response = await axios.get('/api/export-receipts', {
          params: { status: 'reviewed', limit: 20 },
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const list = response.data?.exportReceipts || [];

        console.log(
          '🔍 fetchPendingApprovals - Current list:',
          list.length,
          'Previous:',
          this.previousCount,
          'FirstLoad:',
          this.isFirstLoad,
        );

        // detect new items to show notice
        if (Array.isArray(list)) {
          const currentIds = new Set(list.map((item) => item._id));

          // Tìm các approval mới (có trong current nhưng không có trong lastApprovalIds)
          const newApprovals = list.filter((item) => !this.lastApprovalIds.has(item._id));

          console.log('🔍 Current IDs:', Array.from(currentIds));
          console.log('🔍 Last seen IDs:', Array.from(this.lastApprovalIds));
          console.log('🔍 New approvals found:', newApprovals.length);

          // Tạo notification cho các approval mới (không phải lần đầu load)
          if (newApprovals.length > 0 && !this.isFirstLoad) {
            console.log('🔔 Creating notification for new approvals:', newApprovals.length);
            this.showNewNotice = true;
            // Reset viewed flag when there are new items (user needs to see them)
            this.hasViewedNotifications = false;

            // Tạo notification cho từng approval mới
            newApprovals.forEach((approvalItem) => {
              console.log('📝 Adding notification for:', approvalItem.receiptNumber || approvalItem._id);
              this.notificationStore.addNotification({
                type: 'approval_created',
                title: '🔔 Phiếu Export Đã Được Review',
                message: `Phiếu ${approvalItem.receiptNumber || approvalItem._id} - ${approvalItem.customerName || 'N/A'} đã được manager review và chờ admin approval`,
                data: approvalItem,
              });
            });
          }

          // Cập nhật lastApprovalIds và isFirstLoad
          this.lastApprovalIds = currentIds;
          this.isFirstLoad = false; // Mark as not first load after this call
        }

        this.pendingApprovals = list;
        console.log('📊 Updated pendingApprovals:', this.pendingApprovals.length);
        console.log('📊 Notification store unreadCount:', this.notificationStore.unreadCount);
      } catch (e) {
        console.warn('Failed to load pending export approvals', e);
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
