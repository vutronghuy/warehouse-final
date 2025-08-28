<template>
  <div class="min-h-screen bg-gray-50 p-6">
    <div class="max-w-7xl mx-auto">
      <!-- Header Stats -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <!-- Customers Card -->
        <div class="bg-white rounded-xl shadow-sm border p-6">
          <div class="flex items-center mb-4">
            <div class="bg-gray-100 rounded-lg p-2 mr-3">
              <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"></path>
              </svg>
            </div>
            <span class="text-sm text-gray-500 font-medium">Customers</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-3xl font-bold text-gray-900">3,782</span>
            <div class="flex items-center text-green-600 bg-green-50 px-2 py-1 rounded-md">
              <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path>
              </svg>
              <span class="text-sm font-medium">11.01%</span>
            </div>
          </div>
        </div>

        <!-- Orders Card -->
        <div class="bg-white rounded-xl shadow-sm border p-6">
          <div class="flex items-center mb-4">
            <div class="bg-gray-100 rounded-lg p-2 mr-3">
              <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
              </svg>
            </div>
            <span class="text-sm text-gray-500 font-medium">Orders</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-3xl font-bold text-gray-900">5,359</span>
            <div class="flex items-center text-red-600 bg-red-50 px-2 py-1 rounded-md">
              <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
              </svg>
              <span class="text-sm font-medium">9.05%</span>
            </div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <!-- Monthly Sales Chart -->
        <div class="xl:col-span-2 bg-white rounded-xl shadow-sm border p-6">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-lg font-semibold text-gray-900">Monthly Sales</h3>
            <button class="text-gray-400 hover:text-gray-600">
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"></path>
              </svg>
            </button>
          </div>

          <!-- Chart Container -->
          <div class="relative">
            <div class="flex items-end justify-between h-64 space-x-2">
              <!-- Chart Bars -->
              <div v-for="month in chartData" :key="month.name" class="flex flex-col items-center flex-1">
                <div class="bg-blue-500 rounded-t-md transition-all duration-300 hover:bg-blue-600 cursor-pointer"
                     :style="{ height: (month.value / 400 * 200) + 'px', minHeight: '8px' }"
                     :title="`${month.name}: ${month.value}`">
                </div>
                <span class="text-xs text-gray-500 mt-2 font-medium">{{ month.name }}</span>
              </div>
            </div>

            <!-- Y-axis labels -->
            <div class="absolute left-0 top-0 h-64 flex flex-col justify-between text-xs text-gray-400 -ml-8">
              <span>400</span>
              <span>300</span>
              <span>200</span>
              <span>100</span>
              <span>0</span>
            </div>
          </div>
        </div>

        <!-- Monthly Target -->
        <div class="bg-white rounded-xl shadow-sm border p-6">
          <div class="flex items-center justify-between mb-6">
            <div>
              <h3 class="text-lg font-semibold text-gray-900">Monthly Target</h3>
              <p class="text-sm text-gray-500">Target you've set for each month</p>
            </div>
            <button class="text-gray-400 hover:text-gray-600">
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"></path>
              </svg>
            </button>
          </div>

          <!-- Progress Circle -->
          <div class="flex items-center justify-center mb-6">
            <div class="relative">
              <svg class="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
                <!-- Background circle -->
                <circle cx="60" cy="60" r="45" stroke="#e5e7eb" stroke-width="8" fill="transparent"></circle>
                <!-- Progress circle -->
                <circle cx="60" cy="60" r="45"
                        stroke="url(#gradient)"
                        stroke-width="8"
                        fill="transparent"
                        :stroke-dasharray="circumference"
                        :stroke-dashoffset="circumference - (progress / 100) * circumference"
                        stroke-linecap="round"
                        class="transition-all duration-500">
                </circle>
                <!-- Gradient definition -->
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" style="stop-color:#3B82F6"/>
                    <stop offset="100%" style="stop-color:#8B5CF6"/>
                  </linearGradient>
                </defs>
              </svg>
              <div class="absolute inset-0 flex items-center justify-center flex-col">
                <span class="text-2xl font-bold text-gray-900">{{ progress }}%</span>
                <div class="flex items-center text-green-600 mt-1">
                  <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path>
                  </svg>
                  <span class="text-xs font-medium">+10%</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Achievement Text -->
          <div class="text-center mb-6">
            <p class="text-sm text-gray-600">You earn $3287 today, it's higher than last month.</p>
            <p class="text-sm text-gray-600 font-medium">Keep up your good work!</p>
          </div>

          <!-- Target Stats -->
          <div class="grid grid-cols-3 gap-4 text-center">
            <div>
              <p class="text-xs text-gray-500 mb-1">Target</p>
              <div class="flex items-center justify-center">
                <span class="text-sm font-semibold text-gray-900">$20K</span>
                <svg class="w-3 h-3 ml-1 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
                </svg>
              </div>
            </div>
            <div>
              <p class="text-xs text-gray-500 mb-1">Revenue</p>
              <div class="flex items-center justify-center">
                <span class="text-sm font-semibold text-gray-900">$20K</span>
                <svg class="w-3 h-3 ml-1 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path>
                </svg>
              </div>
            </div>
            <div>
              <p class="text-xs text-gray-500 mb-1">Today</p>
              <div class="flex items-center justify-center">
                <span class="text-sm font-semibold text-gray-900">$20K</span>
                <svg class="w-3 h-3 ml-1 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import AdminSidebars from './sidebar.vue';
import HeadBar from './headbar.vue';

// Chart data for monthly sales
const chartData = ref([
  { name: 'Jan', value: 150 },
  { name: 'Feb', value: 380 },
  { name: 'Mar', value: 190 },
  { name: 'Apr', value: 290 },
  { name: 'May', value: 170 },
  { name: 'Jun', value: 180 },
  { name: 'Jul', value: 280 },
  { name: 'Aug', value: 90 },
  { name: 'Sep', value: 200 },
  { name: 'Oct', value: 390 },
  { name: 'Nov', value: 260 },
  { name: 'Dec', value: 100 }
])

// Progress circle data
const progress = ref(75.55)
const circumference = computed(() => 2 * Math.PI * 45)
</script>

<style scoped>
/* Additional custom styles if needed */
.transition-all {
  transition: all 0.3s ease;
}
</style>
