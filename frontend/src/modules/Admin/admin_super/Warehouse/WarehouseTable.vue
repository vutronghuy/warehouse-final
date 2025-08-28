<template>
  <div class="flex h-screen bg-gray-50">
    <!-- Sidebar -->
    <Sidebar />
    <!-- Main Content -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <!-- Header -->
      <Headers />
      <!-- Page Content -->
      <main class="flex-1 overflow-auto bg-gray-50 p-8">
        <!-- Page Header -->
        <div class="flex items-center justify-between mb-8">
          <h2 class="text-3xl font-bold text-gray-900">Warehouse Management</h2>
          <button
            @click="showCreateModal = true"
            class="inline-flex items-center px-4 py-2.5 bg-slate-800 text-white text-sm font-medium rounded-lg hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-colors duration-150"
            aria-label="Add Warehouse"
          >
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Add Warehouse
          </button>
        </div>

        <!-- Search and Filter Bar -->
        <div class="mb-6 flex flex-col sm:flex-row gap-4">
          <div class="relative flex-1 max-w-md">
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
              placeholder="Search warehouses..."
              class="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-colors duration-150"
            />
          </div>

          <div class="flex gap-2">
            <select
              v-model="statusFilter"
              class="px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              aria-label="Filter by status"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        <!-- Warehouses Table -->
        <div class="bg-white shadow-sm border border-gray-200 rounded-xl overflow-hidden">
          <div v-if="isLoading" class="flex justify-center items-center py-12">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>

          <div v-else-if="paginatedWarehouses.length === 0" class="text-center py-12">
            <svg
              class="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 21V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m0 0H5m0 0h4M9 7h6m-6 4h6m-6 4h6"
              />
            </svg>
            <h3 class="mt-2 text-sm font-medium text-gray-900">No warehouses found</h3>
            <p class="mt-1 text-sm text-gray-500">Get started by creating a new warehouse.</p>
          </div>

          <div v-else class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Warehouse</th>
                  <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Location</th>
                  <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Manager</th>
                  <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Admin</th>
                  <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Accounter</th>
                  <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Staff Count</th>
                  <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  <th class="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-for="warehouse in paginatedWarehouses" :key="warehouse._id" class="hover:bg-gray-50">
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">{{ warehouse.name }}</div>
                  </td>
                  <td class="px-6 py-4">
                    <div class="text-sm text-gray-900 max-w-xs truncate">{{ warehouse.location }}</div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">{{ getManagerName(warehouse.managerId) }}</div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">{{ getAdminName(warehouse.adminId) }}</div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">{{ getAccounterName(warehouse.accounterId) }}</div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="text-sm text-gray-900">{{ getStaffCount(warehouse.staffIds) }} member{{ getStaffCount(warehouse.staffIds) === 1 ? '' : 's' }}</span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" :class="getStatusClass(warehouse.status)">
                      {{ warehouse.status }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div class="flex items-center justify-end space-x-2">
                      <button @click="openEditModal(warehouse)" class="text-blue-600 hover:text-blue-900 transition-colors" title="Edit warehouse" aria-label="Edit warehouse">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                        </svg>
                      </button>
                      <button @click="deleteWarehouse(warehouse._id, warehouse.name)" class="text-red-600 hover:text-red-900 transition-colors" title="Delete warehouse" aria-label="Delete warehouse">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <div class="px-6 py-4 bg-white border-t flex items-center justify-between">
            <div class="text-sm text-gray-600">
              Showing <span class="font-medium">{{ paginatedWarehouses.length }}</span> of
              <span class="font-medium">{{ filteredWarehouses.length }}</span> warehouses
            </div>

            <div class="flex items-center space-x-2">
              <button
                @click="prevPage"
                :disabled="currentPage === 1"
                class="px-3 py-1 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>

              <div class="flex items-center space-x-1">
                <template v-for="(page, idx) in visiblePages" :key="`${page}-${idx}`">
                  <span v-if="page === '...'" class="px-3 py-1 text-sm text-gray-500 select-none">…</span>
                  <button
                    v-else
                    @click="goToPage(page)"
                    :class="[
                      'px-3 py-1 text-sm font-medium rounded-md',
                      page === currentPage
                        ? 'text-blue-600 bg-blue-50 border border-blue-300'
                        : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50',
                    ]"
                  >
                    {{ page }}
                  </button>
                </template>
              </div>

              <button
                @click="nextPage"
                :disabled="currentPage === totalPages"
                class="px-3 py-1 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>

    <!-- Create Modal -->
    <CreateWarehouseModal
      :show="showCreateModal"
      @close="showCreateModal = false"
      @created="handleWarehouseCreated"
    />

    <!-- Edit Modal -->
    <EditWarehouseModal
      :show="showEditModal"
      :warehouse="selectedWarehouse"
      @close="closeEditModal"
      @updated="handleWarehouseUpdated"
      @warehouse-updated="handleWarehouseRefreshed"
    />
  </div>
</template>

<script>
import axios from 'axios';
import Sidebar from '../Sidebar.vue';
import Headers from '../header.vue';
import CreateWarehouseModal from './CreateWarehouseModal.vue';
import EditWarehouseModal from './EditWarehouseModal.vue';
import { warehouseEventBus } from '@/utils/warehouseUtils.js';

// Simple debounce utility (no external deps)
function debounce(fn, wait = 250) {
  let t = null;
  return function (...args) {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), wait);
  };
}

export default {
  name: 'WarehouseTable',
  components: {
    Sidebar,
    Headers,
    CreateWarehouseModal,
    EditWarehouseModal,
  },
  data() {
    return {
      warehouses: [],
      search: '',
      statusFilter: '',
      isLoading: false,
      showCreateModal: false,
      showEditModal: false,
      selectedWarehouse: null,
      currentPage: 1,
      pageSize: 10,
      showUserMenu: false,
      currentUserObj: null,
      userCache: {}, // cache userId -> user object
      // _userAreaClickHandler: null,
    };
  },
  computed: {
    filteredWarehouses() {
      let filtered = this.warehouses || [];

      // Search filter
      if (this.search && this.search.trim()) {
        const searchTerm = this.search.toLowerCase();
        filtered = filtered.filter(
          (warehouse) =>
            (warehouse.name || '').toLowerCase().includes(searchTerm) ||
            (warehouse.location || '').toLowerCase().includes(searchTerm)
        );
      }

      // Status filter
      if (this.statusFilter) {
        filtered = filtered.filter((warehouse) => warehouse.status === this.statusFilter);
      }

      return filtered.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    },
    totalPages() {
      return Math.max(1, Math.ceil(this.filteredWarehouses.length / this.pageSize));
    },
    paginatedWarehouses() {
      const start = (this.currentPage - 1) * this.pageSize;
      return this.filteredWarehouses.slice(start, start + this.pageSize);
    },
    visiblePages() {
      const pages = [];
      const total = this.totalPages;
      const current = this.currentPage;

      if (total <= 7) {
        for (let i = 1; i <= total; i++) pages.push(i);
      } else {
        if (current <= 4) {
          for (let i = 1; i <= 5; i++) pages.push(i);
          pages.push('...');
          pages.push(total);
        } else if (current >= total - 3) {
          pages.push(1);
          pages.push('...');
          for (let i = total - 4; i <= total; i++) pages.push(i);
        } else {
          pages.push(1);
          pages.push('...');
          for (let i = current - 1; i <= current + 1; i++) pages.push(i);
          pages.push('...');
          pages.push(total);
        }
      }
      return pages;
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
  },
  watch: {
    // Use debounced watcher for search to improve performance
    search: {
      handler: debounce(function () {
        this.currentPage = 1;
      }, 200),
    },
    statusFilter() {
      this.currentPage = 1;
    },
  },
  async mounted() {
    // Attach document click handler and clean up later
    this._userAreaClickHandler = (e) => {
      if (this.$refs.userArea && !this.$refs.userArea.contains(e.target)) {
        this.showUserMenu = false;
      }
    };
    document.addEventListener('click', this._userAreaClickHandler);

    // Load current user from storage
    try {
      const rawUser = localStorage.getItem('user') || sessionStorage.getItem('user');
      if (rawUser) this.currentUserObj = JSON.parse(rawUser);
    } catch (e) {
      this.currentUserObj = null;
    }

    // Listen for warehouse updates
    warehouseEventBus.on('warehouse-updated', this.handleWarehouseUpdateEvent);

    await this.fetchWarehouses();
  },
  beforeUnmount() {
    if (this._userAreaClickHandler) {
      document.removeEventListener('click', this._userAreaClickHandler);
      this._userAreaClickHandler = null;
    }
    warehouseEventBus.off('warehouse-updated', this.handleWarehouseUpdateEvent);
  },
  methods: {
    _loadUserFromStorage() {
      try {
        const raw = localStorage.getItem('user') || sessionStorage.getItem('user');
        return raw ? JSON.parse(raw) : null;
      } catch (e) {
        return null;
      }
    },
    toggleUserMenu() {
      this.showUserMenu = !this.showUserMenu;
    },
    handleLogout() {
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      localStorage.removeItem('user');
      sessionStorage.removeItem('user');
      this.$router.push('/login');
    },

    // -------------------------
    // Backend / normalization utilities
    // -------------------------
    async fetchUserById(userId) {
      if (!userId) return null;
      if (this.userCache[userId]) return this.userCache[userId];

      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const resp = await axios.get(`/api/users/${userId}`, { headers });
        const user = resp.data?.user || resp.data;
        if (user) {
          this.userCache[userId] = user;
          return user;
        }
      } catch (err) {
        console.warn('fetchUserById failed for', userId, err?.response?.data || err.message);
      }
      return null;
    },

    getFullNameFromUserDoc(userDoc) {
      if (!userDoc) return null;
      if (userDoc.admin && userDoc.admin.fullName) return userDoc.admin.fullName;
      if (userDoc.manager && userDoc.manager.fullName) return userDoc.manager.fullName;
      if (userDoc.staff && userDoc.staff.fullName) return userDoc.staff.fullName;
      if (userDoc.accounter && userDoc.accounter.fullName) return userDoc.accounter.fullName;
      if (userDoc.fullName) return userDoc.fullName;
      if (userDoc.name) return userDoc.name;
      return null;
    },

    // If warehouse.managerId/adminId/accounterId are strings (ObjectId), fetch user and replace with { _id, fullName }
    async normalizeWarehouse(warehouse) {
      if (!warehouse) return warehouse;
      const promises = [];

      const convertIfId = (fieldName) => {
        const val = warehouse[fieldName];
        if (!val) return;
        if (typeof val === 'string' && val.match(/^[0-9a-fA-F]{24}$/)) {
          promises.push(
            this.fetchUserById(val).then((user) => {
              const name = this.getFullNameFromUserDoc(user);
              if (name) {
                warehouse[fieldName] = { _id: val, fullName: name };
              }
            })
          );
        }
      };

      convertIfId('managerId');
      convertIfId('adminId');
      convertIfId('accounterId');

      await Promise.all(promises);
      return warehouse;
    },

    // -------------------------
    // Data fetching
    // -------------------------
    async fetchWarehouses() {
      this.isLoading = true;
      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}`, 'Cache-Control': 'no-cache', Pragma: 'no-cache' } : { 'Cache-Control': 'no-cache', Pragma: 'no-cache' };

        const cacheBuster = Date.now();
        const response = await axios.get(`/api/warehouses?_t=${cacheBuster}`, { headers });

        const raw = response.data?.warehouses || response.data || [];
        const normalized = await Promise.all(raw.map((w) => this.normalizeWarehouse(w)));
        this.warehouses = normalized;
      } catch (error) {
        console.error('Error fetching warehouses:', error);
        if (error.response?.status === 401) {
          this.$router.push('/login');
        }
      } finally {
        this.isLoading = false;
      }
    },

    getManagerName(managerData) {
      if (!managerData) return 'Not assigned';
      if (typeof managerData === 'object' && managerData !== null) return managerData.fullName || 'Unknown';
      if (typeof managerData === 'string') {
        const cached = this.userCache[managerData];
        if (cached) return this.getFullNameFromUserDoc(cached) || 'Assigned';
        return 'Assigned';
      }
      return 'Not assigned';
    },

    getAdminName(adminData) {
      if (!adminData) return 'Not assigned';
      if (typeof adminData === 'object' && adminData !== null) return adminData.fullName || 'Unknown';
      if (typeof adminData === 'string') {
        const cached = this.userCache[adminData];
        if (cached) return this.getFullNameFromUserDoc(cached) || 'Assigned';
        return 'Assigned';
      }
      return 'Not assigned';
    },

    getAccounterName(accounterData) {
      if (!accounterData) return 'Not assigned';
      if (typeof accounterData === 'object' && accounterData !== null) return accounterData.fullName || 'Unknown';
      if (typeof accounterData === 'string') {
        const cached = this.userCache[accounterData];
        if (cached) return this.getFullNameFromUserDoc(cached) || 'Assigned';
        return 'Assigned';
      }
      return 'Not assigned';
    },

    getStaffCount(staffIds) {
      if (Array.isArray(staffIds)) return staffIds.length;
      return 0;
    },

    async openEditModal(warehouse) {
      await this.refreshSingleWarehouse(warehouse._id);
      this.showEditModal = true;
    },

    async refreshSingleWarehouse(warehouseId) {
      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const response = await axios.get(`/api/warehouses/${warehouseId}`, { headers });

        const refreshedWarehouse = response.data?.warehouse || response.data;
        if (refreshedWarehouse) {
          const norm = await this.normalizeWarehouse(refreshedWarehouse);
          this.selectedWarehouse = JSON.parse(JSON.stringify(norm));

          const index = this.warehouses.findIndex((w) => w._id === warehouseId);
          if (index !== -1) this.warehouses.splice(index, 1, norm);
          else this.warehouses.push(norm);
        }
      } catch (error) {
        console.error('Error refreshing warehouse:', error);
        this.selectedWarehouse = JSON.parse(JSON.stringify(this.warehouses.find((w) => w._id === warehouseId)));
      }
    },

    closeEditModal() {
      this.showEditModal = false;
      this.selectedWarehouse = null;
    },

    async handleWarehouseCreated(newWarehouse) {
      await this.fetchWarehouses();
    },

    async handleWarehouseUpdated(updatedWarehouse) {
      await this.fetchWarehouses();
    },

    handleWarehouseRefreshed(refreshedWarehouse) {
      this.selectedWarehouse = refreshedWarehouse;
      const index = this.warehouses.findIndex((w) => w._id === refreshedWarehouse._id);
      if (index !== -1) {
        this.warehouses.splice(index, 1, refreshedWarehouse);
      } else {
        this.warehouses.push(refreshedWarehouse);
      }
    },

    async handleWarehouseUpdateEvent(warehouseId) {
      console.log('Handling warehouse update event for:', warehouseId);
      const refreshedWarehouse = await this.forceRefreshWarehouse(warehouseId);
      if (refreshedWarehouse) {
        const index = this.warehouses.findIndex((w) => w._id === warehouseId);
        if (index !== -1) this.warehouses.splice(index, 1, refreshedWarehouse);
        if (this.selectedWarehouse && this.selectedWarehouse._id === warehouseId) this.selectedWarehouse = refreshedWarehouse;
      } else {
        await this.fetchWarehouses();
      }
    },

    async forceRefreshWarehouse(warehouseId) {
      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}`, 'Cache-Control': 'no-cache, no-store, must-revalidate', Pragma: 'no-cache', Expires: '0', 'If-None-Match': '*' } : { 'Cache-Control': 'no-cache, no-store, must-revalidate', Pragma: 'no-cache', Expires: '0' };

        const cacheBuster = Date.now() + Math.random();
        const response = await axios.get(`/api/warehouses/${warehouseId}?_t=${cacheBuster}&_r=${Math.random()}`, { headers });

        const raw = response.data?.warehouse || response.data;
        if (raw) {
          const norm = await this.normalizeWarehouse(raw);
          return norm;
        }
        return null;
      } catch (error) {
        console.error('Error force refreshing warehouse:', error);
        return null;
      }
    },

    async deleteWarehouse(id, name) {
      if (!confirm(`⚠️ PERMANENTLY DELETE warehouse "${name}"?\n\nThis will completely remove it from the database. This action CANNOT be undone!`)) return;

      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const response = await axios.delete(`/api/warehouses/${id}?force=true`, { headers });

        console.log('Delete response:', response.data);
        await this.fetchWarehouses();
        alert('Warehouse permanently deleted!');
      } catch (error) {
        console.error('Error deleting warehouse:', error, error.response?.data);
        alert('Failed to delete warehouse. Please try again.');
      }
    },

    goToPage(page) {
      if (page !== '...' && page >= 1 && page <= this.totalPages) this.currentPage = page;
    },
    prevPage() {
      if (this.currentPage > 1) this.currentPage--;
    },
    nextPage() {
      if (this.currentPage < this.totalPages) this.currentPage++;
    },

    getStatusClass(status) {
      switch (status) {
        case 'active':
          return 'bg-green-200 text-green-800';
        case 'inactive':
          return 'bg-red-200 text-gray-800';
        default:
          return 'bg-red-100 text-gray-800';
      }
    },
  },
};
</script>

<style scoped>
/* Fade transition for dropdown */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
