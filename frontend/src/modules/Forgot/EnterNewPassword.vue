<template>
  <div class="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full bg-white rounded-lg shadow-md p-8">
      <!-- Back Button -->
      <div class="mb-8">
        <button @click="goBack" class="flex items-center text-gray-600 hover:text-gray-800 transition-colors">
          <svg class="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
          </svg>
        </button>
      </div>

      <!-- Title -->
      <div class="text-center mb-8">
        <h2 class="text-2xl font-semibold text-gray-900 mb-6">Thiết Lập Mật Khẩu</h2>
        <p class="text-gray-600 text-sm">Tạo mật khẩu mới</p>
      </div>

      <!-- Password Input -->
      <div class="mb-6">
        <div class="relative">
          <input
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            placeholder="••••••••••••"
            class="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-400 focus:border-transparent outline-none transition-all placeholder-gray-400"
            @input="validatePassword"
          />
          <button
            type="button"
            @click="togglePasswordVisibility"
            class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <svg v-if="showPassword" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"></path>
            </svg>
            <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
            </svg>
          </button>
        </div>
      </div>

      <!-- Password Requirements -->
      <div class="mb-8 space-y-2">
        <div class="flex items-center text-sm">
          <svg
            class="w-4 h-4 mr-2"
            :class="validations.hasLowerCase ? 'text-green-500' : 'text-gray-400'"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path v-if="validations.hasLowerCase" fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
            <circle v-else cx="10" cy="10" r="8" stroke="currentColor" stroke-width="2" fill="none"></circle>
          </svg>
          <span :class="validations.hasLowerCase ? 'text-green-600' : 'text-gray-500'">
            Ít nhất một kí tự viết thường.
          </span>
        </div>

        <div class="flex items-center text-sm">
          <svg
            class="w-4 h-4 mr-2"
            :class="validations.hasUpperCase ? 'text-green-500' : 'text-gray-400'"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path v-if="validations.hasUpperCase" fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
            <circle v-else cx="10" cy="10" r="8" stroke="currentColor" stroke-width="2" fill="none"></circle>
          </svg>
          <span :class="validations.hasUpperCase ? 'text-green-600' : 'text-gray-500'">
            Ít nhất một kí tự viết hoa.
          </span>
        </div>

        <div class="flex items-center text-sm">
          <svg
            class="w-4 h-4 mr-2"
            :class="validations.hasMinLength ? 'text-green-500' : 'text-gray-400'"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path v-if="validations.hasMinLength" fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
            <circle v-else cx="10" cy="10" r="8" stroke="currentColor" stroke-width="2" fill="none"></circle>
          </svg>
          <span :class="validations.hasMinLength ? 'text-green-600' : 'text-gray-500'">
            8-16 kí tự
          </span>
        </div>

        <div class="flex items-center text-sm">
          <svg
            class="w-4 h-4 mr-2"
            :class="validations.hasSpecialChar ? 'text-green-500' : 'text-gray-400'"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path v-if="validations.hasSpecialChar" fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
            <circle v-else cx="10" cy="10" r="8" stroke="currentColor" stroke-width="2" fill="none"></circle>
          </svg>
          <span :class="validations.hasSpecialChar ? 'text-green-600' : 'text-gray-500'">
            Chỉ các chữ cái, số và ký tự phổ biến mới có thể được sử dụng
          </span>
        </div>
      </div>

      <!-- Submit Button -->
      <button
        @click="handleSubmit"
        :disabled="!isPasswordValid || isLoading"
        class="w-full bg-red-400 hover:bg-red-500 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2"
      >
        <span v-if="!isLoading">TIẾP THEO</span>
        <span v-else class="flex items-center justify-center">
          <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Đang xử lý...
        </span>
      </button>

      <!-- Error Message -->
      <div v-if="errorMessage" class="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm text-center">
        {{ errorMessage }}
      </div>

      <!-- Success Message -->
      <div v-if="successMessage" class="mt-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg text-sm text-center">
        {{ successMessage }}
      </div>
    </div>
  </div>
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
      this.validations.hasSpecialChar = /^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]*$/.test(this.password);
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
