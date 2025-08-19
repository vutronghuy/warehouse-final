<template>
  <div v-if="show" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
      <!-- Header -->
      <div class="flex items-center justify-between p-6 border-b border-gray-200">
        <h3 class="text-lg font-medium text-gray-900">Create New Category</h3>
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
              Category Name <span class="text-red-500">*</span>
            </label>
            <input
              v-model="form.name"
              type="text"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter category name"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Category Code <span class="text-red-500">*</span>
            </label>
            <input
              v-model="form.code"
              type="text"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter category code (e.g., ELEC, FOOD)"
              style="text-transform: uppercase"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              v-model="form.description"
              rows="3"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter category description..."
            ></textarea>
          </div>

          <!-- Status is automatically set to 'active' on creation -->
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
            <span v-else>Create Category</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'CreateCategoryModal',
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
        code: '',
        description: ''
      }
    };
  },
  watch: {
    'form.name'(newName) {
      // Auto-generate code from name
      if (newName && !this.form.code) {
        this.form.code = newName
          .toUpperCase()
          .replace(/[^A-Z0-9]/g, '')
          .substring(0, 10);
      }
    }
  },
  methods: {
    closeModal() {
      this.resetForm();
      this.$emit('close');
    },
    resetForm() {
      this.form = {
        name: '',
        code: '',
        description: ''
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

        const response = await axios.post('/api/categories', this.form);

        if (response.data.success) {
          this.$emit('created', response.data.category);
          this.closeModal();
        }
      } catch (error) {
        console.error('Error creating category:', error);
        this.errorMessage = error.response?.data?.message || 'Failed to create category. Please try again.';
      } finally {
        this.isLoading = false;
      }
    }
  }
};
</script>

<style scoped>
/* Auto uppercase for code input */
input[style*="text-transform: uppercase"] {
  text-transform: uppercase;
}
</style>
