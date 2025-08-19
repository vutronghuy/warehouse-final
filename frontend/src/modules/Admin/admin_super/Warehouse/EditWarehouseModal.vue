<template>
  <div v-if="show" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
      <!-- Header -->
      <div class="flex items-center justify-between p-6 border-b border-gray-200">
        <h3 class="text-lg font-medium text-gray-900">Edit Warehouse</h3>
        <button
          @click="closeModal"
          class="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Form -->
      <form @submit.prevent="handleSubmit" class="p-6 space-y-6">
        <!-- Basic Information -->
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Warehouse Name <span class="text-red-500">*</span>
            </label>
            <input
              v-model="form.name"
              type="text"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter warehouse name"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Location <span class="text-red-500">*</span>
            </label>
            <textarea
              v-model="form.location"
              rows="3"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter warehouse address/location"
            ></textarea>
          </div>
        </div>

        <!-- Status -->
        <div class="border-t pt-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              v-model="form.status"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        <!-- Current Staff Info -->
        <div class="border-t pt-6">
          <h4 class="text-md font-medium text-gray-900 mb-4">Current Staff Assignment</h4>
          <div class="bg-gray-50 border border-gray-200 rounded-md p-4">
            <div class="space-y-3">
              <!-- Manager -->
              <div class="flex items-center justify-between">
                <span class="font-medium text-gray-700">Manager:</span>
                <span class="text-gray-900">{{ getManagerName(warehouse.managerId) }}</span>
              </div>

              <!-- Admin -->
              <div class="flex items-center justify-between">
                <span class="font-medium text-gray-700">Admin:</span>
                <span class="text-gray-900">{{ getAdminName(warehouse.adminId) }}</span>
              </div>

              <!-- Accounter -->
              <div class="flex items-center justify-between">
                <span class="font-medium text-gray-700">Accounter:</span>
                <span class="text-gray-900">{{ getAccounterName(warehouse.accounterId) }}</span>
              </div>

              <!-- Staff Members -->
              <div class="border-t pt-3">
                <div class="flex items-start justify-between">
                  <span class="font-medium text-gray-700">Staff Members:</span>
                  <div class="text-right">
                    <div class="text-gray-900 font-medium">{{ getStaffCount(warehouse.staffIds) }} member(s)</div>
                    <div v-if="warehouse.staffIds && warehouse.staffIds.length > 0" class="mt-1 text-sm text-gray-600">
                      <div v-for="staff in warehouse.staffIds" :key="staff._id" class="text-xs">
                        • {{ staff.fullName }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="mt-4 pt-3 border-t text-xs text-gray-500">
              💡 To change staff assignments, edit users and assign them to this warehouse.
            </div>
          </div>
        </div>

        <!-- Error Message -->
        <div v-if="errorMessage" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {{ errorMessage }}
        </div>

        <!-- Actions -->
        <div class="flex justify-end space-x-3 pt-6 border-t">
          <button
            type="button"
            @click="closeModal"
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            :disabled="isLoading"
            class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span v-if="isLoading">Updating...</span>
            <span v-else>Update Warehouse</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'EditWarehouseModal',
  props: {
    show: {
      type: Boolean,
      default: false
    },
    warehouse: {
      type: Object,
      default: () => ({})
    }
  },
  emits: ['close', 'updated', 'warehouse-updated'],
  data() {
    return {
      isLoading: false,
      errorMessage: '',
      form: {
        name: '',
        location: '',
        status: 'active'
      }
    };
  },
  watch: {
    warehouse: {
      handler(newWarehouse) {
        if (newWarehouse && Object.keys(newWarehouse).length > 0) {
          this.populateForm(newWarehouse);
        }
      },
      immediate: true,
      deep: true
    },
    show(newVal) {
      if (newVal && this.warehouse && this.warehouse._id) {
        // Refresh warehouse data when modal opens
        this.refreshWarehouseData();
      }
    }
  },
  methods: {
    populateForm(warehouse) {
      this.form = {
        name: warehouse.name || '',
        location: warehouse.location || '',
        status: warehouse.status || 'active'
      };
    },
    closeModal() {
      this.errorMessage = '';
      this.$emit('close');
    },
    getManagerName(managerData) {
      if (typeof managerData === 'object' && managerData !== null) {
        return managerData.fullName || 'Unknown';
      }
      return 'Not assigned';
    },
    getAdminName(adminData) {
      if (typeof adminData === 'object' && adminData !== null) {
        return adminData.fullName || 'Unknown';
      }
      return 'Not assigned';
    },
    getAccounterName(accounterData) {
      if (typeof accounterData === 'object' && accounterData !== null) {
        return accounterData.fullName || 'Unknown';
      }
      return 'Not assigned';
    },
    getStaffCount(staffIds) {
      if (Array.isArray(staffIds)) {
        return staffIds.length;
      }
      return 0;
    },
    async refreshWarehouseData() {
      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (token) {
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }
        // console.log(this.warehouse._id);
        const response = await axios.get(`/api/warehouses/${this.warehouse._id}`);

        if (response.data.success) {
          // Update the warehouse prop with fresh data
          this.$emit('warehouse-updated', response.data.warehouse);
        }
      } catch (error) {
        console.error('Error refreshing warehouse data:', error);
      }
    },
    async handleSubmit() {
      this.isLoading = true;
      this.errorMessage = '';

      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (token) {
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }

        const response = await axios.put(`/api/warehouses/${this.warehouse._id}`, this.form);

        if (response.data.success) {
          this.$emit('updated', response.data.warehouse);
          this.closeModal();
        }
      } catch (error) {
        console.error('Error updating warehouse:', error);
        this.errorMessage = error.response?.data?.message || 'Failed to update warehouse. Please try again.';
      } finally {
        this.isLoading = false;
      }
    }
  }
};
</script>

<style scoped>
/* Custom checkbox styling */
input[type="checkbox"]:checked {
  background-color: #3B82F6;
  border-color: #3B82F6;
}
</style>
