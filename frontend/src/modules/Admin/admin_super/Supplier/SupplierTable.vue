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
          <h2 class="text-3xl font-bold text-gray-900">Supplier Management</h2>
          <button
            @click="showCreateModal = true"
            class="inline-flex items-center px-4 py-2.5 bg-slate-800 text-white text-sm font-medium rounded-lg hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-colors duration-150"
          >
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Add Supplier
          </button>
        </div>

        <!-- Search and Filter Bar -->
        <div class="mb-6 flex flex-col sm:flex-row gap-4">
          <div class="relative flex-1 max-w-md">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              v-model="search"
              type="text"
              placeholder="Search suppliers..."
              class="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-colors duration-150"
            />
          </div>

          <div class="flex gap-2">
            <select
              v-model="statusFilter"
              class="px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Status</option>
              <option value="cooperation">Cooperation</option>
              <option value="stop cooperation">Stop Cooperation</option>
            </select>

            <select
              v-model="businessTypeFilter"
              class="px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Types</option>
              <option value="manufacturer">Manufacturer</option>
              <option value="distributor">Distributor</option>
              <option value="retailer">Retailer</option>
              <option value="wholesaler">Wholesaler</option>
            </select>
          </div>
        </div>

        <!-- Suppliers Table -->
        <div class="bg-white shadow-sm border border-gray-200 rounded-xl overflow-hidden">
          <div v-if="isLoading" class="flex justify-center items-center py-12">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>

          <div v-else-if="paginatedSuppliers.length === 0" class="text-center py-12">
            <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m13-8l-4 4m0 0l-4-4m4 4V3" />
            </svg>
            <h3 class="mt-2 text-sm font-medium text-gray-900">No suppliers found</h3>
            <p class="mt-1 text-sm text-gray-500">Get started by creating a new supplier.</p>
          </div>

          <table v-else class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Supplier
                </th>
                <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Contact
                </th>
                <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Business Type
                </th>
                <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Payment Terms
                </th>
                <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Status
                </th>
                <th class="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="supplier in paginatedSuppliers" :key="supplier._id" class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div class="text-sm font-medium text-gray-900">{{ supplier.name }}</div>
                    <div class="text-sm text-gray-500">{{ supplier.code }}</div>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div class="text-sm text-gray-900">{{ supplier.contactInfo?.email || 'N/A' }}</div>
                    <div class="text-sm text-gray-500">{{ supplier.contactInfo?.phone || 'N/A' }}</div>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize"
                        :class="getBusinessTypeClass(supplier.businessInfo?.businessType)">
                    {{ supplier.businessInfo?.businessType || 'N/A' }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {{ formatPaymentTerms(supplier.paymentTerms) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                        :class="getStatusClass(supplier.status)">
                    {{ supplier.status }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div class="flex items-center justify-end space-x-2">
                    <button
                      @click="openEditModal(supplier)"
                      class="text-blue-600 hover:text-blue-900 transition-colors"
                      title="Edit supplier"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      @click="deleteSupplier(supplier._id, supplier.name)"
                      class="text-red-600 hover:text-red-900 transition-colors"
                      title="Delete supplier"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Pagination -->
          <div class="px-6 py-4 bg-white border-t flex items-center justify-between">
            <div class="text-sm text-gray-600">
              Showing <span class="font-medium">{{ paginatedSuppliers.length }}</span> of
              <span class="font-medium">{{ filteredSuppliers.length }}</span> suppliers
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
                <button
                  v-for="page in visiblePages"
                  :key="page"
                  @click="goToPage(page)"
                  :class="[
                    'px-3 py-1 text-sm font-medium rounded-md',
                    page === currentPage
                      ? 'text-blue-600 bg-blue-50 border border-blue-300'
                      : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                  ]"
                >
                  {{ page }}
                </button>
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
    <CreateSupplierModal
      :show="showCreateModal"
      @close="showCreateModal = false"
      @created="handleSupplierCreated"
    />

    <!-- Edit Modal -->
    <EditSupplierModal
      :show="showEditModal"
      :supplier="selectedSupplier"
      @close="closeEditModal"
      @updated="handleSupplierUpdated"
    />
  </div>
</template>

<script>
import axios from 'axios';
import Sidebar from '../Sidebar.vue';
import Headers from '../header.vue';
import CreateSupplierModal from './CreateSupplierModal.vue';
import EditSupplierModal from './EditSupplierModal.vue';

export default {
  name: 'SupplierTable',
  components: {
    Sidebar,
    Headers,
    CreateSupplierModal,
    EditSupplierModal
  },
  data() {
    return {
      suppliers: [],
      search: '',
      statusFilter: '',
      businessTypeFilter: '',
      isLoading: false,
      showCreateModal: false,
      showEditModal: false,
      selectedSupplier: null,
      currentPage: 1,
      pageSize: 10,
      showUserMenu: false,
      currentUserObj: null
    };
  },
  computed: {
    filteredSuppliers() {
      let filtered = this.suppliers;

      // Search filter
      if (this.search.trim()) {
        const searchTerm = this.search.toLowerCase();
        filtered = filtered.filter(supplier =>
          supplier.name.toLowerCase().includes(searchTerm) ||
          supplier.code.toLowerCase().includes(searchTerm) ||
          supplier.contactInfo?.email?.toLowerCase().includes(searchTerm) ||
          supplier.contactInfo?.phone?.includes(searchTerm)
        );
      }

      // Status filter
      if (this.statusFilter) {
        filtered = filtered.filter(supplier => supplier.status === this.statusFilter);
      }

      // Business type filter
      if (this.businessTypeFilter) {
        filtered = filtered.filter(supplier => supplier.businessInfo?.businessType === this.businessTypeFilter);
      }

      return filtered;
    },
    totalPages() {
      return Math.max(1, Math.ceil(this.filteredSuppliers.length / this.pageSize));
    },
    paginatedSuppliers() {
      const start = (this.currentPage - 1) * this.pageSize;
      return this.filteredSuppliers.slice(start, start + this.pageSize);
    },
    visiblePages() {
      const pages = [];
      const total = this.totalPages;
      const current = this.currentPage;

      if (total <= 7) {
        for (let i = 1; i <= total; i++) {
          pages.push(i);
        }
      } else {
        if (current <= 4) {
          for (let i = 1; i <= 5; i++) {
            pages.push(i);
          }
          pages.push('...');
          pages.push(total);
        } else if (current >= total - 3) {
          pages.push(1);
          pages.push('...');
          for (let i = total - 4; i <= total; i++) {
            pages.push(i);
          }
        } else {
          pages.push(1);
          pages.push('...');
          for (let i = current - 1; i <= current + 1; i++) {
            pages.push(i);
          }
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
    }
  },
  watch: {
    search() {
      this.currentPage = 1;
    },
    statusFilter() {
      this.currentPage = 1;
    },
    businessTypeFilter() {
      this.currentPage = 1;
    }
  },
  async mounted() {
    // Close user menu when clicking outside
    document.addEventListener('click', (e) => {
      if (this.$refs.userArea && !this.$refs.userArea.contains(e.target)) {
        this.showUserMenu = false;
      }
    });

    // Load current user from storage
    try {
      const rawUser = localStorage.getItem('user') || sessionStorage.getItem('user');
      if (rawUser) this.currentUserObj = JSON.parse(rawUser);
    } catch (e) {
      this.currentUserObj = null;
    }

    await this.fetchSuppliers();
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
      // Clear tokens
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      localStorage.removeItem('user');
      sessionStorage.removeItem('user');

      // Redirect to login
      this.$router.push('/login');
    },
    async fetchSuppliers() {
      this.isLoading = true;
      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (token) {
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }

        // Add cache-busting parameters and headers to prevent 304 Not Modified
        const config = {
          params: {
            _t: Date.now(), // Cache busting timestamp
            _r: Math.random() // Additional randomness
          },
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
            'If-None-Match': '', // Prevent ETag matching
            'If-Modified-Since': '' // Prevent Last-Modified matching
          }
        };

        console.log('🔄 Fetching suppliers with cache-busting...');
        const response = await axios.get('/api/suppliers', config);

        console.log('📊 Suppliers response status:', response.status);
        this.suppliers = response.data.suppliers || response.data || [];
        console.log('✅ Suppliers loaded:', this.suppliers.length);
      } catch (error) {
        console.error('Error fetching suppliers:', error);
        if (error.response?.status === 401) {
          this.$router.push('/login');
        }
      } finally {
        this.isLoading = false;
      }
    },
    openEditModal(supplier) {
      this.selectedSupplier = JSON.parse(JSON.stringify(supplier));
      this.showEditModal = true;
    },
    closeEditModal() {
      this.showEditModal = false;
      this.selectedSupplier = null;
    },
    async handleSupplierCreated(newSupplier) {
      await this.fetchSuppliers();
    },
    async handleSupplierUpdated(updatedSupplier) {
      await this.fetchSuppliers();
    },
    async deleteSupplier(id, name = 'this supplier') {
      // Enhanced confirmation dialog for permanent deletion
      const confirmMessage = `⚠️ Are you sure you want to permanently delete supplier "${name}"?\n\n❌ This action cannot be undone!`;

      if (!confirm(confirmMessage)) {
        return;
      }

      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (token) {
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }

        console.log(`🗑️ Permanently deleting supplier: ${name} (ID: ${id})`);

        const response = await axios.delete(`/api/suppliers/${id}`);

        if (response.data.success) {
          console.log('✅ Supplier permanently deleted');
          alert(`✅ Supplier "${name}" has been permanently deleted.`);

          // Force refresh with multiple strategies
          console.log('🔄 Force refreshing suppliers list...');
          await this.fetchSuppliers();

          // Additional refresh after short delay to ensure data is updated
          setTimeout(async () => {
            await this.fetchSuppliers();
            console.log('🔄 Secondary refresh completed');
          }, 500);
        } else {
          throw new Error(response.data.message || 'Delete failed');
        }
      } catch (error) {
        console.error('Error deleting supplier:', error);
        const errorMessage = error.response?.data?.message || 'Failed to delete supplier. Please try again.';
        alert(`❌ Delete failed: ${errorMessage}`);
      }
    },
    goToPage(page) {
      if (page !== '...' && page >= 1 && page <= this.totalPages) {
        this.currentPage = page;
      }
    },
    prevPage() {
      if (this.currentPage > 1) {
        this.currentPage--;
      }
    },
    nextPage() {
      if (this.currentPage < this.totalPages) {
        this.currentPage++;
      }
    },
    getStatusClass(status) {
      switch (status) {
        case 'cooperation':
          return 'bg-green-100 text-green-800';
        case 'stop cooperation':
          return 'bg-red-100 text-red-800';
        default:
          return 'bg-gray-100 text-gray-800';
      }
    },
    getBusinessTypeClass(type) {
      switch (type) {
        case 'manufacturer':
          return 'bg-blue-100 text-blue-800';
        case 'distributor':
          return 'bg-green-100 text-green-800';
        case 'retailer':
          return 'bg-purple-100 text-purple-800';
        case 'wholesaler':
          return 'bg-orange-100 text-orange-800';
        default:
          return 'bg-gray-100 text-gray-800';
      }
    },
    formatPaymentTerms(terms) {
      switch (terms) {
        case 'cash':
          return 'Cash';
        case 'net15':
          return 'Net 15';
        case 'net30':
          return 'Net 30';
        case 'net45':
          return 'Net 45';
        case 'net60':
          return 'Net 60';
        default:
          return terms || 'N/A';
      }
    }
  }
};
</script>

<style scoped>
/* Fade transition for dropdown */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
