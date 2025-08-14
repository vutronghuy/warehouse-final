<template>
  <section class="min-h-screen bg-gray-50 dark:bg-gray-900 relative overflow-hidden">
    <!-- Background Image with Overlay -->
    <div
      class="absolute inset-0 bg-[url('/img/logo1.jpeg')] bg-cover bg-center bg-no-repeat"
      style="background-position: 80% 50%"
    >
      <div class="absolute inset-0 bg-black/40 dark:bg-black/60"></div>
    </div>

    <!-- Main Content -->
    <div class="relative z-10 flex flex-col items-center justify-center px-6 py-8 mx-auto min-h-screen lg:py-0">
      <!-- Logo -->
      <a href="#" class="flex items-center mb-6 text-3xl font-semibold text-white drop-shadow-lg no-underline">
        <img class="w-8 h-8 mr-2" src="/img/logo.png" alt="logo" />
        HinWarehouse
      </a>

      <!-- Login Card -->
      <div
        class="w-full bg-[#a89cae] backdrop-blur-sm rounded-xl shadow-2xl dark:border md:mt-0 sm:max-w-md xl:p-0 dark:bg-gray-800/95 dark:border-gray-700 border border-white/20"
      >
        <div class="p-6 space-y-4 md:space-y-6 sm:p-8">
          <h1 class="text-xl font-bold text-center leading-tight tracking-tight text-gray-900 md:text-2xl dark:text-white">
            Sign in
          </h1>

          <!-- Server / client error message -->
          <div v-if="errorMessage" class="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-opacity-10 p-3 rounded">
            {{ errorMessage }}
          </div>

          <!-- Form -->
          <form @submit.prevent="handleSubmit" class="space-y-4 md:space-y-6">
            <!-- Email / Username Input -->
            <div>
              <label for="email" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                Your email or username
              </label>
              <input
                v-model="formData.email"
                @blur="validateEmail"
                @input="clearEmailError"
                :disabled="isSubmitting"
                type="text"
                name="email"
                id="email"
                :class="[
                  'bg-gray-50 border text-gray-900 rounded-lg focus:ring-2 focus:outline-none block w-full p-3 text-sm transition-all duration-200',
                  'dark:bg-gray-700 dark:placeholder-gray-400 dark:text-white',
                  emailError
                    ? 'border-red-500 focus:ring-red-500 focus:border-red-500 dark:border-red-500'
                    : 'border-gray-300 focus:ring-violet-500 focus:border-violet-500 dark:border-gray-600 dark:focus:ring-violet-500 dark:focus:border-violet-500'
                ]"
                placeholder="enter your email or username"
                autocomplete="username"
              />
              <!-- Email Error -->
              <Transition name="error">
                <p v-if="emailError" class="mt-1 text-sm text-red-600 dark:text-red-400">
                  {{ emailError }}
                </p>
              </Transition>
            </div>

            <!-- Password Input -->
            <div>
              <label for="password" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                Password
              </label>
              <div class="relative">
                <input
                  v-model="formData.password"
                  @blur="validatePassword"
                  @input="clearPasswordError"
                  :type="showPassword ? 'text' : 'password'"
                  :disabled="isSubmitting"
                  name="password"
                  id="password"
                  placeholder="enter your password"
                  :class="[
                    'bg-gray-50 border text-gray-900 rounded-lg focus:ring-2 focus:outline-none block w-full p-3 pr-12 text-sm transition-all duration-200',
                    'dark:bg-gray-700 dark:placeholder-gray-400 dark:text-white',
                    passwordError
                      ? 'border-red-500 focus:ring-red-500 focus:border-red-500 dark:border-red-500'
                      : 'border-gray-300 focus:ring-violet-500 focus:border-violet-500 dark:border-gray-600 dark:focus:ring-violet-500 dark:focus:border-violet-500'
                  ]"
                  autocomplete="current-password"
                />
                <!-- Show/Hide Password Button -->
                <button
                  @click="togglePasswordVisibility"
                  type="button"
                  :disabled="isSubmitting"
                  class="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors"
                >
                  <svg v-if="!showPassword" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                  </svg>
                  <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"></path>
                  </svg>
                </button>
              </div>
              <!-- Password Error -->
              <Transition name="error">
                <p v-if="passwordError" class="mt-1 text-sm text-red-600 dark:text-red-400">
                  {{ passwordError }}
                </p>
              </Transition>
            </div>

            <!-- Remember Me & Forgot Password -->
            <div class="flex items-center justify-between">
              <div class="flex items-start">
                <div class="flex items-center h-6">
                  <input
                    v-model="formData.rememberMe"
                    id="remember"
                    type="checkbox"
                    :disabled="isSubmitting"
                    class="w-5 h-5 border border-gray-300 rounded bg-gray-50 focus:ring-3 focus:ring-blue-300 dark:bg-gray-700 dark:border-gray-600 dark:focus:ring-blue-600 dark:ring-offset-gray-800 transition-all cursor-pointer"
                  />
                </div>
                <div class="ml-3 text-sm">
                  <label for="remember" class="text-gray-600 dark:text-gray-300 cursor-pointer select-none">
                    Remember me
                  </label>
                </div>
              </div>
              <router-link to="/forgot/email" class="text-sm font-medium text-black-600 hover:underline dark:text-black-500 transition-colors">
                Forgot password?
              </router-link>
            </div>

            <!-- Form Requirements Notice -->
            <div v-if="!isFormValid" class="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
              <span class="font-medium">Required to continue:</span>
              <ul class="mt-1 space-y-1">
                <li v-if="!formData.email.trim()" class="flex items-center">
                  <span class="w-1 h-1 bg-gray-400 rounded-full mr-2"></span>
                  Enter your email or username
                </li>
                <li v-if="!formData.password.trim()" class="flex items-center">
                  <span class="w-1 h-1 bg-gray-400 rounded-full mr-2"></span>
                  Enter your password
                </li>
              </ul>
            </div>

            <!-- Submit Button -->
            <button
              type="submit"
              :disabled="!isFormValid || isSubmitting"
              :class="[
                'w-full font-medium rounded-lg text-sm px-5 py-3 text-center transition-all duration-200 transform',
                isFormValid && !isSubmitting
                  ? 'text-white bg-[#4b3636] focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800 hover:scale-[1.02] active:scale-[0.98]'
                  : 'text-gray-400 bg-gray-300 cursor-not-allowed dark:bg-gray-600 dark:text-gray-500'
              ]"
            >
              <span v-if="!isSubmitting">Sign in</span>
              <span v-else class="flex items-center justify-center">
                <svg class="animate-spin -ml-1 mr-3 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Signing in...
              </span>
            </button>

            <!-- Sign Up Link -->
            <p class="text-sm font-light text-gray-600 dark:text-gray-400 text-center">
              Don't have an account yet?
              <a href="#" class="font-medium text-blue-600 hover:underline dark:text-blue-500 transition-colors">
                Sign up
              </a>
            </p>
          </form>
        </div>
      </div>
    </div>
  </section>
</template>

<script lang="ts" setup>
import { reactive, computed, ref } from 'vue';
import axios from 'axios';
import { useRouter, useRoute } from 'vue-router';

const router = useRouter();
const route = useRoute();

const formData = reactive({
  email: '',
  password: '',
  rememberMe: false
});

const emailError = ref('');
const passwordError = ref('');
const errorMessage = ref(''); // server/client error message
const showPassword = ref(false);
const isSubmitting = ref(false);

// ---------- validation ----------
const isFormValid = computed(() => {
  return formData.email.trim() !== '' &&
         formData.password.trim() !== '' &&
         !emailError.value &&
         !passwordError.value;
});

const validateEmail = () => {
  // accept email or username (simple)
  if (!formData.email.trim()) {
    emailError.value = 'Email or username is required';
    return;
  }
  // if contains "@", validate as email
  if (formData.email.includes('@')) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      emailError.value = 'Please enter a valid email address';
      return;
    }
  }
  emailError.value = '';
};

const validatePassword = () => {
  if (!formData.password.trim()) {
    passwordError.value = 'Password is required';
  } else if (formData.password.length < 6) {
    passwordError.value = 'Password must be at least 6 characters long';
  } else {
    passwordError.value = '';
  }
};

const clearEmailError = () => {
  if (emailError.value && formData.email.trim()) emailError.value = '';
};
const clearPasswordError = () => {
  if (passwordError.value && formData.password.trim()) passwordError.value = '';
};

const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value;
};

// ---------- helpers ----------
function parseJwt(token: string): any | null {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map((c) => {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

// replace existing handleSubmit with this
// replace existing handleSubmit with this
const handleSubmit = async () => {
  // client validation
  validateEmail();
  validatePassword();
  errorMessage.value = '';

  if (!isFormValid.value) return;

  isSubmitting.value = true;

  try {
    // send identifier (username or email)
    const payload = {
      identifier: formData.email.trim(),
      password: formData.password
    };

    const res = await axios.post('/api/auth/login', payload);
    const { token, user } = res.data || {};

    if (!token) {
      throw new Error(res.data?.message || 'No token returned from server');
    }

    // Prefer server-provided user object for routing (safer)
    let routeTo: string = '/'; // Initialize with default route instead of null
    let isSuper = false;
    let roleKey: string | null = null;

    if (user) {
      // server should return user with root `role` and the active subdoc (admin/manager/...)
      // e.g. user.role === 'admin' and user.admin.isSuperAdmin === true/false
      roleKey = user.role;
      if (roleKey === 'admin' && user.admin?.isSuperAdmin) {
        isSuper = true;
      }
    } else {
      // fallback: decode token payload to get roleKey/isSuperAdmin
      const decoded = parseJwt(token);
      roleKey = decoded?.roleKey || decoded?.role;
      isSuper = !!decoded?.isSuperAdmin;
    }

    // Check if there's a redirect parameter
    const redirectPath = route.query.redirect as string;

    // map to route
    if (redirectPath) {
      routeTo = redirectPath;
    } else if (isSuper) {
      routeTo = '/Superadmin';
    } else if (roleKey === 'admin') {
      routeTo = '/admin';
    } else if (roleKey === 'manager') {
      routeTo = '/manager';
    } else if (roleKey === 'staff') {
      routeTo = '/staff';
    } else if (roleKey === 'accounter') {
      routeTo = '/accouter';
    }
    // If no matching role, routeTo remains '/' (default)

    // Save token: rememberMe => localStorage, otherwise sessionStorage
    if (formData.rememberMe) {
      localStorage.setItem('token', token);
    } else {
      sessionStorage.setItem('token', token);
    }

    // Set default axios header for subsequent requests
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    // Optionally store user info (non-sensitive) if returned
    if (user) {
      try {
        const safeUser = JSON.stringify(user);
        (formData.rememberMe ? localStorage : sessionStorage).setItem('user', safeUser);
      } catch (_) { /* ignore storage errors */ }
    }

    // Redirect - routeTo is guaranteed to be a string now
    await router.push(routeTo);

  } catch (err: any) {
    console.error('Login error:', err);
    const serverMessage = err?.response?.data?.message || err?.message || 'Login failed. Please try again.';
    errorMessage.value = serverMessage;
  } finally {
    isSubmitting.value = false;
  }
};

</script>

<style scoped>
/* Error transition animation */
.error-enter-active,
.error-leave-active {
  transition: all 0.3s ease;
}

.error-enter-from,
.error-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Focus styles for better accessibility */
input:focus,
button:focus {
  outline: none;
}

/* Custom scrollbar for mobile */
@media (max-width: 640px) {
  .min-h-screen {
    min-height: 100vh;
    min-height: 100dvh; /* Dynamic viewport height for mobile */
  }
}

/* Loading animation */
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}

/* Backdrop blur fallback */
@supports not (backdrop-filter: blur(8px)) {
  .backdrop-blur-sm {
    background-color: rgba(255, 255, 255, 0.95);
  }

  .dark .backdrop-blur-sm {
    background-color: rgba(31, 41, 55, 0.95);
  }
}

/* Enhanced mobile responsiveness */
@media (max-width: 480px) {
  .sm\:p-8 {
    padding: 1.5rem;
  }

  .sm\:max-w-md {
    max-width: calc(100vw - 2rem);
  }
}
</style>
