<template>
  <div class="bg-white shadow rounded-lg">
    <div class="px-4 py-5 sm:p-6">
      <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">Role Change History</h3>

      <!-- Filters -->
      <div class="mb-4 flex gap-4">
        <div class="flex-1">
          <input
            v-model="searchQuery"
            @input="debounceSearch"
            type="text"
            placeholder="Search by user name or email..."
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          v-model="selectedUserId"
          @change="loadRoleChangeHistory"
          class="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Users</option>
          <option
            v-for="user in users"
            :key="user.id"
            :value="user.id"
          >
            {{ user.name }} ({{ user.email }})
          </option>
        </select>
        <button
          @click="resetFilters"
          class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Reset
        </button>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="text-center py-8">
        <div class="inline-flex items-center">
          <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading role change history...
        </div>
      </div>

      <!-- History Table -->
      <div v-else class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actor
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Target User
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role Change
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Reason
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Outcome
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="log in roleChangeHistory" :key="log._id">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div class="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <span class="text-sm font-medium text-purple-800">
                      {{ getUserInitials(log.actor.name) }}
                    </span>
                  </div>
                  <div class="ml-3">
                    <div class="text-sm font-medium text-gray-900">{{ log.actor.name }}</div>
                    <div class="text-sm text-gray-500">{{ log.actor.email }}</div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">{{ log.before?.name || 'Unknown' }}</div>
                <div class="text-sm text-gray-500">{{ log.before?.email || 'No email' }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center space-x-2">
                  <span class="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                    {{ log.meta?.fromRole?.toUpperCase() || 'Unknown' }}
                  </span>
                  <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                  <span class="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                    {{ log.meta?.toRole?.toUpperCase() || 'Unknown' }}
                  </span>
                </div>
              </td>
              <td class="px-6 py-4">
                <div class="text-sm text-gray-900 max-w-xs truncate">
                  {{ log.reason || 'No reason provided' }}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span :class="getOutcomeClass(log.outcome)" class="inline-flex px-2 py-1 text-xs font-semibold rounded-full">
                  {{ log.outcome }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ formatDate(log.createdAt) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button
                  @click="showLogDetails(log)"
                  class="text-blue-600 hover:text-blue-900"
                >
                  View Details
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Empty State -->
      <div v-if="!isLoading && roleChangeHistory.length === 0" class="text-center py-8">
        <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h3 class="mt-2 text-sm font-medium text-gray-900">No role changes found</h3>
        <p class="mt-1 text-sm text-gray-500">No role change history available.</p>
      </div>

      <!-- Pagination -->
      <div v-if="pagination && pagination.totalPages > 1" class="mt-4 flex items-center justify-between">
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

    <!-- Log Details Modal -->
    <div v-if="selectedLog" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div class="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
        <div class="mt-3">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-medium text-gray-900">Role Change Details</h3>
            <button
              @click="selectedLog = null"
              class="text-gray-400 hover:text-gray-600"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div class="space-y-4 text-gray-700">
            <div>
              <label class="block text-sm font-medium text-gray-700">Actor (Super Admin)</label>
              <p class="mt-1 text-sm text-gray-900">{{ selectedLog.actor.name }} ({{ selectedLog.actor.email }})</p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700">Target User</label>
              <p class="mt-1 text-sm text-gray-900">{{ selectedLog.before?.name || 'Unknown' }} ({{ selectedLog.before?.email || 'No email' }})</p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700">Role Change</label>
              <div class="mt-1 flex items-center space-x-2">
                <span class="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                  {{ selectedLog.meta?.fromRole?.toUpperCase() || 'Unknown' }}
                </span>
                <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
                <span class="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                  {{ selectedLog.meta?.toRole?.toUpperCase() || 'Unknown' }}
                </span>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700">Reason</label>
              <p class="mt-1 text-sm text-gray-900">{{ selectedLog.reason || 'No reason provided' }}</p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700">Outcome</label>
              <span :class="getOutcomeClass(selectedLog.outcome)" class="inline-flex px-2 py-1 text-xs font-semibold rounded-full">
                {{ selectedLog.outcome }}
              </span>
            </div>

            <div v-if="selectedLog.error">
              <label class="block text-sm font-medium text-gray-700">Error</label>
              <p class="mt-1 text-sm text-red-600">{{ selectedLog.error }}</p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700">Date</label>
              <p class="mt-1 text-sm text-gray-900">{{ formatDate(selectedLog.createdAt) }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import axios from 'axios';

// Reactive data
const roleChangeHistory = ref([]);
const users = ref([]);
const isLoading = ref(false);
const pagination = ref(null);
const currentPage = ref(1);
const searchQuery = ref('');
const selectedUserId = ref('');
const selectedLog = ref(null);
const searchTimeout = ref(null);

// Methods
const getUserInitials = (name) => {
  if (!name) return 'NA';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

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

const loadRoleChangeHistory = async () => {
  isLoading.value = true;
  try {
    const params = {
      page: currentPage.value,
      limit: 20
    };

    if (selectedUserId.value) {
      params.userId = selectedUserId.value;
    }

    const response = await axios.get('/api/user-roles/role-change-history', { params });
    if (response.data?.success) {
      roleChangeHistory.value = response.data.roleChangeHistory || [];
      pagination.value = response.data.pagination;
    }
  } catch (error) {
    console.error('Error loading role change history:', error);
  } finally {
    isLoading.value = false;
  }
};

const loadUsers = async () => {
  try {
    const response = await axios.get('/api/users');
    if (response.data?.success) {
      users.value = response.data.users || [];
    }
  } catch (error) {
    console.error('Error loading users:', error);
  }
};

const debounceSearch = () => {
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value);
  }
  searchTimeout.value = setTimeout(() => {
    currentPage.value = 1;
    loadRoleChangeHistory();
  }, 500);
};

const resetFilters = () => {
  searchQuery.value = '';
  selectedUserId.value = '';
  currentPage.value = 1;
  loadRoleChangeHistory();
};

const changePage = (page) => {
  if (!pagination.value) return;
  if (page >= 1 && page <= pagination.value.totalPages) {
    currentPage.value = page;
    loadRoleChangeHistory();
  }
};

const showLogDetails = (log) => {
  selectedLog.value = log;
};

// Lifecycle
onMounted(() => {
  loadUsers();
  loadRoleChangeHistory();
});

// Watch for search query changes
watch(searchQuery, () => {
  debounceSearch();
});
</script>
