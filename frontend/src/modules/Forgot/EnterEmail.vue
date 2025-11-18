<template>
  <section class="min-h-screen bg-gray-50 dark:bg-gray-900 relative overflow-hidden">
    <!-- Background Image with Overlay -->
    <div
      class="absolute inset-0 bg-[url('/img/logo1.jpeg')] bg-cover bg-center bg-no-repeat"
      style="background-position: 80% 50%"
    >
      <div class="absolute inset-0 bg-black/40 dark:bg-black/60"></div>
    </div>

    <div
      class="relative z-10 flex flex-col items-center justify-center px-6 py-8 mx-auto min-h-screen lg:py-0"
    >
      <!-- Logo -->
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
        <!-- Desktop back button (outside card) -->
        <div
          class="hidden sm:flex absolute top-8 -left-16 items-center gap-2 text-sm font-medium text-white/90 px-24 py-[-1px] transition-colors"
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
          <!-- Title -->
          <div class="space-y-3">
            <!-- Mobile back button -->
            <div
              class="sm:hidden flex items-center gap-2 text-sm font-medium text-white/90 px-4 py-2 rounded-full transition-colors"
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
              <h2 class="text-2xl mt-[-17px] text-center font-semibold text-white">Quên mật khẩu</h2>
              <p class="text-sm text-center text-white/80 mt-2">Nhập email để nhận mã OTP khôi phục</p>
            </div>
          </div>

          <!-- Form -->
          <form class="space-y-5" @submit.prevent="handleSubmit">
            <!-- Email Input -->
            <div>
              <input
                v-model="email"
                type="email"
                placeholder="Nhập email của bạn"
                class="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 block w-full p-3 placeholder-gray-400 transition-all"
                required
              />
            </div>

            <!-- Submit Button -->
            <button
              type="submit"
              :disabled="isLoading"
              :class="[
                'w-full font-medium rounded-lg text-sm px-5 py-3 text-center ' +
                  'transition-all duration-200 transform',
                !isLoading
                  ? 'text-white bg-[#4b3636] hover:scale-[1.02] active:scale-[0.98] ' +
                    'focus:ring-4 focus:outline-none focus:ring-blue-300'
                  : 'bg-gray-400 text-gray-200 cursor-not-allowed',
              ]"
            >
              <span v-if="!isLoading">Tiếp tục</span>
              <span v-else class="flex items-center justify-center">
                <svg
                  class="animate-spin -ml-1 mr-3 h-4 w-4 text-white"
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
                Đang xử lý...
              </span>
            </button>
          </form>

          <!-- Success Message -->
          <div
            v-if="showSuccess"
            class="p-4 bg-green-100/80 border border-green-400 text-green-800 rounded-lg"
          >
            <div class="flex">
              <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fill-rule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clip-rule="evenodd"
                ></path>
              </svg>
              <div>
                <div>Mã OTP đã được gửi đến email của bạn!</div>
                <div
                  v-if="isDevelopmentMode"
                  class="mt-2 text-sm bg-yellow-50 border border-yellow-200 text-yellow-800 p-2 rounded"
                >
                  <strong>Development Mode:</strong> Kiểm tra console của server để xem mã OTP
                </div>
              </div>
            </div>
          </div>

          <!-- Error Message -->
          <div v-if="errorMessage" class="p-4 bg-red-100/80 border border-red-400 text-red-700 rounded-lg">
            <div class="flex">
              <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fill-rule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clip-rule="evenodd"
                ></path>
              </svg>
              <span>{{ errorMessage }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
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
      isDevelopmentMode: false,
    };
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
          email: this.email,
        });
        if (response.data.ok) {
          this.showSuccess = true;
          // Check if we're in development mode (when email config is not set)
          this.isDevelopmentMode = !!response.data.message?.includes('development');
          // Store email and requestId for next step
          sessionStorage.setItem('resetEmail', this.email);
          if (response.data.requestId) {
            sessionStorage.setItem('resetRequestId', response.data.requestId);
          }
          // Redirect to OTP page after 3 seconds (longer for dev mode message)
          setTimeout(
            () => {
              this.$router.push('/forgot/otp');
            },
            this.isDevelopmentMode ? 5000 : 2000,
          );
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
    },
  },
};
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
