<template>
  <div class="flex h-screen bg-gray-50">
    <Sidebar />
    <!-- Main Content -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <Headers />

      <!-- Page Content -->
      <main class="flex-1 overflow-auto bg-gray-50 p-8">
        <!-- Page Header -->
        <div class="flex items-center justify-between mb-8">
          <h2 class="text-3xl font-bold text-gray-900">User Management</h2>
          <button
            v-if="activeTab === 'users'"
            @click="showModal = true"
            class="inline-flex items-center px-4 py-2.5 bg-slate-800 text-white text-sm font-medium rounded-lg hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-colors duration-150"
          >
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Add User
          </button>
        </div>

        <!-- Tabs -->
        <div class="mb-6">
          <nav class="flex space-x-8" aria-label="Tabs">
            <button
              @click="activeTab = 'users'"
              :class="[
                activeTab === 'users'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
                'whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm',
              ]"
            >
              User Management
            </button>
            <button
              @click="activeTab = 'role-history'"
              :class="[
                activeTab === 'role-history'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
                'whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm',
              ]"
            >
              Role Change History
            </button>
          </nav>
        </div>

        <!-- Tab Content -->
        <div v-if="activeTab === 'users'">
          <!-- Search Bar and Filters -->
          <div class="mb-6 flex flex-col sm:flex-row gap-4">
            <!-- Search Input -->
            <div class="relative max-w-md">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <input
                v-model="search"
                type="text"
                placeholder="Search users..."
                class="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-colors duration-150"
              />
            </div>

            <!-- Role Filter -->
            <div class="relative">
              <select
                v-model="selectedRole"
                class="block w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-150"
              >
                <option value="">All Roles</option>
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="staff">Staff</option>
                <option value="accounter">Accounter</option>
              </select>
            </div>

            <!-- Status Filter -->
            <div class="relative">
              <select
                v-model="selectedStatus"
                class="block w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-150"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <!-- Users Table -->
          <div class="bg-white shadow-sm border border-gray-200 rounded-xl overflow-hidden">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">#</th>
                  <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Name</th>
                  <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Email</th>
                  <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Role</th>
                  <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  <th class="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>

              <!-- Use template v-for so inline form shares same user scope -->
              <tbody class="bg-white divide-y divide-gray-100">
                <template v-for="(user, idx) in paginatedUsers" :key="user._id">
                  <tr class="hover:bg-gray-50 transition-colors duration-150">
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {{ (currentPage - 1) * pageSize + idx + 1 }}
                    </td>

                    <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {{
                        user.admin?.username ||
                        user.manager?.username ||
                        user.staff?.username ||
                        user.accounter?.username ||
                        '—'
                      }}
                    </td>

                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {{
                        user.admin?.email ||
                        user.manager?.email ||
                        user.staff?.email ||
                        user.accounter?.email ||
                        '—'
                      }}
                    </td>

                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {{ user.role }}
                    </td>

                    <td class="px-6 py-4 whitespace-nowrap">
                      <span
                        :class="{
                          'inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full': true,
                          'bg-green-100 text-green-700': user.userStatus?.status === 'active',
                          'bg-red-100 text-red-700': user.userStatus?.status === 'inactive',
                        }"
                      >
                        {{
                          user.userStatus?.status
                            ? user.userStatus.status === 'active'
                              ? 'Active'
                              : 'Inactive'
                            : 'Unknown'
                        }}
                      </span>
                    </td>

                    <!-- Actions: replaced by 3-dots menu -->
                    <td class="px-6 py-4 whitespace-nowrap text-center relative">
                      <div class="flex items-center justify-center">
                        <!-- Menu button -->
                        <button
                          @click.stop="toggleActionMenu(user._id)"
                          class="p-2 rounded-full hover:bg-gray-100 focus:outline-none"
                          :aria-expanded="openMenuUserId === user._id ? 'true' : 'false'"
                          :title="'Actions for ' + (user.admin?.username || user.manager?.username || user.staff?.username || user.accounter?.username || 'user')"
                        >
                          <!-- vertical ellipsis icon -->
                          <svg class="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4z"/>
                          </svg>
                        </button>

                        <!-- Dropdown menu -->
                        <div
                          v-if="openMenuUserId === user._id"
                          @click.stop
                          class="absolute right-6 top-10 z-50 w-48 bg-white border border-gray-200 rounded-md shadow-lg py-1"
                        >
                          <button
                            @click="handleMenuChangeRole(user)"
                            class="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center space-x-2"
                          >
                            <svg class="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/>
                            </svg>
                            <span>Change Role</span>
                          </button>

                          <button
                            @click="handleMenuEdit(user)"
                            class="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center space-x-2"
                          >
                            <svg class="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                            </svg>
                            <span>Edit</span>
                          </button>

                          <button
                            @click="handleMenuToggleStatus(user)"
                            class="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center space-x-2"
                          >
                            <svg v-if="user.userStatus?.status === 'active'" class="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728"/>
                            </svg>
                            <svg v-else class="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                            </svg>
                            <span>{{ user.userStatus?.status === 'active' ? 'Disable Account' : 'Activate Account' }}</span>
                          </button>

                          <button
                            @click="handleMenuDelete(user._id)"
                            class="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center space-x-2 text-red-600"
                          >
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                            </svg>
                            <span>Delete User</span>
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>

                </template>
              </tbody>
            </table>

            <!-- Pagination controls -->
            <div class="px-6 py-4 bg-white border-t flex items-center justify-between">
              <div class="text-sm text-gray-600">
               Display <span class="font-medium">{{ paginatedUsers.length }}</span> on total
                <span class="font-medium">{{ filteredUsers.length }}</span> user
              </div>

              <div class="flex items-center space-x-2">
                <button
                  @click="prevPage"
                  :disabled="currentPage === 1"
                  class="px-3 py-1 rounded-md border disabled:opacity-50"
                >
                  Prev
                </button>

                <template v-for="p in totalPages" :key="p">
                  <button
                    @click="goToPage(p)"
                    :class="[
                      'px-3 py-1 rounded-md border',
                      currentPage === p ? 'bg-slate-800 text-white' : '',
                    ]"
                  >
                    {{ p }}
                  </button>
                </template>

                <button
                  @click="nextPage"
                  :disabled="currentPage === totalPages || totalPages === 0"
                  class="px-3 py-1 rounded-md border disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Role Change History Tab -->
        <div v-if="activeTab === 'role-history'">
          <RoleChangeHistory />
        </div>
      </main>
    </div>

    <!-- Modals -->
    <create-user-modal :show="showModal" @close="showModal = false" @created="fetchUsers()" />
    <edit-user-modal
      :show="showEditModal"
      :user="selectedUser"
      @close="closeEditModal"
      @updated="handleUserUpdated"
    />
    <change-role-modal
      :isOpen="showChangeRoleModal"
      :selectedUser="selectedUserForRoleChange"
      @close="closeChangeRoleModal"
      @role-changed="handleRoleChanged"
    />

    <!-- ChatBot Component -->
    <ChatBot />
  </div>
</template>

<script>
import axios from 'axios';
import { useToast } from 'vue-toastification';
import CreateUserModal from './modal.vue';
import EditUserModal from './EditModal.vue';
import ChangeRoleModal from '../../User/superAdmin/components/ChangeRoleModal.vue';
import RoleChangeHistory from '../../User/superAdmin/components/RoleChangeHistory.vue';
import Sidebar from './Sidebar.vue';
import Headers from './header.vue';
import { ChatBot } from '@/components';
axios.defaults.baseURL = 'http://localhost:3003'; // adjust if needed
axios.defaults.withCredentials = true;

export default {
  name: 'AdminDashboard',
  components: {
    CreateUserModal,
    EditUserModal,
    ChangeRoleModal,
    RoleChangeHistory,
    Sidebar,
    Headers,
    ChatBot,
  },
  setup() {
    const toast = useToast();
    return { toast };
  },
  data() {
    return {
      search: '',
      selectedRole: '',
      selectedStatus: '',
      users: [],
      showModal: false,
      showEditModal: false,
      showChangeRoleModal: false,
      selectedUser: null,
      selectedUserForRoleChange: null,
      activeTab: 'users',
      pageSize: 6,
      currentPage: 1,
      showUserMenu: false,
      currentUserObj: null,
      // NEW: track which user's action menu is open
      openMenuUserId: null,
    };
  },
  computed: {
    filteredUsers() {
      let filtered = this.users;

      // Filter by search query
      const q = this.search.trim().toLowerCase();
      if (q) {
        filtered = filtered.filter((u) => {
          const name = (
            u.admin?.username ||
            u.manager?.username ||
            u.staff?.username ||
            u.accounter?.username ||
            ''
          ).toLowerCase();
          const email = (
            u.admin?.email ||
            u.manager?.email ||
            u.staff?.email ||
            u.accounter?.email ||
            ''
          ).toLowerCase();
          return name.includes(q) || email.includes(q);
        });
      }

      // Filter by role
      if (this.selectedRole) {
        filtered = filtered.filter((u) => u.role === this.selectedRole);
      }

      // Filter by status
      if (this.selectedStatus) {
        filtered = filtered.filter((u) => u.userStatus?.status === this.selectedStatus);
      }

      return filtered;
    },
    totalPages() {
      return Math.max(1, Math.ceil(this.filteredUsers.length / this.pageSize));
    },
    paginatedUsers() {
      const start = (this.currentPage - 1) * this.pageSize;
      return this.filteredUsers.slice(start, start + this.pageSize);
    },
    userFullName() {
      const u = this.currentUserObj || this._loadUserFromStorage();
      if (!u) return 'User';
      if (u.admin && u.admin.fullName) return u.admin.fullName;
      if (u.manager && u.manager.fullName) return u.manager.fullName;
      if (u.staff && u.staff.fullName) return u.staff.fullName;
      if (u.accounter && u.accounter.fullName) return u.accounter.fullName;
      if (u.fullName) return u.fullName;
      if (u.name) return u.name;
      return 'User';
    },
  },
  watch: {
    search() {
      this.currentPage = 1;
    },
    selectedRole() {
      this.currentPage = 1;
    },
    selectedStatus() {
      this.currentPage = 1;
    },
  },
  created() {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) {
      this.$router.push('/login');
      return;
    }

    // keep auth header, but do NOT set Cache-Control/Pragma here (causes CORS preflight issues)
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    this.fetchUsers();

    try {
      const rawUser = localStorage.getItem('user') || sessionStorage.getItem('user');
      if (rawUser) this.currentUserObj = JSON.parse(rawUser);
    } catch (e) {
      this.currentUserObj = null;
    }
  },
  mounted() {
    document.addEventListener('click', this.handleDocClick);
    // NEW: close any open action menu when clicking outside
    document.addEventListener('click', this.closeActionMenus);
  },
  beforeUnmount() {
    document.removeEventListener('click', this.handleDocClick);
    document.removeEventListener('click', this.closeActionMenus);
  },
  methods: {
    _loadUserFromStorage() {
      try {
        const raw = localStorage.getItem('user') || sessionStorage.getItem('user');
        return raw ? JSON.parse(raw) : null;
      } catch (e) {
        return null;
      }
    },

    handleDocClick(e) {
      const ua = this.$refs.userArea;
      if (!ua) return;
      if (!ua.contains(e.target)) {
        this.showUserMenu = false;
      }
    },

    toggleUserMenu() {
      this.showUserMenu = !this.showUserMenu;
    },

    // NEW: toggle action menu for a specific user (stopPropagation is handled in template)
    toggleActionMenu(userId) {
      this.openMenuUserId = this.openMenuUserId === userId ? null : userId;
    },

    // NEW: close action menus (used by document click listener)
    closeActionMenus() {
      this.openMenuUserId = null;
    },

    async fetchUsers() {
      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (token) {
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }

        const res = await axios.get('/api/users');

        const users = res.data?.users ?? res.data ?? [];
        this.users = Array.isArray(users) ? users : [];

        this.currentPage = 1;
      } catch (err) {
        console.error('Error fetching users:', err);
        const status = err?.response?.status;
        if (status === 401) {
          try {
            localStorage.removeItem('token');
            sessionStorage.removeItem('token');
          } catch (e) { /* ignore */ }
          if (this.$router) this.$router.push('/login');
        }
      }
    },

    goToPage(p) {
      let page = p;
      if (page < 1) page = 1;
      if (page > this.totalPages) page = this.totalPages;
      this.currentPage = page;
    },
    prevPage() {
      if (this.currentPage > 1) this.currentPage--;
    },
    nextPage() {
      if (this.currentPage < this.totalPages) this.currentPage++;
    },

    openEditModal(user) {
      this.selectedUser = JSON.parse(JSON.stringify(user));
      this.showEditModal = true;
    },

    closeEditModal() {
      this.showEditModal = false;
      this.selectedUser = null;
    },

    async handleUserUpdated(updatedUser) {
      this.showEditModal = false;
      this.selectedUser = null;
      await this.fetchUsers();
    },


    openChangeRoleModal(user) {
      this.selectedUserForRoleChange = {
        id: user._id,
        name:
          user.admin?.fullName ||
          user.manager?.fullName ||
          user.staff?.fullName ||
          user.accounter?.fullName ||
          'Unknown',
        email:
          user.admin?.email ||
          user.manager?.email ||
          user.staff?.email ||
          user.accounter?.email ||
          'No email',
        role: user.role,
        status: user.userStatus?.status || 'unknown',
      };
      this.showChangeRoleModal = true;
    },

    closeChangeRoleModal() {
      this.showChangeRoleModal = false;
      this.selectedUserForRoleChange = null;
    },

    async handleRoleChanged(roleChangeData) {
      this.showChangeRoleModal = false;
      this.selectedUserForRoleChange = null;

      alert(
        `Role changed successfully! ${roleChangeData.user.name} is now ${roleChangeData.newRole.toUpperCase()}. They will receive an email notification and need to login again.`,
      );

      await this.fetchUsers();
    },

    async toggleUserStatus(user) {
      const currentStatus = user.userStatus?.status;
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      const action = newStatus === 'inactive' ? 'disable' : 'activate';

      if (!confirm(`Are you sure you want to${action} this account?`)) return;

      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (token) axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

        const response = await axios.put(`/api/users/${user._id}/toggle-status`, {
          status: newStatus
        });

        if (response.data?.success) {
          this.toast.success(
            `Account has been ${action} successfully! ${newStatus === 'inactive' ? 'User will be logged out and unable to log in.' : 'User can log in normally.'}`
          );
          await this.fetchUsers();
          // close menu if open
          this.openMenuUserId = null;
        } else {
          this.toast.error(response.data?.message || 'Không thể cập nhật trạng thái tài khoản');
        }
      } catch (err) {
        console.error('Error toggling user status:', err);
        this.toast.error(err.response?.data?.message || 'Không thể cập nhật trạng thái tài khoản');

        if (err?.response?.status === 401) {
          localStorage.removeItem('token');
          sessionStorage.removeItem('token');
          if (this.$router) this.$router.push('/login');
        }
      }
    },

    async deleteUser(id) {
      if (!confirm('Bạn có chắc chắn muốn xóa người dùng này?')) return;
      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (token) axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

        await axios.delete(`/api/users/${id}`);
        await this.fetchUsers();
        // close menu if open
        this.openMenuUserId = null;
      } catch (err) {
        console.error(err.response?.data || err);
        if (err?.response?.status === 401) {
          localStorage.removeItem('token');
          sessionStorage.removeItem('token');
          if (this.$router) this.$router.push('/login');
        }
      }
    },

    // --- Helper wrappers for menu actions so we can close menu after action ---
    handleMenuEdit(user) {
      this.openMenuUserId = null;
      this.openEditModal(user);
    },

    handleMenuChangeRole(user) {
      this.openMenuUserId = null;
      this.openChangeRoleModal(user);
    },

    handleMenuToggleStatus(user) {
      this.openMenuUserId = null;
      // call the same toggle method
      this.toggleUserStatus(user);
    },

    handleMenuDelete(userId) {
      this.openMenuUserId = null;
      this.deleteUser(userId);
    },

  },
};
</script>

<style scoped>
/* small fade for dropdown */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.12s ease;
}
.fade-enter,
.fade-leave-to {
  opacity: 0;
}
</style>
