<template>
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
          <button @click="activeTab = 'confirmed-exports'" :class="tabClass('confirmed-exports')">
            Approved Export Receipts
          </button>
          <button @click="activeTab = 'my-invoices'" :class="tabClass('my-invoices')">My Invoices</button>
        </nav>
      </div>

      <!-- Confirmed Export Receipts Tab -->
      <div v-if="activeTab === 'confirmed-exports'" class="p-6">
        <ApprovedExportReceipts
          :my-invoices="myInvoices"
          @create-invoice="openCreateInvoiceModal"
          @error="showMessage"
        />
      </div>

      <!-- My Invoices Tab -->
      <div v-if="activeTab === 'my-invoices'" class="p-6">
        <MyInvoices
          :my-invoices="myInvoices"
          @view-invoice="openViewModal"
          @edit-invoice="openEditModal"
          @delete-invoice="deleteInvoice"
          @error="showMessage"
          @invoices-loaded="handleInvoicesLoaded"
        />
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
      @created="handleInvoiceCreated"
      @error="showMessage"
    />

    <!-- View Invoice Modal -->
    <ViewInvoiceModal
      :visible="showViewModal"
      :invoice="selectedInvoice"
      :show-actions="true"
      @close="closeViewModal"
      @edit="openEditFromView"
      @delete="deleteInvoiceFromView"
      @change-status="handleChangeStatus"
    />

    <!-- Edit Invoice Modal -->
    <EditInvoiceModal
      :visible="showEditModal"
      :invoice="selectedInvoice"
      :is-submitting="isEditing"
      @close="closeEditModal"
      @submit="handleEditSubmit"
      @error="showMessage"
    />
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';
import CreateInvoiceModal from './modal/CreateInvoiceModal.vue';
import ViewInvoiceModal from './modal/ViewInvoiceModal.vue';
import EditInvoiceModal from './modal/EditInvoiceModal.vue';
import ApprovedExportReceipts from './components/ApprovedExportReceipts.vue';
import MyInvoices from './components/MyInvoices.vue';
import { useNotificationStore } from '@/store/modules/notification/slice';

// Notification store
const notificationStore = useNotificationStore();

// Reactive data
const activeTab = ref('confirmed-exports');
const myInvoices = ref([]);
const showCreateModal = ref(false);
const selectedExport = ref(null);
const isCreating = ref(false);

const message = ref('');
const messageType = ref('success');

// New reactive state for view/edit modals
const showViewModal = ref(false);
const showEditModal = ref(false);
const selectedInvoice = ref(null);
const isEditing = ref(false);

// Computed
const messageClass = computed(() => {
  return messageType.value === 'success'
    ? 'bg-green-50 text-green-800 border border-green-200'
    : 'bg-red-50 text-red-800 border border-red-200';
});

// Methods
const tabClass = (tab) => [
  'py-4 px-1 border-b-2 font-medium text-sm',
  activeTab.value === tab
    ? 'border-blue-500 text-blue-600'
    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
];

const loadMyInvoices = async () => {
  try {
    const response = await axios.get('/api/invoices');
    if (response.data?.success) {
      myInvoices.value = response.data.invoices || [];
    }
  } catch (error) {
    console.error('Error loading invoices:', error);
    showMessage('Failed to load invoices', 'error');
  }
};

const handleInvoicesLoaded = (invoices) => {
  myInvoices.value = invoices;
};

// open modal for create invoice
const openCreateInvoiceModal = (exportReceipt) => {
  selectedExport.value = exportReceipt;
  showCreateModal.value = true;
};

// close modal
const closeCreateModal = () => {
  showCreateModal.value = false;
  selectedExport.value = null;
};

// handle created event from create modal (modal handles submission internally)
const handleInvoiceCreated = async (invoiceData) => {
  // Modal already submitted and created invoice, just refresh list and close
  // Toast notification is already shown in CreateInvoiceModal, no need to show message here

  // Tạo notification cho accounter
  if (invoiceData?.invoice) {
    notificationStore.notifyInvoiceCreated(invoiceData.invoice);
  }

  await loadMyInvoices();
  closeCreateModal();
  activeTab.value = 'my-invoices';
};


// View modal handlers
const openViewModal = (invoice) => {
  selectedInvoice.value = invoice;
  showViewModal.value = true;
};
const closeViewModal = () => {
  showViewModal.value = false;
  selectedInvoice.value = null;
};

// Edit modal handlers
const openEditModal = (invoice) => {
  selectedInvoice.value = invoice;
  showEditModal.value = true;
};
const closeEditModal = () => {
  showEditModal.value = false;
  // we keep selectedInvoice for consistency, but you can clear if desired
};

// When view modal requests edit
const openEditFromView = (invoice) => {
  // close view then open edit
  closeViewModal();
  openEditModal(invoice);
};

// When view modal requests delete (emitted)
const deleteInvoiceFromView = (invoice) => {
  // close view and call delete
  closeViewModal();
  deleteInvoice(invoice);
};

// handle submit from edit modal
const handleEditSubmit = async (payload) => {
  // payload expected to contain invoiceId and fields (per EditInvoiceModal)
  const { invoiceId, ...data } = payload;
  if (!invoiceId) {
    showMessage('No invoice id provided for update', 'error');
    return;
  }
  isEditing.value = true;
  try {
    const response = await axios.put(`/api/invoices/${invoiceId}`, data);
    if (response.data?.success) {
      showMessage('Invoice updated', 'success');
      await loadMyInvoices();
      closeEditModal();
    } else {
      showMessage(response.data?.message || 'Update failed', 'error');
    }
  } catch (error) {
    console.error('Error updating invoice:', error);
    const errMsg = error.response?.data?.message || error.message || 'Failed to update invoice';
    showMessage(errMsg, 'error');
  } finally {
    isEditing.value = false;
  }
};

const deleteInvoice = async (invoice) => {
  if (!confirm('Are you sure you want to delete this invoice?')) return;
  try {
    const response = await axios.delete(`/api/invoices/${invoice._id}`);
    if (response.data?.success) {
      showMessage('Invoice deleted', 'success');

      // Remove notification for this invoice
      const notificationStore = useNotificationStore();
      const invoiceNotifications = notificationStore.notifications.filter(
        n => n.type === 'invoice_created' && n.data?._id === invoice._id
      );
      invoiceNotifications.forEach(notification => {
        notificationStore.deleteNotification(notification.id);
      });

      await loadMyInvoices();
      // if the deleted invoice was open in modals, close them
      if (selectedInvoice.value && String(selectedInvoice.value._id) === String(invoice._id)) {
        closeViewModal();
        closeEditModal();
      }
    } else {
      showMessage(response.data?.message || 'Delete failed', 'error');
    }
  } catch (error) {
    console.error('Error deleting invoice:', error);
    showMessage('Failed to delete invoice', 'error');
  }
};

// handle change status request from ViewInvoiceModal
const handleChangeStatus = async ({ invoiceId, status }) => {
  if (!invoiceId || !status) return;
  try {
    // backend endpoint may differ; adjust if needed
    const response = await axios.patch(`/api/invoices/${invoiceId}/status`, { status });
    if (response.data?.success) {
      showMessage('Invoice status updated', 'success');
      await loadMyInvoices();
      // update selectedInvoice if open
      if (selectedInvoice.value && String(selectedInvoice.value._id) === String(invoiceId)) {
        // mutate local selectedInvoice to reflect change
        selectedInvoice.value = { ...selectedInvoice.value, status };
      }
    } else {
      showMessage(response.data?.message || 'Failed to update status', 'error');
    }
  } catch (error) {
    console.error('Error changing invoice status:', error);
    showMessage(error.response?.data?.message || error.message || 'Failed to change status', 'error');
  }
};

const showMessage = (text, type = 'success') => {
  message.value = text;
  messageType.value = type;
  setTimeout(() => {
    message.value = '';
  }, 5000);
};

// Lifecycle
onMounted(async () => {
  await loadMyInvoices();
});
</script>
