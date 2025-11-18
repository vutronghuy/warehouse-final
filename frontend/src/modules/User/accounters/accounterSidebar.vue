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
          <div class="text-white/80 text-sm">Accounter</div>
        </div>
      </div>

      <div class="text-white/70 text-xs uppercase tracking-wider">Invoice Management</div>
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
        to="/accounter/dashboard"
        :class="[
          'flex items-center px-4 py-3 mx-2 rounded-lg text-sm font-medium transition-all duration-200',
          $route.path === '/accounter/dashboard'
            ? 'bg-[#EDE7F6] text-[#6A4C93] shadow-sm'
            : 'text-[#8A7FAF] hover:bg-[#D8C9F1] hover:text-[#6A4C93]',
        ]"
      >
        <svg
          class="w-5 h-5 mr-3 transition-colors duration-200"
          :class="$route.path === '/accounter/dashboard' ? 'text-[#6A4C93]' : 'text-[#8A7FAF]'"
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

      <!-- Invoice Review -->
      <router-link
        to="/accounter/invoices-review"
        :class="[
          'flex items-center px-4 py-3 mx-2 rounded-lg text-sm font-medium transition-all duration-200',
          $route.path === '/accounter/invoices-review'
            ? 'bg-[#EDE7F6] text-[#6A4C93] shadow-sm'
            : 'text-[#8A7FAF] hover:bg-[#D8C9F1] hover:text-[#6A4C93]',
        ]"
      >
        <svg
          class="w-5 h-5 mr-3 transition-colors duration-200"
          :class="$route.path === '/accounter/invoices-review' ? 'text-[#6A4C93]' : 'text-[#8A7FAF]'"
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
        Invoice Review
        <span
          v-if="pendingInvoices > 0"
          class="ml-auto bg-red-500 text-white text-xs font-medium px-2.5 py-1 rounded-full shadow-sm animate-pulse"
        >
          {{ pendingInvoices }}
        </span>
      </router-link>
    </nav>

    <!-- Footer with subtle branding -->
    <div class="absolute bottom-0 left-0 right-0 p-4">
      <div class="text-center">
        <div class="w-8 h-1 bg-gradient-to-r from-[#6A4C93] to-[#8E63B9] rounded-full mx-auto mb-2"></div>
        <div class="text-xs text-[#8A7FAF]">Invoice Accounter</div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import socketService from '@/services/socketService';

export default {
  name: 'AccounterSidebar',
  data() {
    return {
      userInfo: null,
      warehouseInfo: null,
      pendingInvoices: 0,
    };
  },
  computed: {
    userFullName() {
      // Lấy fullName từ role-specific object
      if (this.userInfo?.role === 'accounter' && this.userInfo.accounter?.fullName) {
        return this.userInfo.accounter.fullName;
      }
      // Fallback: lấy từ localStorage nếu có
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
  async mounted() {
    await this.loadUserInfo();
    await this.loadWarehouseInfo();
    await this.loadStats();
    this.initializeSocket();
  },
  beforeUnmount() {
    // Disconnect Socket.IO
    socketService.disconnect();
  },
  methods: {
    normalizeId(id) {
      if (!id) return null;
      if (typeof id === 'string') return id;
      if (typeof id === 'object') {
        if (id._id) return id._id;
        if (typeof id.toString === 'function') return id.toString();
      }
      return id || null;
    },

    getStoredUser() {
      const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user');
      if (!storedUser) return null;
      try {
        return JSON.parse(storedUser);
      } catch (error) {
        console.warn('Error parsing stored user info:', error);
        return null;
      }
    },

    getAccounterWarehouseId() {
      const fromUser = this.normalizeId(this.userInfo?.accounter?.warehouseId);
      if (fromUser) return fromUser;
      const stored = this.getStoredUser();
      return this.normalizeId(stored?.accounter?.warehouseId);
    },

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
            warehouseId: this.userInfo.accounter?.warehouseId,
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
        const storedUser = this.getStoredUser();
        if (storedUser) {
          this.userInfo = storedUser;
          console.log('📦 Using stored user info:', this.userInfo);
        }
      }
    },

    async loadWarehouseInfo() {
      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        const warehouseId = this.getAccounterWarehouseId();
        if (!token || !warehouseId) return;

        const response = await axios.get(`/api/warehouses/${warehouseId}`, {
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
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const warehouseId = this.getAccounterWarehouseId();

      if (!token || !warehouseId) {
        console.warn('Missing token or warehouseId, reset pending count to 0');
        this.pendingInvoices = 0;
        return;
      }

      try {
        const invoicesResponse = await axios.get('/api/invoices', {
          params: {
            status: 'pending_review',
            warehouseId,
            limit: 200,
          },
          headers: { Authorization: `Bearer ${token}` },
        });

        const invoices = Array.isArray(invoicesResponse.data?.invoices)
          ? invoicesResponse.data.invoices
          : [];

        const pendingInvoices = invoices.filter(
          (invoice) =>
            invoice?.status === 'pending_review' &&
            !invoice?.deletedAt &&
            this.normalizeId(invoice?.warehouseId) === warehouseId,
        );

        this.pendingInvoices = pendingInvoices.length;

        console.log('Sidebar pending invoices count updated:', {
          totalFetched: invoices.length,
          filtered: pendingInvoices.length,
        });
      } catch (error) {
        console.error('Error loading stats, reset pending count to 0:', error);
        this.pendingInvoices = 0;
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
        console.log('Sidebar received invoice-created:', data);
        // Reload stats to update count
        this.loadStats();
      });

      // Listen for invoice-approved events
      socketService.on('invoice-approved', (data) => {
        console.log('Sidebar received invoice-approved:', data);
        // Reload stats to update count
        this.loadStats();
      });

      // Listen for invoice-rejected events
      socketService.on('invoice-rejected', (data) => {
        console.log('Sidebar received invoice-rejected:', data);
        // Reload stats to update count
        this.loadStats();
      });

      // Listen for invoice-deleted events
      socketService.on('invoice-deleted', (data) => {
        console.log('Sidebar received invoice-deleted:', data);
        // Reload stats to update count
        this.loadStats();
      });
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
