<template>
  <div v-if="visible" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
    <div class="relative top-10 mx-auto p-5 border w-11/12 md:w-4/5 lg:w-3/4 shadow-lg rounded-md bg-white">
      <div class="mt-3">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-medium text-gray-900">Export Receipt Details</h3>
          <button @click="$emit('close')" class="text-gray-400 hover:text-gray-600">
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

        <div v-if="receipt" class="space-y-6">
          <!-- Basic Info -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700">Receipt Number</label>
                <p class="mt-1 text-sm text-gray-900">{{ receipt.receiptNumber }}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">Customer Name</label>
                <p class="mt-1 text-sm text-gray-900">{{ receipt.customerName }}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">Customer Phone</label>
                <p class="mt-1 text-sm text-gray-900">{{ receipt.customerPhone || 'N/A' }}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">Customer Address</label>
                <p class="mt-1 text-sm text-gray-900">{{ receipt.customerAddress || 'N/A' }}</p>
              </div>
            </div>
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700">Status</label>
                <span
                  :class="getStatusClass(receipt.status)"
                  class="inline-flex px-2 py-1 text-xs font-semibold rounded-full"
                >
                  {{ getStatusText(receipt.status) }}
                </span>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">Created By</label>
                <p class="mt-1 text-sm text-gray-900">{{ getStaffName(receipt.createdByStaff) }}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">Created At</label>
                <p class="mt-1 text-sm text-gray-900">{{ formatDateTime(receipt.createdAt) }}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">Total Amount</label>
                <p class="mt-1 text-lg font-semibold text-blue-600">${{ safeAmount(receipt.totalAmount) }}</p>
              </div>
            </div>
          </div>

          <!-- Products Table -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-3">Products</label>
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th
                      class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Product
                    </th>
                    <th
                      class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      SKU
                    </th>
                    <th
                      class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Current Stock
                    </th>
                    <th
                      class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Export Qty
                    </th>
                    <th
                      class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Unit Price
                    </th>
                    <th
                      class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  <tr v-for="detail in receipt.details" :key="detail._id">
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {{ getProductName(detail.productId) }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {{ getProductSku(detail.productId) }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {{ getProductStock(detail.productId) }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ detail.quantity }}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${{ safeAmount(getProductPrice(detail.productId)) }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${{ (detail.quantity * parseFloat(getProductPrice(detail.productId) || 0)).toFixed(2) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Notes -->
          <div v-if="receipt.notes">
            <label class="block text-sm font-medium text-gray-700">Notes</label>
            <p class="mt-1 text-sm text-gray-900">{{ receipt.notes }}</p>
          </div>

          <!-- Review History -->
          <div class="border-t pt-4 space-y-4">
            <label class="block text-sm font-medium text-gray-700">Review History</label>

            <div v-if="receipt.managerReview?.reviewedBy" class="bg-blue-50 p-4 rounded-lg">
              <div class="text-sm">
                <strong class="text-blue-800">Manager Review:</strong>
                {{ getManagerName(receipt.managerReview.reviewedBy) }}<br />
                <strong class="text-blue-800">Date:</strong>
                {{ formatDateTime(receipt.managerReview.reviewedAt) }}<br />
                <strong class="text-blue-800">Comment:</strong>
                {{ receipt.managerReview.comment || 'No comment' }}
              </div>
            </div>

            <div v-if="receipt.adminApproval?.approvedBy" class="bg-green-50 p-4 rounded-lg">
              <div class="text-sm">
                <strong class="text-green-800">Admin Approval:</strong>
                {{ getAdminName(receipt.adminApproval.approvedBy) }}<br />
                <strong class="text-green-800">Date:</strong>
                {{ formatDateTime(receipt.adminApproval.approvedAt) }}<br />
                <strong class="text-green-800">Comment:</strong>
                {{ receipt.adminApproval.comment || 'No comment' }}
              </div>
            </div>
          </div>

          <!-- Actions: allow triggering approval modal from view -->
          <div class="flex justify-end mt-4 space-x-3">
            <button
              @click="$emit('close')"
              class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Close
            </button>
            <template v-if="receipt.status === 'reviewed'">
              <button
                @click="$emit('open-approval', 'reject')"
                class="px-4 py-2 text-red-600 hover:text-red-900"
              >
                Reject
              </button>
              <button
                @click="$emit('open-approval', 'approve')"
                class="px-4 py-2 text-green-600 hover:text-green-900"
              >
                Approve
              </button>
            </template>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ViewReceiptModal',
  props: {
    visible: { type: Boolean, default: false },
    receipt: { type: Object, default: null },
    // helper functions passed down from parent (admin.vue)
    getStaffName: { type: Function, required: true },
    getManagerName: { type: Function, required: true },
    getAdminName: { type: Function, required: true },
    getProductName: { type: Function, required: true },
    getProductSku: { type: Function, required: true },
    getProductStock: { type: Function, required: true },
    getProductPrice: { type: Function, required: true },
    formatDateTime: { type: Function, required: true },
    getStatusClass: { type: Function, required: true },
    getStatusText: { type: Function, required: true },
  },
  methods: {
    safeAmount(a) {
      if (typeof a === 'number' && !isNaN(a)) return a.toFixed(2);
      if (typeof a === 'string' && !isNaN(parseFloat(a))) return parseFloat(a).toFixed(2);
      return '0.00';
    },
  },
};
</script>
