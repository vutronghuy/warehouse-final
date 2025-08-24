<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex justify-between items-center">
      <div>
        <h2 class="text-2xl font-bold text-gray-900">Invoice Review</h2>
        <p class="text-sm text-gray-600">Review and approve invoices from staff</p>
      </div>
    </div>

    <!-- Tabs -->
    <div class="bg-white shadow rounded-lg">
      <div class="border-b border-gray-200">
        <nav class="-mb-px flex space-x-8 px-6">
          <button @click="activeTab = 'pending'" :class="tabClass('pending')">
            Pending Review
            <span v-if="pendingCount > 0" class="ml-2 bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              {{ pendingCount }}
            </span>
          </button>
          <button @click="activeTab = 'approved'" :class="tabClass('approved')">Approved Invoices</button>
          <button @click="activeTab = 'rejected'" :class="tabClass('rejected')">Rejected Invoices</button>
        </nav>
      </div>

      <!-- Content -->
      <div class="p-6">
        <!-- Search and Filter -->
        <div class="mb-4 flex gap-4">
          <div class="flex-1">
            <input v-model="searchQuery" type="text" placeholder="Search by invoice number, customer name..." class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <button @click="loadInvoices" :disabled="isLoading" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {{ isLoading ? 'Loading...' : 'Refresh' }}
          </button>
        </div>

        <!-- Invoices Table -->
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice Number</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created By</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="invoice in filteredInvoices" :key="invoice._id">
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{{ invoice.invoiceNumber }}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900">{{ invoice.customerName }}</div>
                  <div class="text-sm text-gray-500">{{ invoice.customerPhone }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ invoice.createdByStaff?.staff?.fullName || 'N/A' }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ formatCurrency(invoice.finalAmount) }} {{ invoice.currency }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ formatDate(invoice.dueDate) }}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span :class="getStatusClass(invoice.status)">{{ formatStatus(invoice.status) }}</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <button @click="viewInvoiceDetail(invoice)" class="text-blue-600 hover:text-blue-900">View</button>
                  <button v-if="invoice.status === 'pending_review'" @click="openReviewModal(invoice, 'approve')" class="text-green-600 hover:text-green-900">Approve</button>
                  <button v-if="invoice.status === 'pending_review'" @click="openReviewModal(invoice, 'reject')" class="text-red-600 hover:text-red-900">Reject</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Empty State -->
        <div v-if="filteredInvoices.length === 0" class="text-center py-8">
          <p class="text-gray-500">No invoices found</p>
        </div>
      </div>
    </div>

    <!-- Review Modal -->
    <div v-if="showReviewModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div class="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
        <div class="mt-3">
          <h3 class="text-lg font-medium text-gray-900 mb-4">{{ reviewAction === 'approve' ? 'Approve' : 'Reject' }} Invoice</h3>

          <!-- Invoice Summary -->
          <div v-if="selectedInvoice" class="bg-gray-50 p-4 rounded-lg mb-4">
            <div class="grid grid-cols-2 gap-4 text-sm">
              <div><span class="font-medium">Invoice Number:</span> {{ selectedInvoice.invoiceNumber }}</div>
              <div><span class="font-medium">Customer:</span> {{ selectedInvoice.customerName }}</div>
              <div><span class="font-medium">Amount:</span> {{ formatCurrency(selectedInvoice.finalAmount) }} {{ selectedInvoice.currency }}</div>
              <div><span class="font-medium">Due Date:</span> {{ formatDate(selectedInvoice.dueDate) }}</div>
            </div>
          </div>

          <!-- Review Form -->
          <form @submit.prevent="submitReview" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">{{ reviewAction === 'approve' ? 'Approval' : 'Rejection' }} Comment</label>
              <textarea v-model="reviewComment" rows="4" :placeholder="reviewAction === 'approve' ? 'Optional approval notes...' : 'Please provide reason for rejection...'" :required="reviewAction === 'reject'" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
            </div>

            <!-- Actions -->
            <div class="flex justify-end space-x-3 pt-4">
              <button type="button" @click="closeReviewModal" class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Cancel</button>
              <button type="submit" :disabled="isSubmitting" :class="['px-4 py-2 rounded-lg text-white disabled:opacity-50', reviewAction === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700']">
                {{ isSubmitting ? 'Processing...' : (reviewAction === 'approve' ? 'Approve' : 'Reject') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Invoice Detail Modal (separated component) -->
    <InvoiceDetailModal :visible="showDetailModal" :invoice="selectedInvoice" @close="closeDetailModal" />

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import InvoiceDetailModal from './InvoiceDetailModal.vue' // adjust path as needed

// Reactive data
const activeTab = ref('pending')
const invoices = ref([])
const searchQuery = ref('')
const showReviewModal = ref(false)
const showDetailModal = ref(false)
const selectedInvoice = ref(null)
const reviewAction = ref('')
const reviewComment = ref('')
const isSubmitting = ref(false)
const isLoading = ref(false)

// Computed properties
const filteredInvoices = computed(() => {
  let filtered = invoices.value || []

  // Filter by tab
  switch (activeTab.value) {
    case 'pending':
      filtered = filtered.filter(invoice => invoice.status === 'pending_review')
      break
    case 'approved':
      filtered = filtered.filter(invoice => invoice.status === 'approved')
      break
    case 'rejected':
      filtered = filtered.filter(invoice => invoice.status === 'rejected')
      break
  }

  // Filter by search (safe)
  if (searchQuery.value) {
    const s = (searchQuery.value || '').toLowerCase()
    filtered = filtered.filter(invoice =>
      (invoice.invoiceNumber || '').toLowerCase().includes(s) ||
      (invoice.customerName || '').toLowerCase().includes(s)
    )
  }

  return filtered
})

const pendingCount = computed(() => {
  return (invoices.value || []).filter(inv => inv.status === 'pending_review').length
})

const tabClass = (tab) => ([
  'py-4 px-1 border-b-2 font-medium text-sm',
  activeTab.value === tab ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
])

// Methods
const loadInvoices = async () => {
  isLoading.value = true
  try {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token')
    const response = await axios.get('/api/invoices', {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    })

    if (response.data?.success) {
      invoices.value = response.data.invoices || []
    } else {
      invoices.value = response.data.invoices || []
    }
  } catch (error) {
    console.error('Error loading invoices:', error)
    // Optionally show a toast/message
  } finally {
    isLoading.value = false
  }
}

const openReviewModal = (invoice, action) => {
  selectedInvoice.value = invoice
  reviewAction.value = action
  reviewComment.value = ''
  showReviewModal.value = true
}

const closeReviewModal = () => {
  showReviewModal.value = false
  selectedInvoice.value = null
  reviewAction.value = ''
  reviewComment.value = ''
}

const submitReview = async () => {
  if (!selectedInvoice.value) return
  if (reviewAction.value === 'reject' && !reviewComment.value.trim()) {
    alert('Vui lòng nhập lý do từ chối')
    return
  }

  isSubmitting.value = true
  try {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token')
    const response = await axios.put(`/api/invoices/${selectedInvoice.value._id}/review`, {
      action: reviewAction.value,
      comment: reviewComment.value
    }, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    })

    if (response.data?.success) {
      // refresh list
      await loadInvoices()
      closeReviewModal()
    } else {
      // handle failure
      alert(response.data?.message || 'Review failed')
    }
  } catch (error) {
    console.error('Error reviewing invoice:', error)
    alert(error.response?.data?.message || 'Failed to review invoice')
  } finally {
    isSubmitting.value = false
  }
}

const viewInvoiceDetail = async (invoice) => {
  try {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token')
    const response = await axios.get(`/api/invoices/${invoice._id}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    })

    if (response.data?.success) {
      selectedInvoice.value = response.data.invoice
      showDetailModal.value = true
    } else {
      alert(response.data?.message || 'Failed to load invoice details')
    }
  } catch (error) {
    console.error('Error loading invoice details:', error)
    if (error.response?.status === 403) {
      alert('You do not have permission to view this invoice')
    } else {
      alert(error.response?.data?.message || 'Failed to load invoice details')
    }
  }
}

const closeDetailModal = () => {
  showDetailModal.value = false
  selectedInvoice.value = null
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  const d = new Date(dateString)
  return isNaN(d) ? '' : d.toLocaleDateString('vi-VN')
}

const formatCurrency = (amount) => {
  const n = Number(amount || 0)
  return new Intl.NumberFormat('vi-VN').format(n)
}

const formatStatus = (status) => {
  const statusMap = { draft: 'Draft', pending_review: 'Pending Review', approved: 'Approved', rejected: 'Rejected', paid: 'Paid' }
  return statusMap[status] || status
}

const getStatusClass = (status) => {
  const baseClass = 'inline-flex px-2 py-1 text-xs font-semibold rounded-full'
  switch (status) {
    case 'draft': return `${baseClass} bg-gray-100 text-gray-800`
    case 'pending_review': return `${baseClass} bg-yellow-100 text-yellow-800`
    case 'approved': return `${baseClass} bg-green-100 text-green-800`
    case 'rejected': return `${baseClass} bg-red-100 text-red-800`
    case 'paid': return `${baseClass} bg-blue-100 text-blue-800`
    default: return `${baseClass} bg-gray-100 text-gray-800`
  }
}

// Lifecycle
onMounted(() => {
  loadInvoices()
})
</script>
