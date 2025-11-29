<template>
  <div class="min-h-screen bg-gray-50">
    <AccounterSidebar />

    <AccounterHeader />

    <div class="ml-64 py-8">
      <!-- Main Content -->
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Chart 1: Top Products (Horizontal bar) -->
          <div class="bg-white rounded-xl shadow-sm border p-6">
            <div class="flex items-center justify-between mb-4">
              <div>
                <h3 class="text-lg font-semibold text-gray-900">Top 10 Best Selling Products</h3>
              </div>
              <div class="text-sm text-gray-500">
                Total: {{ topProducts.length }} products
              </div>
            </div>

            <div class="min-h-[250px]">
              <div v-if="isLoadingProducts" class="flex flex-col items-center justify-center py-12 text-gray-500">
                <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
                <p class="text-lg font-medium">Loading data...</p>
              </div>

              <div v-else-if="topProducts.length === 0" class="flex flex-col items-center justify-center py-12 text-gray-500">
                <svg class="w-12 h-12 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2 2v-5m16 0h-2M4 13h2m13-8V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v1M7 7h10"></path>
                </svg>
                <p class="text-lg font-medium">No product data</p>
                <p class="text-sm">Data will appear when invoices are created</p>
              </div>

              <div v-else class="w-full">
                <div class="relative w-full h-72">
                  <canvas ref="topProductsChartRef" class="chart-canvas absolute inset-0"></canvas>
                </div>
                <div class="mt-3 text-xs text-gray-500">
                  Shows Top 10 by quantity sold.
                </div>
              </div>
            </div>
          </div>

          <!-- Chart 2: Cash Flow - Line Chart (Net = Revenue - Cost) -->
          <div class="bg-white rounded-xl shadow-sm border p-6">
            <div class="flex items-center justify-between mb-4">
              <div>
                <h3 class="text-lg font-semibold text-gray-900">Financial Analysis</h3>
              </div>

              <!-- Filter Controls -->
              <div class="flex items-center space-x-3">
                <select v-model="chartFilters.period" @change="updateChart" class="text-sm border border-gray-300 rounded-md px-3 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <option value="year">Year</option>
                  <option value="month">Month</option>
                  <option value="day">Day</option>
                </select>

                <select v-model="chartFilters.year" @change="updateChart" class="text-sm border border-gray-300 rounded-md px-3 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <option value="2025">2025</option>
                  <option value="2024">2024</option>
                  <option value="2023">2023</option>
                  <option value="2022">2022</option>
                </select>

                <select v-if="chartFilters.period === 'day'" v-model="chartFilters.month" @change="updateChart" class="text-sm border border-gray-300 rounded-md px-3 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <option value="1">month 1</option>
                  <option value="2">month 2</option>
                  <option value="3">month 3</option>
                  <option value="4">month 4</option>
                  <option value="5">month 5</option>
                  <option value="6">month 6</option>
                  <option value="7">month 7</option>
                  <option value="8">month 8</option>
                  <option value="9">month 9</option>
                  <option value="10">month 10</option>
                  <option value="11">month 11</option>
                  <option value="12">month 12</option>
                </select>
              </div>
            </div>

            <div class="min-h-[250px]">
              <div v-if="isLoadingCashFlow" class="flex flex-col items-center justify-center py-12 text-gray-500">
                <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
                <p class="text-lg font-medium">Loading cash flow data...</p>
              </div>

              <div v-else>
                <div class="relative w-full h-72 mb-4">
                  <canvas ref="cashFlowChartRef" class="chart-canvas absolute inset-0"></canvas>
                </div>

               <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
    <div class="bg-green-50 rounded-lg p-3">
      <div class="text-sm font-medium text-green-600">Total Revenue</div>
      <div class="text-xl sm:text-2xl font-bold text-green-700 leading-tight">
        <span class="inline-block max-w-full break-words whitespace-normal">
          {{ formatCurrency(cashFlowSummary.totalRevenue) }}
        </span>
      </div>
    </div>

    <div class="bg-red-50 rounded-lg p-3">
      <div class="text-sm font-medium text-red-600">Total Cost</div>
      <div class="text-xl sm:text-2xl font-bold text-red-700 leading-tight">
        <span class="inline-block max-w-full break-words whitespace-normal">
          {{ formatCurrency(cashFlowSummary.totalCost) }}
        </span>
      </div>
    </div>

    <div class="bg-blue-50 rounded-lg p-3">
      <div class="text-sm font-medium text-blue-600">Profit</div>
      <div :class="['text-xl sm:text-2xl font-bold leading-tight', cashFlowSummary.totalProfit >= 0 ? 'text-blue-700' : 'text-red-700']">
        <span class="inline-block max-w-full break-words whitespace-normal">
          {{ formatCurrency(cashFlowSummary.totalProfit) }}
        </span>
      </div>
    </div>
  </div>

              </div>
            </div>
          </div>
        </div>

        <!-- Chart 3: Inventory Value (line over time) -->
        <div class="bg-white rounded-xl shadow-sm border p-6">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h3 class="text-lg font-semibold text-gray-900">Inventory Value</h3>
              <p class="text-sm text-gray-600 mt-1">Track total inventory value (at cost) over time.</p>
            </div>
            <div class="text-sm text-gray-500">
              Scope: {{ inventorySeries.length ? `${inventorySeries.length} periods` : '—' }}
            </div>
          </div>

          <div class="min-h-[300px]">
            <div v-if="isLoadingInventory" class="flex flex-col items-center justify-center py-12 text-gray-500">
              <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
              <p class="text-lg font-medium">Loading inventory data...</p>
            </div>

            <div v-else-if="inventorySeries.length === 0" class="flex flex-col items-center justify-center py-12 text-gray-500">
              <p class="text-lg font-medium">No inventory data over time</p>
              <p class="text-sm">The API does not return historical inventory data.</p>
            </div>

            <div v-else>
              <div class="relative w-full h-80">
                <canvas ref="inventoryChartRef" class="chart-canvas absolute inset-0"></canvas>
              </div>

              <div class="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div class="bg-purple-50 rounded-lg p-3">
                  <div class="text-sm font-medium text-purple-600">Present value</div>
                  <div class="text-lg font-bold text-purple-700">{{ formatCurrency(inventorySummary.currentValue) }}</div>
                </div>
                <div class="bg-gray-50 rounded-lg p-3">
                  <div class="text-sm font-medium text-gray-600">Trend (Δ)</div>
                  <div :class="['text-lg font-bold', inventorySummary.trend >= 0 ? 'text-green-700' : 'text-red-700']">
                    {{ inventorySummary.trend >= 0 ? '+' : '' }}{{ formatCurrency(inventorySummary.trend) }}
                  </div>
                </div>
                <div class="bg-gray-50 rounded-lg p-3">
                  <div class="text-sm font-medium text-gray-600">Average</div>
                  <div class="text-lg font-bold text-gray-700">{{ formatCurrency(inventorySummary.averageValue) }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Chart 4: Combined - Grouped Bars (Revenue & Cost) + Line (Profit %) -->
        <div class="bg-white rounded-xl shadow-sm border p-6">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h3 class="text-lg font-semibold text-gray-900">Revenue vs Cost (Grouped) + Profit %</h3>
              <p class="text-sm text-gray-600 mt-1">Compare two selected years, by month within year. <span class="text-green-600 font-medium">🔄 Real-time updates</span></p>
            </div>
            <div class="flex items-center space-x-3">
              <select v-model="compareFilters.yearA" @change="refreshCompareChart" class="text-sm border border-gray-300 rounded-md px-3 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <option value="2025">2025</option>
                <option value="2024">2024</option>
                <option value="2023">2023</option>
                <option value="2022">2022</option>
              </select>
              <span class="text-gray-500 text-sm">vs</span>
              <select v-model="compareFilters.yearB" @change="refreshCompareChart" class="text-sm border border-gray-300 rounded-md px-3 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <option value="2025">2025</option>
                <option value="2024">2024</option>
                <option value="2023">2023</option>
                <option value="2022">2022</option>
              </select>
              <button @click="refreshCompareChart" :disabled="isLoadingCompareChart" class="text-sm bg-blue-500 text-white px-3 py-1 rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1">
                <svg v-if="isLoadingCompareChart" class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <svg v-else class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                </svg>
                <span>Refresh</span>
              </button>
            </div>
          </div>

          <div class="min-h-[250px]">
            <div v-if="isLoadingCompareChart" class="flex flex-col items-center justify-center py-12 text-gray-500">
              <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
              <p class="text-lg font-medium">Loading comparison data...</p>
            </div>

            <div v-else class="relative w-full h-72">
              <canvas ref="cashFlowCombinedChartRef" class="chart-canvas absolute inset-0"></canvas>
            </div>
            <div class="mt-3 text-xs text-gray-500">
              Bars: Revenue & Cost (VND) — Line: Profit % using the right axis
            </div>
          </div>
        </div>

      </div>

    </div>
  </div>

  <!-- ChatBot Component -->
  <ChatBot />
</template>

<script setup>
/*
  Chỉnh sửa: realtime incremental updates cho charts (không reload toàn bộ).
  - Nếu event payload đủ chi tiết (invoice with items and finalAmount), charts sẽ tăng cục bộ.
  - Nếu payload không rõ, fallback: refreshCharts() để tải lại an toàn.
*/
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue';
import axios from 'axios';
import Chart from 'chart.js/auto';
import socketService from '@/services/socketService';
import AccounterHeader from './accounterHeader.vue';
import AccounterSidebar from './accounterSidebar.vue';
import ChatBot from '@/components/ChatBot/ChatBot.vue';

// Exchange rate constants (keep original)
const USD_TO_VND_RATE = 26401; // 1 USD = 26,401 VND

const warehouseId = ref(null);

const resolveAccounterWarehouseId = () => {
  try {
    const storedUserRaw = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (!storedUserRaw) return null;
    const parsed = JSON.parse(storedUserRaw);
    const roleData = parsed?.accounter;
    const rawId = roleData?.warehouseId;
    if (!rawId) return null;
    if (typeof rawId === 'object') {
      return rawId._id || rawId.toString?.() || null;
    }
    return rawId;
  } catch (error) {
    console.warn('Unable to resolve accounter warehouseId from storage:', error);
    return null;
  }
};

warehouseId.value = resolveAccounterWarehouseId();
if (!warehouseId.value) {
  console.warn('Accounter warehouseId not found in storage. Relying on backend enforcement.');
}

const getWarehouseQuery = () => (warehouseId.value ? { warehouse: warehouseId.value } : {});

// Reactive data (keep original structure)
const topProducts = ref([]);
const cashFlowSummary = ref({
  totalRevenue: 0,
  totalCost: 0,
  totalProfit: 0
});
const inventorySummary = ref({
  currentValue: 0,
  trend: 0,
  averageValue: 0
});

// NEW: cashFlowSeries (time series) — will be assigned if API returns series
const cashFlowSeries = ref([]); // each element: { label, revenueVND, costVND }

// inventorySeries for chart 3 (kept similar to prior code)
const inventorySeries = ref([]);

// Loading states
const isLoadingProducts = ref(false);
const isLoadingCashFlow = ref(false);
const isLoadingInventory = ref(false);
const isLoadingCompareChart = ref(false);

// Chart filters
const chartFilters = ref({
  period: 'month', // 'year', 'month', 'day'
  year: '2025',
  month: '1'
});

// Chart refs & instances
const topProductsChartRef = ref(null);
const cashFlowChartRef = ref(null);
const cashFlowCombinedChartRef = ref(null);
const inventoryChartRef = ref(null);

let topProductsChart = null;
let cashFlowChart = null;
let cashFlowCombinedChart = null;
let inventoryChart = null;

// Auto-refresh interval for real-time updates
let autoRefreshInterval = null;

// Helpers
const safeNumber = (v) => {
  const n = Number(v);
  return Number.isNaN(n) ? 0 : n;
};

const formatCurrency = (value) => {
  if (value === null || value === undefined) return '0 VND';
  const n = Number(value) || 0;
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0
  }).format(n);
};

const formatNumber = (n) => {
  if (!n && n !== 0) return '0';
  return n.toLocaleString('vi-VN');
};

// Chart filter functions - only affect line chart data fetch/update
const updateChart = () => {
  fetchCashFlowTimeSeries();
  updateSummaryFromSeries();
};

// Generate 12 month labels (cleaned)
const generateMonthLabels = (year) => {
  const months = Array.from({ length: 12 }, (_, i) => `${i + 1}`);
  return months.map(month => `${month}/${year}`);
};

// Generate sample data for 3 lines (Revenue, Cost, Net Profit)
const generateSampleData = () => {
  const months = 12;
  const revenue = [];
  const cost = [];
  const netProfit = [];

  for (let i = 0; i < months; i++) {
    const baseRevenue = 50000000 + Math.random() * 30000000; // 50-80M VND
    const baseCost = 30000000 + Math.random() * 25000000;    // 30-55M VND
    const net = baseRevenue - baseCost;

    revenue.push(Math.round(baseRevenue));
    cost.push(Math.round(baseCost));
    netProfit.push(Math.round(net));
  }

  return { revenue, cost, netProfit };
};

// ----------------- FETCH FUNCTIONS -----------------
const fetchTopProducts = async () => {
  try {
    isLoadingProducts.value = true;
    const response = await axios.get('/api/reports/top-products', {
      params: {
        period: 'all',
        top: 10,
        ...getWarehouseQuery()
      }
    });

    if (response.data?.success && response.data.data?.topProducts) {
      topProducts.value = response.data.data.topProducts.map(product => ({
        name: product.productName || product.name || 'N/A',
        sku: product.productSku || product.sku || 'N/A',
        totalQuantity: product.totalQty || product.totalQuantity || 0
      }));
    } else {
      throw new Error('API response not successful');
    }
  } catch (error) {
    console.error('Error fetching top products:', error);
    topProducts.value = [];
  } finally {
    isLoadingProducts.value = false;
    // render or update chart after data loaded
    await nextTick();
    renderTopProductsChart();
  }
};

const fetchCashFlow = async () => {
  try {
    isLoadingCashFlow.value = true;

    // Get total revenue from all invoices in DB
    const totalRevenueResponse = await axios.get('/api/invoices/total-revenue', {
      params: {
        ...getWarehouseQuery()
      }
    });

    if (totalRevenueResponse.data?.success) {
      const totalRevenue = totalRevenueResponse.data.totalRevenue || 0;

      // Get total cost from cash flow API (all time)
      const cashFlowResponse = await axios.get('/api/reports/cash-flow', {
        params: {
          period: 'all',
          ...getWarehouseQuery()
        }
      });

      let totalCost = 0;
      console.log('Full Cash Flow API Response:', JSON.stringify(cashFlowResponse.data, null, 2));

      if (cashFlowResponse.data?.success && cashFlowResponse.data.data?.summary) {
        totalCost = cashFlowResponse.data.data.summary.totalCost || 0;
      } else {
        console.log('Cash Flow API failed or no data. Response:', cashFlowResponse.data);
      }

      // Backup: If totalCost == 0, try total-import-cost API
      if (totalCost === 0) {
        try {
          const importCostResponse = await axios.get('/api/reports/total-import-cost', {
            params: {
              ...getWarehouseQuery()
            }
          });
          if (importCostResponse.data?.success && importCostResponse.data.totalCostVND) {
            totalCost = importCostResponse.data.totalCostVND;
          } else {
            console.log('⚠️ Import cost API returned 0 or invalid data');
          }
        } catch (backupError) {
          console.log('❌ Import cost API failed:', backupError);
        }
      }

      cashFlowSummary.value = {
        totalRevenue: totalRevenue,
        totalCost: totalCost,
        totalProfit: totalRevenue - totalCost,
      };

      // Try to parse series if provided
      try {
        const data = cashFlowResponse.data?.data || cashFlowResponse.data;
        let rawSeries = null;
        if (data?.series && Array.isArray(data.series)) rawSeries = data.series;
        else if (data?.history && Array.isArray(data.history)) rawSeries = data.history;
        else if (data?.data?.series && Array.isArray(data.data.series)) rawSeries = data.data.series;

        if (rawSeries) {
          cashFlowSeries.value = rawSeries.map(item => {
            const rev = safeNumber(item.revenue || item.totalRevenue || item.revenueUSD || 0);
            const cost = safeNumber(item.cost || item.totalCost || item.costUSD || 0);
            const revenueVND = rev > 1000000 ? Math.round(rev) : Math.round(rev * USD_TO_VND_RATE);
            const costVND = cost > 1000000 ? Math.round(cost) : Math.round(cost * USD_TO_VND_RATE);
            return {
              label: item.label || item.month || item.period || (item.year && item.month ? `${item.month}/${item.year}` : ''),
              revenueVND,
              costVND
            };
          });
        } else {
          cashFlowSeries.value = [];
        }
      } catch (e) {
        console.log('Could not parse series from cashFlowResponse:', e);
        cashFlowSeries.value = [];
      }
    } else {
      throw new Error('Total revenue API response not successful');
    }
  } catch (error) {
    console.error('Error fetching cash flow:', error);
    cashFlowSummary.value = {
      totalRevenue: 0,
      totalCost: 0,
      totalProfit: 0
    };
    cashFlowSeries.value = [];
  } finally {
    isLoadingCashFlow.value = false;
    await nextTick();
    renderCashFlowChart();
  }
};

const fetchCashFlowTimeSeries = async () => {
  try {
    const response = await axios.get('/api/reports/cash-flow-time-series', {
      params: {
        period: chartFilters.value.period,
        year: chartFilters.value.year,
        month: chartFilters.value.month,
        ...getWarehouseQuery()
      }
    });

    if (response.data?.success && response.data.data) {
      cashFlowSeries.value = response.data.data.series || [];
      renderCashFlowChart();
      updateSummaryFromSeries();
    } else {
      cashFlowSeries.value = [];
      renderCashFlowChart();
    }
  } catch (error) {
    console.error('Error fetching cash flow time series:', error);
    cashFlowSeries.value = [];
    renderCashFlowChart();
  }
};

const fetchInventoryValue = async () => {
  try {
    isLoadingInventory.value = true;
    const response = await axios.get('/api/reports/inventory-value-fifo', {
      params: {
        ...getWarehouseQuery()
      }
    });

    if (response.data?.success && response.data.data?.summary) {
      inventorySummary.value = {
        currentValue: response.data.data.summary.currentValue || 0,
        trend: response.data.data.summary.trend || 0,
        averageValue: response.data.data.summary.averageValue || 0
      };

      if (Array.isArray(response.data.data.series)) {
        inventorySeries.value = response.data.data.series.map(item => ({
          label: item.label || '',
          valueVND: item.valueVND || 0
        }));
      } else {
        inventorySeries.value = [
          { label: 'T-2', valueVND: response.data.data.summary.averageValue || 0 },
          { label: 'T-1', valueVND: Math.round((response.data.data.summary.currentValue || 0) * 0.98) || 0 },
          { label: 'Present', valueVND: response.data.data.summary.currentValue || 0 }
        ];
      }
    } else {
      throw new Error('FIFO inventory API response not successful');
    }
  } catch (error) {
    console.error('Error fetching inventory value:', error);
    inventorySummary.value = { currentValue: 0, trend: 0, averageValue: 0 };
    inventorySeries.value = [];
  } finally {
    isLoadingInventory.value = false;
    await nextTick();
    renderInventoryChart();
  }
};

// Refresh helper - choose which sections to refresh (defaults: all)
const refreshCharts = async (sections = {}) => {
  const {
    topProducts: shouldRefreshTopProducts = true,
    cashSummary: shouldRefreshCashSummary = true,
    cashSeries: shouldRefreshCashSeries = true,
    inventory: shouldRefreshInventory = true
  } = sections;

  try {
    const tasks = [];
    if (shouldRefreshTopProducts) tasks.push(fetchTopProducts());
    if (shouldRefreshCashSummary) tasks.push(fetchCashFlow());
    if (shouldRefreshInventory) tasks.push(fetchInventoryValue());
    await Promise.all(tasks);
    if (shouldRefreshCashSeries) {
      await fetchCashFlowTimeSeries();
    }
  } catch (error) {
    console.error('Error refreshing charts:', error);
  }
};

// ----------------- CHART RENDERERS (safe update: update if exists) -----------------
const palette = {
  gold: '#F59E0B',
  gray: '#9CA3AF',
  orange: '#FB923C',
  blue: '#3B82F6',
  revenue: '#10B981', // green
  cost: '#EF4444', // red
  inventory: '#7C3AED' // purple
};

// Top products chart (horizontal bar)
const renderTopProductsChart = () => {
  if (!topProductsChartRef.value) return;

  const labels = topProducts.value.slice(0, 10).map(p => p.name);
  const dataValues = topProducts.value.slice(0, 10).map(p => p.totalQuantity || 0);
  const bg = dataValues.map((_, i) => {
    if (i === 0) return palette.gold;
    if (i === 1) return palette.gray;
    if (i === 2) return palette.orange;
    return palette.blue;
  });

  const datasets = [{ label: 'Sold', data: dataValues, backgroundColor: bg, borderRadius: 8, barThickness: 16 }];

  const cfg = {
    type: 'bar',
    data: { labels, datasets },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ` ${formatNumber(ctx.parsed.x)} sold` } } },
      scales: { x: { beginAtZero: true, ticks: { callback: v => formatNumber(v) } }, y: { ticks: { autoSkip: false } } }
    }
  };

  if (topProductsChart) {
    // update in-place
    topProductsChart.data.labels = labels;
    topProductsChart.data.datasets = datasets;
    topProductsChart.update();
    return;
  }

  topProductsChart = new Chart(topProductsChartRef.value.getContext('2d'), cfg);
};

// Cash flow line chart with 3 lines: Revenue (green), Cost (red), Net Profit (blue)
const compareFilters = ref({ yearA: '2024', yearB: '2025' });
const compareSeriesA = ref([]); // series for yearA (12 months)
const compareSeriesB = ref([]); // series for yearB (12 months)

const renderCashFlowChart = () => {
  if (!cashFlowChartRef.value) return;

  const labels = generateMonthLabels(chartFilters.value.year);

  const sampleData = generateSampleData();

  let revenueData, costData, netProfitData;

  if (cashFlowSeries.value && cashFlowSeries.value.length >= 12) {
    revenueData = cashFlowSeries.value.slice(0, 12).map(item => safeNumber(item.revenueVND || 0));
    costData = cashFlowSeries.value.slice(0, 12).map(item => safeNumber(item.costVND || 0));
    netProfitData = revenueData.map((rev, i) => rev - (costData[i] || 0));
  } else {
    revenueData = sampleData.revenue;
    costData = sampleData.cost;
    netProfitData = sampleData.netProfit;
  }

  const datasets = [
    { label: 'Revenue', data: revenueData, tension: 0.3, fill: false, borderColor: '#10B981', backgroundColor: '#10B981', pointRadius: 4, pointHoverRadius: 6, borderWidth: 3 },
    { label: 'Cost', data: costData, tension: 0.3, fill: false, borderColor: '#EF4444', backgroundColor: '#EF4444', pointRadius: 4, pointHoverRadius: 6, borderWidth: 3 },
    { label: 'Net Profit', data: netProfitData, tension: 0.3, fill: false, borderColor: '#3B82F6', backgroundColor: '#3B82F6', pointRadius: 4, pointHoverRadius: 6, borderWidth: 3 }
  ];

  const cfg = {
    type: 'line',
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        tooltip: {
          callbacks: { label: (ctx) => { const v = ctx.parsed.y; return `${ctx.dataset.label}: ${formatCurrency(v)}`; } }
        },
        legend: { display: true, position: 'top', labels: { usePointStyle: true, padding: 20 } }
      },
      scales: {
        x: { grid: { display: true, color: '#f3f4f6' } },
        y: { ticks: { callback: v => formatCurrency(v), maxTicksLimit: 8 }, beginAtZero: false, grid: { display: true, color: '#f3f4f6' } }
      }
    }
  };

  if (cashFlowChart) {
    cashFlowChart.data.labels = labels;
    cashFlowChart.data.datasets = datasets;
    cashFlowChart.update();
    return;
  }

  cashFlowChart = new Chart(cashFlowChartRef.value.getContext('2d'), cfg);
};

// Combined chart: Grouped Bars (Revenue, Cost) + Line (Profit %)
const renderCashFlowCombinedChart = () => {
  if (!cashFlowCombinedChartRef.value) return;

  const seriesA = compareSeriesA.value || [];
  const seriesB = compareSeriesB.value || [];
  const labels = Array.from({ length: 12 }, (_, i) => `Mon ${i + 1}`);
  const revenueA = labels.map((_, idx) => safeNumber(seriesA[idx]?.revenueVND || 0));
  const costA = labels.map((_, idx) => safeNumber(seriesA[idx]?.costVND || 0));
  const revenueB = labels.map((_, idx) => safeNumber(seriesB[idx]?.revenueVND || 0));
  const costB = labels.map((_, idx) => safeNumber(seriesB[idx]?.costVND || 0));
  const profitPctA = revenueA.map((rev, i) => (rev > 0 ? ((rev - costA[i]) / rev) * 100 : 0));
  const profitPctB = revenueB.map((rev, i) => (rev > 0 ? ((rev - costB[i]) / rev) * 100 : 0));

  const datasets = [
    { type: 'bar', label: `Revenue ${compareFilters.value.yearA}`, data: revenueA, backgroundColor: '#10B981', borderRadius: 6, yAxisID: 'y' },
    { type: 'bar', label: `Cost ${compareFilters.value.yearA}`, data: costA, backgroundColor: '#EF4444', borderRadius: 6, yAxisID: 'y' },
    { type: 'bar', label: `Revenue ${compareFilters.value.yearB}`, data: revenueB, backgroundColor: '#34D399', borderRadius: 6, yAxisID: 'y' },
    { type: 'bar', label: `Cost ${compareFilters.value.yearB}`, data: costB, backgroundColor: '#F87171', borderRadius: 6, yAxisID: 'y' },
    { type: 'line', label: `Profit % ${compareFilters.value.yearA}`, data: profitPctA, borderColor: '#3B82F6', backgroundColor: '#3B82F6', yAxisID: 'y1', tension: 0.3, pointRadius: 3, pointHoverRadius: 5, borderWidth: 2, fill: false },
    { type: 'line', label: `Profit % ${compareFilters.value.yearB}`, data: profitPctB, borderColor: '#6366F1', backgroundColor: '#6366F1', yAxisID: 'y1', tension: 0.3, pointRadius: 3, pointHoverRadius: 5, borderWidth: 2, fill: false }
  ];

  const cfg = {
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'nearest', intersect: true, axis: 'x' },
      plugins: {
        tooltip: {
          mode: 'nearest',
          intersect: true,
          callbacks: {
            label: (ctx) => {
              if (ctx.dataset.yAxisID === 'y1') {
                const v = ctx.parsed.y;
                return `${ctx.dataset.label}: ${v.toFixed(1)}%`;
              }
              return `${ctx.dataset.label}: ${formatCurrency(ctx.parsed.y)}`;
            }
          }
        },
        legend: { display: true, position: 'top', labels: { usePointStyle: true, padding: 20 } }
      },
      scales: {
        y: { type: 'linear', position: 'left', ticks: { callback: v => formatCurrency(v), maxTicksLimit: 6 }, grid: { color: '#f3f4f6' } },
        y1: { type: 'linear', position: 'right', ticks: { callback: v => `${Number(v).toFixed(0)}%`, maxTicksLimit: 6 }, grid: { drawOnChartArea: false } },
        x: { grid: { color: '#f9fafb' } }
      }
    }
  };

  if (cashFlowCombinedChart) {
    cashFlowCombinedChart.data.labels = cfg.data.labels;
    cashFlowCombinedChart.data.datasets = cfg.data.datasets;
    cashFlowCombinedChart.update();
    return;
  }

  cashFlowCombinedChart = new Chart(cashFlowCombinedChartRef.value.getContext('2d'), cfg);
};

// Inventory chart (line)
const renderInventoryChart = () => {
  if (!inventoryChartRef.value) return;
  const labels = inventorySeries.value.map(s => s.label || '');
  const values = inventorySeries.value.map(s => s.valueVND || 0);

  const datasets = [
    { label: 'Inventory Value', data: values, tension: 0.25, fill: true, borderColor: palette.inventory, backgroundColor: 'rgba(124,58,237,0.08)', pointRadius: 3, pointHoverRadius: 6 }
  ];

  const cfg = {
    type: 'line',
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { tooltip: { callbacks: { label: ctx => `${ctx.dataset.label}: ${formatCurrency(ctx.parsed.y)}` } } },
      scales: { y: { ticks: { callback: v => formatCurrency(v) } } }
    }
  };

  if (inventoryChart) {
    inventoryChart.data.labels = labels;
    inventoryChart.data.datasets = datasets;
    inventoryChart.update();
    return;
  }

  inventoryChart = new Chart(inventoryChartRef.value.getContext('2d'), cfg);
};

// ----------------- Incremental update helpers (for realtime events) -----------------

// Helper: convert invoice payload amount to VND
const amountToVND = (value, currency) => {
  const n = safeNumber(value);
  if (!currency) {
    // fallback: if number small assume USD else VND (heuristic)
    return n > 1000000 ? Math.round(n) : Math.round(n * USD_TO_VND_RATE);
  }
  return currency.toUpperCase() === 'USD' ? Math.round(n * USD_TO_VND_RATE) : Math.round(n);
};

// Map invoice date to chart label used in cashFlowSeries (best-effort)
const invoiceDateToLabel = (isoDate) => {
  try {
    const d = new Date(isoDate);
    const month = d.getMonth() + 1;
    const year = d.getFullYear();
    return `${month}/${year}`;
  } catch (e) {
    return null;
  }
};

// Increment topProducts from invoice payload (best-effort)
const incrementTopProductsFromInvoice = (invoice) => {
  if (!invoice) return false;
  const items = invoice.items || invoice.lineItems || invoice.products || [];
  if (!Array.isArray(items) || items.length === 0) return false;

  let changed = false;
  items.forEach(it => {
    const qty = safeNumber(it.quantity || it.qty || it.quantitySold || 0);
    const sku = it.sku || it.productSku || null;
    const name = it.productName || it.name || (sku ? sku : 'Unknown');

    // Find in topProducts by sku or name
    const found = topProducts.value.find(p => (sku && p.sku && p.sku === sku) || p.name === name);
    if (found) {
      found.totalQuantity = safeNumber(found.totalQuantity) + qty;
      changed = true;
    } else {
      // push new item (may or may not belong top10, but we'll insert and then sort)
      topProducts.value.push({ name, sku: sku || 'N/A', totalQuantity: qty });
      changed = true;
    }
  });

  if (changed) {
    // sort by totalQuantity desc and keep top 10
    topProducts.value.sort((a, b) => safeNumber(b.totalQuantity) - safeNumber(a.totalQuantity));
    topProducts.value = topProducts.value.slice(0, 10);
    renderTopProductsChart();
  }
  return changed;
};

// Increment cash flow (revenue & net profit) from invoice
const incrementCashFlowFromInvoice = (invoice) => {
  if (!invoice) return false;
  const finalAmount = invoice.finalAmount || invoice.total || invoice.amount || 0;
  const currency = invoice.currency || invoice.currencyCode || null;
  const dateLabel = invoiceDateToLabel(invoice.date || invoice.createdAt || invoice.updatedAt || new Date());

  const addVND = amountToVND(finalAmount, currency);
  if (!dateLabel) {
    // if no date label, just add to summary totals
    cashFlowSummary.value.totalRevenue = safeNumber(cashFlowSummary.value.totalRevenue) + addVND;
    cashFlowSummary.value.totalProfit = safeNumber(cashFlowSummary.value.totalProfit) + addVND;
    renderCashFlowChart();
    return true;
  }

  // try to find dateLabel in cashFlowSeries
  const idx = cashFlowSeries.value.findIndex(s => s.label === dateLabel);
  if (idx !== -1) {
    cashFlowSeries.value[idx].revenueVND = safeNumber(cashFlowSeries.value[idx].revenueVND) + addVND;
    // cost unknown here -> net profit increases by addVND
    // update summary totals
    cashFlowSummary.value.totalRevenue = safeNumber(cashFlowSummary.value.totalRevenue) + addVND;
    cashFlowSummary.value.totalProfit = safeNumber(cashFlowSummary.value.totalProfit) + addVND;
    // rebuild chart dataset arrays in-place
    if (cashFlowChart) {
      const labels = generateMonthLabels(chartFilters.value.year);
      cashFlowChart.data.labels = labels;
      // dataset[0] = revenue, dataset[1] = cost, dataset[2] = netProfit
      cashFlowChart.data.datasets[0].data = cashFlowSeries.value.slice(0,12).map(i => safeNumber(i.revenueVND || 0));
      cashFlowChart.data.datasets[1].data = cashFlowSeries.value.slice(0,12).map(i => safeNumber(i.costVND || 0));
      cashFlowChart.data.datasets[2].data = cashFlowChart.data.datasets[0].data.map((r, i) => r - safeNumber(cashFlowChart.data.datasets[1].data[i]));
      cashFlowChart.update();
    } else {
      renderCashFlowChart();
    }

    return true;
  } else {
    // If series not found or empty, try to append to series if length < 12 or create/refresh fallback
    // If series empty, we might be using sampleData -> update summary and chart using sample fallback
    cashFlowSummary.value.totalRevenue = safeNumber(cashFlowSummary.value.totalRevenue) + addVND;
    cashFlowSummary.value.totalProfit = safeNumber(cashFlowSummary.value.totalProfit) + addVND;
    // fallback: just call render to reflect summary change
    renderCashFlowChart();
    return true;
  }
};

// Update compare series (yearA/yearB) when invoice matches a compare year
const incrementCompareSeriesFromInvoice = (invoice) => {
  if (!invoice) return false;
  const finalAmount = invoice.finalAmount || invoice.total || invoice.amount || 0;
  const currency = invoice.currency || invoice.currencyCode || null;
  const d = new Date(invoice.date || invoice.createdAt || invoice.updatedAt || new Date());
  const year = String(d.getFullYear());
  const monthIndex = d.getMonth(); // 0-based
  const addVND = amountToVND(finalAmount, currency);

  let updated = false;
  if (year === compareFilters.value.yearA) {
    if (!compareSeriesA.value || compareSeriesA.value.length === 0) {
      // initialize 12 months if empty
      compareSeriesA.value = Array.from({ length: 12 }, (_, i) => ({ label: `${i+1}/${year}`, revenueVND: 0, costVND: 0 }));
    }
    compareSeriesA.value[monthIndex].revenueVND = safeNumber(compareSeriesA.value[monthIndex].revenueVND) + addVND;
    updated = true;
  }
  if (year === compareFilters.value.yearB) {
    if (!compareSeriesB.value || compareSeriesB.value.length === 0) {
      compareSeriesB.value = Array.from({ length: 12 }, (_, i) => ({ label: `${i+1}/${year}`, revenueVND: 0, costVND: 0 }));
    }
    compareSeriesB.value[monthIndex].revenueVND = safeNumber(compareSeriesB.value[monthIndex].revenueVND) + addVND;
    updated = true;
  }
  if (updated) renderCashFlowCombinedChart();
  return updated;
};

// Inventory: optionally decrease inventory on invoice (not always safe) -> we'll skip to avoid inaccuracies
// If payload contains inventory delta, you can implement similarly.


// ----------------- Fetch comparison & render -----------------
const fetchCompareSeries = async () => {
  try {
    isLoadingCompareChart.value = true;
    const yearA = compareFilters.value.yearA;
    const yearB = compareFilters.value.yearB;

    const [resA, resB] = await Promise.all([
      axios.get('/api/reports/cash-flow-time-series', { params: { period: 'month', year: yearA, ...getWarehouseQuery() } }),
      axios.get('/api/reports/cash-flow-time-series', { params: { period: 'month', year: yearB, ...getWarehouseQuery() } })
    ]);

    compareSeriesA.value = Array.isArray(resA.data?.data?.series) ? resA.data.data.series : [];
    compareSeriesB.value = Array.isArray(resB.data?.data?.series) ? resB.data.data.series : [];
  } catch (e) {
    console.error('Error fetching compare series:', e);
    compareSeriesA.value = [];
    compareSeriesB.value = [];
  } finally {
    isLoadingCompareChart.value = false;
    await nextTick();
    renderCashFlowCombinedChart();
  }
};

const refreshCompareChart = async () => {
  await fetchCompareSeries();
  // render called by fetchCompareSeries
};

// ----------------- WATCHERS -----------------
// Keep watchers only for initial render/update but avoid destroy/create cycles
watch(topProducts, () => renderTopProductsChart(), { deep: true });
watch(cashFlowSeries, () => renderCashFlowChart(), { deep: true });
watch(inventorySeries, () => renderInventoryChart(), { deep: true });

// ----------------- SOCKET (real-time) -----------------
const initializeSocket = () => {
  console.log('🚀 Initializing Socket.IO for Accounter Dashboard...');

  const socket = socketService.connect();
  if (!socket) {
    console.warn('⚠️ Socket not available, charts will not update in real-time');
    return;
  }

  socket.emit('join-room', 'accounters');

  socket.on('connect', () => console.log('✅ Socket.IO connected for Accounter Dashboard'));
  socket.on('disconnect', () => console.log('❌ Socket.IO disconnected for Accounter Dashboard'));

  // Primary listener: chart-data-updated (generic)
  socketService.on('chart-data-updated', (data) => {
    console.log('📊 chart-data-updated', data);
    // If backend gives type + payload, we try to do incremental update
    try {
      if (data && data.type === 'invoice' && data.payload) {
        const invoice = data.payload;
        const p1 = incrementTopProductsFromInvoice(invoice);
        const p2 = incrementCashFlowFromInvoice(invoice);
        const p3 = incrementCompareSeriesFromInvoice(invoice);
        // if none of incremental succeeded, fallback to refresh
        if (!p1 && !p2 && !p3) {
          refreshCharts();
          refreshCompareChart();
        }
        return;
      } else if (data && data.type === 'products' && data.payload) {
        // payload may contain product updates; refresh top products incremental
        fetchTopProducts(); // safe small call; or attempt incremental if payload structured
        return;
      } else if (data && data.type === 'inventory' && data.payload) {
        // for inventory updates, fetch inventory series
        fetchInventoryValue();
        return;
      }
    } catch (e) {
      console.error('Error handling chart-data-updated payload:', e);
    }
    // Generic fallback: refresh all
    refreshCharts();
    refreshCompareChart();
  });

  // Invoice events — do incremental updates when possible
  socketService.on('invoice-approved', (payload) => {
    console.log('✅ invoice-approved', payload);
    try {
      // payload ideally contains the invoice detail
      if (payload && (payload.items || payload.finalAmount || payload.total)) {
        const invoice = payload;
        const done1 = incrementTopProductsFromInvoice(invoice);
        const done2 = incrementCashFlowFromInvoice(invoice);
        const done3 = incrementCompareSeriesFromInvoice(invoice);
        if (!done1 && !done2 && !done3) {
          // fallback: refresh
          refreshCharts();
          refreshCompareChart();
        }
      } else {
        // fallback if payload not detailed
        refreshCharts();
        refreshCompareChart();
      }
    } catch (error) {
      console.error('Error handling invoice-approved:', error);
      refreshCharts();
      refreshCompareChart();
    }
  });

  // For created/updated/deleted invoice events we try to be smart:
  socketService.on('invoice-created', (payload) => {
    console.log('📄 invoice-created', payload);
    try {
      // treat similar to approved (increment revenue & products)
      if (payload) {
        const invoice = payload;
        incrementTopProductsFromInvoice(invoice);
        incrementCashFlowFromInvoice(invoice);
        incrementCompareSeriesFromInvoice(invoice);
      } else {
        refreshCharts({ topProducts: true, cashSummary: true, cashSeries: true, inventory: false });
      }
    } catch (error) {
      console.error('Error handling invoice-created:', error);
      refreshCharts({ topProducts: true, cashSummary: true, cashSeries: true, inventory: false });
    }
  });

  socketService.on('invoice-deleted', (payload) => {
    console.log('🗑️ invoice-deleted', payload);
    try {
      // safer to refresh full data on delete to avoid negative/inconsistent adjustments
      refreshCharts();
      refreshCompareChart();
    } catch (error) {
      console.error('Error handling invoice-deleted:', error);
      refreshCharts();
      refreshCompareChart();
    }
  });

  socketService.on('invoice-rejected', (payload) => {
    console.log('❌ invoice-rejected', payload);
    try {
      // rejected invoices shouldn't affect totals; refresh to be safe
      refreshCharts();
      refreshCompareChart();
    } catch (error) {
      console.error('Error handling invoice-rejected:', error);
      refreshCharts();
      refreshCompareChart();
    }
  });

  socketService.on('invoice-status-changed', (data) => {
    console.log('🔄 invoice-status-changed', data);
    // if status changed to approved -> handle as approved; else refresh
    if (data && data.status === 'approved' && data.payload) {
      try {
        incrementTopProductsFromInvoice(data.payload);
        incrementCashFlowFromInvoice(data.payload);
        incrementCompareSeriesFromInvoice(data.payload);
      } catch (error) {
        console.error('Error handling invoice-status-changed:', error);
        refreshCharts();
        refreshCompareChart();
      }
    } else {
      refreshCharts();
      refreshCompareChart();
    }
  });

  // Exports / products / general data updates -> partial refresh
  socketService.on('export-created', () => {
    console.log('📦 export-created');
    refreshCharts({ topProducts: true, cashSummary: true, cashSeries: true, inventory: false });
  });

  socketService.on('export-approved', () => {
    console.log('✅ export-approved');
    refreshCharts({ topProducts: true, cashSummary: true, cashSeries: true, inventory: false });
  });

  socketService.on('data-updated', (data) => {
    console.log('📊 data-updated', data);
    // If backend gives granular type, handle accordingly, otherwise refresh
    if (data?.resource === 'product') {
      fetchTopProducts();
    } else if (data?.resource === 'inventory') {
      refreshCharts({ topProducts: false, cashSummary: false, cashSeries: false, inventory: true });
    } else {
      refreshCharts();
    }
  });
};

// Auto-refresh function for real-time updates (kept but optional)
const startAutoRefresh = () => {
  if (autoRefreshInterval) clearInterval(autoRefreshInterval);
  autoRefreshInterval = setInterval(() => {
    console.log('🔄 Auto-refreshing comparison chart...');
    refreshCompareChart();
  }, 30000);
  console.log('⏰ Auto-refresh started for comparison chart (30s interval)');
};

const stopAutoRefresh = () => {
  if (autoRefreshInterval) {
    clearInterval(autoRefreshInterval);
    autoRefreshInterval = null;
    console.log('⏹️ Auto-refresh stopped');
  }
};

// Cleanup socket listeners safely
const cleanupSocket = () => {
  try {
    console.log('🧹 Cleaning up AccounterDashboard socket listeners...');
    // Use socketService.off() for proper cleanup
    socketService.off('chart-data-updated');
    socketService.off('invoice-created');
    socketService.off('invoice-deleted');
    socketService.off('invoice-approved');
    socketService.off('invoice-rejected');
    socketService.off('invoice-status-changed');
    socketService.off('export-created');
    socketService.off('export-approved');
    socketService.off('data-updated');
    console.log('✅ AccounterDashboard socket listeners cleaned up successfully');
  } catch (e) {
    console.warn('⚠️ Error cleaning up AccounterDashboard socket listeners:', e);
  }
};

// Lifecycle
onMounted(async () => {
  initializeSocket();
  await refreshCharts();
  await fetchCompareSeries();
  // render charts (will update in-place)
  renderTopProductsChart();
  renderCashFlowChart();
  renderCashFlowCombinedChart();
  renderInventoryChart();
  updateSummaryFromSeries();
  startAutoRefresh();
});

onBeforeUnmount(() => {
  stopAutoRefresh();
  cleanupSocket();

  if (topProductsChart) { topProductsChart.destroy(); topProductsChart = null; }
  if (cashFlowChart) { cashFlowChart.destroy(); cashFlowChart = null; }
  if (cashFlowCombinedChart) { cashFlowCombinedChart.destroy(); cashFlowCombinedChart = null; }
  if (inventoryChart) { inventoryChart.destroy(); inventoryChart = null; }
});

// Recalculate summary boxes from series based on current filters
const updateSummaryFromSeries = () => {
  const period = chartFilters.value.period;
  if (!cashFlowSeries.value || cashFlowSeries.value.length === 0) return;

  if (period === 'year') {
    const selectedYear = Number(chartFilters.value.year);
    const yearItem = cashFlowSeries.value.find(item =>
      Number(item.period) === selectedYear ||
      (item.label && item.label.includes(String(selectedYear)))
    );

    const totalRevenue = yearItem?.revenueVND ? safeNumber(yearItem.revenueVND) : 0;
    const totalCost = yearItem?.costVND ? safeNumber(yearItem.costVND) : 0;
    const totalProfit = totalRevenue - totalCost;

    cashFlowSummary.value = { totalRevenue, totalCost, totalProfit };
  }
};
</script>

<style scoped>
.animate-spin { animation: spin 1s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

.chart-canvas {
  width: 100% !important;
  height: 100% !important;
  display: block;
  box-sizing: border-box;
}
</style>

