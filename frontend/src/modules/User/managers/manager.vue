<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Sidebar -->
    <ManagerSidebar />

    <!-- Top Header -->
    <ManagerHeader />
    <!-- Main Content -->
    <div class="ml-64 p-8">
      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <!-- Total Users -->
        <div class="bg-white overflow-hidden shadow rounded-lg">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <svg class="h-6 w-6 text-[#6A4C93]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                  />
                </svg>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 truncate">Total Users</dt>
                  <dd class="text-lg font-medium text-gray-900">{{ stats.totalUsers }}</dd>
                </dl>
              </div>
            </div>
          </div>
          <div class="bg-gray-50 px-5 py-3">
            <div class="text-sm">
              <router-link to="/manager/users" class="font-medium text-[#6A4C93] hover:text-[#8E63B9]">
                View all users
              </router-link>
            </div>
          </div>
        </div>

        <!-- Pending Exports -->
        <div class="bg-white overflow-hidden shadow rounded-lg">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <svg class="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 truncate">Pending Exports</dt>
                  <dd class="text-lg font-medium text-gray-900">{{ stats.pendingExports }}</dd>
                </dl>
              </div>
            </div>
          </div>
          <div class="bg-gray-50 px-5 py-3">
            <div class="text-sm">
              <router-link to="/manager/export-review" class="font-medium text-red-600 hover:text-red-500">
                Review exports
              </router-link>
            </div>
          </div>
        </div>

        <!-- Total Products -->
        <div class="bg-white overflow-hidden shadow rounded-lg">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <svg class="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 truncate">Total Products</dt>
                  <dd class="text-lg font-medium text-gray-900">{{ stats.totalProducts }}</dd>
                </dl>
              </div>
            </div>
          </div>
          <div class="bg-gray-50 px-5 py-3">
            <div class="text-sm">
              <span class="font-medium text-green-600">In your warehouse</span>
            </div>
          </div>
        </div>

        <!-- Low Stock Items -->
        <div class="bg-white overflow-hidden shadow rounded-lg">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <svg class="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 truncate">Low Stock Items</dt>
                  <dd class="text-lg font-medium text-gray-900">{{ stats.lowStockItems }}</dd>
                </dl>
              </div>
            </div>
          </div>
          <div class="bg-gray-50 px-5 py-3">
            <div class="text-sm">
              <span class="font-medium text-yellow-600">Need attention</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Activity -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Recent Export Requests -->
        <div class="bg-white shadow rounded-lg">
          <div class="px-6 py-4 border-b border-gray-200">
            <h3 class="text-lg font-medium text-gray-900">Recent Export Requests</h3>
          </div>
          <div class="p-6">
            <div v-if="recentExports.length === 0" class="text-center text-gray-500 py-4">
              No recent export requests
            </div>
            <div v-else class="space-y-4">
              <div
                v-for="exportItem in recentExports"
                :key="exportItem._id"
                class="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <div class="font-medium text-gray-900">{{ exportItem.receiptNumber }}</div>
                  <div class="text-sm text-gray-500">{{ exportItem.customerName }}</div>
                </div>
                <div class="text-right">
                  <span
                    :class="getStatusClass(exportItem.status)"
                    class="inline-flex px-2 py-1 text-xs font-semibold rounded-full"
                  >
                    {{ getStatusText(exportItem.status) }}
                  </span>
                  <div class="text-sm text-gray-500 mt-1">${{ exportItem.totalAmount.toFixed(2) }}</div>
                </div>
              </div>
            </div>
            <div class="mt-4 text-center">
              <router-link
                to="/manager/export-review"
                class="text-[#6A4C93] hover:text-[#8E63B9] font-medium"
              >
                View all exports →
              </router-link>
            </div>
          </div>
        </div>

        <!-- Warehouse Users -->
        <div class="bg-white shadow rounded-lg">
          <div class="px-6 py-4 border-b border-gray-200">
            <h3 class="text-lg font-medium text-gray-900">Warehouse Team</h3>
          </div>
          <div class="p-6">
            <div v-if="recentUsers.length === 0" class="text-center text-gray-500 py-4">No users found</div>
            <div v-else class="space-y-4">
              <div v-for="user in recentUsers" :key="user._id" class="flex items-center justify-between">
                <div class="flex items-center">
                  <div
                    class="w-8 h-8 bg-gradient-to-br from-[#6A4C93] to-[#8E63B9] rounded-full flex items-center justify-center text-white text-sm font-semibold"
                  >
                    {{ getUserInitials(user) }}
                  </div>
                  <div class="ml-3">
                    <div class="font-medium text-gray-900">{{ getUserFullName(user) }}</div>
                    <div class="text-sm text-gray-500">{{ user.role }}</div>
                  </div>
                </div>
                <span
                  :class="
                    getUserStatus(user) === 'active'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  "
                  class="inline-flex px-2 py-1 text-xs font-semibold rounded-full"
                >
                  {{ getUserStatus(user) }}
                </span>
              </div>
            </div>
            <div class="mt-4 text-center">
              <router-link to="/manager/users" class="text-[#6A4C93] hover:text-[#8E63B9] font-medium">
                View all users →
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import ManagerSidebar from './ManagerSidebar.vue';
import ManagerHeader from './managerHeader.vue';

export default {
  name: 'ManagerDashboard',
  components: {
    ManagerSidebar,
    ManagerHeader,
  },
  data() {
    return {
      userInfo: null,
      warehouseInfo: null,
      stats: {
        totalUsers: 0,
        pendingExports: 0,
        totalProducts: 0,
        lowStockItems: 0,
      },
      recentExports: [],
      recentUsers: [],
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
  },
  mounted() {
    this.loadDashboardData();
  },
  methods: {
    async loadDashboardData() {
      await this.loadUserInfo();
      await this.loadWarehouseInfo();
      await this.loadStats();
      await this.loadRecentExports();
      await this.loadRecentUsers();
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

    async loadWarehouseInfo() {
      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (!token) return;

        const userResponse = await axios.get('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (userResponse.data.success && userResponse.data.user.manager?.warehouseId) {
          const warehouseResponse = await axios.get(
            `/api/warehouses/${userResponse.data.user.manager.warehouseId}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            },
          );

          if (warehouseResponse.data.success) {
            this.warehouseInfo = warehouseResponse.data.warehouse;
          }
        }
      } catch (error) {
        console.error('Error loading warehouse info:', error);
        // Fallback: try to get from localStorage
        const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user');
        if (storedUser) {
          try {
            const user = JSON.parse(storedUser);
            if (user.manager?.warehouseId) {
              const token = localStorage.getItem('token') || sessionStorage.getItem('token');
              const warehouseResponse = await axios.get(`/api/warehouses/${user.manager.warehouseId}`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              if (warehouseResponse.data.success) {
                this.warehouseInfo = warehouseResponse.data.warehouse;
              }
            }
          } catch (e) {
            console.error('Error using stored user info:', e);
          }
        }
      }
    },

    async loadStats() {
      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');

        // Load users count
        const usersResponse = await axios.get('/api/users', {
          headers: { Authorization: `Bearer ${token}` },
        });
        this.stats.totalUsers = usersResponse.data.count || 0;

        // Load pending exports count
        const exportsResponse = await axios.get('/api/export-receipts', {
          params: { status: 'created' },
          headers: { Authorization: `Bearer ${token}` },
        });
        this.stats.pendingExports = exportsResponse.data.exportReceipts?.length || 0;

        // Load products count
        const productsResponse = await axios.get('/api/products', {
          params: { all: 'true' },
          headers: { Authorization: `Bearer ${token}` },
        });
        this.stats.totalProducts = productsResponse.data.products?.length || 0;

        // Calculate low stock items
        const products = productsResponse.data.products || [];
        this.stats.lowStockItems = products.filter(
          (product) => product.quantity <= product.minStockLevel,
        ).length;
      } catch (error) {
        console.error('Error loading stats:', error);
      }
    },

    async loadRecentExports() {
      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        const response = await axios.get('/api/export-receipts', {
          params: { limit: 5 },
          headers: { Authorization: `Bearer ${token}` },
        });
        this.recentExports = response.data.exportReceipts || [];
      } catch (error) {
        console.error('Error loading recent exports:', error);
      }
    },

    async loadRecentUsers() {
      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        const response = await axios.get('/api/users', {
          params: { limit: 5 },
          headers: { Authorization: `Bearer ${token}` },
        });
        this.recentUsers = response.data.users || [];
      } catch (error) {
        console.error('Error loading recent users:', error);
      }
    },

    getStatusClass(status) {
      const classes = {
        created: 'bg-yellow-100 text-yellow-800',
        reviewed: 'bg-blue-100 text-blue-800',
        approved: 'bg-green-100 text-green-800',
        rejected: 'bg-red-100 text-red-800',
      };
      return classes[status] || 'bg-gray-100 text-gray-800';
    },

    getStatusText(status) {
      const texts = {
        created: 'Pending Review',
        reviewed: 'Reviewed',
        approved: 'Approved',
        rejected: 'Rejected',
      };
      return texts[status] || status;
    },

    getUserFullName(user) {
      if (user.role === 'staff' && user.staff?.fullName) {
        return user.staff.fullName;
      } else if (user.role === 'accounter' && user.accounter?.fullName) {
        return user.accounter.fullName;
      }
      return 'Unknown User';
    },

    getUserStatus(user) {
      if (user.role === 'staff' && user.staff?.status) {
        return user.staff.status;
      } else if (user.role === 'accounter' && user.accounter?.status) {
        return user.accounter.status;
      }
      return 'unknown';
    },

    getUserInitials(user) {
      const name = this.getUserFullName(user);
      return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    },

  },
};
</script>

<style scoped>
/* Ensure dropdown appears above other elements */
.relative {
  z-index: 50;
}
</style>
