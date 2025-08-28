<template>
  <div v-if="visible" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
    <div class="relative top-10 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
      <div class="mt-3">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-medium text-gray-900">Invoice Details</h3>
          <button @click="close" class="text-gray-400 hover:text-gray-600">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              ></path>
            </svg>
          </button>
        </div>

        <div v-if="invoice" class="space-y-6">
          <!-- Header Info -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-3">
              <h4 class="font-medium text-gray-900">Invoice Information</h4>
              <div class="space-y-2 text-sm">
                <div><span class="font-medium">Invoice Number:</span> {{ invoice.invoiceNumber }}</div>
                <div><span class="font-medium">Issue Date:</span> {{ formatDate(invoice.issueDate) }}</div>
                <div><span class="font-medium">Due Date:</span> {{ formatDate(invoice.dueDate) }}</div>
                <div><span class="font-medium">Payment Condition:</span> {{ invoice.paymentCondition }}</div>
                <div><span class="font-medium">Currency:</span> {{ invoice.currency }}</div>
              </div>
            </div>

            <div class="space-y-3">
              <h4 class="font-medium text-gray-900">Customer Information</h4>
              <div class="space-y-2 text-sm">
                <div><span class="font-medium">Name:</span> {{ invoice.customerName }}</div>
                <div><span class="font-medium">Phone:</span> {{ invoice.customerPhone }}</div>
                <div><span class="font-medium">Address:</span> {{ invoice.customerAddress }}</div>
              </div>
            </div>
          </div>

          <!-- Products Table -->
          <div>
            <h4 class="font-medium text-gray-900 mb-3">Products</h4>
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                    <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                    <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Unit Price
                    </th>
                    <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  <tr v-for="detail in invoice.details || []" :key="detail._id || detail.productId">
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
          </div>

          <!-- Totals -->
          <div class="border-t pt-4">
            <div class="flex justify-end">
              <div class="w-64 space-y-2 text-sm">
                <div class="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{{ formatCurrency(invoice.totalAmount) }} {{ invoice.currency }}</span>
                </div>
                <div class="flex justify-between">
                  <span>VAT ({{ invoice.vatRate }}%):</span>
                  <span>{{ formatCurrency(invoice.vatAmount) }} {{ invoice.currency }}</span>
                </div>
                <div class="flex justify-between font-medium border-t pt-2">
                  <span>Total:</span>
                  <span>{{ formatCurrency(invoice.finalAmount) }} {{ invoice.currency }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Notes -->
          <div v-if="invoice.note">
            <h4 class="font-medium text-gray-900 mb-2">Notes</h4>
            <p class="text-sm text-gray-600">{{ invoice.note }}</p>
          </div>

          <!-- Review History -->
          <div v-if="invoice.accounterReview?.reviewedBy">
            <h4 class="font-medium text-gray-900 mb-2">Review History</h4>
            <div class="bg-gray-50 p-3 rounded text-sm">
              <div>
                <span class="font-medium">Reviewed by:</span>
                {{
                  invoice.accounterReview.reviewedBy?.accounter?.fullName ||
                  invoice.accounterReview.reviewedBy
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
        </div>

        <div v-else class="text-center py-12 text-gray-500">Loading invoice details...</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  visible: { type: Boolean, default: false },
  invoice: { type: Object, default: null },
});

const emit = defineEmits(['close']);

function close() {
  emit('close');
}

function formatDate(dateString) {
  if (!dateString) return '';
  const d = new Date(dateString);
  return isNaN(d) ? '' : d.toLocaleDateString('vi-VN');
}

function formatDateTime(dateString) {
  if (!dateString) return '';
  const d = new Date(dateString);
  return isNaN(d) ? '' : d.toLocaleString('vi-VN');
}

function formatCurrency(amount) {
  const n = Number(amount || 0);
  return new Intl.NumberFormat('vi-VN').format(n);
}
</script>
