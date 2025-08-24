<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Sidebar -->
    <ManagerSidebar />

    <!-- Top Header -->
    <ManagerHeader />

    <!-- Main Content -->
    <div class="ml-64 p-8">
      <!-- Filters -->
      <div class="bg-white shadow rounded-lg p-6 mb-6">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Role</label>
            <select
              v-model="filters.role"
              @change="fetchUsers"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Roles</option>
              <option value="staff">Staff</option>
              <option value="accounter">Accounter</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              v-model="filters.status"
              @change="fetchUsers"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <input
              v-model="filters.search"
              @input="debounceSearch"
              type="text"
              placeholder="Name or email..."
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div class="flex items-end">
            <button
              @click="resetFilters"
              class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      <!-- Users Table -->
      <div class="bg-white shadow rounded-lg overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-200">
          <h3 class="text-lg font-medium text-gray-900">Warehouse Users</h3>
        </div>

        <div v-if="isLoading" class="p-8 text-center">
          <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p class="mt-2 text-gray-600">Loading users...</p>
        </div>

        <div v-else-if="users.length === 0" class="p-8 text-center text-gray-500">
          No users found in your warehouse.
        </div>

        <div v-else class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="user in users" :key="user._id" class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <div
                      class="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold"
                    >
                      {{ getUserInitials(user) }}
                    </div>
                    <div class="ml-4">
                      <div class="text-sm font-medium text-gray-900">{{ getUserFullName(user) }}</div>
                      <div class="text-sm text-gray-500">{{ getUserEmail(user) }}</div>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span
                    class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800"
                  >
                    {{ user.role }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div>{{ getUserPhone(user) || 'N/A' }}</div>
                  <div class="text-gray-500">{{ getUserAddress(user) || 'N/A' }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
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
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ formatDate(user.createdAt) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button @click="viewUser(user)" class="text-blue-600 hover:text-blue-900 mr-3">View</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div v-if="pagination && pagination.totalPages > 1" class="px-6 py-4 border-t border-gray-200">
          <div class="flex items-center justify-between">
            <div class="text-sm text-gray-700">
              Showing {{ (pagination.currentPage - 1) * 10 + 1 }} to
              {{ Math.min(pagination.currentPage * 10, pagination.totalUsers) }} of
              {{ pagination.totalUsers }} results
            </div>
            <div class="flex space-x-2">
              <button
                @click="changePage(pagination.currentPage - 1)"
                :disabled="!pagination.hasPrev"
                class="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                @click="changePage(pagination.currentPage + 1)"
                :disabled="!pagination.hasNext"
                class="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- View User Modal -->
      <div
        v-if="showViewModal"
        class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
      >
        <div
          class="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white"
        >
          <div class="mt-3">
            <div class="flex justify-between items-center mb-4">
              <h3 class="text-lg font-medium text-gray-900">User Details</h3>
              <button @click="closeViewModal" class="text-gray-400 hover:text-gray-600">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div v-if="selectedUser" class="space-y-6">
              <!-- Basic Info -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="space-y-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700">Full Name</label>
                    <p class="mt-1 text-sm text-gray-900">{{ getUserFullName(selectedUser) }}</p>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700">Email</label>
                    <p class="mt-1 text-sm text-gray-900">{{ getUserEmail(selectedUser) }}</p>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700">Phone</label>
                    <p class="mt-1 text-sm text-gray-900">{{ getUserPhone(selectedUser) || 'N/A' }}</p>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700">Address</label>
                    <p class="mt-1 text-sm text-gray-900">{{ getUserAddress(selectedUser) || 'N/A' }}</p>
                  </div>
                </div>
                <div class="space-y-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700">Role</label>
                    <span
                      class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800"
                    >
                      {{ selectedUser.role }}
                    </span>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700">Status</label>
                    <span
                      :class="
                        getUserStatus(selectedUser) === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      "
                      class="inline-flex px-2 py-1 text-xs font-semibold rounded-full"
                    >
                      {{ getUserStatus(selectedUser) }}
                    </span>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700">Joined Date</label>
                    <p class="mt-1 text-sm text-gray-900">{{ formatDateTime(selectedUser.createdAt) }}</p>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700">Last Updated</label>
                    <p class="mt-1 text-sm text-gray-900">{{ formatDateTime(selectedUser.updatedAt) }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Success/Error Messages -->
      <div v-if="message" :class="messageClass" class="fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50">
        {{ message }}
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import ManagerSidebar from './ManagerSidebar.vue';
import ManagerHeader from './managerHeader.vue';

export default {
  name: 'ManagerUsers',
  components: {
    ManagerSidebar,
    ManagerHeader,
  },
  data() {
    return {
      isLoading: false,
      message: '',
      messageType: '',
      users: [],
      userInfo: null,
      warehouseInfo: null,
      pagination: null,
      currentPage: 1,
      filters: {
        role: '',
        status: '',
        search: '',
      },
      searchTimeout: null,
      showViewModal: false,
      selectedUser: null,
    };
  },
  computed: {
    messageClass() {
      return this.messageType === 'success'
        ? 'bg-green-50 text-green-800 border border-green-200'
        : 'bg-red-50 text-red-800 border border-red-200';
    },
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
    this.fetchUsers();
  },
  methods: {
    async loadUserInfo() {
      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (!token) return;

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

    async fetchUsers() {
      this.isLoading = true;
      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        const params = {
          page: this.currentPage,
          limit: 10,
        };

        if (this.filters.role) params.role = this.filters.role;
        if (this.filters.status) params.status = this.filters.status;
        if (this.filters.search) params.search = this.filters.search;

        const response = await axios.get('/api/users', {
          params,
          headers: { Authorization: `Bearer ${token}` },
        });

        this.users = response.data.users || [];
        this.pagination = {
          currentPage: this.currentPage,
          totalPages: Math.ceil(response.data.count / 10),
          totalUsers: response.data.count,
          hasNext: this.currentPage * 10 < response.data.count,
          hasPrev: this.currentPage > 1,
        };
      } catch (error) {
        console.error('Error fetching users:', error);
        this.showMessage('Failed to load users', 'error');
      } finally {
        this.isLoading = false;
      }
    },

    debounceSearch() {
      clearTimeout(this.searchTimeout);
      this.searchTimeout = setTimeout(() => {
        this.currentPage = 1;
        this.fetchUsers();
      }, 500);
    },

    resetFilters() {
      this.filters = {
        role: '',
        status: '',
        search: '',
      };
      this.currentPage = 1;
      this.fetchUsers();
    },

    changePage(page) {
      if (page >= 1 && page <= this.pagination.totalPages) {
        this.currentPage = page;
        this.fetchUsers();
      }
    },

    viewUser(user) {
      this.selectedUser = user;
      this.showViewModal = true;
    },

    closeViewModal() {
      this.showViewModal = false;
      this.selectedUser = null;
    },

    getUserFullName(user) {
      if (user.role === 'staff' && user.staff?.fullName) {
        return user.staff.fullName;
      } else if (user.role === 'accounter' && user.accounter?.fullName) {
        return user.accounter.fullName;
      }
      return 'Unknown User';
    },

    getUserEmail(user) {
      if (user.role === 'staff' && user.staff?.email) {
        return user.staff.email;
      } else if (user.role === 'accounter' && user.accounter?.email) {
        return user.accounter.email;
      }
      return 'N/A';
    },

    getUserPhone(user) {
      if (user.role === 'staff' && user.staff?.phone) {
        return user.staff.phone;
      } else if (user.role === 'accounter' && user.accounter?.phone) {
        return user.accounter.phone;
      }
      return null;
    },

    getUserAddress(user) {
      if (user.role === 'staff' && user.staff?.address) {
        return user.staff.address;
      } else if (user.role === 'accounter' && user.accounter?.address) {
        return user.accounter.address;
      }
      return null;
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

    formatDate(dateString) {
      if (!dateString) return 'N/A';
      return new Date(dateString).toLocaleDateString();
    },

    formatDateTime(dateString) {
      if (!dateString) return 'N/A';
      return new Date(dateString).toLocaleString();
    },

    showMessage(text, type) {
      this.message = text;
      this.messageType = type;
      setTimeout(() => {
        this.message = '';
      }, 5000);
    },

  },
};
</script>
