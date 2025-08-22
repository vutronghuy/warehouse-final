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
          <div class="text-white/80 text-sm">Administrator</div>
        </div>
      </div>

      <div class="text-white/70 text-xs uppercase tracking-wider">System Administration</div>
    </div>

    <!-- Admin Info with blue theme -->
    <div v-if="adminInfo" class="mt-4 mx-3 p-3 bg-[#F4EEFB] rounded-lg border border-purple-100">
      <div class="flex items-center justify-between mb-2">
        <div class="text-xs font-medium text-[#6A4C93]  uppercase tracking-wider">Admin Warehouse</div>
        <div class="bg-green-500/20 text-green-600 border border-green-500/30 inline-flex items-center px-2 py-1 text-xs font-medium rounded-full">
          <div class="w-1.5 h-1.5 rounded-full mr-1 bg-green-400"></div>
          Active
        </div>
      </div>
      <div class="font-medium text-gray-800 text-sm mb-1">System Administrator</div>
      <div class="text-gray-600 text-xs flex items-center">
        <svg class="w-3 h-3 mr-1 text-[#1E40AF]" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clip-rule="evenodd" />
        </svg>
        Full System Access
      </div>
    </div>

    <!-- Navigation Menu -->
    <nav class="mt-6">
      <div class="px-4 py-2">
        <h3 class="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Menu</h3>
      </div>

      <!-- Users -->
      <router-link
        to="/admin"
        :class="[
          'flex items-center px-4 py-3 mx-2 rounded-lg text-sm font-medium transition-all duration-200',
          $route.path === '/admin'
            ? 'bg-[#EDE7F6] text-[#6A4C93] shadow-sm'
            : 'text-[#8A7FAF] hover:bg-[#D8C9F1] hover:text-[#6A4C93]',
        ]"
      >
        <svg
          class="w-5 h-5 mr-3 transition-colors duration-200"
          :class="$route.path === '/admin' ? 'text-[#6A4C93]' : 'text-[#8A7FAF]'"
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
        <span
          v-if="userCount > 0"
          class="ml-auto bg-[#6A4C93] text-white text-xs font-medium px-2.5 py-1 rounded-full shadow-sm"
        >
          {{ userCount }}
        </span>
      </router-link>

      <!-- Products -->
      <router-link
        to="/admin/products"
        :class="[
          'flex items-center px-4 py-3 mx-2 rounded-lg text-sm font-medium transition-all duration-200',
          $route.path === '/admin/products'
            ? 'bg-[#EDE7F6] text-[#6A4C93] shadow-sm'
            : 'text-[#8A7FAF] hover:bg-[#D8C9F1] hover:text-[#6A4C93]',
        ]"
      >
        <svg
          class="w-5 h-5 mr-3 transition-colors duration-200"
          :class="$route.path === '/admin/products' ? 'text-[#6A4C93]' : 'text-[#8A7FAF]'"
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
        Products
      </router-link>

      <!-- Export Approval -->
      <router-link
        to="/admin/export-approval"
        :class="[
          'flex items-center px-4 py-3 mx-2 rounded-lg text-sm font-medium transition-all duration-200',
          $route.path === '/admin/export-approval'
            ? 'bg-[#EDE7F6] text-[#6A4C93] shadow-sm'
            : 'text-[#8A7FAF] hover:bg-[#D8C9F1] hover:text-[#6A4C93]',
        ]"
      >
        <svg
          class="w-5 h-5 mr-3 transition-colors duration-200"
          :class="$route.path === '/admin/export-approval' ? 'text-[#6A4C93] ' : 'text-[#8A7FAF]'"
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
        Export Approval
        <span
          v-if="pendingApprovals > 0"
          class="ml-auto bg-red-500 text-white text-xs font-medium px-2.5 py-1 rounded-full shadow-sm animate-pulse"
        >
          {{ pendingApprovals }}
        </span>
      </router-link>
    </nav>

    <!-- Footer with subtle branding -->
    <div class="absolute bottom-0 left-0 right-0 p-4">
      <div class="text-center">
        <div class="w-8 h-1 bg-gradient-to-r from-[#6A4C93] to-[#8E63B9] rounded-full mx-auto mb-2"></div>
        <div class="text-xs text-[#8A7FAF]">System Administrator</div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'AdminSidebar',
  data() {
    return {
      userInfo: null,
      adminInfo: null,
      userCount: 0,
      pendingApprovals: 0,
    };
  },
  computed: {
    userFullName() {
      // Lấy fullName từ role-specific object
      if (this.userInfo?.role === 'admin' && this.userInfo.admin?.fullName) {
        return this.userInfo.admin.fullName;
      }
      // Fallback: lấy từ localStorage nếu có
      const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user');
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          if (parsed.admin?.fullName) {
            return parsed.admin.fullName;
          }
        } catch (e) {
          console.warn('Error parsing stored user:', e);
        }
      }
      return 'Administrator';
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
    this.loadStats();
  },
  methods: {
    async loadUserInfo() {
      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (!token) {
          console.warn('No token found');
          return;
        }

        console.log('🔄 Loading admin user info...');
        const response = await axios.get('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });

        console.log('✅ Admin user info response:', response.data);

        if (response.data.success) {
          this.userInfo = response.data.user;
          this.adminInfo = { status: 'active' }; // Set admin info
          console.log('✅ Admin user info loaded:', {
            role: this.userInfo.role,
            fullName: this.userFullName,
          });
        }
      } catch (error) {
        console.error('❌ Error loading admin user info:', error);

        // Fallback: try to get user info from localStorage
        const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user');
        if (storedUser) {
          try {
            this.userInfo = JSON.parse(storedUser);
            this.adminInfo = { status: 'active' };
            console.log('📦 Using stored admin user info:', this.userInfo);
          } catch (e) {
            console.error('Error parsing stored user:', e);
          }
        }
      }
    },

    async loadStats() {
      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (!token) return;

        // Load user count
        const usersResponse = await axios.get('/api/users', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (usersResponse.data.users) {
          this.userCount = usersResponse.data.users.length;
        }

        // Load pending approvals count
        const approvalsResponse = await axios.get('/api/export-receipts', {
          params: { status: 'reviewed' },
          headers: { Authorization: `Bearer ${token}` },
        });
        if (approvalsResponse.data.exportReceipts) {
          this.pendingApprovals = approvalsResponse.data.exportReceipts.length;
        }
      } catch (error) {
        console.error('Error loading admin stats:', error);
      }
    },
  },
  watch: {
    userInfo: {
      handler() {
        if (this.userInfo) {
          this.loadStats();
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
