<template>
  <div
    v-if="visible"
    class="fixed inset-0 bg-gray-600 bg-opacity-50 z-50 flex items-center justify-center p-4"
    @keydown.esc.prevent="onClose"
    tabindex="-1"
  >
    <div class="w-full max-w-6xl max-h-[90vh] bg-white rounded-lg shadow-lg overflow-hidden flex flex-col">
      <!-- Modal Header - Fixed -->
      <div class="flex justify-between items-start gap-4 p-6 border-b border-gray-200 bg-white">
        <div>
          <h3 class="text-xl font-semibold text-gray-900">Invoice {{ invoice?.invoiceNumber || '' }}</h3>
          <div class="mt-1">
            <span class="font-medium mr-2">Status:</span>
            <span
              v-if="invoice?.status"
              :class="[
                'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                formatStatus(invoice.status).class,
              ]"
            >
              {{ formatStatus(invoice.status).text }}
            </span>
            <span v-else class="text-sm text-gray-500">—</span>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <button @click="onClose" class="text-gray-400 hover:text-gray-600" aria-label="Close">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>

      <!-- Modal Content - Scrollable -->
      <div class="flex-1 overflow-y-auto p-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Customer -->
        <div class="p-4 space-y-2 border rounded">
          <h4 class="font-medium text-gray-900 mb-2">Customer Information</h4>
          <div class="flex justify-between text-sm text-gray-600">
            <span class="font-medium">Name:</span> {{ invoice?.customerName || '-' }}
          </div>
          <div class="flex justify-between text-sm text-gray-600">
            <span class="font-medium">Phone:</span> {{ invoice?.customerPhone || '-' }}
          </div>
          <div class="flex justify-between text-sm text-gray-600">
            <span class="font-medium">Address:</span> {{ invoice?.customerAddress || '-' }}
          </div>
        </div>

        <!-- Invoice meta -->
        <div class="p-4 border rounded">
          <div class="flex justify-between text-sm text-gray-600">
            <span>Payment:</span><span class="font-medium">{{ invoice?.paymentCondition || '-' }}</span>
          </div>
          <div class="flex justify-between text-sm text-gray-600 mt-2">
            <span>Currency:</span><span class="font-medium">{{ invoice?.currency || '-' }}</span>
          </div>
          <div class="flex justify-between text-sm text-gray-600 mt-2">
            <span>VAT:</span
            ><span class="font-medium">{{ invoice?.vatRate != null ? invoice.vatRate + '%' : '-' }}</span>
          </div>
          <div class="flex justify-between text-sm text-gray-600 mt-2">
            <span>Due date:</span><span class="font-medium">{{ formatDate(invoice?.dueDate) || '-' }}</span>
          </div>
        </div>
      </div>

      <!-- Line items (if present) -->
      <div class="mt-4 overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">#</th>
              <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
              <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
              <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Unit Price</th>
              <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="(detail, idx) in invoice.details || []" :key="detail._id || detail.productId">
              <td class="px-4 py-2 text-sm text-gray-900">{{ idx + 1 }}</td>
              <td class="px-4 py-2 text-sm text-gray-900">
                {{ detail.productName || detail.product?.name || detail.productId }}
              </td>
              <td class="px-4 py-2 text-sm text-gray-500">{{ detail.quantity }}</td>
              <td class="px-4 py-2 text-sm text-gray-500">{{ formatCurrency(detail.unitPrice) }}</td>
              <td class="px-4 py-2 text-sm text-gray-900">{{ formatCurrency(detail.totalPrice) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Totals -->
      <div class="mt-4 flex justify-end">
        <div class="w-full max-w-md p-4 border rounded bg-gray-50">
          <div class="flex justify-between text-sm text-gray-600">
            <span>Subtotal</span
            ><span class="font-medium">{{ formatCurrency(invoice.totalAmount) }} {{ invoice.currency }}</span>
          </div>
          <div class="flex justify-between text-sm text-gray-600 mt-2">
            <span>VAT ({{ invoice.vatRate }}%)</span
            ><span class="font-medium">{{ formatCurrency(invoice.vatAmount) }} {{ invoice.currency }}</span>
          </div>
          <div class="flex justify-between text-sm text-gray-900 mt-3">
            <span class="text-base font-semibold">Total:</span
            ><span class="text-base font-semibold"
              >{{ formatCurrency(invoice.finalAmount) }} {{ invoice.currency }}</span
            >
          </div>
        </div>
      </div>

      <!-- Note -->
      <div v-if="invoice?.note" class="mt-4 p-3 border rounded text-sm text-gray-700">
        <strong class="block text-sm text-gray-600">Note</strong>
        <p class="mt-1">{{ invoice.note }}</p>
      </div>

      <!-- Review History -->
      <div v-if="invoice.accounterReview?.reviewedBy">
        <h4 class="font-medium text-gray-900 mb-2">Review History</h4>
        <div class="bg-green-200 p-3 rounded text-sm">
          <div>
            <span class="font-medium">Reviewed by:</span>
            {{
              invoice.accounterReview.reviewedBy?.accounter?.fullName || invoice.accounterReview.reviewedBy
            }}
          </div>
          <div>
            <span class="font-medium">Reviewed at:</span>
            {{ formatDateTime(invoice.accounterReview.reviewedAt) }}
          </div>
          <div v-if="invoice.accounterReview.comment">
            <span class="font-medium">Comment:</span> {{ invoice.accounterReview.comment }}
          </div>
        </div>
      </div>
      <!-- Actions -->
      <div class="mt-4 flex justify-end gap-2">
        <button
          @click="downloadPDF"
          :disabled="isDownloading"
          class="px-4 py-2 border rounded text-purple-600 hover:bg-purple-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ isDownloading ? 'Loading...' : 'Download PDF' }}
        </button>
        <button
          v-if="canEdit"
          @click="onEdit"
          class="px-4 py-2 border rounded text-green-700 hover:bg-green-50"
        >
          Edit
        </button>
        <button
          v-if="canDelete"
          @click="confirmDelete"
          class="px-4 py-2 border rounded text-red-600 hover:bg-red-50"
        >
          Delete
        </button>
        <button @click="onClose" class="px-4 py-2 border rounded text-gray-700 hover:bg-gray-50">
          Close
        </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch, onMounted, onUnmounted } from 'vue';
import axios from 'axios';

const props = defineProps({
  visible: { type: Boolean, default: false },
  invoice: { type: Object, default: null },
  showActions: { type: Boolean, default: true }, // toggle action buttons
});

const emit = defineEmits(['close', 'edit', 'delete', 'change-status']);

// Scroll management
const scrollY = ref(0); // Store scroll position for body scroll prevention
const isDownloading = ref(false);

const items = computed(() => {
  // invoice may contain items array, or exportReceipt items
  if (!props.invoice) return [];
  return props.invoice.items || props.invoice.lineItems || props.invoice.exportItems || [];
});

const subtotal = computed(() => {
  return items.value.reduce((s, it) => {
    const qty = Number(it.quantity || it.qty || 0);
    const price = Number(it.unitPrice || it.price || 0);
    return s + qty * price;
  }, 0);
});

const vatAmount = computed(() => {
  const rate = Number(props.invoice?.vatRate || 0);
  return subtotal.value * (rate / 100);
});

const total = computed(() => {
  return subtotal.value + vatAmount.value;
});

function formatCurrency(amount) {
  const n = Number(amount || 0);
  return new Intl.NumberFormat('vi-VN').format(n);
}

function formatDate(dateString) {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('vi-VN');
}

function formatStatus(status) {
  const map = {
    pending_review: { text: 'Pending Review', class: 'bg-yellow-100 text-yellow-800' },
    approved: { text: 'Approved', class: 'bg-green-100 text-green-800' },
    rejected: { text: 'Rejected', class: 'bg-red-100 text-red-800' },
  };

  return map[status] || { text: status || '', class: 'bg-gray-100 text-gray-800' };
}

const canEdit = computed(() => {
  const s = props.invoice?.status;
  return ['draft', 'rejected'].includes(s);
});

const canDelete = computed(() => {
  const s = props.invoice?.status;
  return ['draft', 'rejected'].includes(s);
});

// Methods to handle body scroll
const preventBodyScroll = () => {
  // Store current scroll position
  scrollY.value = window.scrollY;
  // Apply styles to prevent scrolling
  document.body.style.position = 'fixed';
  document.body.style.top = `-${scrollY.value}px`;
  document.body.style.width = '100%';
  document.body.style.overflow = 'hidden';
};

const allowBodyScroll = () => {
  // Remove fixed positioning
  document.body.style.position = '';
  document.body.style.top = '';
  document.body.style.width = '';
  document.body.style.overflow = '';
  // Restore scroll position
  if (scrollY.value !== undefined) {
    window.scrollTo(0, scrollY.value);
  }
};

// Watch visible prop to handle body scroll
watch(
  () => props.visible,
  (v) => {
    if (v) {
      // Prevent body scroll when modal opens
      preventBodyScroll();
    } else {
      // Allow body scroll when modal closes
      allowBodyScroll();
    }
  },
);

// Lifecycle hooks
onMounted(() => {
  // Prevent body scroll if modal is already visible
  if (props.visible) {
    preventBodyScroll();
  }
});

onUnmounted(() => {
  // Ensure body scroll is restored when component is destroyed
  allowBodyScroll();
});

function onClose() {
  emit('close');
}

function onEdit() {
  emit('edit', props.invoice);
}

function formatDateTime(dateString) {
  if (!dateString) return '';
  const d = new Date(dateString);
  return isNaN(d) ? '' : d.toLocaleString('vi-VN');
}
function confirmDelete() {
  if (!confirm('Are you sure you want to delete this invoice?')) return;
  emit('delete', props.invoice);
}

async function downloadPDF() {
  if (!props.invoice?._id || isDownloading.value) return;

  isDownloading.value = true;
  try {
    // Get baseURL from axios config or use default
    const baseURL = axios.defaults.baseURL || import.meta.env.VITE_API_URL || 'http://localhost:3003';
    const apiUrl = `${baseURL}/api/invoices/${props.invoice._id}/pdf`;

    // Use axios with responseType: 'blob' to handle PDF binary data
    const response = await axios.get(apiUrl, {
      responseType: 'blob',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token') || sessionStorage.getItem('token')}`,
      },
    });

    // Check if response is actually PDF
    const contentType = response.headers['content-type'] || response.headers['Content-Type'];

    if (!contentType || !contentType.includes('application/pdf')) {
      // If not PDF, try to read as text to get error message
      const text = await response.data.text();
      let errorMessage = 'Phản hồi không phải là file PDF hợp lệ';
      try {
        const errorJson = JSON.parse(text);
        errorMessage = errorJson.message || errorMessage;
      } catch (e) {
        if (text && text.length < 500) {
          errorMessage = text;
        }
      }
      throw new Error(errorMessage);
    }

    // Get the blob from response
    const blob = response.data;

    // Verify blob is not empty
    if (blob.size === 0) {
      throw new Error('File PDF trống');
    }

    // Verify it's actually a PDF by checking first bytes
    const arrayBuffer = await blob.slice(0, 4).arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    const pdfSignature = [0x25, 0x50, 0x44, 0x46]; // %PDF
    const isPDF = uint8Array.every((byte, index) => byte === pdfSignature[index]);

    if (!isPDF) {
      // Try to read as text to get error message
      const text = await blob.text();
      let errorMessage = 'File không phải là PDF hợp lệ';
      try {
        const errorJson = JSON.parse(text);
        errorMessage = errorJson.message || errorMessage;
      } catch (e) {
        if (text && text.length < 500) {
          errorMessage = text.substring(0, 200);
        }
      }
      throw new Error(errorMessage);
    }

    // Get filename from Content-Disposition header or use default
    let fileName = `Invoice-${props.invoice.invoiceNumber || props.invoice._id}.pdf`;
    const contentDisposition = response.headers['content-disposition'] || response.headers['Content-Disposition'];
    if (contentDisposition) {
      const fileNameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (fileNameMatch && fileNameMatch[1]) {
        fileName = fileNameMatch[1].replace(/['"]/g, '');
        // Decode URI if encoded
        try {
          fileName = decodeURIComponent(fileName);
        } catch (e) {
          // If decode fails, use as is
        }
      }
    }

    // Create a download link
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();

    // Clean up
    setTimeout(() => {
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }, 100);
  } catch (error) {
    console.error('Error downloading PDF:', error);
    let errorMessage = 'Vui lòng thử lại';

    if (error.response) {
      // Axios error with response
      const contentType = error.response.headers['content-type'] || error.response.headers['Content-Type'];
      if (contentType && contentType.includes('application/json')) {
        errorMessage = error.response.data?.message || errorMessage;
      } else if (error.response.data) {
        // Try to read as text
        try {
          const text = await error.response.data.text();
          try {
            const errorJson = JSON.parse(text);
            errorMessage = errorJson.message || errorMessage;
          } catch (e) {
            if (text && text.length < 500) {
              errorMessage = text;
            }
          }
        } catch (e) {
          errorMessage = error.response.statusText || errorMessage;
        }
      } else {
        errorMessage = error.response.statusText || errorMessage;
      }
    } else if (error.message) {
      errorMessage = error.message;
    }

    alert(`Lỗi khi tải PDF: ${errorMessage}`);
  } finally {
    isDownloading.value = false;
  }
}
</script>
