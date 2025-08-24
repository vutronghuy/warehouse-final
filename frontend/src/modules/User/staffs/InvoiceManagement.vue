<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex justify-between items-center">
      <div>
        <h2 class="text-2xl font-bold text-gray-900">Invoice Management</h2>
        <p class="text-sm text-gray-600">Create and manage invoices from export receipts</p>
      </div>
    </div>

    <!-- Tabs -->
    <div class="bg-white shadow rounded-lg">
      <div class="border-b border-gray-200">
        <nav class="-mb-px flex space-x-8 px-6">
          <button @click="activeTab = 'confirmed-exports'"
            :class="tabClass('confirmed-exports')">
            Approved Export Receipts
          </button>
          <button @click="activeTab = 'my-invoices'"
            :class="tabClass('my-invoices')">
            My Invoices
          </button>
        </nav>
      </div>

      <!-- Confirmed Export Receipts Tab -->
      <div v-if="activeTab === 'confirmed-exports'" class="p-6">
        <div class="mb-4">
          <h3 class="text-lg font-medium text-gray-900 mb-2">Approved Export Receipts Ready for Invoice</h3>
          <p class="text-sm text-gray-600">Select an approved export receipt to create an invoice</p>
        </div>

        <!-- Search and Filter -->
        <div class="mb-4 flex gap-4">
          <div class="flex-1">
            <input v-model="exportSearch" type="text" placeholder="Search by receipt number or customer name..." class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <button @click="loadConfirmedExports" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Refresh</button>
        </div>

        <!-- Export Receipts Table -->
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Receipt Number</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="receipt in filteredExports" :key="receipt._id">
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{{ receipt.receiptNumber }}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900">{{ receipt.customerName }}</div>
                  <div class="text-sm text-gray-500">{{ receipt.customerPhone }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ formatDate(receipt.createdAt) }}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">{{ receipt.status }}</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button @click="openCreateInvoiceModal(receipt)" :disabled="hasInvoice(receipt._id)"
                    :class="[
                      'px-3 py-1 rounded text-sm',
                      hasInvoice(receipt._id) ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'
                    ]">
                    {{ hasInvoice(receipt._id) ? 'Invoice Created' : 'Create Invoice' }}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Empty State -->
        <div v-if="confirmedExports.length === 0" class="text-center py-8">
          <div class="text-gray-400 mb-4">
            <svg class="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p class="text-gray-500 text-lg font-medium">No approved export receipts available</p>
          <p class="text-gray-400 text-sm mt-2">Export receipts must be approved before you can create invoices from them.</p>
        </div>
      </div>

      <!-- My Invoices Tab -->
      <div v-if="activeTab === 'my-invoices'" class="p-6">
        <div class="mb-4">
          <h3 class="text-lg font-medium text-gray-900 mb-2">My Invoices</h3>
          <p class="text-sm text-gray-600">Manage your created invoices</p>
        </div>

        <!-- Search and Filter -->
        <div class="mb-4 flex gap-4">
          <div class="flex-1">
            <input v-model="invoiceSearch" type="text" placeholder="Search by invoice number or customer name..." class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <select v-model="statusFilter" class="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">All Status</option>
            <option value="draft">Draft</option>
            <option value="pending_review">Pending Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <button @click="loadMyInvoices" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Refresh</button>
        </div>

        <!-- Invoices Table -->
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice Number</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
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
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ formatCurrency(invoice.finalAmount) }} {{ invoice.currency }}</td>
                <td class="px-6 py-4 whitespace-nowrap"><span :class="getStatusClass(invoice.status)">{{ formatStatus(invoice.status) }}</span></td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ formatDate(invoice.dueDate) }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <button @click="viewInvoice(invoice)" class="text-blue-600 hover:text-blue-900">View</button>
                  <button v-if="canEdit(invoice.status)" @click="editInvoice(invoice)" class="text-green-600 hover:text-green-900">Edit</button>
                  <button v-if="canDelete(invoice.status)" @click="deleteInvoice(invoice)" class="text-red-600 hover:text-red-900">Delete</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="myInvoices.length === 0" class="text-center py-8">
          <p class="text-gray-500">No invoices created yet</p>
        </div>
      </div>
    </div>

    <!-- Global Message -->
    <div v-if="message" :class="messageClass" class="p-4 rounded-lg">{{ message }}</div>

    <!-- Create Invoice Modal component -->
    <CreateInvoiceModal
      :visible="showCreateModal"
      :selected-export="selectedExport"
      :is-submitting="isCreating"
      @close="closeCreateModal"
      @submit="handleCreateSubmit"
      @error="showMessage"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import CreateInvoiceModal from './modal/CreateInvoiceModal.vue'

// Reactive data
const activeTab = ref('confirmed-exports')
const confirmedExports = ref([])
const myInvoices = ref([])
const exportSearch = ref('')
const invoiceSearch = ref('')
const statusFilter = ref('')
const showCreateModal = ref(false)
const selectedExport = ref(null)
const isCreating = ref(false)

const message = ref('')
const messageType = ref('success')

// Computed & filters
const filteredExports = computed(() => {
  if (!exportSearch.value) return confirmedExports.value
  const search = exportSearch.value.toLowerCase()
  return confirmedExports.value.filter(e => {
    const rn = e.receiptNumber || ''
    const cn = e.customerName || ''
    return rn.toLowerCase().includes(search) || cn.toLowerCase().includes(search)
  })
})

const filteredInvoices = computed(() => {
  let filtered = myInvoices.value
  if (invoiceSearch.value) {
    const s = invoiceSearch.value.toLowerCase()
    filtered = filtered.filter(inv => (inv.invoiceNumber || '').toLowerCase().includes(s) || (inv.customerName || '').toLowerCase().includes(s))
  }
  if (statusFilter.value) {
    filtered = filtered.filter(inv => inv.status === statusFilter.value)
  }
  return filtered
})

const messageClass = computed(() => {
  return messageType.value === 'success'
    ? 'bg-green-50 text-green-800 border border-green-200'
    : 'bg-red-50 text-red-800 border border-red-200'
})

// Methods
const tabClass = (tab) => ([
  'py-4 px-1 border-b-2 font-medium text-sm',
  activeTab.value === tab ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
])

const loadConfirmedExports = async () => {
  try {
    const response = await axios.get('/api/export-receipts/confirmed')
    if (response.data?.success) {
      confirmedExports.value = response.data.exportReceipts || []
    } else {
      console.warn('API returned success: false for confirmed exports')
    }
  } catch (error) {
    console.error('Error loading approved exports:', error)
    showMessage('Failed to load approved export receipts', 'error')
  }
}

const loadMyInvoices = async () => {
  try {
    const response = await axios.get('/api/invoices')
    if (response.data?.success) {
      myInvoices.value = response.data.invoices || []
    }
  } catch (error) {
    console.error('Error loading invoices:', error)
    showMessage('Failed to load invoices', 'error')
  }
}

const hasInvoice = (exportReceiptId) => {
  return myInvoices.value.some(invoice => {
    const rid = invoice.exportReceiptId ? (invoice.exportReceiptId._id || invoice.exportReceiptId) : null
    return rid && String(rid) === String(exportReceiptId)
  })
}

// open modal
const openCreateInvoiceModal = (exportReceipt) => {
  selectedExport.value = exportReceipt
  showCreateModal.value = true
}

// close modal
const closeCreateModal = () => {
  showCreateModal.value = false
  selectedExport.value = null
}

// handle submit emitted from modal
const handleCreateSubmit = async (payload) => {
  if (!selectedExport.value) {
    showMessage('No export receipt selected', 'error')
    return
  }

  isCreating.value = true
  try {
    const response = await axios.post('/api/invoices/from-export', {
      exportReceiptId: selectedExport.value._id,
      ...payload
    })

    if (response.data?.success) {
      showMessage('Invoice created successfully!', 'success')
      await loadMyInvoices()
      closeCreateModal()
      activeTab.value = 'my-invoices'
    } else {
      showMessage(response.data?.message || 'Failed to create invoice', 'error')
    }
  } catch (error) {
    console.error('Error creating invoice:', error)
    const errMsg = error.response?.data?.message || error.message || 'Failed to create invoice'
    showMessage(errMsg, 'error')
  } finally {
    isCreating.value = false
  }
}

const viewInvoice = (invoice) => { console.log('View invoice:', invoice) }
const editInvoice = (invoice) => { console.log('Edit invoice:', invoice) }

const deleteInvoice = async (invoice) => {
  if (!confirm('Are you sure you want to delete this invoice?')) return
  try {
    const response = await axios.delete(`/api/invoices/${invoice._id}`)
    if (response.data?.success) {
      showMessage('Invoice deleted', 'success')
      await loadMyInvoices()
    } else {
      showMessage(response.data?.message || 'Delete failed', 'error')
    }
  } catch (error) {
    console.error('Error deleting invoice:', error)
    showMessage('Failed to delete invoice', 'error')
  }
}

const canEdit = (status) => ['draft', 'rejected'].includes(status)
const canDelete = (status) => ['draft', 'rejected'].includes(status)

const formatDate = (dateString) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('vi-VN')
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

const showMessage = (text, type = 'success') => {
  message.value = text
  messageType.value = type
  setTimeout(() => { message.value = '' }, 5000)
}

// Lifecycle
onMounted(() => {
  loadConfirmedExports()
  loadMyInvoices()
})
</script>
