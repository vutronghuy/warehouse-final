<template>
  <div class="p-6 bg-white rounded-lg shadow-md">
    <h2 class="text-2xl font-bold mb-4">Route Protection Test</h2>
    
    <div class="mb-4">
      <h3 class="text-lg font-semibold mb-2">Current Status:</h3>
      <p><strong>Authenticated:</strong> {{ isAuthenticated ? 'Yes' : 'No' }}</p>
      <p><strong>Role:</strong> {{ userRole || 'None' }}</p>
      <p><strong>Super Admin:</strong> {{ isSuperAdmin ? 'Yes' : 'No' }}</p>
    </div>

    <div class="mb-6">
      <h3 class="text-lg font-semibold mb-2">Test Protected Routes:</h3>
      <div class="grid grid-cols-2 gap-4">
        <button 
          @click="testRoute('/Superadmin')"
          class="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          Super Admin Page
        </button>
        
        <button 
          @click="testRoute('/admin')"
          class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Admin Page
        </button>
        
        <button 
          @click="testRoute('/manager')"
          class="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          Manager Page
        </button>
        
        <button 
          @click="testRoute('/staff')"
          class="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
        >
          Staff Page
        </button>
        
        <button 
          @click="testRoute('/accouter')"
          class="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
        >
          Accounter Page
        </button>
        
        <button 
          @click="testRoute('/login')"
          class="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
        >
          Login Page
        </button>
      </div>
    </div>

    <div class="mb-4">
      <h3 class="text-lg font-semibold mb-2">Actions:</h3>
      <div class="space-x-2">
        <button 
          @click="logout"
          class="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        >
          Logout
        </button>
        
        <button 
          @click="refreshStatus"
          class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Refresh Status
        </button>
      </div>
    </div>

    <div v-if="message" class="mt-4 p-3 rounded" :class="messageClass">
      {{ message }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const isAuthenticated = ref(false);
const userRole = ref<string | null>(null);
const isSuperAdmin = ref(false);
const message = ref('');
const messageType = ref<'success' | 'error' | 'info'>('info');

const messageClass = computed(() => {
  switch (messageType.value) {
    case 'success':
      return 'bg-green-100 border border-green-400 text-green-700';
    case 'error':
      return 'bg-red-100 border border-red-400 text-red-700';
    default:
      return 'bg-blue-100 border border-blue-400 text-blue-700';
  }
});

function checkAuthStatus() {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  isAuthenticated.value = !!token;
  
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      userRole.value = payload.role;
      isSuperAdmin.value = payload.isSuperAdmin === true;
    } catch (error) {
      console.error('Error decoding token:', error);
      userRole.value = null;
      isSuperAdmin.value = false;
    }
  } else {
    userRole.value = null;
    isSuperAdmin.value = false;
  }
}

function testRoute(path: string) {
  message.value = `Attempting to navigate to ${path}...`;
  messageType.value = 'info';
  
  router.push(path).then(() => {
    message.value = `Successfully navigated to ${path}`;
    messageType.value = 'success';
  }).catch((error) => {
    message.value = `Failed to navigate to ${path}: ${error.message}`;
    messageType.value = 'error';
  });
}

function logout() {
  localStorage.removeItem('token');
  sessionStorage.removeItem('token');
  localStorage.removeItem('user');
  sessionStorage.removeItem('user');
  
  checkAuthStatus();
  message.value = 'Logged out successfully';
  messageType.value = 'success';
  
  // Redirect to login after a short delay
  setTimeout(() => {
    router.push('/login');
  }, 1000);
}

function refreshStatus() {
  checkAuthStatus();
  message.value = 'Status refreshed';
  messageType.value = 'info';
}

onMounted(() => {
  checkAuthStatus();
});
</script>
