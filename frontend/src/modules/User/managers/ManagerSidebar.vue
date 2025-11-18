<template>
  <div class="h-screen w-64 bg-white shadow-lg fixed left-0 top-0 z-40">
    <!-- Header with gradient background -->
    <div class="bg-gradient-to-br from-[#6A4C93] to-[#8E63B9] p-4 shadow-lg relative overflow-hidden">
      <!-- Subtle pattern overlay -->
      <div class="absolute inset-0 bg-white/5"></div>

      <!-- User avatar/icon -->
      <div class="relative flex items-center mb-3">
        <div class="w-10 h-10 bg-white/20 text-white rounded-full flex items-center justify-center border border-white/30 mr-3 font-semibold">
           {{ userInitials }}
        </div>
        <div>
          <div class="text-white text-lg font-bold tracking-wide">{{ userFullName }}</div>
          <div class="text-white/80 text-sm">Manager</div>
        </div>
      </div>

      <div class="text-white/70 text-xs uppercase tracking-wider">Warehouse Management</div>
    </div>

    <!-- Warehouse Info with purple theme -->
    <div v-if="warehouseInfo" class="mt-4 mx-3 p-3 bg-[#F4EEFB] rounded-lg border border-purple-100">
      <div class="flex items-center justify-between mb-2">
        <div class="text-xs font-medium text-[#6A4C93] uppercase tracking-wider">Warehouse</div>
        <div
          :class="
            warehouseInfo.status === 'active'
              ? 'bg-green-500/20 text-green-600 border border-green-500/30'
              : 'bg-red-500/20 text-red-400 border border-red-500/30'
          "
          class="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full"
        >
          <div
            :class="warehouseInfo.status === 'active' ? 'bg-green-400' : 'bg-red-400'"
            class="w-1.5 h-1.5 rounded-full mr-1"
          ></div>
          {{ warehouseInfo.status }}
        </div>
      </div>
      <div class="font-medium text-gray-800 text-sm mb-1">{{ warehouseInfo.name }}</div>
      <div class="text-gray-600 text-xs flex items-center">
        <svg class="w-3 h-3 mr-1 text-[#6A4C93]" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" />
        </svg>
        {{ warehouseInfo.location }}
      </div>
    </div>

    <!-- Navigation Menu -->
    <nav class="mt-6">
      <div class="px-4 py-2">
        <h3 class="text-xs font-semibold text-[#8A7FAF] uppercase tracking-wider">Menu</h3>
      </div>

      <!-- Dashboard -->
      <router-link
        to="/manager"
        :class="[
          'flex items-center px-4 py-3 mx-2 rounded-lg text-sm font-medium transition-all duration-200',
          $route.path === '/manager'
            ? 'bg-[#EDE7F6] text-[#6A4C93] shadow-sm'
            : 'text-[#8A7FAF] hover:bg-[#D8C9F1] hover:text-[#6A4C93]',
        ]"
      >
        <svg
          class="w-5 h-5 mr-3 transition-colors duration-200"
          :class="$route.path === '/manager' ? 'text-[#6A4C93]' : 'text-[#8A7FAF]'"
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
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z"
          />
        </svg>
        Dashboard
      </router-link>

      <!-- Users Management -->
      <router-link
        to="/manager/users"
        :class="[
          'flex items-center px-4 py-3 mx-2 rounded-lg text-sm font-medium transition-all duration-200',
          $route.path === '/manager/users'
            ? 'bg-[#EDE7F6] text-[#6A4C93] shadow-sm'
            : 'text-[#8A7FAF] hover:bg-[#D8C9F1] hover:text-[#6A4C93]',
        ]"
      >
        <svg
          class="w-5 h-5 mr-3 transition-colors duration-200"
          :class="$route.path === '/manager/users' ? 'text-[#6A4C93]' : 'text-[#8A7FAF]'"
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

      <!-- Export Review -->
      <router-link
        to="/manager/export-review"
        :class="[
          'flex items-center px-4 py-3 mx-2 rounded-lg text-sm font-medium transition-all duration-200',
          $route.path === '/manager/export-review'
            ? 'bg-[#EDE7F6] text-[#6A4C93] shadow-sm'
            : 'text-[#8A7FAF] hover:bg-[#D8C9F1] hover:text-[#6A4C93]',
        ]"
      >
        <svg
          class="w-5 h-5 mr-3 transition-colors duration-200"
          :class="$route.path === '/manager/export-review' ? 'text-[#6A4C93]' : 'text-[#8A7FAF]'"
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
        Export Review
        <span
          v-if="pendingExports > 0"
          class="ml-auto bg-red-500 text-white text-xs font-medium px-2.5 py-1 rounded-full shadow-sm animate-pulse"
        >
          {{ pendingExports }}
        </span>
      </router-link>
    </nav>

    <!-- Footer with subtle branding -->
    <div class="absolute bottom-0 left-0 right-0 p-4">
      <div class="text-center">
        <div class="w-8 h-1 bg-gradient-to-r from-[#6A4C93] to-[#8E63B9] rounded-full mx-auto mb-2"></div>
        <div class="text-xs text-[#8A7FAF]">Warehouse Manager</div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import socketService from '@/services/socketService';

export default {
  name: 'ManagerSidebar',
  data() {
    return {
      userInfo: null,
      warehouseInfo: null,
      pendingExports: 0,
      loadStatsTimeout: null, // Debounce timeout
    };
  },
  computed: {
    userFullName() {
      // Lấy fullName từ role-specific object
      if (this.userInfo?.role === 'manager' && this.userInfo.manager?.fullName) {
        return this.userInfo.manager.fullName;
      }
      // Fallback: lấy từ localStorage nếu có
      const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user');
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          if (parsed.manager?.fullName) {
            return parsed.manager.fullName;
          }
        } catch (e) {
          console.warn('Error parsing stored user:', e);
        }
      }
      return 'Manager';
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
    this.loadWarehouseInfo();
    this.loadStats();
    // Initialize Socket.IO connection
    this.initializeSocket();
  },
  beforeUnmount() {
    // Clear timeout
    if (this.loadStatsTimeout) {
      clearTimeout(this.loadStatsTimeout);
    }
    // Remove event listeners
    if (this.handleExportCreated) {
      window.removeEventListener('export-created', this.handleExportCreated);
    }
    if (this.handleExportStatusChanged) {
      window.removeEventListener('export-status-changed', this.handleExportStatusChanged);
    }
    if (this.handleExportApproved) {
      window.removeEventListener('export-approved', this.handleExportApproved);
    }
    if (this.handleExportRejected) {
      window.removeEventListener('export-rejected', this.handleExportRejected);
    }
    // Disconnect Socket.IO
    socketService.disconnect();
  },
  methods: {
    async loadUserInfo() {
      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (!token) {
          console.warn('No token found');
          return;
        }

        console.log('🔄 Loading user info...');
        const response = await axios.get('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });

        console.log('✅ User info response:', response.data);

        if (response.data.success) {
          this.userInfo = response.data.user;
          console.log('✅ User info loaded:', {
            role: this.userInfo.role,
            fullName: this.userFullName,
            warehouseId: this.userInfo.manager?.warehouseId,
          });
        }
      } catch (error) {
        console.error('❌ Error loading user info:', error);
        console.error('❌ Error details:', {
          status: error.response?.status,
          message: error.response?.data?.message,
          url: error.config?.url,
        });

        // Fallback: try to get user info from localStorage
        const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user');
        if (storedUser) {
          try {
            this.userInfo = JSON.parse(storedUser);
            console.log('📦 Using stored user info:', this.userInfo);
          } catch (e) {
            console.error('Error parsing stored user:', e);
          }
        }
      }
    },

    async loadWarehouseInfo() {
      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (!token || !this.userInfo?.manager?.warehouseId) return;

        const response = await axios.get(`/api/warehouses/${this.userInfo.manager.warehouseId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data.success) {
          this.warehouseInfo = response.data.warehouse;
        }
      } catch (error) {
        console.error('Error loading warehouse info:', error);
      }
    },

    async loadStats() {
      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (!token) return;

        // Load user count (if needed in future)
        // const usersResponse = await axios.get('/api/users', {
        //   headers: { Authorization: `Bearer ${token}` },
        // });

        // Load pending exports count
        const exportsResponse = await axios.get('/api/export-receipts', {
          params: { status: 'created' },
          headers: { Authorization: `Bearer ${token}` },
        });
        if (exportsResponse.data.exportReceipts) {
          const newCount = exportsResponse.data.exportReceipts.length;
          // Chỉ log khi count thực sự thay đổi
          if (this.pendingExports !== newCount) {
            console.log('📊 ManagerSidebar - Updating pendingExports count:', this.pendingExports, '->', newCount);
            this.pendingExports = newCount;
          }
        }
      } catch (error) {
        console.error('Error loading stats:', error);
      }
    },

    // Debounced version of loadStats
    debouncedLoadStats() {
      if (this.loadStatsTimeout) {
        clearTimeout(this.loadStatsTimeout);
      }
      this.loadStatsTimeout = setTimeout(() => {
        this.loadStats();
      }, 500); // 500ms debounce
    },

    initializeSocket() {
      console.log('🚀 Initializing Socket.IO for ManagerSidebar...');
      // Connect to Socket.IO
      const socket = socketService.connect();

      // Join manager room
      if (socket) {
        console.log('🏠 Joining manager room...');
        socket.emit('join-room', 'managers');
        console.log('✅ ManagerSidebar socket connected and joined managers room');
      } else {
        console.warn('⚠️ Socket not available, pending exports count will not update in real-time');
      }

      // Listen for custom events from socket service
      this.handleExportCreated = (event) => {
        const data = event.detail;
        console.log('📦 ManagerSidebar - Export created:', data);
        // Update count immediately
        const oldCount = this.pendingExports;
        this.pendingExports += 1;
        console.log('📊 ManagerSidebar - Updated pendingExports count:', oldCount, '->', this.pendingExports);
        // Also refresh from API to ensure accuracy
        this.debouncedLoadStats();
      };

      this.handleExportStatusChanged = (event) => {
        const data = event.detail;
        console.log('📦 ManagerSidebar - Export status changed:', data);
        // Update count immediately (decrease because export is no longer pending)
        if (this.pendingExports > 0) {
          const oldCount = this.pendingExports;
          this.pendingExports -= 1;
          console.log('📊 ManagerSidebar - Updated pendingExports count:', oldCount, '->', this.pendingExports);
        }
        // Also refresh from API to ensure accuracy
        this.debouncedLoadStats();
      };

      this.handleExportApproved = (event) => {
        const data = event.detail;
        console.log('✅ ManagerSidebar - Export approved:', data);
        // Refresh pending exports count
        this.debouncedLoadStats();
      };

      this.handleExportRejected = (event) => {
        const data = event.detail;
        console.log('❌ ManagerSidebar - Export rejected:', data);
        // Refresh pending exports count
        this.debouncedLoadStats();
      };

      // Add event listeners
      window.addEventListener('export-created', this.handleExportCreated);
      window.addEventListener('export-status-changed', this.handleExportStatusChanged);
      window.addEventListener('export-approved', this.handleExportApproved);
      window.addEventListener('export-rejected', this.handleExportRejected);
    },
  },
  watch: {
    userInfo: {
      handler() {
        if (this.userInfo) {
          this.loadWarehouseInfo();
        }
      },
      deep: true,
    },
  },
};
</script>

<style scoped>
/* Custom scrollbar for sidebar */
.sidebar-scroll::-webkit-scrollbar {
  width: 4px;
}

.sidebar-scroll::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.sidebar-scroll::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 2px;
}

.sidebar-scroll::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* Smooth transitions for all interactive elements */
* {
  transition: all 0.2s ease;
}
</style>
