<template>
  <div
    v-if="visible"
    class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
    @keydown.esc.prevent="onClose"
    tabindex="-1"
  >
    <div
      ref="printArea"
      class="relative top-16 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white"
      @click.self.stop
    >
      <div class="flex justify-between items-start gap-4">
        <div>
          <h3 class="text-xl font-semibold text-gray-900">Invoice {{ invoice?.invoiceNumber || '' }}</h3>
          <div class="mt-1" v-if="!isPrinting">
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
        <div class="flex items-center gap-2" v-if="!isPrinting">
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

      <div class="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
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
      <div v-if="invoice.accounterReview?.reviewedBy && !isPrinting">
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
      <div class="mt-4 flex justify-end gap-2" v-if="!isPrinting">
        <button @click="downloadPdf" class="px-4 py-2 border rounded text-blue-700 hover:bg-blue-50">
          Download PDF
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
</template>

<script setup>
import { computed, ref } from 'vue';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

const props = defineProps({
  visible: { type: Boolean, default: false },
  invoice: { type: Object, default: null },
  showActions: { type: Boolean, default: true }, // toggle action buttons
});

const emit = defineEmits(['close', 'edit', 'delete', 'change-status']);

const printArea = ref(null);
const isPrinting = ref(false);

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

async function downloadPdf() {
  try {
    const element = printArea.value;
    if (!element) return;

    isPrinting.value = true;
    await new Promise((r) => requestAnimationFrame(() => r()));

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 10;
    const usableWidth = pageWidth - margin * 2;

    const imgWidth = usableWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let positionY = margin;
    let remainingHeight = imgHeight;
    let renderedHeight = 0;

    // Add image across pages if longer than one page
    const imgProps = { format: 'PNG' };
    while (remainingHeight > 0) {
      const sliceHeight = Math.min(remainingHeight, pageHeight - margin * 2);
      // Calculate the source y for the slice
      const sourceY = (renderedHeight * canvas.width) / imgWidth;

      // Create a temporary canvas for the slice
      const sliceCanvas = document.createElement('canvas');
      sliceCanvas.width = canvas.width;
      sliceCanvas.height = (sliceHeight * canvas.width) / imgWidth;
      const ctx = sliceCanvas.getContext('2d');
      ctx.drawImage(
        canvas,
        0,
        sourceY,
        canvas.width,
        sliceCanvas.height,
        0,
        0,
        sliceCanvas.width,
        sliceCanvas.height
      );
      const sliceData = sliceCanvas.toDataURL('image/png');

      if (positionY !== margin) {
        pdf.addPage();
        positionY = margin;
      }
      const sliceRenderedHeight = sliceHeight;
      pdf.addImage(sliceData, 'PNG', margin, positionY, imgWidth, sliceRenderedHeight, undefined, 'FAST');

      renderedHeight += sliceRenderedHeight;
      remainingHeight = imgHeight - renderedHeight;
    }

    const filename = `invoice-${props.invoice?.invoiceNumber || 'export'}.pdf`;
    pdf.save(filename);
  } catch (err) {
    console.error('Failed to generate PDF:', err);
    alert('Không thể xuất PDF. Vui lòng thử lại.');
  }
  finally {
    isPrinting.value = false;
  }
}
</script>
