<template>
  <div class="min-h-screen bg-gray-50">
    <Sidebar />
    <Header />
    <div class="ml-64 py-8">
      <!-- Header Stats (Customers + Orders) -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <!-- Customers Card -->
        <div class="bg-white rounded-xl shadow-sm border p-6 ml-5">
          <div class="flex items-start justify-between mb-4">
            <div class="flex items-center">
              <div class="bg-gray-100 rounded-lg p-2 mr-3">
                <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
                  ></path>
                </svg>
              </div>
              <div>
                <span class="text-sm text-gray-500 font-medium">Customers</span>
              </div>
            </div>

            <div class="flex items-center space-x-2">
              <select v-model="customerFilter.period" class="border rounded px-2 py-1 text-sm">
                <option value="day">Day</option>
                <option value="month">Month</option>
                <option value="year">Year</option>
              </select>

              <input
                v-if="customerFilter.period === 'day'"
                type="date"
                v-model="customerFilter.date"
                :max="maxDate"
                class="border rounded px-2 py-1 text-sm"
              />
              <input
                v-if="customerFilter.period === 'month'"
                type="month"
                v-model="customerFilter.month"
                :max="maxMonth"
                class="border rounded px-2 py-1 text-sm"
              />
              <input
                v-if="customerFilter.period === 'year'"
                type="number"
                min="2000"
                :max="maxYear"
                v-model.number="customerFilter.year"
                class="border rounded px-2 py-1 w-24 text-sm"
              />
            </div>
          </div>

          <div class="flex items-center justify-between">
            <span class="text-3xl font-bold text-gray-900">{{ formatNumber(customers?.total ?? 0) }}</span>
            <div
              :class="[
                'flex items-center px-2 py-1 rounded-md',
                (customers?.changePercent ?? 0) >= 0
                  ? 'text-green-600 bg-green-50'
                  : 'text-red-600 bg-red-50',
              ]"
            >
              <svg
                v-if="(customers?.changePercent ?? 0) >= 0"
                class="w-4 h-4 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M5 10l7-7m0 0l7 7m-7-7v18"
                ></path>
              </svg>
              <svg v-else class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19 14l-7 7m0 0l-7-7m7 7V3"
                ></path>
              </svg>
              <span class="text-sm font-medium"
                >{{ formatPercent(customers?.changePercent ?? 0) }}%</span
              >
            </div>
          </div>
        </div>

        <!-- Orders Card -->
        <div class="bg-white rounded-xl shadow-sm border p-6 mr-5">
          <div class="flex items-start justify-between mb-4">
            <div class="flex items-center">
              <div class="bg-gray-100 rounded-lg p-2 mr-3">
                <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  ></path>
                </svg>
              </div>
              <div>
                <span class="text-sm text-gray-500 font-medium">Orders</span>
              </div>
            </div>

            <div class="flex items-center space-x-2">
              <select v-model="invoiceFilter.period" class="border rounded px-2 py-1 text-sm">
                <option value="day">Day</option>
                <option value="month">Month</option>
                <option value="year">Year</option>
              </select>

              <input
                v-if="invoiceFilter.period === 'day'"
                type="date"
                v-model="invoiceFilter.date"
                :max="maxDate"
                class="border rounded px-2 py-1 text-sm"
              />
              <input
                v-if="invoiceFilter.period === 'month'"
                type="month"
                v-model="invoiceFilter.month"
                :max="maxMonth"
                class="border rounded px-2 py-1 text-sm"
              />
              <input
                v-if="invoiceFilter.period === 'year'"
                type="number"
                min="2000"
                :max="maxYear"
                v-model.number="invoiceFilter.year"
                class="border rounded px-2 py-1 w-24 text-sm"
              />
            </div>
          </div>

          <div class="flex items-center justify-between">
            <span class="text-3xl font-bold text-gray-900">{{ formatNumber(invoices?.metrics?.count ?? 0) }}</span>
            <div
              :class="[
                'flex items-center px-2 py-1 rounded-md',
                (invoices?.metrics?.changePercent ?? 0) >= 0
                  ? 'text-green-600 bg-green-50'
                  : 'text-red-600 bg-red-50',
              ]"
            >
              <svg
                v-if="(invoices?.metrics?.changePercent ?? 0) >= 0"
                class="w-4 h-4 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path>
              </svg>
              <svg v-else class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
              </svg>
              <span class="text-sm font-medium"
                >{{ formatPercent(invoices?.metrics?.changePercent ?? 0) }}%</span
              >
            </div>
          </div>
        </div>
      </div>

      <!-- Sales + Target area -->
      <div class="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <!-- Monthly Sales Chart (Chart.js) -->
        <div class="xl:col-span-2 bg-white rounded-xl shadow-sm border p-6 ml-5">
          <div class="flex items-center justify-between mb-6">
            <div>
              <h3 class="text-lg font-semibold text-gray-900">Monthly Sales</h3>
            </div>

            <!-- Year selector with three dots menu -->
            <div class="flex items-center space-x-2">
              <input
                type="number"
                min="2000"
                :max="maxYear"
                v-model.number="salesYear"
                class="border rounded px-2 py-1 w-24 text-sm"
              />
            </div>
          </div>

          <!-- Chart canvas with custom styling -->
          <div class="relative bg-gray-50 rounded-lg p-4" style="height: 300px">
            <canvas ref="salesCanvas" style="width: 100%; height: 100%"></canvas>
          </div>
        </div>

        <!-- Monthly Target -->
        <div class="bg-white rounded-xl shadow-sm border p-4 mr-5">
          <div class="flex items-start justify-between mb-4">
            <div>
              <h3 class="text-lg font-semibold text-gray-900">Monthly Target</h3>
            </div>

            <div class="flex items-center space-x-2">
              <select v-model="targetFilter.period" class="border rounded px-2 py-1 text-sm">
                <option value="day">Day</option>
                <option value="month">Month</option>
                <option value="year">Year</option>
              </select>
              <input
                v-if="targetFilter.period === 'day'"
                type="date"
                v-model="targetFilter.date"
                :max="maxDate"
                class="border rounded px-2 py-1 text-sm"
              />
              <input
                v-if="targetFilter.period === 'month'"
                type="month"
                v-model="targetFilter.month"
                :max="maxMonth"
                class="border rounded px-2 py-1 text-sm"
              />
              <input
                v-if="targetFilter.period === 'year'"
                type="number"
                min="2000"
                :max="maxYear"
                v-model.number="targetFilter.year"
                class="border rounded px-2 py-1 w-24 text-sm"
              />
            </div>
          </div>

          <div class="flex items-center justify-center mb-6">
            <div class="relative">
              <svg class="w-40 h-32 transform -rotate-90" viewBox="0 0 120 120">
                <circle cx="50" cy="60" r="55" stroke="#e5e7eb" stroke-width="8" fill="transparent"></circle>
                <circle
                  cx="50"
                  cy="60"
                  r="55"
                  stroke="url(#gradient)"
                  stroke-width="8"
                  fill="transparent"
                  :stroke-dasharray="circumference"
                  :stroke-dashoffset="circumference - (targetProgressPercent / 100) * circumference"
                  stroke-linecap="round"
                  class="transition-all duration-500"
                ></circle>
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" style="stop-color: #3b82f6" />
                    <stop offset="100%" style="stop-color: #8b5cf6" />
                  </linearGradient>
                </defs>
              </svg>
              <div class="absolute inset-0 mt-6 flex items-center justify-center flex-col">
                <span class="text-2xl font-bold text-gray-900">{{ targetProgressPercent.toFixed(2) }}%</span>
                <div
                  class="flex items-center text-green-600 mt-1"
                  v-if="(target?.metrics?.revenue ?? 0) >= (appliedTarget ?? 0)"
                >
                  <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M5 10l7-7m0 0l7 7m-7-7v18"
                    ></path>
                  </svg>
                  <span class="text-xs font-medium">of target</span>
                </div>
              </div>
            </div>
          </div>

          <div class="text-center mb-7">
            <p class="text-sm text-gray-600">
              Revenue: <span class="font-medium">{{ formatCurrency(target?.metrics?.revenue ?? 0) }}</span>
            </p>
            <p class="text-sm text-gray-600 font-medium">
              Target:
              <span class="font-medium">{{ appliedTarget ? formatCurrency(appliedTarget) : '-' }}</span>
            </p>
          </div>

          <div class="grid grid-cols-3 gap-4 text-center">
            <div>
              <p class="text-xs text-gray-500 mb-1">Target</p>
              <div class="flex items-center justify-center">
                <span class="text-sm font-semibold text-gray-900">{{
                  appliedTarget ? formatCurrency(appliedTarget) : '-'
                }}</span>
              </div>
            </div>
            <div>
              <p class="text-xs text-gray-500 mb-1">Revenue</p>
              <div class="flex items-center justify-center">
                <span class="text-sm font-semibold text-gray-900">{{
                  formatCurrency(target?.metrics?.revenue ?? 0)
                }}</span>
              </div>
            </div>
            <div>
              <p class="text-xs text-gray-500 mb-1">Today</p>
              <div class="flex items-center justify-center">
                <span class="text-sm font-semibold text-gray-900">{{
                  formatCurrency(todayRevenue ?? 0)
                }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <!-- end grid -->
    </div>

    <!-- ChatBot Component -->
    <ChatBot />
  </div>
</template>

<script setup>
/* eslint-disable no-unused-vars */
import { ref, computed, onMounted, watch, onBeforeUnmount, nextTick } from 'vue';
import axios from 'axios';
import Sidebar from './sidebar.vue';
import Header from './headbar.vue';
import { ChatBot } from '@/components';
import Chart from 'chart.js/auto'; // npm i chart.js
import socketService from '@/services/socketService';

// Exchange rate constant (same as AccounterDashboardSimple.vue)
const USD_TO_VND_RATE = 26401; // 1 USD = 26,401 VND

// initial dates
const now = new Date();
const currentYear = now.getFullYear();
const currentMonth = (now.getMonth() + 1).toString().padStart(2, '0');
const currentDayISO = now.toISOString().slice(0, 10);
const currentMonthInput = `${currentYear}-${currentMonth}`;

// Per-card filters (refs)
const customerFilter = ref({
  period: 'month',
  year: currentYear,
  month: currentMonthInput,
  date: currentDayISO,
});
const invoiceFilter = ref({
  period: 'month',
  year: currentYear,
  month: currentMonthInput,
  date: currentDayISO,
});
const targetFilter = ref({
  period: 'month',
  year: currentYear,
  month: currentMonthInput,
  date: currentDayISO,
});

// monthly sales year (chart)
const salesYear = ref(currentYear);

// target manual input / applied target
const targetInput = ref(null);
const appliedTarget = ref(null);

// data objects (separate metrics per dashboard)
const customers = ref({ total: 0, previous: 0, changePercent: 0, periodLabel: '' });
const invoices = ref({ metrics: { count: 0, previousCount: 0, changePercent: 0 }, metricsDetail: {} });
const sales = ref({ metrics: { revenue: 0 } });
const target = ref({ metrics: { revenue: 0 } });

// monthly series sample
const monthSeries = ref([
  { month: 1, total: 150 },
  { month: 2, total: 380 },
  { month: 3, total: 190 },
  { month: 4, total: 290 },
  { month: 5, total: 180 },
  { month: 6, total: 190 },
  { month: 7, total: 280 },
  { month: 8, total: 100 },
  { month: 9, total: 200 },
  { month: 10, total: 380 },
  { month: 11, total: 270 },
  { month: 12, total: 110 },
]);
const chartMax = ref(400); // will store raw max of months only
const todayRevenue = ref(0);

const circumference = 2 * Math.PI * 55;

// max selectors
const maxDate = computed(() => currentDayISO);
const maxMonth = computed(() => currentMonthInput);
const maxYear = computed(() => currentYear);

// helpers
const formatNumber = (n) => {
  if (!n && n !== 0) return '-';
  return n.toLocaleString();
};
const formatCurrency = (v) => {
  if (v === null || v === undefined) return '-';
  const n = Number(v) || 0;
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(n);
};

// Helper: convert amount to VND (same as AccounterDashboardSimple.vue)
const amountToVND = (value, currency) => {
  const n = Number(value) || 0;
  if (!currency) {
    // fallback: if number small assume USD else VND (heuristic)
    return n > 1000000 ? Math.round(n) : Math.round(n * USD_TO_VND_RATE);
  }
  return currency.toUpperCase() === 'USD' ? Math.round(n * USD_TO_VND_RATE) : Math.round(n);
};
const monthShortName = (m) => new Date(0, m - 1).toLocaleString(undefined, { month: 'short' });

function getYStep(max, steps = 4) {
  const num = Math.max(1, Number(max) || 1);
  const raw = num / Math.max(1, steps);
  if (!isFinite(raw) || raw <= 0) return 1;
  const exp = Math.floor(Math.log10(raw));
  const base = Math.pow(10, exp);
  const mul = Math.ceil(raw / base);
  return mul * base;
}

// NEW: desired number of Y steps (you can change this number)
const yAxisSteps = 8;

// Compute step and yMax based on raw max
function computeStepAndMax(maxVal, steps = 6) {
  const raw = Math.max(0, Number(maxVal) || 0);
  const step = getYStep(raw, steps); // "nice" step size
  const yMax = Math.max(step, Math.ceil(raw / step) * step); // round up to nearest step multiple
  return { step, yMax };
}

// ----- Progress percent for target (use target.value.metrics.revenue) -----
const targetProgressPercent = computed(() => {
  if (!appliedTarget.value || appliedTarget.value <= 0) return 0;
  const revenue = target.value?.metrics?.revenue || 0;
  const p = (revenue / appliedTarget.value) * 100;
  return Math.round(p * 100) / 100;
});

// Build query helper
function buildQueryFromFilter(f) {
  const q = {};
  const p = f.period;
  q.period = p;
  if (p === 'day') {
    const d = f.date || currentDayISO;
    let [y, mm, dd] = d.split('-').map(Number);
    if (y > currentYear) y = currentYear;
    if (y === currentYear && mm > Number(currentMonth)) mm = Number(currentMonth);
    if (y === currentYear && mm === Number(currentMonth) && dd > Number(currentDayISO.split('-')[2]))
      dd = Number(currentDayISO.split('-')[2]);
    q.year = y;
    q.month = mm;
    q.day = dd;
  } else if (p === 'month') {
    const [y, mm] = (f.month || currentMonthInput).split('-').map(Number);
    let yy = y || currentYear;
    let m = mm || Number(currentMonth);
    if (yy > currentYear) yy = currentYear;
    if (yy === currentYear && m > Number(currentMonth)) m = Number(currentMonth);
    q.year = yy;
    q.month = m;
  } else {
    let yy = f.year || currentYear;
    if (yy > currentYear) yy = currentYear;
    q.year = yy;
  }
  return q;
}

// ----------------- Fetchers -----------------
async function fetchCustomers() {
  try {
    const q = buildQueryFromFilter(customerFilter.value);
    const res = await axios.get('/api/customers/dashboard', { params: q });
    if (res.data?.success) {
      customers.value.total = res.data.total ?? customers.value.total;
      customers.value.previous = res.data.previous ?? customers.value.previous;
      customers.value.changePercent =
        typeof res.data.changePercent === 'number' ? res.data.changePercent : customers.value.changePercent;
      customers.value.periodLabel = res.data.period?.period ?? customerFilter.value.period;
    }
  } catch (err) {
    console.warn('customers dashboard error', err?.response?.data ?? err.message);
  }
}

async function fetchInvoices() {
  try {
    const q = buildQueryFromFilter(invoiceFilter.value);
    const res = await axios.get('/api/invoices/dashboard', { params: q });
    if (res.data?.success) {
      invoices.value.metrics.count = res.data.invoicesCount || 0;
      invoices.value.metrics.previousCount = res.data.invoicesPreviousCount || 0;
      invoices.value.metrics.changePercent = res.data.invoicesChangePercent || 0;
      invoices.value.metricsDetail.revenue = res.data.revenue || 0;
      invoices.value.metricsDetail.revenuePrevious = res.data.revenuePrevious || 0;
      invoices.value.metricsDetail.revenueChangePercent = res.data.revenueChangePercent || 0;
    }
    // if current invoiceFilter is day, update today's revenue
    if (invoiceFilter.value.period === 'day') {
      await fetchDailyRevenue(invoiceFilter.value.date);
    }
  } catch (err) {
    console.warn('invoices dashboard error', err?.response?.data ?? err.message);
  }
}

async function fetchMonthlySales() {
  try {
    const salesQ = { period: 'year', year: Number(salesYear.value) || currentYear };
    const res = await axios.get('/api/invoices/dashboard', { params: salesQ });
    if (res.data?.success && Array.isArray(res.data.monthlySales)) {
      const byMonth = Array.from({ length: 12 }, (_, i) => {
        const m = i + 1;
        const found = res.data.monthlySales.find((s) => Number(s._id ?? s.month) === m);
        if (found) {
          // Backend now returns total in VND (already converted)
          // If totalOriginal exists and is different, it means conversion happened
          const totalVND = Number(found.total ?? found.amount ?? 0);
          // Fallback: if value seems too small, might be in USD (for backward compatibility)
          const total = totalVND > 1000000 ? totalVND : amountToVND(totalVND, found.currencies?.[0] || 'USD');
          return { month: m, total };
        }
        return { month: m, total: 0 };
      });
      monthSeries.value = byMonth;

      // Backend now returns revenue in VND (already converted)
      sales.value.metrics.revenue = Number(res.data.revenue) || 0;
    } else {
      // Backend now returns revenue in VND (already converted)
      sales.value.metrics.revenue = Number(res.data?.revenue) || 0;
    }

    // ======= IMPORTANT CHANGE: chartMax now uses ONLY the highest month value (not annual total) =======
    const highestMonthValue = Math.max(...monthSeries.value.map((m) => Number(m.total) || 0), 0);
    chartMax.value = highestMonthValue;

    updateSalesChart();
  } catch (err) {
    console.warn('monthly sales error', err?.response?.data ?? err.message);
    chartMax.value = Math.max(...monthSeries.value.map((m) => Number(m.total) || 0), 0);
    sales.value.metrics.revenue = sales.value.metrics.revenue || 0;
    updateSalesChart();
  }
}

async function fetchTarget() {
  try {
    console.log('🎯 fetchTarget called - refreshing monthly target data');

    if (targetInput.value !== null && targetInput.value !== undefined && targetInput.value !== '') {
      const n = Number(targetInput.value);
      appliedTarget.value = Number.isFinite(n) ? n : null;
      console.log('🎯 Using manual target input:', appliedTarget.value);
    } else {
      const tq = {};
      if (targetFilter.value.period === 'month') {
        const [y, mm] = (targetFilter.value.month || currentMonthInput).split('-').map(Number);
        tq.year = y || currentYear;
        tq.month = mm || Number(currentMonth);
      } else if (targetFilter.value.period === 'day') {
        tq.date = targetFilter.value.date || currentDayISO;
        const [y, mm, dd] = tq.date.split('-').map(Number);
        tq.year = y;
        tq.month = mm;
        tq.day = dd;
      } else {
        tq.year = targetFilter.value.year || currentYear;
      }

      try {
        console.log('🎯 Fetching target from API with params:', tq);
        const tRes = await axios.get('/api/targets', { params: tq });
        const d = tRes.data || {};
        if (d.targetAmount !== undefined) appliedTarget.value = Number(d.targetAmount);
        else if (d.amount !== undefined) appliedTarget.value = Number(d.amount);
        else if (Array.isArray(d.targets) && tq.month) {
          const found = d.targets.find(
            (t) => Number(t.month) === Number(tq.month) && Number(t.year) === Number(tq.year),
          );
          appliedTarget.value = found ? Number(found.amount) : null;
        } else appliedTarget.value = null;
        console.log('🎯 Target amount set to:', appliedTarget.value);
      } catch (err) {
        console.warn('targets fetch failed', err?.response?.data ?? err.message);
        appliedTarget.value = null;
      }
    }

    const revenueQ = buildQueryFromFilter(targetFilter.value);
    console.log('🎯 Fetching revenue data with params:', revenueQ);
    const revRes = await axios.get('/api/invoices/dashboard', { params: revenueQ });
    if (revRes.data?.success) {
      // Backend now returns revenue in VND (already converted)
      target.value.metrics.revenue = Number(revRes.data.revenue) || 0;
      console.log('🎯 Revenue updated to:', target.value.metrics.revenue);
    } else {
      target.value.metrics.revenue = 0;
      console.log('🎯 Revenue set to 0 (no success response)');
    }

    // if targetFilter asks day, update today's revenue accordingly (or always update from invoiceFilter/day)
    if (targetFilter.value.period === 'day') {
      await fetchDailyRevenue(targetFilter.value.date);
    } else {
      // ensure todayRevenue is kept up-to-date with invoiceFilter or default today
      await fetchDailyRevenue(); // default today
    }

    console.log('🎯 Target progress percent:', targetProgressPercent.value);
  } catch (err) {
    console.warn('fetchTarget error', err?.response?.data ?? err.message);
    appliedTarget.value = null;
    target.value.metrics.revenue = 0;
  }
}

// ----------------- Fetch daily revenue -----------------
async function fetchDailyRevenue(dateStr) {
  try {
    const d = dateStr || currentDayISO;
    const q = buildQueryFromFilter({ period: 'day', date: d });
    const res = await axios.get('/api/invoices/dashboard', { params: q });
    if (res.data?.success) {
      // Backend now returns revenue in VND (already converted)
      todayRevenue.value = Number(res.data.revenue) || 0;
    } else {
      todayRevenue.value = 0;
    }
  } catch (err) {
    console.warn('fetchDailyRevenue error', err?.response?.data ?? err.message);
    todayRevenue.value = 0;
  }
}

// ----------------- Chart.js integration -----------------
const salesCanvas = ref(null);
let salesChart = null;
const selectedMonth = ref(null); // 1..12 or null

function createSalesChart() {
  if (!salesCanvas.value) return;
  const ctx = salesCanvas.value.getContext('2d');

  const labels = monthSeries.value.map((m) => monthShortName(m.month));
  const data = monthSeries.value.map((m) => Number(m.total) || 0);

  // colors
  const barColor = 'rgba(59, 130, 246, 0.8)';
  const selectedBarColor = 'rgba(59, 130, 246, 1)';
  const backgroundColors = data.map((_, idx) =>
    selectedMonth.value === idx + 1 ? selectedBarColor : barColor,
  );

  // compute step and yMax from raw chartMax (which is highest month only)
  const { step: yStep, yMax } = computeStepAndMax(chartMax.value, yAxisSteps);

  const config = {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Revenue',
          data,
          backgroundColor: backgroundColors,
          borderColor: 'transparent',
          borderWidth: 0,
          borderRadius: 8,
          borderSkipped: false,
          barThickness: 24,
          maxBarThickness: 24,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'nearest', intersect: true },
      layout: { padding: { left: 10, right: 10, top: 20, bottom: 10 } },
      plugins: {
        legend: { display: false },
        tooltip: {
          enabled: true,
          backgroundColor: 'rgba(0,0,0,0.85)',
          titleColor: '#fff',
          bodyColor: '#fff',
          displayColors: false,
          callbacks: {
            title: (context) => labels[context[0].dataIndex],
            label: (context) => formatCurrency(context.raw),
          },
        },
      },
      scales: {
        x: {
          grid: { display: false, drawBorder: false },
          ticks: { color: '#6B7280', padding: 8 },
          border: { display: false },
        },
        y: {
          beginAtZero: true,
          suggestedMax: yMax,
          ticks: {
            stepSize: yStep,
            callback: (val) => formatCurrency(val),
            color: '#9CA3AF',
            maxTicksLimit: yAxisSteps + 1,
          },
          grid: { color: 'rgba(226,232,240,0.8)' },
        },
      },
      onClick(e) {
        if (!salesChart) return;
        const points = salesChart.getElementsAtEventForMode(e, 'nearest', { intersect: true }, true);
        if (points.length) {
          const first = points[0];
          const idx = first.index;
          selectedMonth.value = idx + 1;
          updateSalesChart();
        }
      },
    },
  };

  // destroy old
  if (salesChart) {
    try {
      salesChart.destroy();
    } catch (e) {
      /* ignore */
    }
    salesChart = null;
  }

  salesChart = new Chart(ctx, config);
}

function updateSalesChart() {
  if (!salesChart) {
    nextTick(() => createSalesChart());
    return;
  }

  const data = monthSeries.value.map((m) => Number(m.total) || 0);
  salesChart.data.labels = monthSeries.value.map((m) => monthShortName(m.month));
  salesChart.data.datasets[0].data = data;

  const barColor = 'rgba(59, 130, 246, 0.8)';
  const selectedBarColor = 'rgba(59, 130, 246, 1)';
  salesChart.data.datasets[0].backgroundColor = data.map((_, idx) =>
    selectedMonth.value === idx + 1 ? selectedBarColor : barColor,
  );

  // recompute step & yMax from raw chartMax (highest month only)
  const { step: newStep, yMax: newYMax } = computeStepAndMax(chartMax.value, yAxisSteps);
  if (salesChart.options && salesChart.options.scales && salesChart.options.scales.y) {
    salesChart.options.scales.y.suggestedMax = newYMax;
    salesChart.options.scales.y.ticks.stepSize = newStep;
    salesChart.options.scales.y.ticks.callback = (val) => formatCurrency(val);
    salesChart.options.scales.y.ticks.maxTicksLimit = yAxisSteps + 1;
  }

  salesChart.update();
}

onBeforeUnmount(() => {
  // Disconnect Socket.IO
  socketService.disconnect();

  if (salesChart)
    try {
      salesChart.destroy();
    } catch (e) {
      /* ignore */
    }
});

// ----------------- Debounced watchers per-card -----------------
let customerTimer = null;
let invoiceTimer = null;
let salesTimer = null;
let targetTimer = null;

watch(
  customerFilter,
  () => {
    if (customerTimer) clearTimeout(customerTimer);
    customerTimer = setTimeout(() => fetchCustomers(), 300);
  },
  { deep: true },
);

watch(
  invoiceFilter,
  () => {
    if (invoiceTimer) clearTimeout(invoiceTimer);
    invoiceTimer = setTimeout(() => fetchInvoices(), 300);
  },
  { deep: true },
);

watch(
  () => salesYear.value,
  () => {
    if (salesTimer) clearTimeout(salesTimer);
    salesTimer = setTimeout(() => fetchMonthlySales(), 300);
  },
);

watch(
  [
    () => targetFilter.value.period,
    () => targetFilter.value.month,
    () => targetFilter.value.year,
    () => targetFilter.value.date,
    () => targetInput.value,
  ],
  () => {
    if (targetTimer) clearTimeout(targetTimer);
    targetTimer = setTimeout(() => fetchTarget(), 300);
  },
);

// watch monthSeries to update chart when data changes
watch(monthSeries, () => updateSalesChart(), { deep: true });

// ----------------- Percent formatting helper -----------------
function formatPercent(value, digits = 2) {
  const n = Number(value ?? 0);
  if (!isFinite(n)) return (0).toFixed(digits);
  return Number(n).toFixed(digits);
}

// Socket.IO initialization
const initializeSocket = () => {
  console.log('🚀 Initializing Socket.IO for Admin Dashboard...');

  // Connect to Socket.IO
  const socket = socketService.connect();

  // Join admin room
  if (socket) {
    console.log('🏠 Joining admin room...');
    socket.emit('join-room', 'admins');
  } else {
    console.warn('⚠️ Socket not available, charts will not update in real-time');
  }

  // Listen for chart data updates
  socketService.on('chart-data-updated', (data) => {
    console.log('📊 Admin Dashboard - Chart data updated:', data);

    // Refresh all charts based on update type
    if (data.type === 'sales' || data.type === 'all') {
      console.log('📊 Refreshing sales data...');
      fetchMonthlySales();
    }
    if (data.type === 'customers' || data.type === 'all') {
      console.log('📊 Refreshing customers data...');
      fetchCustomers();
    }
    if (data.type === 'invoices' || data.type === 'all') {
      console.log('📊 Refreshing invoices data...');
      fetchInvoices();
    }
    if (data.type === 'target' || data.type === 'all') {
      console.log('📊 Refreshing target data...');
      fetchTarget();
    }

    // Always refresh target for invoice events
    if (data.type === 'invoice' || data.type === 'all') {
      console.log('📊 Refreshing target data for invoice event...');
      fetchTarget();
    }
  });

  // Listen for invoice events
  socketService.on('invoice-created', () => {
    console.log('📄 Admin Dashboard - Invoice created - refreshing charts');
    fetchMonthlySales();
    fetchInvoices();
    fetchTarget(); // Add target refresh for monthly target
  });

  socketService.on('invoice-deleted', () => {
    console.log('🗑️ Admin Dashboard - Invoice deleted - refreshing charts');
    fetchMonthlySales();
    fetchInvoices();
    fetchTarget(); // Add target refresh for monthly target
  });

  socketService.on('invoice-approved', () => {
    console.log('✅ Admin Dashboard - Invoice approved - refreshing charts');
    fetchMonthlySales();
    fetchInvoices();
    fetchTarget(); // Add target refresh for monthly target
  });

  socketService.on('invoice-rejected', () => {
    console.log('❌ Admin Dashboard - Invoice rejected - refreshing charts');
    fetchMonthlySales();
    fetchInvoices();
    fetchTarget(); // Add target refresh for monthly target
  });

  // Listen for export events
  socketService.on('export-created', () => {
    console.log('📦 Admin Dashboard - Export created - refreshing charts');
    fetchMonthlySales();
    fetchTarget(); // Add target refresh for monthly target
  });

  socketService.on('export-approved', () => {
    console.log('✅ Admin Dashboard - Export approved - refreshing charts');
    fetchMonthlySales();
    fetchTarget(); // Add target refresh for monthly target
  });
};

// ----------------- Init -----------------
onMounted(async () => {
  // Initialize Socket.IO connection
  initializeSocket();

  if (!customerFilter.value.month) customerFilter.value.month = currentMonthInput;
  if (!invoiceFilter.value.month) invoiceFilter.value.month = currentMonthInput;
  if (!targetFilter.value.month) targetFilter.value.month = currentMonthInput;
  if (!salesYear.value) salesYear.value = currentYear;

  // initial fetches
  await Promise.allSettled([fetchCustomers(), fetchInvoices(), fetchMonthlySales(), fetchTarget()]);
  // ensure daily revenue at startup (today)
  await fetchDailyRevenue(currentDayISO);

  nextTick(() => createSalesChart());
});
</script>

<style scoped>
.transition-all {
  transition: all 0.3s ease;
}
</style>
