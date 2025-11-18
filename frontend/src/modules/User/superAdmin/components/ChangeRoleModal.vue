<template>
  <div v-if="isOpen" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
    <div class="relative top-20 mx-auto p-5 border w-11/12 md:w-2/3 lg:w-1/2 shadow-lg rounded-md bg-white">
      <div class="mt-3">
        <!-- Header -->
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-medium text-gray-900">Change User Role</h3>
          <button @click="closeModal" class="text-gray-400 hover:text-gray-600">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <!-- User Info -->
        <div v-if="selectedUser" class="mb-6 p-4 bg-gray-50 rounded-lg">
          <h4 class="text-sm font-medium text-gray-700 mb-2">User Information</h4>
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span class="font-medium">Name:</span>
              <span class="ml-2">{{ selectedUser.name }}</span>
            </div>
            <div>
              <span class="font-medium">Email:</span>
              <span class="ml-2">{{ selectedUser.email }}</span>
            </div>
            <div>
              <span class="font-medium">Current Role:</span>
              <span class="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                {{ selectedUser.role.toUpperCase() }}
              </span>
            </div>
            <div>
              <span class="font-medium">Status:</span>
              <span class="ml-2 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                {{ selectedUser.status }}
              </span>
            </div>
          </div>
        </div>

        <!-- Form -->
        <form @submit.prevent="handleSubmit" class="space-y-4">
          <!-- Current Password Verification (Disabled) -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Current Password <span class="text-gray-500 text-xs ml-2">(not required)</span>
            </label>
            <input
              v-model="formData.currentPassword"
              type="password"
              disabled
              class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
              placeholder="Password not required for role change"
            />
          </div>

          <!-- New Role Selection -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              New Role <span class="text-red-500">*</span>
            </label>
            <select
              v-model="formData.newRole"
              @change="onRoleChange"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select new role</option>
              <option v-for="role in availableRoles" :key="role.value" :value="role.value">
                {{ role.label }}
              </option>
            </select>
          </div>

          <!-- Role Description -->
          <div v-if="selectedRoleDescription" class="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <h5 class="text-sm font-medium text-blue-800 mb-1">New Role Permissions:</h5>
            <p class="text-sm text-blue-700">{{ selectedRoleDescription }}</p>
          </div>

          <!-- Reason -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1"> Reason (Optional) </label>
            <textarea
              v-model="formData.reason"
              rows="3"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter reason for role change..."
            ></textarea>
          </div>

          <!-- Action Buttons -->
          <div class="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              @click="closeModal"
              class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="isLoading"
              class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span v-if="isLoading" class="flex items-center">
                <svg
                  class="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    class="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    stroke-width="4"
                  ></circle>
                  <path
                    class="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Changing Role...
              </span>
              <span v-else>Change Role</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>

  <!-- Super Admin Password Verification Modal -->
  <div
    v-if="showSuperAdminAuth"
    class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full"
    style="z-index: 9999"
  >
    <!-- Debug info -->

    <div class="relative top-20 mx-auto p-5 border w-11/12 md:w-1/3 shadow-lg rounded-md bg-white">
      <div class="mt-3">
        <!-- Header -->
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-medium text-gray-900">Super Admin Verification</h3>
          <button @click="closeSuperAdminAuth" class="text-gray-400 hover:text-gray-600">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <!-- Security Warning -->
        <div class="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div class="flex">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fill-rule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clip-rule="evenodd"
                />
              </svg>
            </div>
            <div class="ml-3">
              <h3 class="text-sm font-medium text-yellow-800">Security Verification Required</h3>
              <div class="mt-2 text-sm text-yellow-700">
                <p>To change user roles, you must verify your Super Admin password.</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Super Admin Password Form -->
        <form @submit.prevent="handleSuperAdminAuth" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Super Admin Password <span class="text-red-500">*</span>
            </label>
            <input
              v-model="superAdminPassword"
              type="password"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your Super Admin password"
              ref="superAdminPasswordInput"
            />
          </div>

          <!-- Error Message -->
          <div v-if="authError" class="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p class="text-sm text-red-700">{{ authError }}</p>
          </div>

          <!-- Action Buttons -->
          <div class="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              @click="closeSuperAdminAuth"
              class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="isAuthLoading"
              class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span v-if="isAuthLoading" class="flex items-center">
                <svg
                  class="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    class="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    stroke-width="4"
                  ></circle>
                  <path
                    class="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Verifying...
              </span>
              <span v-else>Verify & Change Role</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue';
import axios from 'axios';
import { message } from 'ant-design-vue';
import { useRouter } from 'vue-router';

// Props
const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
  selectedUser: {
    type: Object,
    default: null,
  },
});

// Emits
const emit = defineEmits(['close', 'role-changed']);

// Reactive data
const formData = ref({
  currentPassword: '',
  newRole: '',
  reason: '',
});

const availableRoles = ref([]);
const isLoading = ref(false);
const error = ref('');

// Super Admin Authentication
const showSuperAdminAuth = ref(false);
const superAdminPassword = ref('');
const isAuthLoading = ref(false);
const authError = ref('');
const superAdminPasswordInput = ref(null);

// Computed
const selectedRoleDescription = computed(() => {
  if (!formData.value.newRole || !availableRoles.value.length) return '';
  const role = availableRoles.value.find((r) => r.value === formData.value.newRole);
  return role ? role.description : '';
});

// Methods
const closeModal = () => {
  resetForm();
  emit('close');
};

const resetForm = () => {
  formData.value = {
    currentPassword: '',
    newRole: '',
    reason: '',
  };
  error.value = '';
  showSuperAdminAuth.value = false;
  superAdminPassword.value = '';
  authError.value = '';
};

const loadAvailableRoles = async () => {
  if (!props.selectedUser) return;

  try {
    // include token header if exists
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    const response = await axios.get('/api/user-roles/available-roles', {
      params: { currentRole: props.selectedUser.role },
      headers
    });

    if (response.data?.success) {
      availableRoles.value = response.data.availableRoles;
    }
  } catch (err) {
    console.error('Error loading available roles:', err);
    error.value = 'Failed to load available roles';
  }
};

const onRoleChange = () => {
  error.value = '';
};

const handleSubmit = async () => {
  if (!props.selectedUser) {
    error.value = 'No user selected';
    return;
  }

  if (!formData.value.newRole) {
    error.value = 'Please select a new role';
    return;
  }

  // show Super Admin auth modal and focus securely
  showSuperAdminAuth.value = true;
  authError.value = '';
  superAdminPassword.value = '';

  await nextTick();
  if (superAdminPasswordInput.value) {
    superAdminPasswordInput.value.focus();
  }
};

// Super Admin Authentication Methods
const closeSuperAdminAuth = () => {
  showSuperAdminAuth.value = false;
  superAdminPassword.value = '';
  authError.value = '';
};

const showMessage = (type, content) => {
  if (message && typeof message[type] === 'function') {
    message[type](content);
  } else {
    // fallback
    console[type === 'error' ? 'error' : 'log'](content);
    if (type === 'error') alert(content);
  }
};

const router = useRouter();

const handleSuperAdminAuth = async () => {
  if (!superAdminPassword.value) {
    authError.value = 'Please enter your Super Admin password';
    return;
  }

  isAuthLoading.value = true;
  authError.value = '';

  try {
    // LẤY TOKEN: chắc chắn key 'token' đúng (thay đổi nếu project bạn lưu token khác)
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) {
      showMessage('error', 'Vui lòng đăng nhập lại');
      // redirect to login
      router.push('/login');
      return;
    }

    // Debug: log presence token (không log token value)
    console.log('Auth token present:', !!token);

    // Gọi API bằng đường dẫn RELATIVE (để dùng proxy hoặc cùng origin)
    // Dùng axios mặc định của app (nếu bạn có axios.defaults.baseURL)
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    const payload = {
      userId: props.selectedUser._id || props.selectedUser.id,
      newRole: formData.value.newRole,
      reason: formData.value.reason,
      superAdminPassword: superAdminPassword.value
    };

    // Debug (hide password)
    console.log('Sending change-role request for user:', payload.userId, 'newRole:', payload.newRole);

    const response = await axios.post('/api/user-roles/change-role', payload, { headers });

    if (response.data?.success) {
      emit('role-changed', {
        user: props.selectedUser,
        oldRole: props.selectedUser.role,
        newRole: formData.value.newRole,
        data: response.data.data
      });

      showMessage('success', 'Role changed successfully');
      closeSuperAdminAuth();
      closeModal();
    } else {
      authError.value = response.data?.message || 'Failed to change role';
    }
  } catch (err) {
    console.error('Error changing role:', err);
    const status = err?.response?.status;
    const serverMsg = err?.response?.data?.message || err.message || 'Failed to change user role';

    // Helpful debug output (you can remove in production)
    console.warn('Change-role request failed', { status, serverMsg, url: '/api/user-roles/change-role' });

    if (status === 401) {
      // Token invalid/expired or verifyToken threw
      if (String(serverMsg).toLowerCase().includes('token') || String(serverMsg).toLowerCase().includes('invalid')) {
        authError.value = 'Unauthorized — token invalid or expired. Please login again.';
        // Clear stored token and redirect to login
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
        router.push('/login');
      } else if (String(serverMsg).toLowerCase().includes('password')) {
        authError.value = 'Super Admin password is incorrect. Please try again.';
      } else {
        authError.value = serverMsg;
      }
    } else if (status === 403) {
      authError.value = serverMsg || 'Access denied. You are not Super Admin.';
    } else if (status) {
      authError.value = serverMsg;
    } else {
      authError.value = 'Network or server error. Please try again later.';
    }
  } finally {
    isAuthLoading.value = false;
  }
};


// Watches
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) loadAvailableRoles();
});

watch(() => props.selectedUser, (newUser) => {
  if (newUser) loadAvailableRoles();
});

watch(() => showSuperAdminAuth.value, (newVal) => {
  console.log('SuperAdmin modal visible:', newVal);
});
</script>

