<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Sidebar -->
    <AdminSidebar />

    <!-- Main Content with left margin to avoid sidebar overlap -->
    <HeadBar />
    <div class="ml-64 py-8">
      <main class="flex-1 overflow-auto bg-gray-50 p-8">
        <!-- Page Header -->
        <div class="flex items-center justify-between mb-8">
          <h2 class="text-3xl font-bold text-gray-900">User Management</h2>
        </div>

        <!-- Search Bar -->
        <div class="mb-6">
          <div class="relative max-w-md">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <input
              v-model="search"
              type="text"
              placeholder="Search users..."
              class="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-colors duration-150"
            />
          </div>
        </div>

        <!-- Users Table -->
        <div class="bg-white shadow-sm border border-gray-200 rounded-xl overflow-hidden">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  #
                </th>
                <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Name
                </th>
                <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Email
                </th>
                <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Role
                </th>

                <!-- NEW: Warehouse column -->
                <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Warehouse
                </th>

                <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-100">
              <tr
                v-for="(user, idx) in paginatedUsers"
                :key="user._id"
                class="hover:bg-gray-50 transition-colors duration-150"
              >
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {{ (currentPage - 1) * pageSize + idx + 1 }}
                </td>

                <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                  <div class="flex items-center">
                    <div
                      class="w-10 h-10 bg-gradient-to-br from-[#6A4C93] to-[#8E63B9] rounded-full flex items-center justify-center text-white font-semibold"
                    >
                      {{ getUserInitials(user) }}
                    </div>
                    <div class="ml-4">
                      <div class="text-sm font-medium text-gray-900">{{ getUserName(user) }}</div>
                    </div>
                  </div>
                </td>

                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {{ getUserEmail(user) }}
                </td>

                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{{ user.role }}</td>

                <!-- Warehouse display -->
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {{ getUserWarehouse(user) }}
                </td>

                <td class="px-6 py-4 whitespace-nowrap">
                  <span
                    :class="{
                      'inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full': true,
                      'bg-green-100 text-green-700': user.userStatus?.status === 'active',
                      'bg-red-100 text-red-700': user.userStatus?.status === 'inactive',
                    }"
                  >
                    {{ user.userStatus?.status === 'active' ? 'Active' : 'Inactive' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Pagination controls -->
          <div class="px-6 py-4 bg-white border-t flex items-center justify-between">
            <div class="text-sm text-gray-600">
              Hiển thị <span class="font-medium">{{ paginatedUsers.length }}</span> trên tổng
              <span class="font-medium">{{ filteredUsers.length }}</span> người dùng
            </div>

            <div class="flex items-center space-x-2">
              <button
                @click="prevPage"
                :disabled="currentPage === 1"
                class="px-3 py-1 rounded-md border disabled:opacity-50"
              >
                Prev
              </button>

              <template v-for="p in totalPages" :key="p">
                <button
                  @click="goToPage(p)"
                  :class="['px-3 py-1 rounded-md border', currentPage === p ? 'bg-slate-800 text-white' : '']"
                >
                  {{ p }}
                </button>
              </template>

              <button
                @click="nextPage"
                :disabled="currentPage === totalPages || totalPages === 0"
                class="px-3 py-1 rounded-md border disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
  <div v-if="isDropdownOpen" @click="closeDropdown" class="fixed inset-0 z-40"></div>
</template>

<script>
import axios from 'axios';
import AdminSidebar from './sidebar.vue';
import HeadBar from './headbar.vue';

// Add axios interceptor to prevent caching for user endpoints
axios.interceptors.request.use((config) => {
  // Add cache-busting headers for user-related requests
  if (config.url && config.url.includes('/users')) {
    config.headers['Cache-Control'] = 'no-cache';
    config.headers['Pragma'] = 'no-cache';

    // Add timestamp to URL if not already present
    if (!config.url.includes('_t=')) {
      const separator = config.url.includes('?') ? '&' : '?';
      config.url += `${separator}_t=${Date.now()}`;
    }
  }
  return config;
});

export default {
  name: 'AdminDashboard',
  components: {
    AdminSidebar,
    HeadBar,
  },
  data() {
    return {
      search: '',
      users: [],
      showModal: false,
      isDropdownOpen: false,
      pageSize: 6,
      currentPage: 1,
      showUserMenu: false,
      currentUserObj: null,
      warehouses: [],
    };
  },
  computed: {
    filteredUsers() {
      const q = this.search.trim().toLowerCase();
      if (!q) return this.users;
      return this.users.filter((u) => {
        const name = (this.getUserName(u) || '').toLowerCase();
        const email = (this.getUserEmail(u) || '').toLowerCase();
        const wh = (this.getUserWarehouse(u) || '').toLowerCase();
        return name.includes(q) || email.includes(q) || wh.includes(q);
      });
    },
    totalPages() {
      return Math.max(1, Math.ceil(this.filteredUsers.length / this.pageSize));
    },
    paginatedUsers() {
      const start = (this.currentPage - 1) * this.pageSize;
      return this.filteredUsers.slice(start, start + this.pageSize);
    },
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
  },
  watch: {
    search() {
      this.currentPage = 1;
    },
  },
  created() {
    // set baseURL here (component-level override)
    axios.defaults.baseURL = 'http://localhost:3001';

    // ensure Authorization header exists if token present
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      this.$router.push('/login');
      return;
    }

    // load current user object
    try {
      const rawUser = localStorage.getItem('user') || sessionStorage.getItem('user');
      if (rawUser) this.currentUserObj = JSON.parse(rawUser);
    } catch (e) {
      this.currentUserObj = null;
    }

    // fetch users according to admin's managed warehouses if possible
    this.fetchUsers();
    this.fetchWarehouses();
  },
  mounted() {
    document.addEventListener('click', this.handleDocClick);
  },
  beforeUnmount() {
    document.removeEventListener('click', this.handleDocClick);
  },

  methods: {
    toggleDropdown() {
      this.isDropdownOpen = !this.isDropdownOpen;
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

    handleDocClick(e) {
      const ua = this.$refs.userArea;
      if (!ua) return;
      if (!ua.contains(e.target)) {
        this.showUserMenu = false;
      }
    },

    toggleUserMenu() {
      this.showUserMenu = !this.showUserMenu;
    },

    getUserName(u) {
      if (!u) return '—';
      if (u.admin && u.admin.username) return u.admin.username;
      if (u.manager && u.manager.username) return u.manager.username;
      if (u.staff && u.staff.username) return u.staff.username;
      if (u.accounter && u.accounter.username) return u.accounter.username;
      return '—';
    },

    getUserEmail(u) {
      if (!u) return '—';
      if (u.admin && u.admin.email) return u.admin.email;
      if (u.manager && u.manager.email) return u.manager.email;
      if (u.staff && u.staff.email) return u.staff.email;
      if (u.accounter && u.accounter.email) return u.accounter.email;
      return '—';
    },

    getUserInitials(user) {
      const name = this.getUserName(user);
      return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    },

    getUserWarehouse(u) {
      if (!u) return '—';
      if (!this.warehouses || !Array.isArray(this.warehouses)) return '—';

      const warehouseId = u.manager?.warehouseId || u.staff?.warehouseId || u.accounter?.warehouseId;
      if (!warehouseId) return '—';

      // Xử lý trường hợp warehouseId là object
      const wId = typeof warehouseId === 'object' ? warehouseId._id : warehouseId;
      const warehouse = this.warehouses.find((w) => w._id === wId);

      return warehouse ? warehouse.name : '—';
    },
    async fetchUsers() {
      try {
        // ensure header present (defensive)
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (token) axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

        // if current user is admin and has managedWarehouses -> fetch managers+staff and filter
        const cur = this.currentUserObj || this._loadUserFromStorage();
        if (
          cur &&
          cur.role === 'admin' &&
          cur.admin &&
          Array.isArray(cur.admin.managedWarehouses) &&
          cur.admin.managedWarehouses.length > 0
        ) {
          const whIds = cur.admin.managedWarehouses.map((id) => String(id));

          // fetch manager & staff lists in parallel using backend role filter with cache-busting
          const cacheBuster = Date.now();
          const [mgrRes, staffRes, actRes] = await Promise.all([
            axios.get('/api/users', {
              params: { role: 'manager', _t: cacheBuster + 1 },
              headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
            }),
            axios.get('/api/users', {
              params: { role: 'staff', _t: cacheBuster + 2 },
              headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
            }),
            axios.get('/api/users', {
              params: { role: 'accounter', _t: cacheBuster + 3 },
              headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
            }),
          ]);

          const mgrList = (mgrRes.data.users || mgrRes.data || []).filter((u) => {
            const wid = u.manager && u.manager.warehouseId ? String(u.manager.warehouseId) : null;
            return wid && whIds.includes(wid);
          });

          const staffList = (staffRes.data.users || staffRes.data || []).filter((u) => {
            const wid = u.staff && u.staff.warehouseId ? String(u.staff.warehouseId) : null;
            return wid && whIds.includes(wid);
          });
          const actList = (actRes.data.users || actRes.data || []).filter((u) => {
            const wid = u.accounter && u.accounter.warehouseId ? String(u.accounter.warehouseId) : null;
            return wid && whIds.includes(wid);
          });

          this.users = [...mgrList, ...staffList, ...actList];
        } else {
          // fallback: fetch all users (existing behavior) with cache-busting
          const cacheBuster = Date.now();
          const res = await axios.get('/api/users', {
            params: { _t: cacheBuster },
            headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
          });
          this.users = res.data.users || res.data || [];
        }

        this.currentPage = 1;
      } catch (err) {
        console.error('Error fetching users:', err);

        const status = err?.response?.status;
        if (status === 401) {
          try {
            localStorage.removeItem('token');
            sessionStorage.removeItem('token');
          } catch (e) {
            // log the storage removal error to avoid empty catch (ESLint no-empty)
            console.warn('Failed to clear storage during fetchUsers 401 handling:', e);
          }
          this.$router.push('/login');
        }
      }
    },

    async fetchWarehouses() {
      try {
        const response = await axios.get('/api/warehouses');
        this.warehouses = response.data.warehouses || response.data || [];
      } catch (error) {
        console.error('Error fetching warehouses:', error);
      }
    },

    goToPage(p) {
      let page = p;
      if (page < 1) page = 1;
      if (page > this.totalPages) page = this.totalPages;
      this.currentPage = page;
    },

    prevPage() {
      if (this.currentPage > 1) this.currentPage--;
    },
    nextPage() {
      if (this.currentPage < this.totalPages) this.currentPage++;
    },
  },
};
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.12s ease;
}
.fade-enter,
.fade-leave-to {
  opacity: 0;
}
</style>
