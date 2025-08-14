<template>
  <div v-if="show" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
      <!-- Header -->
      <div class="flex items-center justify-between p-6 border-b border-gray-200">
        <h3 class="text-lg font-medium text-gray-900">Edit Supplier</h3>
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
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Supplier Name <span class="text-red-500">*</span>
            </label>
            <input
              v-model="form.name"
              type="text"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter supplier name"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Supplier Code <span class="text-red-500">*</span>
            </label>
            <input
              v-model="form.code"
              type="text"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter supplier code"
            />
          </div>
        </div>

        <!-- Contact Information -->
        <div class="border-t pt-6">
          <h4 class="text-md font-medium text-gray-900 mb-4">Contact Information</h4>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                v-model="form.contactInfo.email"
                type="email"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="supplier@example.com"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Phone</label>
              <input
                v-model="form.contactInfo.phone"
                type="tel"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="+84 xxx xxx xxx"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Website</label>
              <input
                v-model="form.contactInfo.website"
                type="url"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="https://supplier.com"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Business Type</label>
              <select
                v-model="form.businessInfo.businessType"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select business type</option>
                <option value="manufacturer">Manufacturer</option>
                <option value="distributor">Distributor</option>
                <option value="retailer">Retailer</option>
                <option value="wholesaler">Wholesaler</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Address -->
        <div class="border-t pt-6">
          <h4 class="text-md font-medium text-gray-900 mb-4">Address</h4>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-gray-700 mb-2">Street Address</label>
              <input
                v-model="form.contactInfo.address.street"
                type="text"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Street address"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">City</label>
              <input
                v-model="form.contactInfo.address.city"
                type="text"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="City"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">State/Province</label>
              <input
                v-model="form.contactInfo.address.state"
                type="text"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="State/Province"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Country</label>
              <input
                v-model="form.contactInfo.address.country"
                type="text"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Country"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Zip Code</label>
              <input
                v-model="form.contactInfo.address.zipCode"
                type="text"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Zip code"
              />
            </div>
          </div>
        </div>

        <!-- Business Information -->
        <div class="border-t pt-6">
          <h4 class="text-md font-medium text-gray-900 mb-4">Business Information</h4>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Tax ID</label>
              <input
                v-model="form.businessInfo.taxId"
                type="text"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Tax ID"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Business License</label>
              <input
                v-model="form.businessInfo.businessLicense"
                type="text"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Business license number"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Established Year</label>
              <input
                v-model="form.businessInfo.establishedYear"
                type="number"
                min="1900"
                :max="new Date().getFullYear()"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="2020"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Payment Terms</label>
              <select
                v-model="form.paymentTerms"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="cash">Cash</option>
                <option value="net15">Net 15</option>
                <option value="net30">Net 30</option>
                <option value="net45">Net 45</option>
                <option value="net60">Net 60</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Contact Person -->
        <div class="border-t pt-6">
          <h4 class="text-md font-medium text-gray-900 mb-4">Contact Person</h4>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Name</label>
              <input
                v-model="form.contactPerson.name"
                type="text"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Contact person name"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Title</label>
              <input
                v-model="form.contactPerson.title"
                type="text"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Sales Manager"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                v-model="form.contactPerson.email"
                type="email"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="contact@supplier.com"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Phone</label>
              <input
                v-model="form.contactPerson.phone"
                type="tel"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="+84 xxx xxx xxx"
              />
            </div>
          </div>
        </div>

        <!-- Status -->
        <div class="border-t pt-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                v-model="form.status"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Notes -->
        <div class="border-t pt-6">
          <label class="block text-sm font-medium text-gray-700 mb-2">Notes</label>
          <textarea
            v-model="form.notes"
            rows="3"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Additional notes about the supplier..."
          ></textarea>
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
            <span v-else>Update Supplier</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'EditSupplierModal',
  props: {
    show: {
      type: Boolean,
      default: false
    },
    supplier: {
      type: Object,
      default: () => ({})
    }
  },
  emits: ['close', 'updated'],
  data() {
    return {
      isLoading: false,
      errorMessage: '',
      form: {
        name: '',
        code: '',
        contactInfo: {
          email: '',
          phone: '',
          website: '',
          address: {
            street: '',
            city: '',
            state: '',
            country: '',
            zipCode: ''
          }
        },
        businessInfo: {
          taxId: '',
          businessLicense: '',
          businessType: '',
          establishedYear: null
        },
        contactPerson: {
          name: '',
          title: '',
          email: '',
          phone: ''
        },
        paymentTerms: 'net30',
        status: 'active',
        notes: ''
      }
    };
  },
  watch: {
    supplier: {
      handler(newSupplier) {
        if (newSupplier && Object.keys(newSupplier).length > 0) {
          this.populateForm(newSupplier);
        }
      },
      immediate: true,
      deep: true
    }
  },
  methods: {
    populateForm(supplier) {
      this.form = {
        name: supplier.name || '',
        code: supplier.code || '',
        contactInfo: {
          email: supplier.contactInfo?.email || '',
          phone: supplier.contactInfo?.phone || '',
          website: supplier.contactInfo?.website || '',
          address: {
            street: supplier.contactInfo?.address?.street || '',
            city: supplier.contactInfo?.address?.city || '',
            state: supplier.contactInfo?.address?.state || '',
            country: supplier.contactInfo?.address?.country || '',
            zipCode: supplier.contactInfo?.address?.zipCode || ''
          }
        },
        businessInfo: {
          taxId: supplier.businessInfo?.taxId || '',
          businessLicense: supplier.businessInfo?.businessLicense || '',
          businessType: supplier.businessInfo?.businessType || '',
          establishedYear: supplier.businessInfo?.establishedYear || null
        },
        contactPerson: {
          name: supplier.contactPerson?.name || '',
          title: supplier.contactPerson?.title || '',
          email: supplier.contactPerson?.email || '',
          phone: supplier.contactPerson?.phone || ''
        },
        paymentTerms: supplier.paymentTerms || 'net30',
        status: supplier.status || 'active',
        notes: supplier.notes || ''
      };
    },
    closeModal() {
      this.errorMessage = '';
      this.$emit('close');
    },
    async handleSubmit() {
      this.isLoading = true;
      this.errorMessage = '';

      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (token) {
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }

        const response = await axios.put(`/api/suppliers/${this.supplier._id}`, this.form);

        if (response.data.success) {
          this.$emit('updated', response.data.supplier);
          this.closeModal();
        }
      } catch (error) {
        console.error('Error updating supplier:', error);
        this.errorMessage = error.response?.data?.message || 'Failed to update supplier. Please try again.';
      } finally {
        this.isLoading = false;
      }
    }
  }
};
</script>
