<template>
  <div class="flex h-screen bg-gray-50">
    <Sidebar />
    <!-- Main Content -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <Headers />

      <!-- Page Content -->
      <main class="flex-1 overflow-auto bg-gray-50 p-8">
        <!-- Page Header -->
        <div class="flex items-center justify-between mb-8">
          <div>
            <h2 class="text-3xl font-bold text-gray-900">Audit Logs</h2>
            <p class="text-sm text-gray-600 mt-1">Monitor staff activities within the system</p>
          </div>

        </div>

        <!-- Filters -->
        <div class="bg-white shadow-sm border-b border-gray-200 mb-6">
          <div class="px-6 py-4">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <!-- Role Filter -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Role</label>
            <select
              v-model="filters.role"
              @change="onRoleChange"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Roles</option>
              <option value="staff">Staff</option>
              <option value="manager">Manager</option>
              <option value="accounter">Accounter</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <!-- Staff Filter -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Account
              <span v-if="filters.role" class="text-xs text-gray-500">
                ({{ filteredStaffList.length }} {{ filters.role }}s)
              </span>
            </label>
            <select
              v-model="filters.staffId"
              @change="applyFilters"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">
                {{ filters.role ? `All ${filters.role}s` : 'All Staff' }}
              </option>
              <option v-if="filteredStaffList.length === 0" disabled>
                No {{ filters.role }}s found
              </option>
              <option v-for="staff in filteredStaffList" :key="staff._id" :value="staff._id">
                {{ staff.name }} ({{ staff.role }})
              </option>
            </select>
          </div>

          <!-- Action Filter -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Action</label>
            <select
              v-model="filters.action"
              @change="applyFilters"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Actions</option>
              <option value="CREATE_INVOICE">Create Invoice</option>
              <option value="UPDATE_INVOICE">Update Invoice</option>
              <option value="DELETE_INVOICE">Delete Invoice</option>
              <option value="CREATE_EXPORT_SLIP">Create Export Slip</option>
              <option value="UPDATE_EXPORT_SLIP">Update Export Slip</option>
              <option value="DELETE_EXPORT_SLIP">Delete Export Slip</option>
              <option value="IMPORT_PRODUCT_EXCEL">Import Products</option>
              <option value="UPDATE_PRODUCT">Update Product</option>
              <option value="CHANGE_ROLE">Change Role</option>
            </select>
          </div>

          <!-- Date Range -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Date</label>
            <input
              v-model="filters.dateRange"
              type="date"
              @change="applyFilters"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <!-- Clear Filters -->
        <div class="mt-4 flex justify-end">
          <button
            @click="clearFilters"
            class="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
            Clear Filters
          </button>
        </div>
      </div>

      <!-- Content -->
      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center items-center py-12">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span class="ml-2 text-gray-600">Loading...</span>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-md p-4">
        <div class="flex">
          <svg class="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clip-rule="evenodd" />
          </svg>
          <div class="ml-3">
            <h3 class="text-sm font-medium text-red-800">Failed to load data</h3>
            <p class="text-sm text-red-700 mt-1">{{ error }}</p>
          </div>
        </div>
      </div>

      <!-- Audit Logs Table -->
      <div v-else class="bg-white shadow-sm rounded-lg overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-200">
          <h3 class="text-lg font-medium text-gray-900">Audit Logs</h3>
          <p class="text-sm text-gray-600 mt-1">
            Showing {{ pagination.total }} logs (page {{ pagination.page }} / {{ pagination.pages }})
          </p>
        </div>

        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Staff</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Target</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Result</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="log in auditLogs" :key="log._id" class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {{ formatDateTime(log.createdAt) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <div class="flex-shrink-0 h-8 w-8">
                      <div class="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <span class="text-xs font-medium text-blue-600">
                          {{ getInitials(log.actor.name) }}
                        </span>
                      </div>
                    </div>
                    <div class="ml-4">
                      <div class="text-sm font-medium text-gray-900">{{ log.actor.name }}</div>
                      <div class="text-sm text-gray-500">{{ log.actor.email }}</div>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                    :class="getActionBadgeClass(log.action)"
                  >
                    {{ getActionLabel(log.action) }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ log.target.type }}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                    :class="log.outcome === 'SUCCESS' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'"
                  >
                    {{ log.outcome === 'SUCCESS' ? 'Success' : 'Failed' }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <button @click="showLogDetails(log)" class="text-blue-600 hover:text-blue-900 font-medium">
                    View Details
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div class="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p class="text-sm text-gray-700">
                Showing
                <span class="font-medium">{{ (pagination.page - 1) * pagination.limit + 1 }}</span>
                to
                <span class="font-medium">{{ Math.min(pagination.page * pagination.limit, pagination.total) }}</span>
                of
                <span class="font-medium">{{ pagination.total }}</span>
                results
              </p>
            </div>
            <div>
              <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  @click="previousPage"
                  :disabled="pagination.page <= 1"
                  class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  <span class="sr-only">Previous</span>
                  <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd"
                          d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                          clip-rule="evenodd" />
                  </svg>
                </button>
                <button
                  @click="nextPage"
                  :disabled="pagination.page >= pagination.pages"
                  class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  <span class="sr-only">Next</span>
                  <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd"
                          d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                          clip-rule="evenodd" />
                  </svg>
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- Log Details Modal -->
    <div v-if="selectedLog" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div class="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
        <div class="mt-3">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-medium text-gray-900">Audit Log Details</h3>
            <button @click="selectedLog = null" class="text-gray-400 hover:text-gray-600">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700">Staff</label>
              <p class="mt-1 text-sm text-gray-900">{{ selectedLog.actor.name }} ({{ selectedLog.actor.email }})</p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700">Action</label>
              <p class="mt-1 text-sm text-gray-900">{{ getActionLabel(selectedLog.action) }}</p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700">Target</label>
              <p class="mt-1 text-sm text-gray-900">{{ selectedLog.target.type }} (ID: {{ selectedLog.target.id }})</p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700">Result</label>
              <span
                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                :class="selectedLog.outcome === 'SUCCESS' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'"
              >
                {{ selectedLog.outcome === 'SUCCESS' ? 'Success' : 'Failed' }}
              </span>
            </div>

            <div v-if="selectedLog.reason">
              <label class="block text-sm font-medium text-gray-700">Reason</label>
              <p class="mt-1 text-sm text-gray-900">{{ selectedLog.reason }}</p>
            </div>

            <div v-if="selectedLog.error">
              <label class="block text-sm font-medium text-gray-700">Error</label>
              <p class="mt-1 text-sm text-red-600">{{ selectedLog.error }}</p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700">Time</label>
              <p class="mt-1 text-sm text-gray-900">{{ formatDateTime(selectedLog.createdAt) }}</p>
            </div>

            <div v-if="selectedLog.before || selectedLog.after">
              <label class="block text-sm font-medium text-gray-700">Changes</label>
              <div class="mt-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div v-if="selectedLog.before">
                  <p class="text-sm font-medium text-gray-700">Before:</p>
                  <pre class="mt-1 text-xs text-gray-900 bg-gray-50 p-2 rounded">{{ JSON.stringify(selectedLog.before, null, 2) }}</pre>
                </div>
                <div v-if="selectedLog.after">
                  <p class="text-sm font-medium text-gray-700">After:</p>
                  <pre class="mt-1 text-xs text-gray-900 bg-gray-50 p-2 rounded">{{ JSON.stringify(selectedLog.after, null, 2) }}</pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
      </main>
    </div>
  </div>

</template>

<script>
import axios from "axios";
import Sidebar from './Sidebar.vue';
import Headers from './header.vue';

export default {
  name: "AuditLog",
  components: {
    Sidebar,
    Headers
  },
  data() {
    return {
      loading: false,
      error: null,
      auditLogs: [],
      staffList: [],
      selectedLog: null,
      filters: {
        role: "",
        staffId: "",
        action: "",
        dateRange: ""
      },
      pagination: {
        page: 1,
        limit: 10,
        total: 0,
        pages: 0
      }
    };
  },
  computed: {
    // Filter staff list based on selected role
    filteredStaffList() {
      if (!this.filters.role) {
        return this.staffList;
      }
      return this.staffList.filter(staff => staff.role === this.filters.role);
    }
  },
  watch: {
    // Watch for role changes and reset staff selection
    'filters.role'(newRole, oldRole) {
      if (newRole !== oldRole) {
        this.filters.staffId = ''; // Reset staff selection when role changes
      }
    }
  },
  mounted() {
    // initial load
    this.fetchStaffList();
    this.fetchAuditLogs();
  },
  methods: {
    // Fetch list of staff for the filter dropdown
    async fetchStaffList() {
      try {
        const response = await axios.get("/api/users?role=all&status=all");
        // Map to expected shape for UI
        this.staffList = response.data.users.map((user) => ({
          _id: user._id,
          // try to use a role-specific display name (keeps compatibility with your previous structure)
          name: (user[user.role] && (user[user.role].fullName || user[user.role].username)) || user.name || user.email,
          role: user.role
        }));
      } catch (err) {
        console.error("Error fetching staff list:", err);
        // non-blocking: user can still see logs but staff filter will be empty
      }
    },

    // Fetch audit logs with current filters and pagination
    async fetchAuditLogs() {
      this.loading = true;
      this.error = null;

      try {
        const params = {
          page: this.pagination.page,
          limit: this.pagination.limit,
          role: this.filters.role,
          staffId: this.filters.staffId,
          action: this.filters.action,
          dateRange: this.filters.dateRange
        };

        const response = await axios.get("/api/audit/logs", { params });

        if (response.data && response.data.success) {
          this.auditLogs = response.data.auditLogs || [];
          // keep pagination consistent — backend should return this shape
          this.pagination = {
            page: response.data.pagination.page,
            limit: response.data.pagination.limit,
            total: response.data.pagination.total,
            pages: response.data.pagination.pages
          };
        } else {
          // handle unexpected shape / error message
          this.error = (response.data && response.data.message) || "Failed to load audit logs.";
        }
      } catch (err) {
        console.error("Error fetching audit logs:", err);
        this.error = err.response?.data?.message || "Failed to load audit logs.";
      } finally {
        this.loading = false;
      }
    },

    // Apply filters and reset to first page
    applyFilters() {
      this.pagination.page = 1;
      this.fetchAuditLogs();
    },

    // Handle role change - reset staff filter
    onRoleChange() {
      this.filters.staffId = ''; // Reset staff selection when role changes
      this.applyFilters();
    },

    // Clear filters and reload
    clearFilters() {
      this.filters = {
        role: "",
        staffId: "",
        action: "",
        dateRange: ""
      };
      this.applyFilters();
    },

    // Pagination helpers
    previousPage() {
      if (this.pagination.page > 1) {
        this.pagination.page--;
        this.fetchAuditLogs();
      }
    },

    nextPage() {
      if (this.pagination.page < this.pagination.pages) {
        this.pagination.page++;
        this.fetchAuditLogs();
      }
    },

    // Show details modal
    showLogDetails(log) {
      this.selectedLog = log;
    },

    // Format date/time for display (uses en-US locale)
    formatDateTime(dateString) {
      if (!dateString) return "";
      const date = new Date(dateString);
      return date.toLocaleString("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      });
    },

    // Get initials from a name (used for avatar)
    getInitials(name) {
      if (!name) return "?";
      return name
        .split(" ")
        .map((n) => (n ? n[0] : ""))
        .join("")
        .toUpperCase()
        .slice(0, 2);
    },

    // Map action code to human label (English)
    getActionLabel(action) {
      const labels = {
        CREATE_INVOICE: "Create Invoice",
        UPDATE_INVOICE: "Update Invoice",
        DELETE_INVOICE: "Delete Invoice",
        CREATE_EXPORT_SLIP: "Create Export Slip",
        UPDATE_EXPORT_SLIP: "Update Export Slip",
        DELETE_EXPORT_SLIP: "Delete Export Slip",
        IMPORT_PRODUCT_EXCEL: "Import Products",
        UPDATE_PRODUCT: "Update Product",
        CHANGE_ROLE: "Change Role"
      };
      return labels[action] || action;
    },

    // Map action to badge classes (Tailwind)
    getActionBadgeClass(action) {
      const classes = {
        CREATE_INVOICE: "bg-green-100 text-green-800",
        UPDATE_INVOICE: "bg-blue-100 text-blue-800",
        DELETE_INVOICE: "bg-red-100 text-red-800",
        CREATE_EXPORT_SLIP: "bg-green-100 text-green-800",
        UPDATE_EXPORT_SLIP: "bg-blue-100 text-blue-800",
        DELETE_EXPORT_SLIP: "bg-red-100 text-red-800",
        IMPORT_PRODUCT_EXCEL: "bg-purple-100 text-purple-800",
        UPDATE_PRODUCT: "bg-yellow-100 text-yellow-800",
        CHANGE_ROLE: "bg-indigo-100 text-indigo-800"
      };
      return classes[action] || "bg-gray-100 text-gray-800";
    }
  }
};
</script>

<style scoped>
/* Add any component-specific styles here if needed */
</style>
