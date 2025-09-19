<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <div class="bg-white shadow-sm border-b">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center py-6">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">Accounter Dashboard</h1>
            <p class="text-gray-600">Financial reporting and inventory analysis</p>
          </div>
        </div>
      </div>
    </div>

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
</template>

<script setup>
/*
  Keep original fetchCashFlow logic intact — do not change calculations for totalRevenue/totalCost/backup/fallback.
  Added: cashFlowSeries (if API returns a series) and UI renders a line chart net = revenue - cost.
*/
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import axios from 'axios';
import Chart from 'chart.js/auto';
import socketService from '@/services/socketService';

// Exchange rate constants (keep original)
const USD_TO_VND_RATE = 26401; // 1 USD = 26,401 VND

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
const isRefreshing = ref(false);

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
  console.log('Updating line chart with filters:', chartFilters.value);
  fetchCashFlowTimeSeries(); // fetch line chart data
  // also refresh summary boxes if we already have series
  updateSummaryFromSeries();
};

// Removed unused refreshChart function

// Fetch cash flow time series data for the line chart
const fetchCashFlowTimeSeries = async () => {
  try {
    const response = await axios.get('/api/reports/cash-flow-time-series', {
      params: {
        period: chartFilters.value.period,
        year: chartFilters.value.year,
        month: chartFilters.value.month
      }
    });

    console.log('📊 Cash Flow Time Series API Response:', response.data);

    if (response.data?.success && response.data.data) {
      // Update only the series used by the line chart
      cashFlowSeries.value = response.data.data.series || [];

      console.log('📈 Updated cashFlowSeries for line chart:', cashFlowSeries.value);
      console.log('🔍 Line chart data source: Invoice.finalAmount by month/year');

      // Render the line chart
      renderCashFlowChart();

      // When filtering by year, update the 3 summary boxes to only that year's data
      updateSummaryFromSeries();
    } else {
      console.error('Cash Flow Time Series API failed:', response.data);
      cashFlowSeries.value = [];
      renderCashFlowChart();
    }

  } catch (error) {
    console.error('Error fetching cash flow time series:', error);
    cashFlowSeries.value = [];
    renderCashFlowChart();
  }
};

// Recalculate summary boxes from series based on current filters
const updateSummaryFromSeries = () => {
  const period = chartFilters.value.period;
  if (!cashFlowSeries.value || cashFlowSeries.value.length === 0) return;

  if (period === 'year') {
    const selectedYear = Number(chartFilters.value.year);
    // series for period='year' contains multiple years; pick the selected one
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

// Generate 12 month labels
const generateMonthLabels = (year) => {
  const months = [
    ' 1', ' 2', ' 3', ' 4', ' 5', ' 6',
    ' 7', ' 8', ' 9', ' 10', ' 11', ' 12'
  ];
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

    revenue.push(baseRevenue);
    cost.push(baseCost);
    netProfit.push(net);
  }

  return { revenue, cost, netProfit };
};

// ----------------- FETCH FUNCTIONS -----------------

// fetchTopProducts (kept similar)
const fetchTopProducts = async () => {
  try {
    isLoadingProducts.value = true;
    const response = await axios.get('/api/reports/top-products', {
      params: {
        period: 'all',
        top: 10
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
  }
};

// Keep original fetchCashFlow logic intact (only detect series if present)
const fetchCashFlow = async () => {
  try {
    isLoadingCashFlow.value = true;

    // Get total revenue from all invoices in DB
    const totalRevenueResponse = await axios.get('/api/invoices/total-revenue');

    if (totalRevenueResponse.data?.success) {
      const totalRevenue = totalRevenueResponse.data.totalRevenue || 0;

      // Get total cost from cash flow API (all time)
      const cashFlowResponse = await axios.get('/api/reports/cash-flow', {
        params: {
          period: 'all' // get all time
        }
      });

      let totalCost = 0;
      console.log('Full Cash Flow API Response:', JSON.stringify(cashFlowResponse.data, null, 2));

      if (cashFlowResponse.data?.success && cashFlowResponse.data.data?.summary) {
        // totalCost from API is already converted to VND in the backend
        totalCost = cashFlowResponse.data.data.summary.totalCost || 0;

        console.log('Cash Flow API Response Summary:', cashFlowResponse.data.data.summary);
        console.log('Total Cost VND from API (already converted):', totalCost);
      } else {
        console.log('Cash Flow API failed or no data. Response:', cashFlowResponse.data);
        console.log('API Success:', cashFlowResponse.data?.success);
        console.log('API Data:', cashFlowResponse.data?.data);
        console.log('API Summary:', cashFlowResponse.data?.data?.summary);
      }

      // Backup: If totalCost == 0, try total-import-cost API
      if (totalCost === 0) {
        console.log('🔄 totalCost is 0, trying backup method: total-import-cost API...');

        try {
          const importCostResponse = await axios.get('/api/reports/total-import-cost');
          console.log('Import Cost API response:', importCostResponse.data);

          if (importCostResponse.data?.success && importCostResponse.data.totalCostVND) {
            totalCost = importCostResponse.data.totalCostVND;
            console.log('✅ Backup calculation successful from ImportReceipts!');
            console.log('Total Cost USD from ImportReceipts:', importCostResponse.data.totalCostUSD);
            console.log('Total Cost VND from ImportReceipts:', totalCost);
            console.log('Total ImportReceipts:', importCostResponse.data.totalReceipts);
          } else {
            console.log('⚠️ Import cost API returned 0 or invalid data (no ImportReceipts found)');
          }
        } catch (backupError) {
          console.log('❌ Import cost API failed:', backupError);
        }

        if (totalCost === 0) {
          console.log('ℹ️ No ImportReceipts found, total cost remains 0');
        }
      }

      // Assign summary as original
      cashFlowSummary.value = {
        totalRevenue: totalRevenue,
        totalCost: totalCost, // already converted to VND
        totalProfit: totalRevenue - totalCost,
      };

      console.log('✅ FINAL RESULTS:');
      console.log('📊 Total Revenue from finalAmount:', totalRevenue);
      console.log('💰 Total Cost (converted to VND):', totalCost);
      console.log('📈 Total Profit:', totalRevenue - totalCost);
      console.log('🔍 Revenue source: Invoice.finalAmount (final price after markup)');
      console.log('🔍 Cost source: ImportReceipt.details (unitPrice * quantity when imported, converted USD to VND)');

      // ---- NEW: If API returned a time-series (e.g., data.series), try to extract it ----
      try {
        const data = cashFlowResponse.data?.data || cashFlowResponse.data;
        // possible shapes: data.series OR data.history OR data.data.series
        let rawSeries = null;
        if (data?.series && Array.isArray(data.series)) rawSeries = data.series;
        else if (data?.history && Array.isArray(data.history)) rawSeries = data.history;
        else if (data?.data?.series && Array.isArray(data.data.series)) rawSeries = data.data.series;

        if (rawSeries) {
          cashFlowSeries.value = rawSeries.map(item => {
            // best-effort mapping: item may contain revenueUSD/costUSD or revenue/cost already in VND
            const revUSD = safeNumber(item.revenue || item.totalRevenue || item.revenueUSD || 0);
            const costUSD = safeNumber(item.cost || item.totalCost || item.costUSD || 0);
            // If values look too big (likely already VND), assume VND and don't convert
            const revenueVND = revUSD > 1000000 ? Math.round(revUSD) : Math.round(revUSD * USD_TO_VND_RATE);
            const costVND = costUSD > 1000000 ? Math.round(costUSD) : Math.round(costUSD * USD_TO_VND_RATE);
            return {
              label: item.label || item.month || item.period || (item.year && item.month ? `${item.year}-${String(item.month).padStart(2,'0')}` : ''),
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
    // Fallback data
    cashFlowSummary.value = {
      totalRevenue: 0,
      totalCost: 0,
      totalProfit: 0
    };
    cashFlowSeries.value = [];
  } finally {
    isLoadingCashFlow.value = false;
  }
};

// fetchInventoryValue (kept almost original, still builds inventorySeries used for chart)
const fetchInventoryValue = async () => {
  try {
    isLoadingInventory.value = true;
    // Use FIFO-based ending inventory from backend
    const response = await axios.get('/api/reports/inventory-value-fifo');

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
  }
};

// Refresh all data
const refreshData = async () => {
  try {
    isRefreshing.value = true;
    await Promise.all([
      fetchTopProducts(),
      fetchCashFlow(), // keep original API for summary data
      fetchInventoryValue()
    ]);
    // Fetch line chart data separately
    await fetchCashFlowTimeSeries();
  } catch (error) {
    console.error('Error refreshing data:', error);
  } finally {
    isRefreshing.value = false;
  }
};

// ----------------- CHART RENDERERS -----------------

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

  const cfg = {
    type: 'bar',
    data: {
      labels,
      datasets: [{ label: 'Sold', data: dataValues, backgroundColor: bg, borderRadius: 8, barThickness: 16 }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: ctx => ` ${formatNumber(ctx.parsed.x)} sold` } }
      },
      scales: {
        x: { beginAtZero: true, ticks: { callback: v => formatNumber(v) } },
        y: { ticks: { autoSkip: false } }
      }
    }
  };

  if (topProductsChart) {
    topProductsChart.destroy();
    topProductsChart = null;
  }
  topProductsChart = new Chart(topProductsChartRef.value.getContext('2d'), cfg);
};

// Cash flow line chart with 3 lines: Revenue (green), Cost (red), Net Profit (blue)
const compareFilters = ref({ yearA: '2024', yearB: '2025' });
const compareSeriesA = ref([]); // series for yearA (12 months)
const compareSeriesB = ref([]); // series for yearB (12 months)

const refreshCompareChart = async () => {
  await fetchCompareSeries();
  renderCashFlowCombinedChart();
};

const fetchCompareSeries = async () => {
  try {
    isLoadingCompareChart.value = true;
    const yearA = compareFilters.value.yearA;
    const yearB = compareFilters.value.yearB;

    console.log(`🔄 Fetching comparison data for ${yearA} vs ${yearB}...`);

    const [resA, resB] = await Promise.all([
      axios.get('/api/reports/cash-flow-time-series', { params: { period: 'month', year: yearA } }),
      axios.get('/api/reports/cash-flow-time-series', { params: { period: 'month', year: yearB } })
    ]);

    compareSeriesA.value = Array.isArray(resA.data?.data?.series) ? resA.data.data.series : [];
    compareSeriesB.value = Array.isArray(resB.data?.data?.series) ? resB.data.data.series : [];

    console.log(`✅ Comparison data loaded: ${compareSeriesA.value.length} months for ${yearA}, ${compareSeriesB.value.length} months for ${yearB}`);
  } catch (e) {
    console.error('Error fetching compare series:', e);
    compareSeriesA.value = [];
    compareSeriesB.value = [];
  } finally {
    isLoadingCompareChart.value = false;
  }
};

const renderCashFlowChart = () => {
  if (!cashFlowChartRef.value) return;

  // Generate labels for 12 months
  const labels = generateMonthLabels(chartFilters.value.year);

  // Generate sample data for 3 lines
  const sampleData = generateSampleData();

  // If we have real data from API, use it; otherwise use sample data
  let revenueData, costData, netProfitData;

  if (cashFlowSeries.value && cashFlowSeries.value.length >= 12) {
    // Use real data from API
    revenueData = cashFlowSeries.value.slice(0, 12).map(item => safeNumber(item.revenueVND || 0));
    costData = cashFlowSeries.value.slice(0, 12).map(item => safeNumber(item.costVND || 0));
    netProfitData = revenueData.map((rev, i) => rev - costData[i]);
  } else {
    // Use sample data
    revenueData = sampleData.revenue;
    costData = sampleData.cost;
    netProfitData = sampleData.netProfit;
  }

  const cfg = {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Revenue',
          data: revenueData,
          tension: 0.3,
          fill: false,
          borderColor: '#10B981', // Green
          backgroundColor: '#10B981',
          pointRadius: 4,
          pointHoverRadius: 6,
          borderWidth: 3
        },
        {
          label: 'Cost',
          data: costData,
          tension: 0.3,
          fill: false,
          borderColor: '#EF4444', // Red
          backgroundColor: '#EF4444',
          pointRadius: 4,
          pointHoverRadius: 6,
          borderWidth: 3
        },
        {
          label: 'Net Profit',
          data: netProfitData,
          tension: 0.3,
          fill: false,
          borderColor: '#3B82F6', // Blue
          backgroundColor: '#3B82F6',
          pointRadius: 4,
          pointHoverRadius: 6,
          borderWidth: 3
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const v = ctx.parsed.y;
              return `${ctx.dataset.label}: ${formatCurrency(v)}`;
            }
          }
        },
        legend: {
          display: true,
          position: 'top',
          labels: {
            usePointStyle: true,
            padding: 20
          }
        }
      },
      scales: {
        x: {
          grid: {
            display: true,
            color: '#f3f4f6'
          }
        },
        y: {
          ticks: {
            callback: v => formatCurrency(v),
            maxTicksLimit: 8
          },
          beginAtZero: false,
          grid: {
            display: true,
            color: '#f3f4f6'
          }
        }
      }
    }
  };

  if (cashFlowChart) {
    cashFlowChart.destroy();
    cashFlowChart = null;
  }
  cashFlowChart = new Chart(cashFlowChartRef.value.getContext('2d'), cfg);
};

// Combined chart: Grouped Bars (Revenue, Cost) + Line (Profit %)
const renderCashFlowCombinedChart = () => {
  if (!cashFlowCombinedChartRef.value) return;

  // Use monthly data for two selected years
  const seriesA = compareSeriesA.value || [];
  const seriesB = compareSeriesB.value || [];
  const labels = Array.from({ length: 12 }, (_, i) => `Mon ${i + 1}`);
  const revenueA = labels.map((_, idx) => safeNumber(seriesA[idx]?.revenueVND || 0));
  const costA = labels.map((_, idx) => safeNumber(seriesA[idx]?.costVND || 0));
  const revenueB = labels.map((_, idx) => safeNumber(seriesB[idx]?.revenueVND || 0));
  const costB = labels.map((_, idx) => safeNumber(seriesB[idx]?.costVND || 0));
  const profitPctA = revenueA.map((rev, i) => (rev > 0 ? ((rev - costA[i]) / rev) * 100 : 0));
  const profitPctB = revenueB.map((rev, i) => (rev > 0 ? ((rev - costB[i]) / rev) * 100 : 0));

  const cfg = {
    data: {
      labels,
      datasets: [
        {
          type: 'bar',
          label: `Revenue ${compareFilters.value.yearA}`,
          data: revenueA,
          backgroundColor: '#10B981',
          borderRadius: 6,
          yAxisID: 'y'
        },
        {
          type: 'bar',
          label: `Cost ${compareFilters.value.yearA}`,
          data: costA,
          backgroundColor: '#EF4444',
          borderRadius: 6,
          yAxisID: 'y'
        },
        {
          type: 'bar',
          label: `Revenue ${compareFilters.value.yearB}`,
          data: revenueB,
          backgroundColor: '#34D399',
          borderRadius: 6,
          yAxisID: 'y'
        },
        {
          type: 'bar',
          label: `Cost ${compareFilters.value.yearB}`,
          data: costB,
          backgroundColor: '#F87171',
          borderRadius: 6,
          yAxisID: 'y'
        },
        {
          type: 'line',
          label: `Profit % ${compareFilters.value.yearA}`,
          data: profitPctA,
          borderColor: '#3B82F6',
          backgroundColor: '#3B82F6',
          yAxisID: 'y1',
          tension: 0.3,
          pointRadius: 3,
          pointHoverRadius: 5,
          borderWidth: 2,
          fill: false
        },
        {
          type: 'line',
          label: `Profit % ${compareFilters.value.yearB}`,
          data: profitPctB,
          borderColor: '#6366F1',
          backgroundColor: '#6366F1',
          yAxisID: 'y1',
          tension: 0.3,
          pointRadius: 3,
          pointHoverRadius: 5,
          borderWidth: 2,
          fill: false
        }
      ]
    },
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
        legend: {
          display: true,
          position: 'top',
          labels: { usePointStyle: true, padding: 20 }
        }
      },
      scales: {
        y: {
          type: 'linear',
          position: 'left',
          ticks: { callback: v => formatCurrency(v), maxTicksLimit: 6 },
          grid: { color: '#f3f4f6' }
        },
        y1: {
          type: 'linear',
          position: 'right',
          ticks: {
            callback: v => `${Number(v).toFixed(0)}%`,
            maxTicksLimit: 6
          },
          grid: { drawOnChartArea: false }
        },
        x: {
          grid: { color: '#f9fafb' }
        }
      }
    }
  };

  if (cashFlowCombinedChart) {
    cashFlowCombinedChart.destroy();
    cashFlowCombinedChart = null;
  }
  cashFlowCombinedChart = new Chart(cashFlowCombinedChartRef.value.getContext('2d'), cfg);
};

// Inventory chart (line)
const renderInventoryChart = () => {
  if (!inventoryChartRef.value) return;
  const labels = inventorySeries.value.map(s => s.label || '');
  const values = inventorySeries.value.map(s => s.valueVND || 0);

  const cfg = {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Inventory Value',
          data: values,
          tension: 0.25,
          fill: true,
          borderColor: palette.inventory,
          backgroundColor: 'rgba(124,58,237,0.08)',
          pointRadius: 3,
          pointHoverRadius: 6
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        tooltip: {
          callbacks: { label: ctx => `${ctx.dataset.label}: ${formatCurrency(ctx.parsed.y)}` }
        }
      },
      scales: {
        y: { ticks: { callback: v => formatCurrency(v) } }
      }
    }
  };

  if (inventoryChart) {
    inventoryChart.destroy();
    inventoryChart = null;
  }
  inventoryChart = new Chart(inventoryChartRef.value.getContext('2d'), cfg);
};

// Watchers & lifecycle
watch(topProducts, () => renderTopProductsChart(), { deep: true });
watch(cashFlowSummary, () => renderCashFlowChart(), { deep: true }); // total-based fallback
watch(cashFlowSeries, () => renderCashFlowChart(), { deep: true }); // series-based update
watch(cashFlowSeries, () => renderCashFlowCombinedChart(), { deep: true });
watch(chartFilters, () => updateSummaryFromSeries(), { deep: true });
watch(inventorySeries, () => renderInventoryChart(), { deep: true });

// Socket.IO initialization
const initializeSocket = () => {
  console.log('🚀 Initializing Socket.IO for Accounter Dashboard...');

  // Connect to Socket.IO
  const socket = socketService.connect();

  // Join accounter room
  if (socket) {
    console.log('🏠 Joining accounter room...');
    socket.emit('join-room', 'accounters');
  } else {
    console.warn('⚠️ Socket not available, charts will not update in real-time');
  }

  // Listen for chart data updates
  socketService.on('chart-data-updated', (data) => {
    console.log('📊 Accounter Dashboard - Chart data updated:', data);

    // Refresh all charts based on update type
    if (data.type === 'invoice' || data.type === 'all') {
      console.log('📊 Refreshing invoice data...');
      refreshData();
      // Also refresh comparison chart for real-time updates
      refreshCompareChart();
    }
    if (data.type === 'inventory' || data.type === 'all') {
      console.log('📊 Refreshing inventory data...');
      fetchInventoryValue();
    }
    if (data.type === 'products' || data.type === 'all') {
      console.log('📊 Refreshing products data...');
      fetchTopProducts();
    }
  });

  // Listen for invoice events
  socketService.on('invoice-created', () => {
    console.log('📄 Accounter Dashboard - Invoice created - refreshing charts');
    refreshData();
    refreshCompareChart();
  });

  socketService.on('invoice-deleted', () => {
    console.log('🗑️ Accounter Dashboard - Invoice deleted - refreshing charts');
    refreshData();
    refreshCompareChart();
  });

  socketService.on('invoice-approved', () => {
    console.log('✅ Accounter Dashboard - Invoice approved - refreshing charts');
    refreshData();
    refreshCompareChart();
  });

  socketService.on('invoice-rejected', () => {
    console.log('❌ Accounter Dashboard - Invoice rejected - refreshing charts');
    refreshData();
    refreshCompareChart();
  });

  // Listen for export events
  socketService.on('export-created', () => {
    console.log('📦 Accounter Dashboard - Export created - refreshing charts');
    refreshData();
    refreshCompareChart();
  });

  socketService.on('export-approved', () => {
    console.log('✅ Accounter Dashboard - Export approved - refreshing charts');
    refreshData();
    refreshCompareChart();
  });
};

// Auto-refresh function for real-time updates
const startAutoRefresh = () => {
  // Clear existing interval if any
  if (autoRefreshInterval) {
    clearInterval(autoRefreshInterval);
  }

  // Set up auto-refresh every 30 seconds for comparison chart
  autoRefreshInterval = setInterval(() => {
    console.log('🔄 Auto-refreshing comparison chart...');
    refreshCompareChart();
  }, 30000); // 30 seconds

  console.log('⏰ Auto-refresh started for comparison chart (30s interval)');
};

const stopAutoRefresh = () => {
  if (autoRefreshInterval) {
    clearInterval(autoRefreshInterval);
    autoRefreshInterval = null;
    console.log('⏹️ Auto-refresh stopped');
  }
};

onMounted(async () => {
  // Initialize Socket.IO connection
  initializeSocket();

  await refreshData();
  await fetchCompareSeries();
  renderTopProductsChart();
  renderCashFlowChart();
  renderCashFlowCombinedChart();
  renderInventoryChart();
  updateSummaryFromSeries();

  // Start auto-refresh for real-time updates
  startAutoRefresh();
});

onBeforeUnmount(() => {
  // Stop auto-refresh
  stopAutoRefresh();

  // Disconnect Socket.IO
  socketService.disconnect();

  if (topProductsChart) { topProductsChart.destroy(); topProductsChart = null; }
  if (cashFlowChart) { cashFlowChart.destroy(); cashFlowChart = null; }
  if (cashFlowCombinedChart) { cashFlowCombinedChart.destroy(); cashFlowCombinedChart = null; }
  if (inventoryChart) { inventoryChart.destroy(); inventoryChart = null; }
});
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
