<template>
  <div class="flex h-screen bg-gray-50">
    <!-- Sidebar -->
    <Sidebar />

    <!-- Main Content -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <!-- Header -->
      <Headers />

      <!-- Dashboard Content -->
      <main class="flex-1 overflow-y-auto p-6 space-y-8">
        <!-- Stats Cards -->

        <!-- Charts for Super Admin -->
        <section class="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <!-- Inventory Levels by Warehouse -->
          <div class="bg-white rounded-lg shadow p-6 flex flex-col">
            <div class="flex items-center justify-between mb-4">
              <div>
                <h3 class="text-lg font-medium text-gray-900">Inventory Levels by Warehouse</h3>
                <p class="text-xs text-gray-500 mt-1">
                  Inventory quantity (or inventory value) by warehouse
                </p>
              </div>
            </div>
            <div class="flex-1">
              <canvas ref="inventoryChartCanvas"></canvas>
            </div>
          </div>

          <!-- Inbound vs Outbound Trends -->
          <div class="bg-white rounded-lg shadow p-6 flex flex-col">
            <div class="flex items-center justify-between mb-4">
              <div>
                <h3 class="text-lg font-medium text-gray-900">Inbound vs Outbound Trends</h3>
                <p class="text-xs text-gray-500 mt-1">
                  Import-export trends over time (revenue and expenses)
                </p>
              </div>
            </div>
            <div class="flex items-center gap-3 mb-4 text-xs">
              <label class="flex items-center gap-2">
                <span class="text-gray-600">Period</span>
                <select v-model="cashFlowFilter.period" class="border border-gray-300 rounded px-2 py-1 text-xs">
                  <option value="year">Yearly</option>
                  <option value="month">Monthly</option>
                  <option value="day">Daily (in month)</option>
                </select>
              </label>
              <label class="flex items-center gap-2" v-if="cashFlowFilter.period !== 'day'">
                <span class="text-gray-600">Year</span>
                <input
                  v-model.number="cashFlowFilter.year"
                  type="number"
                  class="border border-gray-300 rounded px-2 py-1 w-20 text-xs"
                />
              </label>
              <label class="flex items-center gap-2" v-else>
                <span class="text-gray-600">Month/Year</span>
                <input
                  v-model.number="cashFlowFilter.year"
                  type="number"
                  class="border border-gray-300 rounded px-2 py-1 w-20 text-xs"
                />
                <input
                  v-model.number="cashFlowFilter.month"
                  type="number"
                  min="1"
                  max="12"
                  class="border border-gray-300 rounded px-2 py-1 w-16 text-xs"
                />
              </label>
              <button
                type="button"
                class="ml-auto inline-flex items-center px-3 py-1 rounded-md text-xs font-medium bg-gray-900 text-white hover:bg-gray-800"
                @click="reloadCashFlow"
              >
              Apply
              </button>
            </div>
            <div class="flex-1">
              <canvas ref="cashFlowChartCanvas"></canvas>
            </div>
          </div>

        </section>

        <!-- Revenue by Warehouse -->
        <section>
          <div class="bg-white rounded-lg shadow p-6 flex flex-col">
            <div class="flex items-start justify-between mb-4 gap-3">
              <div>
                <h3 class="text-lg font-medium text-gray-900">Revenue by Warehouse</h3>
                <p class="text-xs text-gray-500 mt-1">
                  Revenue by warehouse, with warehouse and time period filters
                </p>
              </div>
              <div class="text-right">
                <p class="text-xs text-gray-500">Total Revenue</p>
                <p class="text-xl font-semibold text-emerald-600">
                  {{ formatCurrency(totalRevenueByWarehouse) }}
                </p>
              </div>
            </div>

            <div class="flex flex-wrap items-center gap-3 mb-4 text-xs">
              <label class="flex items-center gap-2">
                <span class="text-gray-600">Warehouse</span>
                <select
                  v-model="selectedWarehouseForRevenue"
                  class="border border-gray-300 rounded px-2 py-1 text-xs min-w-[140px]"
                >
                  <option value="">All Warehouses</option>
                  <option
                    v-for="w in warehouses"
                    :key="w._id"
                    :value="w._id"
                  >
                    {{ w.name }}
                  </option>
                </select>
              </label>

              <label class="flex items-center gap-2">
                <span class="text-gray-600">Period</span>
                <select v-model="revenueFilter.period" class="border border-gray-300 rounded px-2 py-1 text-xs">
                  <option value="all">All</option>
                  <option value="year">Year</option>
                  <option value="month">Month</option>
                </select>
              </label>

              <label
                v-if="revenueFilter.period === 'year'"
                class="flex items-center gap-2"
              >
                <span class="text-gray-600">Year</span>
                <input
                  v-model.number="revenueFilter.year"
                  type="number"
                  class="border border-gray-300 rounded px-2 py-1 w-20 text-xs"
                />
              </label>

              <label
                v-if="revenueFilter.period === 'month'"
                class="flex items-center gap-2"
              >
                <span class="text-gray-600">Month/Year</span>
                <input
                  v-model.number="revenueFilter.year"
                  type="number"
                  class="border border-gray-300 rounded px-2 py-1 w-20 text-xs"
                />
                <input
                  v-model.number="revenueFilter.month"
                  type="number"
                  min="1"
                  max="12"
                  class="border border-gray-300 rounded px-2 py-1 w-16 text-xs"
                />
              </label>

              <button
                type="button"
                class="ml-auto inline-flex items-center px-3 py-1 rounded-md text-xs font-medium bg-gray-900 text-white hover:bg-gray-800"
                @click="reloadRevenueByWarehouse"
              >
                Apply
              </button>
            </div>

            <div class="flex-1">
              <canvas ref="revenueChartCanvas"></canvas>
            </div>
          </div>
        </section>

        <!-- Recent Activity -->

      </main>
    </div>

    <!-- ChatBot Component -->
    <ChatBot />
  </div>
</template>

<script>
import Sidebar from './Sidebar.vue';
import Headers from './header.vue';
import { ChatBot } from '@/components';
import axios from 'axios';
import Chart from 'chart.js/auto';

export default {
  name: 'SuperAdminDashboard',
  components: {
    Sidebar,
    Headers,
    ChatBot
  },
  data() {
    return {
      stats: {
        totalUsers: 0,
        totalWarehouses: 0,
        totalProducts: 0,
        totalOrders: 0
      },
      recentUsers: [],
      showUserMenu: false,
      currentUserObj: null,

      // Warehouses for filters/charts
      warehouses: [],

      // Inventory by warehouse
      inventoryLevels: [],

      // Cash flow (inbound vs outbound)
      cashFlowFilter: {
        period: 'month',
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1
      },
      cashFlowSeries: [],

      // Revenue by warehouse
      revenueByWarehouse: [],
      totalRevenueByWarehouse: 0,
      selectedWarehouseForRevenue: '',
      revenueFilter: {
        period: 'all',
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1
      },

      // Chart.js instances
      inventoryChart: null,
      cashFlowChart: null,
      revenueChart: null
    };
  },
  computed: {
    userFullName() {
      const u = this.currentUserObj || this._loadUserFromStorage();
      if (!u) return 'Super Admin';
      if (u.admin && u.admin.fullName) return u.admin.fullName;
      if (u.manager && u.manager.fullName) return u.manager.fullName;
      if (u.staff && u.staff.fullName) return u.staff.fullName;
      if (u.accounter && u.accounter.fullName) return u.accounter.fullName;
      if (u.fullName) return u.fullName;
      if (u.name) return u.name;
      return 'Super Admin';
    }
  },
  async mounted() {
    // Close user menu when clicking outside
    document.addEventListener('click', (e) => {
      if (this.$refs.userArea && !this.$refs.userArea.contains(e.target)) {
        this.showUserMenu = false;
      }
    });

    // Load current user from storage
    try {
      const rawUser = localStorage.getItem('user') || sessionStorage.getItem('user');
      if (rawUser) this.currentUserObj = JSON.parse(rawUser);
    } catch (e) {
      this.currentUserObj = null;
    }

    await this.loadDashboardData();
    await this.loadWarehouses();
    await this.loadInventoryByWarehouse();
    await this.loadCashFlowSeries();
    await this.loadRevenueByWarehouse();
  },
  methods: {
    _loadUserFromStorage() {
      try {
        const raw = localStorage.getItem('user') || sessionStorage.getItem('user');
        return raw ? JSON.parse(raw) : null;
      } catch (e) {
        return null;
      }
    },
    async loadDashboardData() {
      try {
        // Load stats (you can create API endpoints for these)
        this.stats = {
          totalUsers: 25,
          totalWarehouses: 5,
          totalProducts: 150,
          totalOrders: 89
        };

        // Load recent users
        this.recentUsers = [
          { id: 1, name: 'John Doe', role: 'Manager', status: 'active', initials: 'JD' },
          { id: 2, name: 'Jane Smith', role: 'Staff', status: 'active', initials: 'JS' },
          { id: 3, name: 'Bob Wilson', role: 'Accounter', status: 'inactive', initials: 'BW' },
          { id: 4, name: 'Alice Brown', role: 'Admin', status: 'active', initials: 'AB' }
        ];
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      }
    },

    // ---------- Helpers ----------
    formatCurrency(value) {
      if (value === null || value === undefined) return '0';
      const n = Number(value) || 0;
      return n.toLocaleString('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 });
    },

    // ---------- Load data for charts ----------
    async loadWarehouses() {
      try {
        const res = await axios.get('/api/warehouses/active');
        if (res.data && res.data.success !== false) {
          this.warehouses = res.data.warehouses || res.data.data || [];
        }
      } catch (error) {
        console.error('Error loading warehouses for super admin dashboard:', error);
      }
    },

    async loadInventoryByWarehouse() {
      if (!this.warehouses || this.warehouses.length === 0) {
        this.destroyChart('inventory');
        return;
      }

      const results = [];

      for (const w of this.warehouses) {
        try {
          // Reuse inventory value endpoint as proxy for inventory level
          const res = await axios.get('/api/reports/inventory-value', {
            params: {
              warehouse: w._id,
              period: 'month',
              months: 1
            }
          });
          if (res.data && res.data.success !== false) {
            const info = res.data.data || {};
            const summary = info.summary || {};
            const value = summary.currentValue || 0;
            results.push({ warehouseName: w.name, value });
          }
        } catch (err) {
          console.warn('Error loading inventory for warehouse', w._id, err?.response?.data || err.message);
        }
      }

      this.inventoryLevels = results;
      this.$nextTick(() => this.renderInventoryChart());
    },

    async loadCashFlowSeries() {
      try {
        const params = {
          period: this.cashFlowFilter.period,
          year: this.cashFlowFilter.year
        };
        if (this.cashFlowFilter.period === 'day') {
          params.month = this.cashFlowFilter.month;
        }
        const res = await axios.get('/api/reports/cash-flow-time-series', { params });
        if (res.data && res.data.success) {
          this.cashFlowSeries = res.data.data?.series || [];
        } else {
          this.cashFlowSeries = [];
        }
      } catch (error) {
        console.error('Error loading cash flow time series:', error);
        this.cashFlowSeries = [];
      }
      this.$nextTick(() => this.renderCashFlowChart());
    },

    async loadRevenueByWarehouse() {
      if (!this.warehouses || this.warehouses.length === 0) {
        this.destroyChart('revenue');
        return;
      }

      const results = [];
      let total = 0;

      const warehousesToUse = this.selectedWarehouseForRevenue
        ? this.warehouses.filter((w) => w._id === this.selectedWarehouseForRevenue)
        : this.warehouses;

      for (const w of warehousesToUse) {
        try {
          const params = {
            warehouse: w._id,
            period: this.revenueFilter.period === 'all' ? 'all' : 'month'
          };
          if (this.revenueFilter.period === 'year') {
            params.year = this.revenueFilter.year;
          } else if (this.revenueFilter.period === 'month') {
            params.year = this.revenueFilter.year;
            params.months = 1;
          }

          const res = await axios.get('/api/reports/cash-flow', { params });
          if (res.data && res.data.success) {
            const summary = res.data.data?.summary || {};
            const revenue = summary.totalRevenue || 0;
            total += revenue;
            results.push({ warehouseName: w.name, revenue });
          }
        } catch (err) {
          console.warn('Error loading revenue for warehouse', w._id, err?.response?.data || err.message);
        }
      }

      this.revenueByWarehouse = results;
      this.totalRevenueByWarehouse = total;
      this.$nextTick(() => this.renderRevenueChart());
    },

    reloadCashFlow() {
      this.loadCashFlowSeries();
    },

    reloadRevenueByWarehouse() {
      this.loadRevenueByWarehouse();
    },

    // ---------- Chart.js rendering ----------
    destroyChart(type) {
      if (type === 'inventory' && this.inventoryChart) {
        this.inventoryChart.destroy();
        this.inventoryChart = null;
      }
      if (type === 'cashFlow' && this.cashFlowChart) {
        this.cashFlowChart.destroy();
        this.cashFlowChart = null;
      }
      if (type === 'revenue' && this.revenueChart) {
        this.revenueChart.destroy();
        this.revenueChart = null;
      }
    },

    renderInventoryChart() {
      const canvas = this.$refs.inventoryChartCanvas;
      if (!canvas) return;

      const labels = this.inventoryLevels.map((x) => x.warehouseName);
      const data = this.inventoryLevels.map((x) => x.value || 0);

      this.destroyChart('inventory');

      const ctx = canvas.getContext('2d');
      this.inventoryChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels,
          datasets: [
            {
              label: 'Inventory Value (VND)',
              data,
              backgroundColor: 'rgba(59,130,246,0.8)',
              borderRadius: 6
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (context) => this.formatCurrency(context.parsed.y)
              }
            }
          },
          scales: {
            x: {
              ticks: { color: '#6B7280' },
              grid: { display: false }
            },
            y: {
              beginAtZero: true,
              ticks: {
                color: '#9CA3AF',
                callback: (val) => this.formatCurrency(val)
              }
            }
          }
        }
      });
    },

    renderCashFlowChart() {
      const canvas = this.$refs.cashFlowChartCanvas;
      if (!canvas) return;

      const labels = this.cashFlowSeries.map((x) => x.label);
      const revenueData = this.cashFlowSeries.map((x) => x.revenueVND || 0);
      const costData = this.cashFlowSeries.map((x) => x.costVND || 0);

      this.destroyChart('cashFlow');

      const ctx = canvas.getContext('2d');
      this.cashFlowChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels,
          datasets: [
            {
              label: 'Outbound (Revenue)',
              data: revenueData,
              borderColor: 'rgba(16,185,129,1)',
              backgroundColor: 'rgba(16,185,129,0.15)',
              fill: true,
              tension: 0.3
            },
            {
              label: 'Inbound (Cost)',
              data: costData,
              borderColor: 'rgba(239,68,68,1)',
              backgroundColor: 'rgba(239,68,68,0.1)',
              fill: true,
              tension: 0.3
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              labels: { color: '#4B5563', boxWidth: 16, usePointStyle: true }
            },
            tooltip: {
              callbacks: {
                label: (context) => `${context.dataset.label}: ${this.formatCurrency(context.parsed.y)}`
              }
            }
          },
          scales: {
            x: {
              ticks: { color: '#6B7280' },
              grid: { display: false }
            },
            y: {
              beginAtZero: true,
              ticks: {
                color: '#9CA3AF',
                callback: (val) => this.formatCurrency(val)
              }
            }
          }
        }
      });
    },

    renderRevenueChart() {
      const canvas = this.$refs.revenueChartCanvas;
      if (!canvas) return;

      const labels = this.revenueByWarehouse.map((x) => x.warehouseName);
      const data = this.revenueByWarehouse.map((x) => x.revenue || 0);

      this.destroyChart('revenue');

      const ctx = canvas.getContext('2d');
      this.revenueChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels,
          datasets: [
            {
              label: 'Revenue (VND)',
              data,
              backgroundColor: 'rgba(37,99,235,0.8)',
              borderRadius: 6
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (context) => this.formatCurrency(context.parsed.y)
              }
            }
          },
          scales: {
            x: {
              ticks: { color: '#6B7280' },
              grid: { display: false }
            },
            y: {
              beginAtZero: true,
              ticks: {
                color: '#9CA3AF',
                callback: (val) => this.formatCurrency(val)
              }
            }
          }
        }
      });
    },
    toggleUserMenu() {
      this.showUserMenu = !this.showUserMenu;
    },
    handleLogout() {
      // Clear tokens
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      localStorage.removeItem('user');
      sessionStorage.removeItem('user');

      // Redirect to login
      this.$router.push('/login');
    },
    logout() {
      this.handleLogout();
    }
  }
};
</script>

<style scoped>
/* Fade transition for dropdown */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
