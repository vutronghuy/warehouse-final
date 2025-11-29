<template>
  <transition name="fade">
    <div v-if="show" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
        <div class="flex justify-between items-center mb-5">
          <h3 class="text-xl font-bold">Edit User</h3>
          <button @click="close" class="text-gray-500 hover:text-gray-700">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form @submit.prevent="submit">
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-1">Role</label>
              <!-- Role is shown but disabled so it cannot be changed -->
              <select v-model="form.role" class="w-full border rounded-lg p-2 bg-gray-100 cursor-not-allowed" disabled>
                <option disabled value="">Select role</option>
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="staff">Staff</option>
                <option value="accounter">Accounter</option>
              </select>
            </div>

            <div v-if="form.role">
              <label class="block text-sm font-medium mb-1">Username</label>
              <input
                v-model="form[form.role].username"
                type="text"
                required
                class="w-full border rounded-lg p-2"
                :disabled="loading"
              />

              <label class="block text-sm font-medium mb-1 mt-3">Full Name</label>
              <input
                v-model="form[form.role].fullName"
                type="text"
                required
                class="w-full border rounded-lg p-2"
                :disabled="loading"
              />

              <label class="block text-sm font-medium mb-1 mt-3">Email</label>
              <input
                v-model="form[form.role].email"
                type="email"
                class="w-full border rounded-lg p-2"
                :disabled="loading"
              />

              <!-- NOTE: password not editable (hidden) -->
              <p class="text-xs text-gray-500 mt-2">Password cannot be changed here. Use Reset Password flow to change password.</p>

              <!-- ADMIN: multi-select (checkbox list) -->
              <div v-if="form.role === 'admin'" class="mt-3">
                <label class="block text-sm font-medium mb-1">Warehouses (select one or more)</label>

                <div v-if="warehouses.length === 0" class="text-sm text-gray-500">
                  No warehouses available.
                </div>

                <div v-else class="max-h-40 overflow-auto border rounded p-2">
              
                  <div v-for="wh in warehouses" :key="wh._id" class="flex items-center py-1">
                    <input
                      type="checkbox"
                      :id="`edit-admin-wh-${wh._id}`"
                      :value="wh._id"
                      v-model="form.admin.managedWarehouses"
                      class="mr-2"
                      :disabled="loading"
                    />
                    <label :for="`edit-admin-wh-${wh._id}`" class="text-sm">
                      {{ wh.name }} <span class="text-xs text-gray-400">({{ wh.location }})</span>
                    </label>
                  </div>
                </div>
              </div>

              <!-- MANAGER / STAFF / ACCOUNTER: single select -->
              <div v-if="form.role === 'manager' || form.role === 'staff' || form.role === 'accounter'" class="mt-3">
                <label class="block text-sm font-medium mb-1">Warehouse</label>
                <select v-model="form[form.role].warehouseId" required class="w-full border rounded-lg p-2" :disabled="loading">
                  <option disabled value="">Select warehouse</option>
                  <option v-for="wh in warehouses" :key="wh._id" :value="wh._id">
                    {{ wh.name }} ({{ wh.location }})
                  </option>
                </select>
              </div>
            </div>
          </div>

          <div class="mt-6 flex justify-end space-x-3">
            <button type="button" @click="close" class="px-4 py-2 bg-gray-200 rounded-lg" :disabled="loading">Cancel</button>
            <button
              :disabled="loading"
              type="submit"
              class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {{ loading ? 'Saving...' : 'Save changes' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </transition>
</template>

<script>
import axios from 'axios';
import { notifyWarehouseUpdate } from '@/utils/warehouseUtils.js';
axios.defaults.baseURL = 'http://localhost:3003';

export default {
  name: 'EditUserModal',
  emits: ['close', 'updated'],
  props: {
    show: { type: Boolean, required: true },
    user: { type: Object, default: null } // user object from server
  },
  data() {
    return {
      loading: false,
      warehouses: [],
      form: {
        role: '',
        admin: { username: '', fullName: '', email: '', managedWarehouses: [] },
        manager: { username: '', fullName: '', email: '', warehouseId: '' },
        staff: { username: '', fullName: '', email: '', warehouseId: '' },
        accounter: { username: '', fullName: '', email: '', warehouseId: '' },
      },
    };
  },
  computed: {
    allAdminSelected() {
      return (
        this.warehouses.length > 0 && Array.isArray(this.form.admin.managedWarehouses) &&
        this.form.admin.managedWarehouses.length === this.warehouses.length
      );
    }
  },
  watch: {
    show(newVal) {
      if (newVal) {
        this.fetchWarehouses();
        this.populateFromUser();
      }
    },
    user(newVal) {
      if (this.show && newVal) this.populateFromUser();
    }
  },
  methods: {
    close() {
      this.$emit('close');
      this.resetForm();
    },
    resetForm() {
      this.form.role = '';
      this.form.admin = { username: '', fullName: '', email: '', managedWarehouses: [] };
      this.form.manager = { username: '', fullName: '', email: '', warehouseId: '' };
      this.form.staff = { username: '', fullName: '', email: '', warehouseId: '' };
      this.form.accounter = { username: '', fullName: '', email: '', warehouseId: '' };
      this.loading = false;
    },
    populateFromUser() {
      if (!this.user) {
        this.resetForm();
        return;
      }

      // set role (readonly for editing)
      this.form.role = this.user.role || '';

      // helper to set subdoc fields
      const setSub = (roleKey) => {
        const sub = this.user[roleKey] || {};
        if (roleKey === 'admin') {
          this.form.admin.username = sub.username || '';
          this.form.admin.fullName = sub.fullName || '';
          this.form.admin.email = sub.email || '';
          if (Array.isArray(sub.managedWarehouses)) {
            this.form.admin.managedWarehouses = sub.managedWarehouses.map((v) => (typeof v === 'object' ? v._id : v));
          } else {
            this.form.admin.managedWarehouses = [];
          }
        } else {
          this.form[roleKey].username = sub.username || '';
          this.form[roleKey].fullName = sub.fullName || '';
          this.form[roleKey].email = sub.email || '';
          this.form[roleKey].warehouseId = sub.warehouseId ? (typeof sub.warehouseId === 'object' ? sub.warehouseId._id : sub.warehouseId) : '';
        }
      };

      ['admin', 'manager', 'staff', 'accounter'].forEach(setSub);
    },
    async fetchWarehouses() {
      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (token) {
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }

        const res = await axios.get('/api/warehouses/active');
        const list = res.data.warehouses || [];
        this.warehouses = Array.isArray(list) ? list : [];
      } catch (err) {
        console.error('Fetch warehouses error:', err);
        this.warehouses = [];
      }
    },
    toggleSelectAllAdmin(event) {
      if (event.target.checked) {
        this.form.admin.managedWarehouses = this.warehouses.map((w) => w._id);
      } else {
        this.form.admin.managedWarehouses = [];
      }
    },
    async submit() {
      if (!this.form.role) return;

      if ((this.form.role === 'manager' || this.form.role === 'staff') && !this.form[this.form.role].warehouseId) {
        alert('Please select a warehouse for manager/staff.');
        return;
      }

      this.loading = true;
      try {
        const role = this.form.role;
        const sub = JSON.parse(JSON.stringify(this.form[role] || {}));

        // Ensure password is not sent
        if (sub.password) delete sub.password;

        if (role === 'admin') {
          sub.managedWarehouses = Array.isArray(sub.managedWarehouses) ? sub.managedWarehouses : [];
        } else {
          if (!sub.warehouseId) delete sub.warehouseId;
        }

        const payload = { role, [role]: sub };

        const userId = this.user?._id;
        if (!userId) throw new Error('Missing user id');

        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (token) {
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }

        const { data } = await axios.put(`/api/users/${userId}`, payload);

        // Notify warehouse updates - always notify to refresh staff info
        const oldWarehouseId = this.getOriginalWarehouseId();
        const newWarehouseId = this.getCurrentWarehouseId();

        console.log('🔍 User update - Old warehouse:', oldWarehouseId);
        console.log('🔍 User update - New warehouse:', newWarehouseId);

        // If warehouse changed, notify both old and new
        if (oldWarehouseId && oldWarehouseId !== newWarehouseId) {
          console.log('🔄 Warehouse changed - notifying old warehouse:', oldWarehouseId);
          notifyWarehouseUpdate(oldWarehouseId);
        }

        // Always notify current warehouse (even if just user info changed)
        if (newWarehouseId) {
          console.log('🔄 Notifying current warehouse:', newWarehouseId);
          notifyWarehouseUpdate(newWarehouseId);
        }

        // If user info changed but warehouse stayed same, still notify
        if (oldWarehouseId && oldWarehouseId === newWarehouseId) {
          console.log('🔄 Same warehouse but user info changed - notifying:', oldWarehouseId);
          notifyWarehouseUpdate(oldWarehouseId);
        }

        this.$emit('updated', data.user || data);

        this.close();
      } catch (err) {
        console.error('Update user error:', err.response?.data || err);
        alert(err.response?.data?.message || 'Update user failed');
      } finally {
        this.loading = false;
      }
    },
    getOriginalWarehouseId() {
      if (!this.user) return null;

      const role = this.user.role;
      if (role === 'admin') {
        return null; // Admin có thể quản lý nhiều warehouse
      }

      const roleData = this.user[role];
      if (roleData && roleData.warehouseId) {
        return typeof roleData.warehouseId === 'object'
          ? roleData.warehouseId._id
          : roleData.warehouseId;
      }
      return null;
    },
    getCurrentWarehouseId() {
      const role = this.form.role;
      if (role === 'admin') {
        return null; // Admin có thể quản lý nhiều warehouse
      }

      return this.form[role]?.warehouseId || null;
    }
  }
};
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}
.fade-enter,
.fade-leave-to {
  opacity: 0;
}
</style>
