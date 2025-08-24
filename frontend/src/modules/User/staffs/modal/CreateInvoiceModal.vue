<template>
  <div v-if="visible" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
    <div class="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
      <div class="mt-3">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-medium text-gray-900">Create Invoice</h3>
          <button @click="onClose" class="text-gray-400 hover:text-gray-600">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <form @submit.prevent="submit" class="space-y-4">
          <!-- Customer Info (Read-only) -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
              <input :value="selectedExport?.customerName" readonly class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Customer Phone</label>
              <input :value="selectedExport?.customerPhone" readonly class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Customer Address</label>
              <input :value="selectedExport?.customerAddress" readonly class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50" />
            </div>
          </div>

          <!-- Invoice Details -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Payment Condition *</label>
              <select v-model="localForm.paymentCondition" required class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="cash">Cash</option>
                <option value="net15">Net 15 days</option>
                <option value="net30">Net 30 days</option>
                <option value="net45">Net 45 days</option>
                <option value="net60">Net 60 days</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Currency *</label>
              <select v-model="localForm.currency" required class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="VND">VND</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">VAT Rate (%)</label>
              <input v-model.number="localForm.vatRate" type="number" min="0" max="100" step="0.1" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <!-- Note -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Note</label>
            <textarea v-model="localForm.note" rows="3" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Additional notes for the invoice..."></textarea>
          </div>

          <!-- Actions -->
          <div class="flex justify-end space-x-3 pt-4">
            <button type="button" @click="onClose" class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Cancel</button>
            <button type="submit" :disabled="isSubmitting" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {{ isSubmitting ? 'Creating...' : 'Create Invoice' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, watch } from 'vue'

const props = defineProps({
  visible: { type: Boolean, default: false },
  selectedExport: { type: Object, default: null },
  isSubmitting: { type: Boolean, default: false }
})

const emit = defineEmits(['submit', 'close', 'error'])

const defaultForm = () => ({
  paymentCondition: 'net30',
  currency: 'VND',
  vatRate: 10,
  note: ''
})

const localForm = reactive(defaultForm())

watch(() => props.visible, (v) => {
  if (!v) {
    // reset when modal closes
    Object.assign(localForm, defaultForm())
  }
})

function validate() {
  if (!localForm.paymentCondition) {
    emit('error', 'Payment condition is required')
    return false
  }
  if (!localForm.currency) {
    emit('error', 'Currency is required')
    return false
  }
  if (localForm.vatRate < 0 || localForm.vatRate > 100 || isNaN(localForm.vatRate)) {
    emit('error', 'VAT rate must be between 0 and 100')
    return false
  }
  if (!props.selectedExport || !props.selectedExport._id) {
    emit('error', 'No export receipt selected')
    return false
  }
  return true
}

function submit() {
  if (!validate()) return
  const payload = {
    paymentCondition: localForm.paymentCondition,
    currency: localForm.currency,
    vatRate: Number(localForm.vatRate),
    note: localForm.note
  }
  emit('submit', payload)
}

function onClose() {
  emit('close')
}
</script>
