<template>
  <div v-if="show" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
      <!-- Header -->
      <div class="flex items-center justify-between p-6 border-b border-gray-200">
        <h3 class="text-lg font-medium text-gray-900">Create New Warehouse</h3>
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

        <!-- Note about staff assignment -->
        <div class="border-t pt-6">
          <div class="bg-blue-50 border border-blue-200 rounded-md p-4">
            <div class="flex items-start">
              <svg class="w-5 h-5 text-blue-400 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div class="text-sm text-blue-700">
                <p class="font-medium">Staff Assignment</p>
                <p class="mt-1">Manager, Admin, Accounter, and Staff will be assigned to this warehouse when creating/editing users.</p>
              </div>
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
            <span v-if="isLoading">Creating...</span>
            <span v-else>Create Warehouse</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'CreateWarehouseModal',
  props: {
    show: {
      type: Boolean,
      default: false
    }
  },
  emits: ['close', 'created'],
  data() {
    return {
      isLoading: false,
      errorMessage: '',
      form: {
        name: '',
        location: ''
      }
    };
  },

  methods: {
    closeModal() {
      this.resetForm();
      this.$emit('close');
    },
    resetForm() {
      this.form = {
        name: '',
        location: ''
      };
      this.errorMessage = '';
    },
    async handleSubmit() {
      this.isLoading = true;
      this.errorMessage = '';

      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (token) {
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }

        const response = await axios.post('/api/warehouses/create', this.form);

        if (response.data.success) {
          this.$emit('created', response.data.warehouse);
          this.closeModal();
        }
      } catch (error) {
        console.error('Error creating warehouse:', error);
        this.errorMessage = error.response?.data?.message || 'Failed to create warehouse. Please try again.';
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
