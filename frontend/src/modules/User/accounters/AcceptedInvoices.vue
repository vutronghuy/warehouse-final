<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex justify-between items-center">
      <div>
        <h2 class="text-2xl font-bold text-gray-900">Accepted Invoices</h2>
        <p class="text-sm text-gray-600">View and manage approved invoices</p>
      </div>
      <div class="flex space-x-3">
        <button
          @click="exportToExcel"
          class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          Export to Excel
        </button>
        <button
          @click="loadInvoices"
          class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Refresh
        </button>
      </div>
    </div>

    <!-- Filters and Search -->
    <div class="bg-white shadow rounded-lg p-6">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <!-- Search -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Search</label>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Invoice number, customer..."
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <!-- Date Range -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">From Date</label>
          <input
            v-model="dateFrom"
            type="date"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">To Date</label>
          <input
            v-model="dateTo"
            type="date"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <!-- Currency Filter -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Currency</label>
          <select
            v-model="currencyFilter"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Currencies</option>
            <option value="VND">VND</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Statistics Cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
      <div class="bg-white overflow-hidden shadow rounded-lg">
        <div class="p-5">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
            </div>
            <div class="ml-5 w-0 flex-1">
              <dl>
                <dt class="text-sm font-medium text-gray-500 truncate">Total Approved</dt>
                <dd class="text-lg font-medium text-gray-900">{{ statistics.totalCount }}</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-white overflow-hidden shadow rounded-lg">
        <div class="p-5">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
                </svg>
              </div>
            </div>
            <div class="ml-5 w-0 flex-1">
              <dl>
                <dt class="text-sm font-medium text-gray-500 truncate">Total Amount (VND)</dt>
                <dd class="text-lg font-medium text-gray-900">{{ formatCurrency(statistics.totalAmountVND) }}</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-white overflow-hidden shadow rounded-lg">
        <div class="p-5">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
            </div>
            <div class="ml-5 w-0 flex-1">
              <dl>
                <dt class="text-sm font-medium text-gray-500 truncate">This Month</dt>
                <dd class="text-lg font-medium text-gray-900">{{ statistics.thisMonthCount }}</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-white overflow-hidden shadow rounded-lg">
        <div class="p-5">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center">
                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
            </div>
            <div class="ml-5 w-0 flex-1">
              <dl>
                <dt class="text-sm font-medium text-gray-500 truncate">Overdue</dt>
                <dd class="text-lg font-medium text-gray-900">{{ statistics.overdueCount }}</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Invoices Table -->
    <div class="bg-white shadow rounded-lg">
      <div class="px-6 py-4 border-b border-gray-200">
        <h3 class="text-lg font-medium text-gray-900">Approved Invoices</h3>
      </div>

      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Invoice Number
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Customer
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Issue Date
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Due Date
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Payment Status
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="invoice in filteredInvoices" :key="invoice._id">
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {{ invoice.invoiceNumber }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">{{ invoice.customerName }}</div>
                <div class="text-sm text-gray-500">{{ invoice.customerPhone }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ formatDate(invoice.issueDate) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm">
                <span :class="getDueDateClass(invoice.dueDate)">
                  {{ formatDate(invoice.dueDate) }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ formatCurrency(invoice.finalAmount) }} {{ invoice.currency }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span :class="getPaymentStatusClass(invoice.status)">
                  {{ getPaymentStatusText(invoice.status) }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                <button
                  @click="viewInvoice(invoice)"
                  class="text-blue-600 hover:text-blue-900"
                >
                  View
                </button>
                <button
                  @click="downloadInvoice(invoice)"
                  class="text-green-600 hover:text-green-900"
                >
                  Download
                </button>
                <button
                  v-if="invoice.status === 'approved'"
                  @click="markAsPaid(invoice)"
                  class="text-purple-600 hover:text-purple-900"
                >
                  Mark Paid
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Empty State -->
      <div v-if="filteredInvoices.length === 0" class="text-center py-8">
        <p class="text-gray-500">No approved invoices found</p>
      </div>

      <!-- Pagination -->
      <div v-if="pagination.totalPages > 1" class="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
        <div class="flex-1 flex justify-between sm:hidden">
          <button
            @click="changePage(pagination.currentPage - 1)"
            :disabled="pagination.currentPage <= 1"
            class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            Previous
          </button>
          <button
            @click="changePage(pagination.currentPage + 1)"
            :disabled="pagination.currentPage >= pagination.totalPages"
            class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            Next
          </button>
        </div>
        <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p class="text-sm text-gray-700">
              Showing {{ (pagination.currentPage - 1) * pagination.itemsPerPage + 1 }} to
              {{ Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems) }} of
              {{ pagination.totalItems }} results
            </p>
          </div>
          <div>
            <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
              <button
                @click="changePage(pagination.currentPage - 1)"
                :disabled="pagination.currentPage <= 1"
                class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                v-for="page in visiblePages"
                :key="page"
                @click="changePage(page)"
                :class="[
                  'relative inline-flex items-center px-4 py-2 border text-sm font-medium',
                  page === pagination.currentPage
                    ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                ]"
              >
                {{ page }}
              </button>
              <button
                @click="changePage(pagination.currentPage + 1)"
                :disabled="pagination.currentPage >= pagination.totalPages"
                class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </nav>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import axios from 'axios'

// Reactive data
const invoices = ref([])
const searchQuery = ref('')
const dateFrom = ref('')
const dateTo = ref('')
const currencyFilter = ref('')
const currentPage = ref(1)
const itemsPerPage = ref(20)

// Statistics
const statistics = ref({
  totalCount: 0,
  totalAmountVND: 0,
  thisMonthCount: 0,
  overdueCount: 0
})

// Pagination
const pagination = ref({
  currentPage: 1,
  totalPages: 1,
  totalItems: 0,
  itemsPerPage: 20
})

// Computed properties
const filteredInvoices = computed(() => {
  let filtered = invoices.value

  // Filter by search
  if (searchQuery.value) {
    const search = searchQuery.value.toLowerCase()
    filtered = filtered.filter(invoice =>
      invoice.invoiceNumber.toLowerCase().includes(search) ||
      invoice.customerName.toLowerCase().includes(search)
    )
  }

  // Filter by date range
  if (dateFrom.value) {
    filtered = filtered.filter(invoice =>
      new Date(invoice.issueDate) >= new Date(dateFrom.value)
    )
  }

  if (dateTo.value) {
    filtered = filtered.filter(invoice =>
      new Date(invoice.issueDate) <= new Date(dateTo.value)
    )
  }

  // Filter by currency
  if (currencyFilter.value) {
    filtered = filtered.filter(invoice => invoice.currency === currencyFilter.value)
  }

  return filtered
})

const visiblePages = computed(() => {
  const total = pagination.value.totalPages
  const current = pagination.value.currentPage
  const delta = 2

  const range = []
  const rangeWithDots = []

  for (let i = Math.max(2, current - delta); i <= Math.min(total - 1, current + delta); i++) {
    range.push(i)
  }

  if (current - delta > 2) {
    rangeWithDots.push(1, '...')
  } else {
    rangeWithDots.push(1)
  }

  rangeWithDots.push(...range)

  if (current + delta < total - 1) {
    rangeWithDots.push('...', total)
  } else {
    rangeWithDots.push(total)
  }

  return rangeWithDots.filter(item => item !== '...' || rangeWithDots.indexOf(item) === rangeWithDots.lastIndexOf(item))
})

// Methods
const loadInvoices = async (page = 1) => {
  try {
    const response = await axios.get('/api/invoices', {
      params: {
        status: 'approved,paid',
        page: page,
        limit: itemsPerPage.value
      }
    })

    if (response.data.success) {
      invoices.value = response.data.invoices || []
      pagination.value = response.data.pagination || pagination.value
      calculateStatistics()
    }
  } catch (error) {
    console.error('Error loading invoices:', error)
    // Handle error (show notification)
  }
}

const calculateStatistics = () => {
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()

  statistics.value = {
    totalCount: invoices.value.length,
    totalAmountVND: invoices.value
      .filter(invoice => invoice.currency === 'VND')
      .reduce((sum, invoice) => sum + invoice.finalAmount, 0),
    thisMonthCount: invoices.value.filter(invoice => {
      const invoiceDate = new Date(invoice.issueDate)
      return invoiceDate.getMonth() === currentMonth && invoiceDate.getFullYear() === currentYear
    }).length,
    overdueCount: invoices.value.filter(invoice => {
      return invoice.status === 'approved' && new Date(invoice.dueDate) < now
    }).length
  }
}

const changePage = (page) => {
  if (page >= 1 && page <= pagination.value.totalPages) {
    currentPage.value = page
    loadInvoices(page)
  }
}

const viewInvoice = (invoice) => {
  // Navigate to invoice detail view or open modal
  console.log('View invoice:', invoice)
}

const downloadInvoice = (invoice) => {
  // Generate and download invoice PDF
  console.log('Download invoice:', invoice)
}

const markAsPaid = async (invoice) => {
  if (!confirm('Mark this invoice as paid?')) return

  try {
    // This would require a new API endpoint to update payment status
    const response = await axios.put(`/api/invoices/${invoice._id}/payment-status`, {
      status: 'paid'
    })

    if (response.data.success) {
      // Success notification
      console.log('Invoice marked as paid')

      // Refresh invoices list
      await loadInvoices(currentPage.value)
    }
  } catch (error) {
    console.error('Error marking invoice as paid:', error)
    // Handle error (show notification)
  }
}

const exportToExcel = () => {
  // Export filtered invoices to Excel
  console.log('Export to Excel')
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('vi-VN')
}

const formatCurrency = (amount) => {
  if (!amount) return '0'
  return new Intl.NumberFormat('vi-VN').format(amount)
}

const getDueDateClass = (dueDate) => {
  const now = new Date()
  const due = new Date(dueDate)
  const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24))

  if (diffDays < 0) {
    return 'text-red-600 font-medium' // Overdue
  } else if (diffDays <= 7) {
    return 'text-yellow-600 font-medium' // Due soon
  } else {
    return 'text-gray-500' // Normal
  }
}

const getPaymentStatusClass = (status) => {
  const baseClass = 'inline-flex px-2 py-1 text-xs font-semibold rounded-full'

  switch (status) {
    case 'approved':
      return `${baseClass} bg-green-100 text-green-800`
    case 'paid':
      return `${baseClass} bg-blue-100 text-blue-800`
    default:
      return `${baseClass} bg-gray-100 text-gray-800`
  }
}

const getPaymentStatusText = (status) => {
  switch (status) {
    case 'approved':
      return 'Pending Payment'
    case 'paid':
      return 'Paid'
    default:
      return status
  }
}

// Watchers
watch([searchQuery, dateFrom, dateTo, currencyFilter], () => {
  // Reset to first page when filters change
  currentPage.value = 1
  // In a real app, you might want to debounce this
})

// Lifecycle
onMounted(() => {
  loadInvoices()
})
</script>
