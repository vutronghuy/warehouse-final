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
          <p class="text-gray-800 font-medium break-words">{{ email }}</p>
        </div>
      </div>

      <!-- OTP Input Fields -->
      <div class="flex justify-center space-x-3 mb-8">
        <input
          v-for="(digit, index) in otpDigits"
          :key="index"
          :ref="el => otpInputs[index] = el"
          :value="otpDigits[index]"
          @input="handleInput(index, $event)"
          @keydown="handleKeydown(index, $event)"
          @paste="handlePaste($event)"
          type="text"
          maxlength="1"
          inputmode="numeric"
          autocomplete="one-time-code"
          :aria-label="`Mã xác nhận chữ số ${index + 1}`"
          pattern="[0-9]*"
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
              :disabled="isLoading || timeLeft > 0"
              class="text-red-400 hover:text-red-500 font-medium ml-1 disabled:opacity-50 disabled:cursor-not-allowed"
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
    this.email = sessionStorage.getItem('resetEmail') || '';
    if (!this.email) {
      this.$router.push('/forgot/email');
      return;
    }

    this.$nextTick(() => {
      // focus first input if exists
      if (this.otpInputs[0]) this.otpInputs[0].focus();
    });

    this.startTimer();
  },
  computed: {
    isOTPComplete() {
      return this.otpDigits.every(d => d !== '' && /^\d$/.test(d));
    },
    otpCode() {
      return this.otpDigits.join('');
    }
  },
  beforeUnmount() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  },
  methods: {
    goBack() {
      this.$router.push('/forgot/email');
    },

    // Main handler: set single digit and auto-jump to next
    handleInput(index, event) {
      let raw = event.target.value || '';
      // keep only digits
      raw = raw.replace(/\D/g, '');
      if (!raw) {
        // clear current
        this.otpDigits.splice(index, 1, '');
        return;
      }

      // Take only the last digit typed/pasted into this input
      const char = raw.slice(-1);

      // update reactive array (works in Vue2 & Vue3)
      this.otpDigits.splice(index, 1, char);

      // update the visible input value explicitly (in case v-model not used)
      if (this.otpInputs[index]) this.otpInputs[index].value = char;

      this.clearMessages();

      // Auto-focus next input if exists
      if (index < this.otpDigits.length - 1) {
        // small timeout to ensure DOM is updated
        setTimeout(() => {
          this.otpInputs[index + 1]?.focus();
          // select content (helpful on mobile)
          if (this.otpInputs[index + 1]) this.otpInputs[index + 1].select?.();
        }, 0);
      } else {
        // last input: optionally blur or keep focus
        // this.otpInputs[index]?.blur();
      }
    },

    handleKeydown(index, event) {
      const key = event.key;

      if (key === 'Backspace') {
        event.preventDefault();
        // if current has value, clear it
        if (this.otpDigits[index]) {
          this.otpDigits.splice(index, 1, '');
          if (this.otpInputs[index]) this.otpInputs[index].value = '';
          // keep focus on current (so user can type again)
          this.otpInputs[index]?.focus();
        } else if (index > 0) {
          // move focus to previous and clear it
          this.otpInputs[index - 1]?.focus();
          this.otpDigits.splice(index - 1, 1, '');
          if (this.otpInputs[index - 1]) this.otpInputs[index - 1].value = '';
        }
        this.clearMessages();
      } else if (key === 'ArrowLeft' && index > 0) {
        this.otpInputs[index - 1]?.focus();
      } else if (key === 'ArrowRight' && index < this.otpDigits.length - 1) {
        this.otpInputs[index + 1]?.focus();
      } else if (/^\d$/.test(key)) {
        // allow the digit — but we handle input event to set and jump
      } else {
        // block other keys
        // do nothing
      }
    },

    handlePaste(event) {
      event.preventDefault();
      const paste = event.clipboardData.getData('text') || '';
      const digits = paste.replace(/\D/g, '').slice(0, 6);

      for (let i = 0; i < 6; i++) {
        this.otpDigits.splice(i, 1, digits[i] || '');
        if (this.otpInputs[i]) this.otpInputs[i].value = digits[i] || '';
      }

      // Focus next empty or last
      const nextEmpty = this.otpDigits.findIndex(d => d === '');
      const focusIndex = nextEmpty === -1 ? 5 : nextEmpty;
      setTimeout(() => {
        this.otpInputs[focusIndex]?.focus();
      }, 0);
      this.clearMessages();
    },

    startTimer() {
      if (this.timer) {
        clearInterval(this.timer);
        this.timer = null;
      }
      if (!this.timeLeft || this.timeLeft <= 0) this.timeLeft = 60;

      this.timer = setInterval(() => {
        if (this.timeLeft > 0) {
          this.timeLeft--;
        } else {
          clearInterval(this.timer);
          this.timer = null;
        }
      }, 1000);
    },

    async resendCode() {
      if (!this.email) {
        this.errorMessage = 'Email không hợp lệ';
        return;
      }
      if (this.timeLeft > 0) return;

      this.clearMessages();
      this.isLoading = true;
      try {
        const res = await axios.post('/api/auth/forgot', { email: this.email });
        if (res.data && res.data.ok) {
          this.timeLeft = 60;
          this.startTimer();
          if (res.data.requestId) sessionStorage.setItem('resetRequestId', res.data.requestId);
          this.successMessage = 'Mã OTP đã được gửi lại!';
          setTimeout(() => this.successMessage = '', 3000);
        } else {
          this.errorMessage = (res.data && res.data.message) || 'Không thể gửi mã OTP';
        }
      } catch (err) {
        console.error(err);
        this.errorMessage = (err.response && err.response.data && err.response.data.message) || 'Có lỗi khi gửi lại OTP';
      } finally {
        this.isLoading = false;
      }
    },

    async verifyOTP() {
      if (!this.isOTPComplete) return;
      this.isLoading = true;
      this.clearMessages();

      try {
        const res = await axios.post('/api/auth/forgot/verify-otp', {
          email: this.email,
          otp: this.otpCode
        });

        if (res.data && res.data.ok) {
          // Lưu thông tin cần thiết vào sessionStorage
          if (res.data.requestId) sessionStorage.setItem('resetRequestId', res.data.requestId);
          sessionStorage.setItem('resetOTP', this.otpCode);

          // Hiển thị thông báo thành công
          this.successMessage = '✅ OTP hợp lệ! Đang chuyển tới trang đặt mật khẩu mới...';

          // Chuyển trang sau 500ms (nhanh hơn để cải thiện UX)
          setTimeout(() => {
            this.$router.push('/forgot/new-password');
          }, 500);
        } else {
          this.errorMessage = (res.data && res.data.message) || 'OTP không đúng hoặc đã hết hạn.';
        }
      } catch (err) {
        console.error(err);
        this.errorMessage = (err.response && err.response.data && err.response.data.message) || 'Có lỗi khi xác minh OTP';
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
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Custom input focus styles */
input:focus {
  box-shadow: 0 0 0 3px rgba(248, 113, 113, 0.1);
}
</style>
