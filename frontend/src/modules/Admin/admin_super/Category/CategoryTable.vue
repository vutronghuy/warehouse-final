<template>
  <div class="flex h-screen bg-gray-50">
    <!-- Sidebar -->
    <Sidebar />

    <!-- Main Content -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <!-- Header -->
      <header class="bg-white border-b border-gray-200 px-6 py-4">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-lg font-medium text-gray-900">Category Management</h1>
          </div>

          <div class="flex items-center gap-4">
            <div class="relative" ref="userArea">
              <button
                @click.stop="toggleUserMenu"
                class="inline-flex items-center space-x-2 px-3 py-1 rounded-md hover:bg-gray-100"
                aria-haspopup="true"
                :aria-expanded="showUserMenu"
              >
                <span class="text-sm font-medium text-gray-800">{{ userFullName }}</span>
                <svg class="w-4 h-4 text-gray-500" viewBox="0 0 20 20" fill="none" stroke="currentColor">
                  <path d="M6 8l4 4 4-4" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" />
                </svg>
              </button>

              <!-- Dropdown -->
              <transition name="fade">
                <div
                  v-if="showUserMenu"
                  ref="userMenu"
                  class="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-50"
                >
                  <div class="py-2">
                    <button
                      @click="handleLogout"
                      class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              </transition>
            </div>
          </div>
        </div>
      </header>

      <!-- Page Content -->
      <main class="flex-1 overflow-auto bg-gray-50 p-8">
        <!-- Page Header -->
        <div class="flex items-center justify-between mb-8">
          <h2 class="text-3xl font-bold text-gray-900">Category Management</h2>
          <button
            @click="showCreateModal = true"
            class="inline-flex items-center px-4 py-2.5 bg-slate-800 text-white text-sm font-medium rounded-lg hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-colors duration-150"
          >
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Add Category
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
              placeholder="Search categories..."
              class="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-colors duration-150"
            />
          </div>

          <div class="flex gap-2">
            <select
              v-model="statusFilter"
              class="px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        <!-- Categories Table -->
        <div class="bg-white shadow-sm border border-gray-200 rounded-xl overflow-hidden">
          <div v-if="isLoading" class="flex justify-center items-center py-12">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>

          <div v-else-if="paginatedCategories.length === 0" class="text-center py-12">
            <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <h3 class="mt-2 text-sm font-medium text-gray-900">No categories found</h3>
            <p class="mt-1 text-sm text-gray-500">Get started by creating a new category.</p>
          </div>

          <table v-else class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Category
                </th>
                <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Code
                </th>
                <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Description
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
              <tr v-for="category in paginatedCategories" :key="category._id" class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-medium text-gray-900">{{ category.name }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    {{ category.code }}
                  </span>
                </td>
                <td class="px-6 py-4">
                  <div class="text-sm text-gray-900 max-w-xs truncate">
                    {{ category.description || 'No description' }}
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                        :class="getStatusClass(category.status)">
                    {{ category.status }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div class="flex items-center justify-end space-x-2">
                    <button
                      @click="openEditModal(category)"
                      class="text-blue-600 hover:text-blue-900 transition-colors"
                      title="Edit category"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      @click="deleteCategory(category._id, category.name)"
                      class="text-red-600 hover:text-red-900 transition-colors"
                      title="Delete category"
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
              Showing <span class="font-medium">{{ paginatedCategories.length }}</span> of
              <span class="font-medium">{{ filteredCategories.length }}</span> categories
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
    <CreateCategoryModal
      :show="showCreateModal"
      @close="showCreateModal = false"
      @created="handleCategoryCreated"
    />

    <!-- Edit Modal -->
    <EditCategoryModal
      :show="showEditModal"
      :category="selectedCategory"
      @close="closeEditModal"
      @updated="handleCategoryUpdated"
    />
  </div>
</template>

<script>
import axios from 'axios';
import Sidebar from '../Sidebar.vue';
import CreateCategoryModal from './CreateCategoryModal.vue';
import EditCategoryModal from './EditCategoryModal.vue';

export default {
  name: 'CategoryTable',
  components: {
    Sidebar,
    CreateCategoryModal,
    EditCategoryModal
  },
  data() {
    return {
      categories: [],
      search: '',
      statusFilter: '',
      isLoading: false,
      showCreateModal: false,
      showEditModal: false,
      selectedCategory: null,
      currentPage: 1,
      pageSize: 10,
      showUserMenu: false,
      currentUserObj: null
    };
  },
  computed: {
    filteredCategories() {
      let filtered = this.categories;

      // Search filter
      if (this.search.trim()) {
        const searchTerm = this.search.toLowerCase();
        filtered = filtered.filter(category =>
          category.name.toLowerCase().includes(searchTerm) ||
          category.code.toLowerCase().includes(searchTerm) ||
          (category.description && category.description.toLowerCase().includes(searchTerm))
        );
      }

      // Status filter
      if (this.statusFilter) {
        filtered = filtered.filter(category => category.status === this.statusFilter);
      }

      return filtered.sort((a, b) => {
        // Sort by name only
        return a.name.localeCompare(b.name);
      });
    },
    totalPages() {
      return Math.max(1, Math.ceil(this.filteredCategories.length / this.pageSize));
    },
    paginatedCategories() {
      const start = (this.currentPage - 1) * this.pageSize;
      return this.filteredCategories.slice(start, start + this.pageSize);
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

    await this.fetchCategories();
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
    async fetchCategories() {
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

        console.log('🔄 Fetching categories with cache-busting...');
        const response = await axios.get('/api/categories', config);

        console.log('📊 Categories response status:', response.status);
        this.categories = response.data.categories || response.data || [];
        console.log('✅ Categories loaded:', this.categories.length);
      } catch (error) {
        console.error('Error fetching categories:', error);
        if (error.response?.status === 401) {
          this.$router.push('/login');
        }
      } finally {
        this.isLoading = false;
      }
    },
    openEditModal(category) {
      this.selectedCategory = JSON.parse(JSON.stringify(category));
      this.showEditModal = true;
    },
    closeEditModal() {
      this.showEditModal = false;
      this.selectedCategory = null;
    },
    async handleCategoryCreated(newCategory) {
      await this.fetchCategories();
    },
    async handleCategoryUpdated(updatedCategory) {
      await this.fetchCategories();
    },
    async deleteCategory(id, name) {
      // Enhanced confirmation dialog for permanent deletion
      const confirmMessage = `⚠️ Are you sure you want to permanently delete category "${name}"?\n\n❌ This action cannot be undone!`;

      if (!confirm(confirmMessage)) {
        return;
      }

      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (token) {
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }

        console.log(`🗑️ Permanently deleting category: ${name} (ID: ${id})`);

        const response = await axios.delete(`/api/categories/${id}`);

        if (response.data.success) {
          console.log('✅ Category permanently deleted:', response.data.deletedCategory);
          alert(`✅ Category "${name}" has been permanently deleted.`);

          // Force refresh with multiple strategies
          console.log('🔄 Force refreshing categories list...');
          await this.fetchCategories();

          // Additional refresh after short delay to ensure data is updated
          setTimeout(async () => {
            await this.fetchCategories();
            console.log('🔄 Secondary refresh completed');
          }, 500);
        } else {
          throw new Error(response.data.message || 'Delete failed');
        }
      } catch (error) {
        console.error('Error deleting category:', error);
        const errorMessage = error.response?.data?.message || 'Failed to delete category. Please try again.';
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
        case 'active':
          return 'bg-green-100 text-green-800';
        case 'inactive':
          return 'bg-gray-100 text-gray-800';
        default:
          return 'bg-gray-100 text-gray-800';
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
