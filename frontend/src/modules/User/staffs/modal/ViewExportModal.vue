<template>
  <div
    v-if="visible"
    class="fixed inset-0 bg-gray-600 bg-opacity-50 z-50 flex items-center justify-center p-4"
  >
    <div class="w-full max-w-6xl max-h-[90vh] bg-white rounded-lg shadow-lg overflow-hidden flex flex-col">
      <!-- Modal Header - Fixed -->
      <div class="flex justify-between items-center p-6 border-b border-gray-200 bg-white">
        <h3 class="text-lg font-medium text-gray-900">Export Receipt Details</h3>
        <div class="space-x-2">
          <button v-if="canEdit" @click="$emit('open-edit')" class="px-3 py-1 text-green-700 border rounded">Edit</button>
          <button @click="$emit('close')" class="px-3 py-1 text-gray-600 border rounded">Close</button>
        </div>
      </div>

      <!-- Modal Content - Scrollable -->
      <div class="flex-1 overflow-y-auto p-6">
        <div v-if="receipt" class="space-y-4">
        <!-- basic -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="space-y-2">
            <div><strong>Receipt #:</strong> {{ receipt.receiptNumber }}</div>
            <div><strong>Customer:</strong> {{ receipt.customerName }}</div>
            <div><strong>Phone:</strong> {{ receipt.customerPhone || 'N/A' }}</div>
            <div><strong>Address:</strong> {{ receipt.customerAddress || 'N/A' }}</div>
          </div>
          <div class="space-y-2">
            <div>
              <strong>Status:</strong>
              <span :class="getStatusClass(receipt.status)" class="inline-flex px-2 py-1 text-xs rounded-full">{{ getStatusText(receipt.status) }}</span>
            </div>
            <div><strong>Created At:</strong> {{ formatDateTime(receipt.createdAt) }}</div>
            <div><strong>Created By:</strong> {{ getStaffName(receipt.createdByStaff) }}</div>
            <div><strong>Total:</strong> ${{ safeAmount(receipt.totalAmount) }}</div>
          </div>
        </div>

        <!-- products -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Products</label>
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                  <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                  <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                  <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                  <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-for="d in receipt.details" :key="d._id">
                  <td class="px-4 py-2 text-sm">{{ getProductName(d.productId) }}</td>
                  <td class="px-4 py-2 text-sm">{{ getProductSku(d.productId) }}</td>
                  <td class="px-4 py-2 text-sm">{{ d.quantity }}</td>
                  <td class="px-4 py-2 text-sm">${{ getProductPrice(d.productId) }}</td>
                  <td class="px-4 py-2 text-sm">${{ (Number(getProductPrice(d.productId) || 0) * Number(d.quantity)).toFixed(2) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- notes -->
        <div v-if="receipt.notes">
          <label class="block text-sm font-medium text-gray-700 mb-2">Notes</label>
          <p class="text-sm text-gray-800">{{ receipt.notes }}</p>
        </div>

        <!-- Manager Review (if exists) -->
        <div v-if="receipt.managerReview?.reviewedBy" class="p-4 rounded-lg bg-blue-50">
          <div class="text-sm">
            <strong class="text-blue-800">Manager Review</strong>
            <div class="mt-1"><strong>Reviewed by:</strong> {{ getManagerName(receipt.managerReview.reviewedBy) }}</div>
            <div><strong>Date:</strong> {{ formatDateTime(receipt.managerReview.reviewedAt) }}</div>
            <div><strong>Comment:</strong> {{ receipt.managerReview.comment || 'No comment' }}</div>
          </div>
        </div>

        <!-- Admin Approval (if exists) -->
        <div v-if="receipt.adminApproval?.approvedBy" class="p-4 rounded-lg bg-green-50">
          <div class="text-sm">
            <strong class="text-green-800">Admin Approval</strong>
            <div class="mt-1"><strong>Approved by:</strong>  {{ getAdminName(receipt.adminApproval.approvedBy) }}</div>
            <div><strong>Date:</strong> {{ formatDateTime(receipt.adminApproval.approvedAt) }}</div>
            <div><strong>Comment:</strong> {{ receipt.adminApproval.comment || 'No comment' }}</div>
          </div>
        </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ViewExportModal',
  props: {
    visible: { type: Boolean, default: false },
    receipt: { type: Object, default: null },
    // helpers
    getStaffName: { type: Function, required: true },
    getManagerName: { type: Function, required: true },
    getAdminName: { type: Function, required: true },
    getProductName: { type: Function, required: true },
    getProductSku: { type: Function, required: true },
    getProductPrice: { type: Function, required: true },
    formatDateTime: { type: Function, required: true },
    getStatusClass: { type: Function, required: true },
    getStatusText: { type: Function, required: true },
  },
  data() {
    return {
      scrollY: 0, // Store scroll position for body scroll prevention
    };
  },
  computed: {
    canEdit() {
      // staff can edit when receipt is created or rejected
      return this.receipt && (this.receipt.status === 'created' || this.receipt.status === 'rejected');
    }
  },
  methods: {
    safeAmount(a) {
      if (a === null || a === undefined) return '0.00';
      const n = Number(a);
      return !isNaN(n) ? n.toFixed(2) : '0.00';
    },

    // Methods to handle body scroll
    preventBodyScroll() {
      // Store current scroll position
      this.scrollY = window.scrollY;
      // Apply styles to prevent scrolling
      document.body.style.position = 'fixed';
      document.body.style.top = `-${this.scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
    },

    allowBodyScroll() {
      // Remove fixed positioning
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
      // Restore scroll position
      if (this.scrollY !== undefined) {
        window.scrollTo(0, this.scrollY);
      }
    },
  },
  watch: {
    visible(val) {
      if (val) {
        // Prevent body scroll when modal opens
        this.preventBodyScroll();
      } else {
        // Allow body scroll when modal closes
        this.allowBodyScroll();
      }
    },
  },
  mounted() {
    // Prevent body scroll if modal is already visible
    if (this.visible) {
      this.preventBodyScroll();
    }
  },
  beforeUnmount() {
    // Ensure body scroll is restored when component is destroyed
    this.allowBodyScroll();
  }
};
</script>
