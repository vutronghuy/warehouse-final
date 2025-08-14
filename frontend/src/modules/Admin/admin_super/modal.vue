<template>
  <transition name="fade">
    <div v-if="show" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
        <div class="flex justify-between items-center mb-5">
          <h3 class="text-xl font-bold">Create New User</h3>
          <button @click="close" class="text-gray-500 hover:text-gray-700">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form @submit.prevent="submit">
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-1">Role</label>
              <select v-model="form.role" class="w-full border rounded-lg p-2">
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
              />

              <label class="block text-sm font-medium mb-1 mt-3">Password</label>
              <input
                v-model="form[form.role].password"
                type="password"
                required
                class="w-full border rounded-lg p-2"
              />

              <label class="block text-sm font-medium mb-1 mt-3">Full Name</label>
              <input
                v-model="form[form.role].fullName"
                type="text"
                required
                class="w-full border rounded-lg p-2"
              />

              <label class="block text-sm font-medium mb-1 mt-3">Email</label>
              <input v-model="form[form.role].email" type="email" class="w-full border rounded-lg p-2" />

              <!-- ADMIN: multi-select (checkbox list) -->
              <div v-if="form.role === 'admin'" class="mt-3">
                <label class="block text-sm font-medium mb-1">Warehouses (select one or more)</label>

                <div v-if="warehouses.length === 0" class="text-sm text-gray-500">
                  No warehouses available.
                </div>

                <div v-else class="max-h-40 overflow-auto border rounded p-2">
                  <div class="flex items-center mb-2">
                    <input
                      id="select-all"
                      type="checkbox"
                      :checked="allAdminSelected"
                      @change="toggleSelectAllAdmin($event)"
                      class="mr-2"
                    />
                    <label for="select-all" class="text-sm">Select all</label>
                  </div>

                  <div v-for="wh in warehouses" :key="wh._id" class="flex items-center py-1">
                    <input
                      type="checkbox"
                      :id="`admin-wh-${wh._id}`"
                      :value="wh._id"
                      v-model="form.admin.managedWarehouses"
                      class="mr-2"
                    />
                    <label :for="`admin-wh-${wh._id}`" class="text-sm">
                      {{ wh.name }} <span class="text-xs text-gray-400">({{ wh.location }})</span>
                    </label>
                  </div>
                </div>
              </div>

              <!-- MANAGER / STAFF: single select -->
              <div
                v-if="form.role === 'manager' || form.role === 'staff' || form.role === 'accounter'"
                class="mt-3"
              >
                <label class="block text-sm font-medium mb-1">Warehouse</label>
                <select v-model="form[form.role].warehouseId" required class="w-full border rounded-lg p-2">
                  <option disabled value="">Select warehouse</option>
                  <option v-for="wh in warehouses" :key="wh._id" :value="wh._id">
                    {{ wh.name }} ({{ wh.location }})
                  </option>
                </select>
              </div>
            </div>
          </div>

          <div class="mt-6 flex justify-end space-x-3">
            <button type="button" @click="close" class="px-4 py-2 bg-gray-200 rounded-lg">Cancel</button>
            <button
              :disabled="loading"
              type="submit"
              class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {{ loading ? 'Creating...' : 'Create' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </transition>
</template>

<script>
import axios from 'axios';
axios.defaults.baseURL = 'http://localhost:3003';

export default {
  name: 'CreateUserModal',
  props: { show: Boolean },
  data() {
    return {
      loading: false,
      warehouses: [],
      form: {
        role: '',
        admin: { username: '', password: '', fullName: '', email: '', managedWarehouses: [] },
        manager: { username: '', password: '', fullName: '', email: '', warehouseId: '' },
        staff: { username: '', password: '', fullName: '', email: '', warehouseId: '' },
        accounter: { username: '', password: '', fullName: '', email: '', warehouseId: '' },
      },
    };
  },
  computed: {
    allAdminSelected() {
      return (
        this.warehouses.length > 0 && this.form.admin.managedWarehouses.length === this.warehouses.length
      );
    },
  },
  watch: {
    show(newVal) {
      if (newVal) this.fetchWarehouses();
    },
  },
  methods: {
    close() {
      this.$emit('close');
      this.resetForm();
    },
    resetForm() {
      this.form.role = '';
      ['admin', 'manager', 'staff', 'accounter'].forEach((r) => {
        Object.keys(this.form[r]).forEach((k) => {
          this.form[r][k] = Array.isArray(this.form[r][k]) ? [] : '';
        });
      });
    },
    async fetchWarehouses() {
      try {
        const res = await axios.get('/warehouse');
        const list = res.data.data || res.data.warehouses || [];
        this.warehouses = Array.isArray(list) ? list : [];
      } catch (err) {
        console.error('Lấy danh sách warehouse lỗi:', err);
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

      // optional client validation: manager/staff require warehouseId, admin should pick at least one (if you want)
      if (
        (this.form.role === 'manager' || this.form.role === 'staff') &&
        !this.form[this.form.role].warehouseId
      ) {
        alert('Please select a warehouse for manager/staff.');
        return;
      }
      // if you want require admin pick at least one, uncomment:
      // if (this.form.role === 'admin' && this.form.admin.managedWarehouses.length === 0) {
      //   alert('Please select at least one warehouse for admin.');
      //   return;
      // }

      this.loading = true;
      try {
        const payload = {
          role: this.form.role,
          [this.form.role]: this.form[this.form.role],
        };
        const { data } = await axios.post('/user/create', payload);
        this.$emit('created', data.user);
        this.close();
      } catch (err) {
        console.error(err.response?.data || err);
        alert(err.response?.data?.message || 'Create user failed');
      } finally {
        this.loading = false;
      }
    },
  },
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
