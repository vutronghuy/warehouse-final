<template>
  <div class="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full bg-white rounded-lg shadow-md p-8">
      <!-- Back Button -->
      <div class="mb-8">
        <button @click="goBack" class="flex items-center text-gray-600 hover:text-gray-800 transition-colors">
          <svg class="w-5 h-5 mr-2 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
          </svg>
        </button>
      </div>

      <!-- Title -->
      <div class="text-center mb-8">
        <h2 class="text-2xl font-semibold text-gray-900">Đặt lại mật khẩu</h2>
      </div>

      <!-- Form -->
      <form @submit.prevent="handleSubmit" class="space-y-6">
        <!-- Email Input -->
        <div>
          <input
            v-model="email"
            type="email"
            placeholder="Nhập email của bạn"
            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-400 focus:border-transparent outline-none transition-all placeholder-gray-400"
            required
          />
        </div>

        <!-- Submit Button -->
        <button
          type="submit"
          :disabled="isLoading"
          class="w-full bg-red-400 hover:bg-red-500 text-white font-medium py-3 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
      </form>

      <!-- Success Message -->
      <div v-if="showSuccess" class="mt-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
        <div class="flex">
          <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
          </svg>
          <div>
            <div>Mã OTP đã được gửi đến email của bạn!</div>
            <div v-if="isDevelopmentMode" class="mt-2 text-sm bg-yellow-50 border border-yellow-200 text-yellow-800 p-2 rounded">
              <strong>Development Mode:</strong> Kiểm tra console của server để xem mã OTP
            </div>
          </div>
        </div>
      </div>

      <!-- Error Message -->
      <div v-if="errorMessage" class="mt-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
        <div class="flex">
          <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
          </svg>
          <span>{{ errorMessage }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'ResetPasswordPage',
  data() {
    return {
      email: '',
      isLoading: false,
      showSuccess: false,
      errorMessage: '',
      isDevelopmentMode: false
    }
  },
  methods: {
    goBack() {
      this.$router.push('/login');
    },
    async handleSubmit() {
      if (!this.email.trim()) {
        this.errorMessage = 'Vui lòng nhập email';
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(this.email)) {
        this.errorMessage = 'Email không hợp lệ';
        return;
      }

      this.isLoading = true;
      this.showSuccess = false;
      this.errorMessage = '';

      try {
        const response = await axios.post('/api/auth/forgot', {
          email: this.email
        });

        if (response.data.ok) {
          this.showSuccess = true;
          // Check if we're in development mode (when email config is not set)
          this.isDevelopmentMode = response.data.message && response.data.message.includes('development');

          // Store email and requestId for next step
          sessionStorage.setItem('resetEmail', this.email);
          if (response.data.requestId) {
            sessionStorage.setItem('resetRequestId', response.data.requestId);
          }

          // Redirect to OTP page after 3 seconds (longer for dev mode message)
          setTimeout(() => {
            this.$router.push('/forgot/otp');
          }, this.isDevelopmentMode ? 5000 : 2000);
        }
      } catch (error) {
        console.error('Error sending OTP:', error);
        if (error.response?.data?.message) {
          this.errorMessage = error.response.data.message;
        } else {
          this.errorMessage = 'Có lỗi xảy ra. Vui lòng thử lại.';
        }
      } finally {
        this.isLoading = false;
      }
    }
  }
}
</script>

<style scoped>
/* Additional custom styles if needed */
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
</style>
