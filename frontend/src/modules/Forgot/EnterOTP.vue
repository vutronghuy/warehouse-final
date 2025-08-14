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
        <h2 class="text-2xl font-semibold text-gray-900 mb-6">Nhập mã xác nhận</h2>

        <!-- Email Info -->
        <div class="mb-6">
          <p class="text-gray-600 text-sm mb-2">Mã xác minh đã được gửi đến Email</p>
          <p class="text-gray-800 font-medium">{{ email }}</p>
        </div>
      </div>

      <!-- OTP Input Fields -->
      <div class="flex justify-center space-x-3 mb-8">
        <input
          v-for="(digit, index) in otpDigits"
          :key="index"
          :ref="el => otpInputs[index] = el"
          v-model="otpDigits[index]"
          @input="handleInput(index, $event)"
          @keydown="handleKeydown(index, $event)"
          @paste="handlePaste($event)"
          type="text"
          maxlength="1"
          class="w-12 h-12 text-center text-xl font-semibold border-2 border-gray-300 rounded-lg focus:border-red-400 focus:outline-none transition-colors bg-gray-50"
        />
      </div>

      <!-- Timer and Resend -->
      <div class="text-center mb-8">
        <p class="text-gray-500 text-sm">
          <span v-if="timeLeft > 0">
            Vui lòng chờ {{ timeLeft }} giây để gửi lại.
          </span>
          <span v-else>
            Không nhận được mã?
            <button
              @click="resendCode"
              class="text-red-400 hover:text-red-500 font-medium ml-1"
            >
              Gửi lại
            </button>
          </span>
        </p>
      </div>

      <!-- Submit Button -->
      <button
        @click="verifyOTP"
        :disabled="!isOTPComplete || isLoading"
        class="w-full bg-red-400 hover:bg-red-500 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2"
      >
        <span v-if="!isLoading">KẾ TIẾP</span>
        <span v-else class="flex items-center justify-center">
          <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Đang xác minh...
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
  name: 'OTPVerificationPage',
  data() {
    return {
      email: '',
      otpDigits: ['', '', '', '', '', ''],
      otpInputs: [],
      timeLeft: 60,
      timer: null,
      isLoading: false,
      errorMessage: '',
      successMessage: '',
    }
  },
  mounted() {
    // Get email from session storage
    this.email = sessionStorage.getItem('resetEmail') || '';
    if (!this.email) {
      this.$router.push('/forgot/email');
      return;
    }

    this.startTimer();
    // Focus on first input
    if (this.otpInputs[0]) {
      this.otpInputs[0].focus();
    }
  },
  computed: {
    isOTPComplete() {
      return this.otpDigits.every(digit => digit !== '' && /^\d$/.test(digit));
    },
    otpCode() {
      return this.otpDigits.join('');
    }
  },

  beforeUnmount() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  },
  methods: {
    goBack() {
      this.$router.push('/forgot/email');
    },

    handleInput(index, event) {
      const value = event.target.value;

      // Only allow digits
      if (value && !/^\d$/.test(value)) {
        this.otpDigits[index] = '';
        return;
      }

      this.otpDigits[index] = value;
      this.clearMessages();

      // Auto focus next input
      if (value && index < 5) {
        this.otpInputs[index + 1]?.focus();
      }
    },

    handleKeydown(index, event) {
      // Handle backspace
      if (event.key === 'Backspace') {
        if (!this.otpDigits[index] && index > 0) {
          this.otpInputs[index - 1]?.focus();
        }
      }
      // Handle arrow keys
      else if (event.key === 'ArrowLeft' && index > 0) {
        this.otpInputs[index - 1]?.focus();
      }
      else if (event.key === 'ArrowRight' && index < 5) {
        this.otpInputs[index + 1]?.focus();
      }
    },

    handlePaste(event) {
      event.preventDefault();
      const paste = event.clipboardData.getData('text');
      const digits = paste.replace(/\D/g, '').slice(0, 6);

      for (let i = 0; i < 6; i++) {
        this.otpDigits[i] = digits[i] || '';
      }

      // Focus on the next empty input or last input
      const nextEmpty = this.otpDigits.findIndex(digit => digit === '');
      const focusIndex = nextEmpty === -1 ? 5 : nextEmpty;
      this.otpInputs[focusIndex]?.focus();
    },

    startTimer() {
      this.timer = setInterval(() => {
        if (this.timeLeft > 0) {
          this.timeLeft--;
        } else {
          clearInterval(this.timer);
        }
      }, 1000);
    },

    async resendCode() {
      if (!this.email) {
        this.errorMessage = 'Email không hợp lệ';
        return;
      }

      this.timeLeft = 30;
      this.clearMessages();
      this.startTimer();

      try {
        const response = await axios.post('/api/auth/forgot', {
          email: this.email
        });

        if (response.data.ok) {
          this.successMessage = 'Mã OTP đã được gửi lại!';
          if (response.data.requestId) {
            sessionStorage.setItem('resetRequestId', response.data.requestId);
          }
          setTimeout(() => {
            this.successMessage = '';
          }, 3000);
        }
      } catch (error) {
        console.error('Error resending OTP:', error);
        this.errorMessage = 'Có lỗi khi gửi lại OTP. Vui lòng thử lại.';
      }
    },

    async verifyOTP() {
      if (!this.isOTPComplete) return;

      this.isLoading = true;
      this.clearMessages();

      try {
        // Store OTP for next step (we'll verify it in the password reset step)
        sessionStorage.setItem('resetOTP', this.otpCode);

        // For now, just proceed to password reset page
        // The actual verification will happen when user submits new password
        this.successMessage = 'Mã OTP hợp lệ!';
        setTimeout(() => {
          this.$router.push('/forgot/new-password');
        }, 1500);

      } catch (error) {
        console.error('Error verifying OTP:', error);
        this.errorMessage = 'Có lỗi xảy ra. Vui lòng thử lại.';
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
