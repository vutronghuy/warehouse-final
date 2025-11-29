<template>
  <section class="min-h-screen bg-gray-50 dark:bg-gray-900 relative overflow-hidden">
    <div
      class="absolute inset-0 bg-[url('/img/logo1.jpeg')] bg-cover bg-center bg-no-repeat"
      style="background-position: 80% 50%"
    >
      <div class="absolute inset-0 bg-black/40 dark:bg-black/60"></div>
    </div>

    <div
      class="relative z-10 flex flex-col items-center justify-center px-6 py-8 mx-auto min-h-screen lg:py-0"
    >
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
              <h2 class="text-2xl text-center font-semibold text-white">Enter the confirmation code</h2>
              <p class="text-sm text-center text-white/80 mt-2">
                Verification code has been sent to
                <span class="font-semibold">{{ email }}</span>
              </p>
            </div>
          </div>

          <div class="flex justify-center flex-wrap gap-3">
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
              class="w-12 h-14 text-center text-xl font-semibold bg-white/80 text-gray-900 border border-white/50 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all shadow-sm"
            />
          </div>

          <div class="text-center text-white/90">
            <p class="text-sm">
              <span v-if="timeLeft > 0">
                Please wait <span class="font-semibold">{{ timeLeft }}s</span> to send back.
              </span>
              <span v-else class="inline-flex items-center gap-1">
                Didn't receive code?
                <button
                  type="button"
                  @click="resendCode"
                  :disabled="isLoading || timeLeft > 0"
                  class="text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer bg-transparent border-0 p-0 underline-offset-2 cursor-pointer"
                >
                Resend
                </button>
              </span>
            </p>
          </div>

          <button
            type="button"
            @click="verifyOTP"
            :disabled="!isOTPComplete || isLoading"
            :class="[
              'w-full font-medium rounded-lg text-sm px-5 py-3 text-center transition-all duration-200 transform',
              isOTPComplete && !isLoading
                ? 'text-white bg-[#4b3636] hover:scale-[1.02] active:scale-[0.98] focus:ring-4 focus:outline-none focus:ring-blue-300'
                : 'bg-gray-400 text-gray-200 cursor-not-allowed'
            ]"
          >
            <span v-if="!isLoading">Kế tiếp</span>
            <span v-else class="flex items-center justify-center">
              <svg class="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Đang xác minh...
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
