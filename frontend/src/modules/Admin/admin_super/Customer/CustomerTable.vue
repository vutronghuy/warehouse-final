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
          <h2 class="text-3xl font-bold text-gray-900">Customer Management</h2>
          <button
            @click="showCreateModal = true"
            class="inline-flex items-center px-4 py-2.5 bg-slate-800 text-white text-sm font-medium rounded-lg hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-colors duration-150"
            aria-label="Add Customer"
          >
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Add Customer
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
              placeholder="Search customers..."
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

        <!-- Customers Table -->
        <div class="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
          <!-- Table Header -->
          <div class="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-medium text-gray-900">Customers</h3>
              <div class="text-sm text-gray-500">
                {{ filteredCustomers.length }} of {{ customers.length }} customer{{ customers.length !== 1 ? 's' : '' }}
              </div>
            </div>
          </div>

          <!-- Loading State -->
          <div v-if="isLoading" class="flex justify-center items-center py-16">
            <div class="flex items-center space-x-2">
              <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-600"></div>
              <span class="text-sm text-gray-600">Loading customers...</span>
            </div>
          </div>

          <!-- Table -->
          <div v-else-if="filteredCustomers.length > 0" class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Address
                  </th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-for="customer in paginatedCustomers" :key="customer._id" class="hover:bg-gray-50 transition-colors duration-150">
                  <!-- Customer Info -->
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                      <div class="flex-shrink-0 h-10 w-10">
                        <div class="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center">
                          <svg class="h-5 w-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                      </div>
                      <div class="ml-4">
                        <div class="text-sm font-medium text-gray-900">{{ customer.name }}</div>
                        <div v-if="customer.email" class="text-sm text-gray-500">{{ customer.email }}</div>
                      </div>
                    </div>
                  </td>

                  <!-- Contact -->
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">{{ customer.phone }}</div>
                  </td>

                  <!-- Address -->
                  <td class="px-6 py-4">
                    <div class="text-sm text-gray-900 max-w-xs truncate" :title="customer.address">{{ customer.address }}</div>
                  </td>

                  <!-- Status -->
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span
                      :class="
                        customer.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      "
                      class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize"
                    >
                      {{ customer.status }}
                    </span>
                  </td>

                  <!-- Created -->
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>{{ formatDate(customer.createdAt) }}</div>
                    <div class="text-xs">{{ formatTime(customer.createdAt) }}</div>
                  </td>

                  <!-- Actions -->
                  <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div class="flex items-center justify-end space-x-2">
                      <button
                        @click="openEditModal(customer)"
                        class="text-slate-600 hover:text-slate-900 transition-colors duration-150"
                        title="Edit Customer"
                      >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </button>
                      <button
                        @click="confirmDelete(customer)"
                        class="text-red-600 hover:text-red-900 transition-colors duration-150"
                        title="Delete Customer"
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
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Empty State -->
          <div v-else class="text-center py-16">
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
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <h3 class="mt-4 text-lg font-medium text-gray-900">No customers found</h3>
            <p class="mt-2 text-sm text-gray-500">
              {{ search || statusFilter ? 'No customers match your current filters.' : 'Get started by creating your first customer.' }}
            </p>
            <div v-if="!search && !statusFilter" class="mt-6">
              <button
                @click="showCreateModal = true"
                class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-slate-600 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
              >
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
                Add Customer
              </button>
            </div>
          </div>

          <!-- Pagination -->
          <div v-if="totalPages > 1" class="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
            <div class="flex items-center justify-between">
              <div class="flex-1 flex justify-between sm:hidden">
                <button
                  @click="prevPage"
                  :disabled="currentPage === 1"
                  class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  @click="nextPage"
                  :disabled="currentPage === totalPages"
                  class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
              <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p class="text-sm text-gray-700">
                    Showing
                    <span class="font-medium">{{ (currentPage - 1) * pageSize + 1 }}</span>
                    to
                    <span class="font-medium">{{ Math.min(currentPage * pageSize, filteredCustomers.length) }}</span>
                    of
                    <span class="font-medium">{{ filteredCustomers.length }}</span>
                    results
                  </p>
                </div>
                <div>
                  <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      @click="prevPage"
                      :disabled="currentPage === 1"
                      class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span class="sr-only">Previous</span>
                      <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
                      </svg>
                    </button>

                    <template v-for="(page, idx) in visiblePages" :key="`${page}-${idx}`">
                      <span v-if="page === '...'" class="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                        ...
                      </span>
                      <button
                        v-else
                        @click="goToPage(page)"
                        :class="[
                          'relative inline-flex items-center px-4 py-2 border text-sm font-medium',
                          page === currentPage
                            ? 'z-10 bg-slate-50 border-slate-500 text-slate-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50',
                        ]"
                      >
                        {{ page }}
                      </button>
                    </template>

                    <button
                      @click="nextPage"
                      :disabled="currentPage === totalPages"
                      class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span class="sr-only">Next</span>
                      <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                      </svg>
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Success/Error Messages -->
        <div
          v-if="message"
          class="fixed bottom-4 right-4 p-4 rounded-md shadow-lg"
          :class="messageType === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'"
        >
          {{ message }}
        </div>
      </main>
    </div>
    <!-- Modals -->
    <CreateCustomerModal
      :visible="showCreateModal"
      @close="showCreateModal = false"
      @created="handleCustomerCreated"
    />

    <EditCustomerModal
      :visible="showEditModal"
      :customer="selectedCustomer"
      @close="closeEditModal"
      @updated="handleCustomerUpdated"
    />

    <!-- Delete Confirmation Modal -->
    <div
      v-if="showDeleteModal"
      class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
    >
      <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div class="mt-3 text-center">
          <h3 class="text-lg font-medium text-gray-900">Delete Customer</h3>
          <div class="mt-2 px-7 py-3">
            <p class="text-sm text-gray-500">
              Are you sure you want to delete "{{ customerToDelete?.name }}"? This action cannot be undone.
            </p>
          </div>
          <div class="flex justify-center space-x-3 mt-4">
            <button
              @click="showDeleteModal = false"
              class="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
            >
              Cancel
            </button>
            <button
              @click="deleteCustomer"
              class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              :disabled="isDeleting"
            >
              {{ isDeleting ? 'Deleting...' : 'Delete' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import Sidebar from '../Sidebar.vue';
import Headers from '../header.vue';
import CreateCustomerModal from './CreateCustomerModal.vue';
import EditCustomerModal from './EditCustomerModal.vue';

export default {
  name: 'CustomerTable',
  components: {
    Sidebar,
    Headers,
    CreateCustomerModal,
    EditCustomerModal,
  },
  data() {
    return {
      customers: [],
      search: '',
      statusFilter: '',
      isLoading: false,
      message: '',
      messageType: 'success',
      showCreateModal: false,
      showEditModal: false,
      showDeleteModal: false,
      selectedCustomer: null,
      customerToDelete: null,
      isDeleting: false,
      currentPage: 1,
      pageSize: 10,
    };
  },
  computed: {
    filteredCustomers() {
      let filtered = this.customers;

      if (this.search.trim()) {
        const searchTerm = this.search.toLowerCase();
        filtered = filtered.filter(
          (customer) =>
            customer.name.toLowerCase().includes(searchTerm) ||
            customer.phone.toLowerCase().includes(searchTerm) ||
            customer.address.toLowerCase().includes(searchTerm) ||
            (customer.email && customer.email.toLowerCase().includes(searchTerm)),
        );
      }

      if (this.statusFilter) {
        filtered = filtered.filter((customer) => customer.status === this.statusFilter);
      }

      return filtered;
    },

    paginatedCustomers() {
      const start = (this.currentPage - 1) * this.pageSize;
      const end = start + this.pageSize;
      return this.filteredCustomers.slice(start, end);
    },

    totalPages() {
      return Math.ceil(this.filteredCustomers.length / this.pageSize);
    },

    visiblePages() {
      const total = this.totalPages;
      const current = this.currentPage;
      const delta = 2;
      const range = [];
      const rangeWithDots = [];

      for (let i = Math.max(2, current - delta); i <= Math.min(total - 1, current + delta); i++) {
        range.push(i);
      }

      if (current - delta > 2) {
        rangeWithDots.push(1, '...');
      } else {
        rangeWithDots.push(1);
      }

      rangeWithDots.push(...range);

      if (current + delta < total - 1) {
        rangeWithDots.push('...', total);
      } else {
        rangeWithDots.push(total);
      }

      return total > 1 ? rangeWithDots : [];
    },
  },
  mounted() {
    // Set axios baseURL
    axios.defaults.baseURL = 'http://localhost:3003';

    // Ensure Authorization header exists if token present
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      this.$router.push('/login');
      return;
    }

    this.fetchCustomers();
  },
  methods: {
    async fetchCustomers() {
      this.isLoading = true;
      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        const response = await axios.get('/api/customers', {
          headers: {
            Authorization: `Bearer ${token}`,
            'Cache-Control': 'no-cache',
            Pragma: 'no-cache',
          },
        });

        this.customers = response.data.customers || [];
      } catch (error) {
        console.error('Error fetching customers:', error);
        this.showMessage('Failed to load customers', 'error');
      } finally {
        this.isLoading = false;
      }
    },

    openEditModal(customer) {
      this.selectedCustomer = { ...customer };
      this.showEditModal = true;
    },

    closeEditModal() {
      this.showEditModal = false;
      this.selectedCustomer = null;
    },

    confirmDelete(customer) {
      this.customerToDelete = customer;
      this.showDeleteModal = true;
    },

    async deleteCustomer() {
      if (!this.customerToDelete) return;

      this.isDeleting = true;
      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        await axios.delete(`/api/customers/${this.customerToDelete._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        this.showMessage('Customer deleted successfully', 'success');
        this.showDeleteModal = false;
        this.customerToDelete = null;
        await this.fetchCustomers();
      } catch (error) {
        console.error('Error deleting customer:', error);
        this.showMessage('Failed to delete customer', 'error');
      } finally {
        this.isDeleting = false;
      }
    },

    async handleCustomerCreated() {
      this.showCreateModal = false;
      this.showMessage('Customer created successfully', 'success');
      await this.fetchCustomers();
    },

    async handleCustomerUpdated() {
      this.closeEditModal();
      this.showMessage('Customer updated successfully', 'success');
      await this.fetchCustomers();
    },

    showMessage(text, type = 'success') {
      this.message = text;
      this.messageType = type;
      setTimeout(() => {
        this.message = '';
      }, 3000);
    },

    formatDate(dateString) {
      if (!dateString) return 'N/A';
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    },

    formatTime(dateString) {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
    },

    // Pagination methods
    goToPage(page) {
      if (page >= 1 && page <= this.totalPages) {
        this.currentPage = page;
      }
    },

    nextPage() {
      if (this.currentPage < this.totalPages) {
        this.currentPage++;
      }
    },

    prevPage() {
      if (this.currentPage > 1) {
        this.currentPage--;
      }
    },
  },

  watch: {
    search() {
      this.currentPage = 1; // Reset to first page when searching
    },
    statusFilter() {
      this.currentPage = 1; // Reset to first page when filtering
    },
  },
};
</script>
