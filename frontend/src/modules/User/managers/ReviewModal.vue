<template>
  <div v-if="visible" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
    <div class="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
      <div class="mt-3">
        <h3 class="text-lg font-medium text-gray-900 mb-4">{{ actionTitle }} Export Receipt</h3>

        <div v-if="receipt" class="mb-6 p-4 bg-gray-50 rounded-lg">
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div><strong>Receipt #:</strong> {{ receipt.receiptNumber }}</div>
            <div><strong>Customer:</strong> {{ receipt.customerName }}</div>
            <div><strong>Total:</strong> ${{ safeAmount(receipt.totalAmount) }}</div>
            <div><strong>Staff:</strong> {{ getStaffName(receipt.createdByStaff) }}</div>
          </div>

          <div v-if="receipt.details && receipt.details.length" class="mt-4">
            <strong class="text-sm">Products:</strong>
            <ul class="mt-2 space-y-1 text-sm text-gray-600">
              <li v-for="d in receipt.details" :key="d._id">
                {{ getProductName(d.productId) }} - Qty: {{ d.quantity }}
              </li>
            </ul>
          </div>

          <div v-if="receipt.managerReview" class="mt-4 p-3 bg-blue-50 rounded">
            <strong class="text-sm text-blue-800">Previous Manager Review:</strong>
            <div class="text-sm text-blue-700 mt-1">
              <div><strong>Reviewed by:</strong> {{ getManagerName(receipt.managerReview.reviewedBy) }}</div>
              <div><strong>Date:</strong> {{ formatDateTime(receipt.managerReview.reviewedAt) }}</div>
              <div><strong>Comment:</strong> {{ receipt.managerReview.comment || 'No comment' }}</div>
            </div>
          </div>
        </div>

        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">Comment</label>
          <textarea v-model="localComment" rows="3"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            :placeholder="`Enter ${actionTitle.toLowerCase()} comment...`"></textarea>
        </div>

        <div class="flex justify-end space-x-3">
          <button @click="$emit('close')" class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Cancel</button>
          <button @click="onSubmit" :disabled="isSubmittingLocal"
            :class="action === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'"
            class="px-4 py-2 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50">
            {{ isSubmittingLocal ? 'Processing...' : (action === 'approve' ? 'Approve' : 'Reject') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ReviewModal',
  props: {
    visible: { type: Boolean, default: false },
    receipt: { type: Object, default: null },
    action: { type: String, default: '' }, // 'approve' or 'reject'
    isSubmitting: { type: Boolean, default: false },
    getStaffName: { type: Function, required: true },
    getProductName: { type: Function, required: true },
    getManagerName: { type: Function, required: true },
    formatDateTime: { type: Function, required: true },
  },
  data() {
    return { localComment: '', isSubmittingLocal: false };
  },
  watch: {
    isSubmitting(val) { this.isSubmittingLocal = val; },
    visible(val) { if (!val) this.localComment = ''; },
    action() { this.localComment = ''; },
  },
  computed: {
    actionTitle() { return this.action === 'approve' ? 'Approve' : 'Reject'; },
  },
  methods: {
    safeAmount(a) {
      if (typeof a === 'number' && !isNaN(a)) return a.toFixed(2);
      if (typeof a === 'string' && !isNaN(parseFloat(a))) return parseFloat(a).toFixed(2);
      return '0.00';
    },
    onSubmit() {
      this.$emit('submit', { action: this.action, comment: this.localComment.trim() });
    },
  },
};
</script>
