<template>
  <div v-if="visible" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" @keydown.esc.prevent="onClose" tabindex="-1">
    <div class="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white" @click.self.stop>
      <div class="mt-3">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-medium text-gray-900">Edit Invoice</h3>
          <button @click="onClose" class="text-gray-400 hover:text-gray-600" aria-label="Close">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <form @submit.prevent="submit" class="space-y-4" :aria-busy="isSubmitting">
          <fieldset :disabled="isSubmitting" class="space-y-4">
            <!-- Customer Info (Read-only) -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
                <input :value="invoice?.customerName || ''" readonly class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Customer Phone</label>
                <input :value="invoice?.customerPhone || ''" readonly class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Customer Address</label>
                <input :value="invoice?.customerAddress || ''" readonly class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50" />
              </div>
            </div>

            <!-- Editable Invoice Details -->
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

            <!-- Due date & Status -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                <input v-model="localForm.dueDate" type="date" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>

            <!-- Invoice Preview with Currency Conversion -->
            <div v-if="invoice" class="border rounded-lg p-4 bg-gray-50">
              <h4 class="font-medium text-gray-900 mb-3">Invoice Preview</h4>

              <!-- Products Table -->
              <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                  <thead class="bg-gray-100">
                    <tr>
                      <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                      <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                      <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                      <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Unit Price
                      </th>
                      <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                    </tr>
                  </thead>
                  <tbody class="bg-white divide-y divide-gray-200">
                    <tr
                      v-for="(detail, idx) in invoice.details || []"
                      :key="detail._id || detail.productId"
                    >
                      <td class="px-3 py-2 text-sm text-gray-900">{{ idx + 1 }}</td>
                      <td class="px-3 py-2 text-sm text-gray-900">
                        {{ getProductName(detail) }}
                      </td>
                      <td class="px-3 py-2 text-sm text-gray-500">{{ detail.quantity }}</td>
                      <td class="px-3 py-2 text-sm text-gray-500">
                        {{ formatCurrency(convertPrice(getOriginalUnitPriceUSD(detail))) }} {{ localForm.currency }}
                      </td>
                      <td class="px-3 py-2 text-sm text-gray-900">
                        {{ formatCurrency(convertPrice(getOriginalUnitPriceUSD(detail) * detail.quantity)) }}
                        {{ localForm.currency }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- Totals -->
              <div class="mt-4 flex justify-end">
                <div class="w-64 space-y-2 text-sm">
                  <div class="flex justify-between">
                    <span>Subtotal:</span>
                    <span class="font-medium">{{ formatCurrency(convertPrice(subtotalUSD)) }} {{ localForm.currency }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span>VAT ({{ localForm.vatRate }}%):</span>
                    <span class="font-medium">{{ formatCurrency(convertPrice(vatAmountUSD)) }} {{ localForm.currency }}</span>
                  </div>
                  <div class="flex justify-between font-medium border-t pt-2">
                    <span>Total:</span>
                    <span class="font-semibold">{{ formatCurrency(convertPrice(totalUSD)) }} {{ localForm.currency }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Note -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Note</label>
              <textarea v-model="localForm.note" rows="3" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Additional notes for the invoice..."></textarea>
            </div>

            <!-- Error text -->
            <div v-if="localError" class="text-sm text-red-700 bg-red-50 border border-red-200 p-2 rounded">
              {{ localError }}
            </div>

            <!-- Actions -->
            <div class="flex justify-end space-x-3 pt-4">
              <button type="button" @click="onClose" class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Cancel</button>
              <button type="submit" :disabled="isSubmitting" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                {{ isSubmitting ? 'Saving...' : 'Save Changes' }}
              </button>
            </div>
          </fieldset>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, watch, computed } from 'vue'

const props = defineProps({
  visible: { type: Boolean, default: false },
  invoice: { type: Object, default: null },
  isSubmitting: { type: Boolean, default: false }
})

const emit = defineEmits(['submit', 'close', 'error'])

// Exchange rates (USD as base currency)
const exchangeRates = {
  USD: 1,
  VND: 26363, // 1 USD ≈ 26,363 VND
  EUR: 0.86, // 1 USD ≈ 0.86 EUR
};

const defaultForm = (inv = null) => ({
  paymentCondition: inv?.paymentCondition || 'net30',
  currency: inv?.currency || 'VND',
  vatRate: inv?.vatRate != null ? Number(inv.vatRate) : 10,
  note: inv?.note || '',
  dueDate: inv?.dueDate ? formatDateInput(inv.dueDate) : '',
})

const localForm = reactive(defaultForm(props.invoice))
const localError = ref('')

// Computed properties for price calculations
const subtotalUSD = computed(() => {
  if (!props.invoice?.details) return 0;
  return props.invoice.details.reduce((sum, detail) => {
    return sum + getOriginalUnitPriceUSD(detail) * detail.quantity;
  }, 0);
});

const vatAmountUSD = computed(() => {
  return subtotalUSD.value * (localForm.vatRate / 100);
});

const totalUSD = computed(() => {
  return subtotalUSD.value + vatAmountUSD.value;
});

// Helper functions
function getProductName(detail) {
  return detail.productName || detail.productId?.name || detail.productId || 'Unknown Product';
}

function getOriginalUnitPriceUSD(detail) {
  // Convert current price back to USD based on original currency
  const originalCurrency = props.invoice?.currency || 'USD';
  const originalRate = exchangeRates[originalCurrency] || 1;
  const currentPriceInOriginalCurrency = detail.unitPrice || 0;

  // Convert back to USD
  return currentPriceInOriginalCurrency / originalRate;
}

function convertPrice(usdAmount) {
  const rate = exchangeRates[localForm.currency] || 1;
  return usdAmount * rate;
}

function formatCurrency(amount) {
  const n = Number(amount || 0);
  return new Intl.NumberFormat('vi-VN').format(n);
}

watch(
  () => props.visible,
  (v) => {
    if (!v) {
      // reset when modal closes
      Object.assign(localForm, defaultForm(null));
      localError.value = '';
    } else {
      // when opening, prefill from invoice
      Object.assign(localForm, defaultForm(props.invoice));
      localError.value = '';
    }
  },
);

watch(
  () => props.invoice,
  (inv) => {
    if (props.visible) Object.assign(localForm, defaultForm(inv));
  },
);

function formatDateInput(dateString) {
  if (!dateString) return '';
  const d = new Date(dateString);
  // build yyyy-mm-dd
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function validate() {
  if (!localForm.paymentCondition) {
    localError.value = 'Payment condition is required';
    emit('error', localError.value);
    return false;
  }
  if (!localForm.currency) {
    localError.value = 'Currency is required';
    emit('error', localError.value);
    return false;
  }
  if (isNaN(localForm.vatRate) || localForm.vatRate < 0 || localForm.vatRate > 100) {
    localError.value = 'VAT rate must be between 0 and 100';
    emit('error', localError.value);
    return false;
  }
  if (!props.invoice || !props.invoice._id) {
    localError.value = 'No invoice selected';
    emit('error', localError.value);
    return false;
  }
  localError.value = '';
  return true;
}

function submit() {
  if (!validate()) return;
  const payload = {
    invoiceId: props.invoice._id,
    paymentCondition: localForm.paymentCondition,
    currency: localForm.currency,
    vatRate: Number(localForm.vatRate),
    note: localForm.note,
    dueDate: localForm.dueDate || null,
  };
  emit('submit', payload);
}

function onClose() {
  emit('close');
}
</script>
