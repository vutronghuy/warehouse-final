<template>
  <div>
    <div class="mb-4">
      <h3 class="text-lg font-medium text-gray-900 mb-2">My Activity History</h3>
      <p class="text-sm text-gray-600">View your activity history for imports, exports, and invoices</p>
    </div>

    <!-- Filters -->
    <div class="mb-6 bg-white p-4 rounded-lg shadow-sm border">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Action</label>
          <select
            v-model="filters.action"
            @change="loadAuditLogs"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Actions</option>
            <option v-for="action in availableActions" :key="action" :value="action">
              {{ formatAction(action) }}
            </option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Target Type</label>
          <select
            v-model="filters.targetType"
            @change="loadAuditLogs"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Types</option>
            <option v-for="type in availableTargetTypes" :key="type" :value="type">
              {{ type }}
            </option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Outcome</label>
          <select
            v-model="filters.outcome"
            @change="loadAuditLogs"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Outcomes</option>
            <option value="SUCCESS">Success</option>
            <option value="FAILED">Failed</option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
          <input
            v-model="filters.startDate"
            type="date"
            @change="loadAuditLogs"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div class="mt-4 flex gap-2">
        <button
          @click="resetFilters"
          class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Reset Filters
        </button>
        <button
          @click="loadAuditLogs"
          class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Refresh
        </button>
      </div>
    </div>

    <!-- Audit Logs Table -->
    <div class="bg-white rounded-lg shadow-sm border overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Action
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Target
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Outcome
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Details
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="log in auditLogs" :key="log._id">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div class="w-8 h-8 bg-gradient-to-br from-[#6A4C93] to-[#8E63B9] rounded-full flex items-center justify-center text-white text-xs font-semibold mr-3">
                    {{ getActionIcon(log.action) }}
                  </div>
                  <div>
                    <div class="text-sm font-medium text-gray-900">
                      {{ formatAction(log.action) }}
                    </div>
                    <div class="text-sm text-gray-500">{{ log.target.type }}</div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">{{ log.target.type }}</div>
                <div class="text-sm text-gray-500">{{ log.target.id }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span :class="getOutcomeClass(log.outcome)">
                  {{ log.outcome }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ formatDate(log.createdAt) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <button
                  @click="showLogDetails(log)"
                  class="text-blue-600 hover:text-blue-900 text-sm font-medium"
                >
                  View Details
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="pagination && pagination.totalPages > 1" class="px-6 py-4 border-t border-gray-200">
        <div class="flex items-center justify-between">
          <div class="text-sm text-gray-700">
            Showing {{ (pagination.currentPage - 1) * pagination.itemsPerPage + 1 }} to
            {{ Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems) }} of
            {{ pagination.totalItems }} results
          </div>
          <div class="flex items-center space-x-4">
            <span class="text-sm text-gray-700">
              Page {{ pagination.currentPage }} of {{ pagination.totalPages }}
            </span>
            <div class="flex space-x-2">
              <button
                @click="changePage(pagination.currentPage - 1)"
                :disabled="pagination.currentPage <= 1"
                class="px-3 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                @click="changePage(pagination.currentPage + 1)"
                :disabled="pagination.currentPage >= pagination.totalPages"
                class="px-3 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="auditLogs.length === 0 && !isLoading" class="text-center py-8">
      <div class="text-gray-400 mb-4">
        <svg class="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <p class="text-gray-500 text-lg font-medium">No activity history found</p>
      <p class="text-gray-400 text-sm mt-2">
        Your activity history will appear here when you perform actions like importing products, creating exports, or managing invoices.
      </p>
    </div>

    <div v-if="isLoading" class="text-center py-8 text-gray-500">
      Loading your activity history...
    </div>

    <AuditLogDetailModal :log="selectedLog" :open="!!selectedLog" @close="selectedLog = null" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import AuditLogDetailModal from './AuditLogDetailModal.vue';

// Reactive data
const auditLogs = ref([]);
const isLoading = ref(false);
const pagination = ref(null);
const currentPage = ref(1);
const selectedLog = ref(null);
const availableActions = ref([]);
const availableTargetTypes = ref([]);
const currentUser = ref(null);
const filters = ref({
  action: '',
  targetType: '',
  outcome: '',
  startDate: '',
});

// Methods
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
};

const formatAction = (action) => {
  const actionMap = {
    'IMPORT_PRODUCT_EXCEL': 'Import Products from Excel',
    'CREATE_EXPORT_SLIP': 'Create Export Slip',
    'UPDATE_EXPORT_SLIP': 'Update Export Slip',
    'DELETE_EXPORT_SLIP': 'Delete Export Slip',
    'CREATE_INVOICE': 'Create Invoice',
    'UPDATE_INVOICE': 'Update Invoice',
    'DELETE_INVOICE': 'Delete Invoice',
  };
  return actionMap[action] || action;
};

const getActionIcon = (action) => {
  const iconMap = {
    'IMPORT_PRODUCT_EXCEL': '📥',
    'CREATE_EXPORT_SLIP': '📤',
    'UPDATE_EXPORT_SLIP': '✏️',
    'DELETE_EXPORT_SLIP': '🗑️',
    'CREATE_INVOICE': '📄',
    'UPDATE_INVOICE': '✏️',
    'DELETE_INVOICE': '🗑️',
  };
  return iconMap[action] || '📋';
};

const getOutcomeClass = (outcome) => {
  const baseClass = 'inline-flex px-2 py-1 text-xs font-semibold rounded-full';
  switch (outcome) {
    case 'SUCCESS':
      return `${baseClass} bg-green-100 text-green-800`;
    case 'FAILED':
      return `${baseClass} bg-red-100 text-red-800`;
    default:
      return `${baseClass} bg-gray-100 text-gray-800`;
  }
};

const loadCurrentUser = async () => {
  try {
    const response = await axios.get('/api/auth/me');
    if (response.data?.success) {
      currentUser.value = response.data.user;
    }
  } catch (error) {
    console.error('Error loading current user:', error);
  }
};

const loadAuditLogs = async () => {
  if (!currentUser.value) {
    await loadCurrentUser();
  }

  isLoading.value = true;
  try {
    const params = {
      page: currentPage.value,
      limit: 20
    };

    if (filters.value.action) params.action = filters.value.action;
    if (filters.value.targetType) params.targetType = filters.value.targetType;
    if (filters.value.outcome) params.outcome = filters.value.outcome;
    if (filters.value.startDate) params.startDate = filters.value.startDate;

    const response = await axios.get('/api/audit/logs', { params });
    if (response.data?.success) {
      auditLogs.value = response.data.auditLogs || [];
      pagination.value = response.data.pagination;
    }
  } catch (error) {
    console.error('Error loading audit logs:', error);
  } finally {
    isLoading.value = false;
  }
};

const loadAvailableFilters = async () => {
  try {
    const [actionsResponse, targetTypesResponse] = await Promise.all([
      axios.get('/api/audit/actions'),
      axios.get('/api/audit/target-types')
    ]);

    if (actionsResponse.data?.success) {
      availableActions.value = actionsResponse.data.actions || [];
    }

    if (targetTypesResponse.data?.success) {
      availableTargetTypes.value = targetTypesResponse.data.targetTypes || [];
    }
  } catch (error) {
    console.error('Error loading available filters:', error);
  }
};

const resetFilters = () => {
  filters.value = {
    action: '',
    targetType: '',
    outcome: '',
    startDate: ''
  };
  currentPage.value = 1;
  loadAuditLogs();
};

const changePage = (page) => {
  if (!pagination.value) return;
  if (page >= 1 && page <= pagination.value.totalPages) {
    currentPage.value = page;
    loadAuditLogs();
  }
};

const showLogDetails = (log) => {
  selectedLog.value = log;
};

// Lifecycle
onMounted(async () => {
  await loadCurrentUser();
  await loadAvailableFilters();
  await loadAuditLogs();
});

// Expose methods for parent component
defineExpose({
  loadAuditLogs,
});
</script>
