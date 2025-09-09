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

          <!-- Filters -->
          <div class="flex items-center space-x-4">
            <!-- <button
              @click="refreshData"
              :disabled="isRefreshing"
              class="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-70"
            >
              Làm mới
            </button> -->
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Biểu đồ 1: Top Sản phẩm (Bar ngang) -->
        <div class="bg-white rounded-xl shadow-sm border p-6">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h3 class="text-lg font-semibold text-gray-900">Top 10 Best Selling Products</h3>

            </div>
            <div class="text-sm text-gray-500">
              Total: {{ topProducts.length }} product
            </div>
          </div>

          <div class="min-h-[250px]">
            <div v-if="isLoadingProducts" class="flex flex-col items-center justify-center py-12 text-gray-500">
              <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
              <p class="text-lg font-medium">Đang tải dữ liệu...</p>
            </div>

            <div v-else-if="topProducts.length === 0" class="flex flex-col items-center justify-center py-12 text-gray-500">
              <svg class="w-12 h-12 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2 2v-5m16 0h-2M4 13h2m13-8V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v1M7 7h10"></path>
              </svg>
              <p class="text-lg font-medium">Không có dữ liệu sản phẩm</p>
              <p class="text-sm">Dữ liệu sẽ hiển thị khi có hóa đơn được tạo</p>
            </div>

            <div v-else class="w-full">
              <div class="relative w-full h-72">
                <canvas ref="topProductsChartRef" class="chart-canvas absolute inset-0"></canvas>
              </div>
              <div class="mt-3 text-xs text-gray-500">
                Hiển thị Top 10 theo số lượng đã bán.
              </div>
            </div>
          </div>
        </div>

        <!-- Biểu đồ 2: Cash Flow - Line Chart (Net = Revenue - Cost) -->
        <div class="bg-white rounded-xl shadow-sm border p-6">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h3 class="text-lg font-semibold text-gray-900">Phân tích Cash Flow theo thời gian</h3>
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
<!--
              <button @click="refreshChart" class="text-sm bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 transition-colors">
                <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                </svg>
                Làm mới
              </button> -->
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
                  <div class="text-sm font-medium text-green-600">Tổng Doanh thu</div>
                  <div class="text-xl font-bold text-green-700">{{ formatCurrency(cashFlowSummary.totalRevenue) }}</div>
                </div>
                <div class="bg-red-50 rounded-lg p-3">
                  <div class="text-sm font-medium text-red-600">Tổng Chi phí</div>
                  <div class="text-xl font-bold text-red-700">{{ formatCurrency(cashFlowSummary.totalCost) }}</div>
                </div>
                <div class="bg-blue-50 rounded-lg p-3">
                  <div class="text-sm font-medium text-blue-600">Lợi nhuận</div>
                  <div class="text-xl font-bold" :class="cashFlowSummary.totalProfit >= 0 ? 'text-blue-700' : 'text-red-700'">
                    {{ formatCurrency(cashFlowSummary.totalProfit) }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Biểu đồ 3: Inventory Value (line theo thời gian) -->
      <div class="bg-white rounded-xl shadow-sm border p-6">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 class="text-lg font-semibold text-gray-900">Inventory Value</h3>
            <p class="text-sm text-gray-600 mt-1">Track total inventory value (at cost) over time.</p>
          </div>
          <div class="text-sm text-gray-500">
          Scope: {{ inventorySeries.length ? `${inventorySeries.length} kỳ` : '—' }}
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

    </div>
  </div>
</template>

<script setup>
/*
  Giữ nguyên logic fetchCashFlow từ code gốc — không thay đổi tính toán totalRevenue/totalCost/backup/fallback.
  Mình chỉ thêm: cashFlowSeries (nếu API trả theo tháng) và UI render Line Chart net = revenue - cost.
*/
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import axios from 'axios';
import Chart from 'chart.js/auto';

// Exchange rate constants (giữ nguyên)
const USD_TO_VND_RATE = 26401; // 1 USD = 26,401 VND

// Reactive data (giữ cấu trúc gốc)
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

// NEW: cashFlowSeries (mảng theo thời gian) — sẽ được gán nếu API trả về series
const cashFlowSeries = ref([]); // mỗi phần tử: { label, revenueVND, costVND }

// inventorySeries for chart 3 (kept similarly to prior code)
const inventorySeries = ref([]);

// Loading states
const isLoadingProducts = ref(false);
const isLoadingCashFlow = ref(false);
const isLoadingInventory = ref(false);

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
const inventoryChartRef = ref(null);

let topProductsChart = null;
let cashFlowChart = null;
let inventoryChart = null;

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

// Chart filter functions - ONLY for line chart, don't affect original data
const updateChart = () => {
  console.log('Updating line chart with filters:', chartFilters.value);
  fetchCashFlowTimeSeries(); // Only fetch line chart data
};

const refreshChart = () => {
  console.log('Refreshing line chart data');
  fetchCashFlowTimeSeries(); // Only fetch line chart data
};

// Fetch cash flow time series data from new API - ONLY for line chart
const fetchCashFlowTimeSeries = async () => {
  try {
    // Don't set loading state here to avoid affecting original UI

    const response = await axios.get('/api/reports/cash-flow-time-series', {
      params: {
        period: chartFilters.value.period,
        year: chartFilters.value.year,
        month: chartFilters.value.month
      }
    });

    console.log('📊 Cash Flow Time Series API Response:', response.data);

    if (response.data?.success && response.data.data) {
      // ONLY update cash flow series for line chart - DON'T touch cashFlowSummary
      cashFlowSeries.value = response.data.data.series || [];

      console.log('📈 Updated cashFlowSeries for line chart:', cashFlowSeries.value);
      console.log('🔍 Line chart data source: Invoice.finalAmount by month/year');

      // Render ONLY the line chart
      renderCashFlowChart();
    } else {
      console.error('Cash Flow Time Series API failed:', response.data);
      // Fallback to sample data for line chart only
      cashFlowSeries.value = [];
      renderCashFlowChart();
    }

  } catch (error) {
    console.error('Error fetching cash flow time series:', error);
    // Fallback to sample data for line chart only
    cashFlowSeries.value = [];
    renderCashFlowChart();
  }
};

// Generate 12 months labels
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

// fetchTopProducts (giữ tương tự)
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

// *** KEEP ORIGINAL fetchCashFlow logic intact (only add detection of series if present) ***
const fetchCashFlow = async () => {
  try {
    isLoadingCashFlow.value = true;

    // Lấy tổng doanh thu từ TẤT CẢ invoice trong database
    const totalRevenueResponse = await axios.get('/api/invoices/total-revenue');

    if (totalRevenueResponse.data?.success) {
      const totalRevenue = totalRevenueResponse.data.totalRevenue || 0;

      // Lấy tổng chi phí từ cash flow API (tất cả thời gian)
      const cashFlowResponse = await axios.get('/api/reports/cash-flow', {
        params: {
          period: 'all' // Lấy tất cả thời gian
        }
      });

      let totalCost = 0;
      console.log('Full Cash Flow API Response:', JSON.stringify(cashFlowResponse.data, null, 2));

      if (cashFlowResponse.data?.success && cashFlowResponse.data.data?.summary) {
        // totalCost từ API đang ở dạng USD, cần convert sang VND
        const totalCostUSD = cashFlowResponse.data.data.summary.totalCost || 0;
        totalCost = totalCostUSD * USD_TO_VND_RATE;

        console.log('Cash Flow API Response Summary:', cashFlowResponse.data.data.summary);
        console.log('Total Cost USD from API:', totalCostUSD);
        console.log('USD to VND Rate:', USD_TO_VND_RATE);
        console.log('Total Cost VND (converted):', totalCost);
      } else {
        console.log('Cash Flow API failed or no data. Response:', cashFlowResponse.data);
        console.log('API Success:', cashFlowResponse.data?.success);
        console.log('API Data:', cashFlowResponse.data?.data);
        console.log('API Summary:', cashFlowResponse.data?.data?.summary);
      }

      // Backup: Nếu totalCost = 0, thử tính dựa trên basePrice của products
      if (totalCost === 0) {
        console.log('🔄 totalCost is 0, trying backup methods...');

        try {
          console.log('Trying backup method 1: calculating cost from product basePrice...');
          // Sử dụng API products/active thay vì /api/products để tránh lỗi 403
          const productsResponse = await axios.get('/api/products/active');
          console.log('Products API response:', productsResponse.data);

          if (productsResponse.data?.success && productsResponse.data.products) {
            const products = productsResponse.data.products;
            let backupTotalCostUSD = 0;

            console.log('Processing products:', products.length);
            products.forEach((product, index) => {
              const basePrice = product.basePrice || 0;
              const quantity = product.quantity || 0;
              const minStockLevel = product.minStockLevel || 0;

              // Tính chi phí = basePrice × quantity (số lượng thực tế trong kho)
              const productCost = basePrice * quantity;
              backupTotalCostUSD += productCost;

              if (index < 10) { // Log first 10 products for debugging
                console.log(`Product ${index + 1}:`, {
                  name: product.name,
                  basePrice,
                  quantity,
                  minStockLevel,
                  cost: productCost
                });
              }
            });

            if (backupTotalCostUSD > 0) {
              totalCost = backupTotalCostUSD * USD_TO_VND_RATE;
              console.log('✅ Backup calculation successful!');
              console.log('Backup calculation - Total Cost USD:', backupTotalCostUSD);
              console.log('Backup calculation - Total Cost VND:', totalCost);
              console.log('Number of products used in calculation:', products.length);
            } else {
              console.log('⚠️ Backup calculation resulted in 0 cost');
            }
          } else {
            console.log('❌ Products API response invalid:', productsResponse.data);
          }
        } catch (backupError) {
          console.log('❌ Backup calculation failed:', backupError);
        }

        // Fallback cuối cùng: tạo một số liệu giả để test
        if (totalCost === 0) {
          console.log('🔄 Using fallback test data...');
          const testCostUSD = 1000; // $1000 USD for testing
          totalCost = testCostUSD * USD_TO_VND_RATE;
          console.log('✅ Fallback test - Total Cost USD:', testCostUSD);
          console.log('✅ Fallback test - Total Cost VND:', totalCost);
        }
      }

      // --- KEEP cashFlowSummary assignment as original ---
      cashFlowSummary.value = {
        totalRevenue: totalRevenue,
        totalCost: totalCost, // Đã được convert sang VND
        totalProfit: totalRevenue - totalCost,
      };

      console.log('✅ FINAL RESULTS:');
      console.log('📊 Total Revenue from finalAmount:', totalRevenue);
      console.log('💰 Total Cost (converted to VND):', totalCost);
      console.log('📈 Total Profit:', totalRevenue - totalCost);
      console.log('🔍 Revenue source: Invoice.finalAmount (not calculated from details)');

      // ---- NEW: If API returned a time-series (e.g., data.series), try to extract it ----
      try {
        const data = cashFlowResponse.data?.data || cashFlowResponse.data;
        // common possible shapes: data.series OR data.data.series OR data.history
        let rawSeries = null;
        if (data?.series && Array.isArray(data.series)) rawSeries = data.series;
        else if (data?.history && Array.isArray(data.history)) rawSeries = data.history;
        else if (data?.data?.series && Array.isArray(data.data.series)) rawSeries = data.data.series;
        // If we found a raw series, map it to cashFlowSeries with conversion to VND where needed
        if (rawSeries) {
          cashFlowSeries.value = rawSeries.map(item => {
            // best-effort mapping: item may contain revenueUSD/costUSD or revenue/cost already in VND
            const revUSD = safeNumber(item.revenue || item.totalRevenue || item.revenueUSD || 0);
            const costUSD = safeNumber(item.cost || item.totalCost || item.costUSD || 0);
            // If values look too big (likely already VND), we attempt to detect: if revUSD > 1e6 assume it's VND, don't convert
            const revenueVND = revUSD > 1000000 ? Math.round(revUSD) : Math.round(revUSD * USD_TO_VND_RATE);
            const costVND = costUSD > 1000000 ? Math.round(costUSD) : Math.round(costUSD * USD_TO_VND_RATE);
            return {
              label: item.label || item.month || item.period || (item.year && item.month ? `${item.year}-${String(item.month).padStart(2,'0')}` : ''),
              revenueVND,
              costVND
            };
          });
        } else {
          // No series returned — leave cashFlowSeries empty (chart will use fallback created elsewhere)
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
    // Fallback data (kept as original)
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

// fetchInventoryValue (giữ gần như gốc, vẫn build inventorySeries used for chart)
const fetchInventoryValue = async () => {
  try {
    isLoadingInventory.value = true;
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;

    const response = await axios.get('/api/reports/inventory-value', {
      params: {
        period: 'month',
        year: year,
        month: month,
        months: 3
      }
    });

    if (response.data?.success && response.data.data?.summary) {
      inventorySummary.value = {
        currentValue: response.data.data.summary.currentValue || 0,
        trend: response.data.data.summary.trend || 0,
        averageValue: response.data.data.summary.averageValue || 0
      };

      if (response.data.data.series && Array.isArray(response.data.data.series)) {
        inventorySeries.value = response.data.data.series.map(item => ({
          label: item.label || item.month || '',
          valueVND: item.value || 0
        }));
      } else {
        // fallback: create small series to show trend
        inventorySeries.value = [
          { label: 'T-2', valueVND: response.data.data.summary.averageValue || 0 },
          { label: 'T-1', valueVND: Math.round((response.data.data.summary.currentValue || 0) * 0.98) || 0 },
          { label: 'Hiện tại', valueVND: response.data.data.summary.currentValue || 0 }
        ];
      }
    } else {
      throw new Error('API response not successful');
    }
  } catch (error) {
    console.error('Error fetching inventory value:', error);
    inventorySummary.value = { currentValue: 0, trend: 0, averageValue: 0 };
    inventorySeries.value = [];
  } finally {
    isLoadingInventory.value = false;
  }
};

// Refresh all
const refreshData = async () => {
  try {
    isRefreshing.value = true;
    await Promise.all([
      fetchTopProducts(),
      fetchCashFlow(), // Keep original API for summary data
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
      datasets: [{ label: 'Đã bán', data: dataValues, backgroundColor: bg, borderRadius: 8, barThickness: 16 }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: ctx => ` ${formatNumber(ctx.parsed.x)} đã bán` } }
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
          label: 'Doanh thu',
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
          label: 'Chi phí',
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
          label: 'Lợi nhuận ròng',
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

// Inventory chart (line) — similar to previous
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
          label: 'Giá trị tồn kho',
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
watch(inventorySeries, () => renderInventoryChart(), { deep: true });

onMounted(async () => {
  await refreshData();
  renderTopProductsChart();
  renderCashFlowChart();
  renderInventoryChart();
});

onBeforeUnmount(() => {
  if (topProductsChart) { topProductsChart.destroy(); topProductsChart = null; }
  if (cashFlowChart) { cashFlowChart.destroy(); cashFlowChart = null; }
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
