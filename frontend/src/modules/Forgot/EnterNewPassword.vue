<template>
  <section class="min-h-screen bg-gray-50 dark:bg-gray-900 relative overflow-hidden">
    <div
      class="absolute inset-0 bg-[url('/img/logo1.jpeg')] bg-cover bg-center bg-no-repeat"
      style="background-position: 80% 50%"
    >
      <div class="absolute inset-0 bg-black/40 dark:bg-black/60"></div>
    </div>

    <div class="relative z-10 flex flex-col items-center justify-center px-6 py-8 mx-auto min-h-screen lg:py-0">
      <a
        href="#"
        class="flex items-center mb-6 text-3xl font-semibold text-white drop-shadow-lg no-underline"
      >
        <img class="w-8 h-8 mr-2" src="/img/logo.png" alt="logo" />
        HinWarehouse
      </a>

      <div
        class="relative w-full bg-[#a89cae] backdrop-blur-sm rounded-xl shadow-2xl dark:border sm:max-w-md xl:p-0 dark:bg-gray-800/95 dark:border-gray-700 border border-white/20"
      >
        <div
          class="hidden sm:flex absolute top-8 -left-16 items-center gap-2 text-sm font-medium text-white/90 px-20 py-3 rounded-full transition-colors cursor-pointer"
          @click="goBack"
        >
          <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            ></path>
          </svg>
        </div>

        <div class="p-6 space-y-6 sm:p-8">
          <div class="space-y-3">
            <div
              class="sm:hidden flex items-center gap-2 text-sm font-medium text-white/90 bg-black/30 hover:bg-black/60 px-4 py-2 rounded-full transition-colors shadow-lg"
              @click="goBack"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                ></path>
              </svg>
            </div>
            <div class="text-center sm:text-left">
              <h2 class="text-2xl font-semibold text-white text-center">Set new password</h2>
              <p class="text-sm text-white/80 mt-2 text-center">
                Please create a password that meets all of the criteria below.
              </p>
            </div>
          </div>

          <div class="space-y-5">
            <div class="relative">
              <input
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="Nhập mật khẩu mới"
                class="w-full h-14 px-4 pr-12 rounded-xl text-base bg-white/80 text-gray-900 border border-white/50 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all placeholder:text-gray-500"
                @input="validatePassword"
              />
              <div
                type="button"
                @click="togglePasswordVisibility"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
              >
                <svg v-if="showPassword" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                  ></path>
                </svg>
                <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  ></path>
                </svg>
              </div>
            </div>

            <div class="text-xs text-gray-700 bg-white/90 rounded-lg p-4 space-y-2 shadow-sm">
              <span class="font-medium text-gray-900">Requirements to continue:</span>
              <ul class="space-y-1">
                <li class="flex items-center" :class="validations.hasLowerCase ? 'text-green-600' : 'text-gray-600'">
                  <span
                    class="w-1.5 h-1.5 rounded-full mr-2"
                    :class="validations.hasLowerCase ? 'bg-green-500' : 'bg-gray-400'"
                  ></span>
                  At least one lowercase character
                </li>
                <li class="flex items-center" :class="validations.hasUpperCase ? 'text-green-600' : 'text-gray-600'">
                  <span
                    class="w-1.5 h-1.5 rounded-full mr-2"
                    :class="validations.hasUpperCase ? 'bg-green-500' : 'bg-gray-400'"
                  ></span>
                  At least one uppercase character
                </li>
                <li class="flex items-center" :class="validations.hasMinLength ? 'text-green-600' : 'text-gray-600'">
                  <span
                    class="w-1.5 h-1.5 rounded-full mr-2"
                    :class="validations.hasMinLength ? 'bg-green-500' : 'bg-gray-400'"
                  ></span>
                  Length from 8&nbsp;-&nbsp;16 characters
                </li>
                <li class="flex items-center" :class="validations.hasSpecialChar ? 'text-green-600' : 'text-gray-600'">
                  <span
                    class="w-1.5 h-1.5 rounded-full mr-2"
                    :class="validations.hasSpecialChar ? 'bg-green-500' : 'bg-gray-400'"
                  ></span>
                  Use only common letters, numbers and characters
                </li>
              </ul>
            </div>
          </div>

          <button
            type="button"
            @click="handleSubmit"
            :disabled="!isPasswordValid || isLoading"
            :class="[
              'w-full font-medium rounded-lg text-sm px-5 py-3 text-center transition-all duration-200 transform',
              isPasswordValid && !isLoading
                ? 'text-white bg-[#4b3636] hover:scale-[1.02] active:scale-[0.98] focus:ring-4 focus:outline-none focus:ring-blue-300'
                : 'bg-gray-400 text-gray-200 cursor-not-allowed'
            ]"
          >
            <span v-if="!isLoading">Set password</span>
            <span v-else class="flex items-center justify-center">
              <svg class="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </span>
          </button>

          <div
            v-if="errorMessage"
            class="p-4 bg-red-100/80 border border-red-400 text-red-700 rounded-lg text-sm text-center"
          >
            {{ errorMessage }}
          </div>

          <div
            v-if="successMessage"
            class="p-4 bg-green-100/80 border border-green-400 text-green-800 rounded-lg text-sm text-center"
          >
            {{ successMessage }}
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script>
import axios from 'axios';

export default {
  name: 'NewPasswordPage',
  data() {
    return {
      password: '',
      showPassword: false,
      isLoading: false,
      errorMessage: '',
      successMessage: '',
      email: '',
      otp: '',
      validations: {
        hasLowerCase: false,
        hasUpperCase: false,
        hasMinLength: false,
        hasSpecialChar: false
      }
    }
  },
  mounted() {
    // Get email and OTP from session storage
    this.email = sessionStorage.getItem('resetEmail') || '';
    this.otp = sessionStorage.getItem('resetOTP') || '';

    if (!this.email || !this.otp) {
      this.$router.push('/forgot/email');
      return;
    }
  },
  computed: {
    isPasswordValid() {
      return Object.values(this.validations).every(validation => validation);
    }
  },
  methods: {
    goBack() {
      this.$router.push('/forgot/otp');
    },

    togglePasswordVisibility() {
      this.showPassword = !this.showPassword;
    },

    validatePassword() {
      this.clearMessages();

      // Check for lowercase
      this.validations.hasLowerCase = /[a-z]/.test(this.password);

      // Check for uppercase
      this.validations.hasUpperCase = /[A-Z]/.test(this.password);

      // Check length (8-16 characters)
      this.validations.hasMinLength = this.password.length >= 8 && this.password.length <= 16;

      // Check for allowed characters (letters, numbers, common special chars)
      this.validations.hasSpecialChar = /^[a-zA-Z0-9!@#$%^&*()_+\-=\u005B\u005D{};':"\\|,.<>/?]*$/.test(this.password);
    },

    async handleSubmit() {
      if (!this.isPasswordValid) return;

      this.isLoading = true;
      this.clearMessages();

      try {
        // Call the backend API to verify OTP and reset password
        const response = await axios.post('/api/auth/forgot/verify', {
          email: this.email,
          otp: this.otp,
          newPassword: this.password
        });

        if (response.data.ok) {
          this.successMessage = 'Mật khẩu đã được cập nhật thành công!';

          // Clear session storage
          sessionStorage.removeItem('resetEmail');
          sessionStorage.removeItem('resetOTP');
          sessionStorage.removeItem('resetRequestId');

          setTimeout(() => {
            this.$router.push('/login');
          }, 2000);
        }

      } catch (error) {
        console.error('Error resetting password:', error);
        if (error.response?.data?.message) {
          this.errorMessage = error.response.data.message;
        } else {
          this.errorMessage = 'Có lỗi xảy ra. Vui lòng thử lại.';
        }
      } finally {
        this.isLoading = false;
      }
    },

    clearMessages() {
      this.errorMessage = '';
      this.successMessage = '';
    }
  }
}
</script>

<style scoped>
.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* Custom input focus styles */
input:focus {
  box-shadow: 0 0 0 3px rgba(248, 113, 113, 0.1);
}
</style>
