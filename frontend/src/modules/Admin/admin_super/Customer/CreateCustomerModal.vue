<template>
  <div v-if="visible" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
    <div class="relative top-10 mx-auto p-6 border w-11/12 md:w-1/2 lg:w-1/3 shadow-lg rounded-md bg-white">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-medium text-gray-900">Create New Customer</h3>
        <button @click="$emit('close')" class="text-gray-400 hover:text-gray-600">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <form @submit.prevent="onSubmit" class="space-y-4">
        <!-- Customer Name -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Customer Name *</label>
          <input
            v-model="form.name"
            @blur="validateField('name')"
            @input="clearFieldError('name')"
            type="text"
            required
            :class="[
              'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
              fieldErrors.name ? 'border-red-500' : 'border-gray-300'
            ]"
            placeholder="Enter customer name"
          />
          <p v-if="fieldErrors.name" class="mt-1 text-sm text-red-600">{{ fieldErrors.name }}</p>
        </div>

        <!-- Phone -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
          <input
            v-model="form.phone"
            @blur="validateField('phone')"
            @input="clearFieldError('phone')"
            type="tel"
            required
            :class="[
              'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
              fieldErrors.phone ? 'border-red-500' : 'border-gray-300'
            ]"
            placeholder="Enter phone number"
          />
          <p v-if="fieldErrors.phone" class="mt-1 text-sm text-red-600">{{ fieldErrors.phone }}</p>
        </div>

        <!-- Address -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Address *</label>
          <textarea
            v-model="form.address"
            @blur="validateField('address')"
            @input="clearFieldError('address')"
            required
            rows="3"
            :class="[
              'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
              fieldErrors.address ? 'border-red-500' : 'border-gray-300'
            ]"
            placeholder="Enter customer address"
          ></textarea>
          <p v-if="fieldErrors.address" class="mt-1 text-sm text-red-600">{{ fieldErrors.address }}</p>
        </div>

        <!-- Email (Optional) -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            v-model="form.email"
            @blur="validateField('email')"
            @input="clearFieldError('email')"
            type="email"
            :class="[
              'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
              fieldErrors.email ? 'border-red-500' : 'border-gray-300'
            ]"
            placeholder="Enter email address (optional)"
          />
          <p v-if="fieldErrors.email" class="mt-1 text-sm text-red-600">{{ fieldErrors.email }}</p>
          <p v-if="form.email && !fieldErrors.email" class="mt-1 text-xs text-gray-500">
            Email will be validated and normalized on server
          </p>
        </div>

        <!-- Status -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            v-model="form.status"
            @blur="validateField('status')"
            @change="clearFieldError('status')"
            :class="[
              'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
              fieldErrors.status ? 'border-red-500' : 'border-gray-300'
            ]"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <p v-if="fieldErrors.status" class="mt-1 text-sm text-red-600">{{ fieldErrors.status }}</p>
          <p v-if="form.status && !fieldErrors.status" class="mt-1 text-xs text-gray-500">
            Status validated on server (active/inactive only)
          </p>
        </div>

        <!-- Notes (Optional) -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea
            v-model="form.notes"
            rows="2"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Additional notes (optional)"
          ></textarea>
        </div>

        <!-- Actions -->
        <div class="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            @click="$emit('close')"
            class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            :disabled="isSubmitting"
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ isSubmitting ? 'Creating...' : 'Create Customer' }}
          </button>
        </div>
      </form>

      <!-- Error Messages -->
      <div v-if="error" class="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
        <p class="text-sm text-red-600">{{ error }}</p>
      </div>

      <!-- Validation Errors -->
      <div v-if="validationErrors.length > 0" class="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
        <h4 class="text-sm font-medium text-red-800 mb-2">Please fix the following errors:</h4>
        <ul class="text-sm text-red-600 space-y-1">
          <li v-for="error in validationErrors" :key="error" class="flex items-center">
            <span class="w-1 h-1 bg-red-500 rounded-full mr-2"></span>
            {{ error }}
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'CreateCustomerModal',
  props: {
    visible: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      form: {
        name: '',
        phone: '',
        address: '',
        email: '',
        status: 'active',
        notes: '',
      },
      isSubmitting: false,
      error: '',
      validationErrors: [],
      fieldErrors: {},
    };
  },
  watch: {
    visible(val) {
      if (!val) {
        // Reset form when modal is closed
        this.resetForm();
      }
    },
  },
  methods: {
    async onSubmit() {
      // Frontend validation first (UX)
      if (!this.validateForm()) {
        return;
      }

      this.error = '';
      this.validationErrors = [];
      this.isSubmitting = true;

      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');

        const payload = {
          name: this.form.name.trim(),
          phone: this.form.phone.trim(),
          address: this.form.address.trim(),
          status: this.form.status,
        };

        // Add optional fields if they have values
        if (this.form.email.trim()) {
          payload.email = this.form.email.trim().toLowerCase();
        }
        if (this.form.notes.trim()) {
          payload.notes = this.form.notes.trim();
        }

        const response = await axios.post('/api/customers', payload, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.data.success) {
          this.$emit('created', response.data.customer);
          this.resetForm();
        } else {
          this.error = response.data.message || 'Failed to create customer';
        }
      } catch (error) {
        console.error('Error creating customer:', error);

        // Handle server validation errors
        if (error.response?.data?.errors) {
          this.validationErrors = error.response.data.errors;
        } else if (error.response?.data?.message) {
          this.error = error.response.data.message;
        } else {
          this.error = 'An error occurred while creating the customer';
        }
      } finally {
        this.isSubmitting = false;
      }
    },

    resetForm() {
      this.form = {
        name: '',
        phone: '',
        address: '',
        email: '',
        status: 'active',
        notes: '',
      };
      this.error = '';
      this.validationErrors = [];
      this.fieldErrors = {};
      this.isSubmitting = false;
    },

    // Frontend validation methods
    validateField(fieldName) {
      this.clearFieldError(fieldName);

      switch (fieldName) {
        case 'name':
          if (!this.form.name.trim()) {
            this.fieldErrors.name = 'Customer name is required';
          }
          break;

        case 'phone':
          if (!this.form.phone.trim()) {
            this.fieldErrors.phone = 'Phone number is required';
          } else if (this.form.phone.trim().length < 8) {
            this.fieldErrors.phone = 'Phone number must be at least 8 characters';
          }
          break;

        case 'address':
          if (!this.form.address.trim()) {
            this.fieldErrors.address = 'Address is required';
          }
          break;

        case 'email':
          if (this.form.email.trim()) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(this.form.email.trim())) {
              this.fieldErrors.email = 'Please enter a valid email address';
            }
          }
          break;

        case 'status':
          if (!['active', 'inactive'].includes(this.form.status)) {
            this.fieldErrors.status = 'Status must be active or inactive';
          }
          break;
      }
    },

    clearFieldError(fieldName) {
      if (this.fieldErrors[fieldName]) {
        this.$delete(this.fieldErrors, fieldName);
      }
    },

    validateForm() {
      this.validationErrors = [];
      this.fieldErrors = {};

      // Validate all required fields
      const requiredFields = ['name', 'phone', 'address'];
      requiredFields.forEach(field => {
        this.validateField(field);
      });

      // Validate optional fields if they have values
      if (this.form.email.trim()) {
        this.validateField('email');
      }

      // Validate status
      this.validateField('status');

      // Check if any field has errors
      const hasFieldErrors = Object.keys(this.fieldErrors).length > 0;

      if (hasFieldErrors) {
        this.validationErrors.push('Please fix the highlighted fields above');
        return false;
      }

      return true;
    },
  },
};
</script>
