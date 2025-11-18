<template>
  <div
    v-if="visible"
    class="fixed inset-0 bg-gray-600 bg-opacity-50 z-50 flex items-center justify-center p-4"
  >
    <div class="w-full max-w-6xl max-h-[90vh] bg-white rounded-lg shadow-lg overflow-hidden flex flex-col">
      <!-- Modal Header - Fixed -->
      <div class="flex justify-between items-center p-6 border-b border-gray-200 bg-white">
        <h3 class="text-lg font-medium text-gray-900">Create Invoice</h3>
        <button @click="onClose" class="text-gray-400 hover:text-gray-600" aria-label="Close modal">
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

      <!-- Modal Content - Scrollable -->
      <div class="flex-1 overflow-y-auto p-6">
        <form @submit.prevent="submit" class="space-y-4">
          <!-- Customer Info (Read-only) -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
              <input
                :value="selectedExport?.customerName"
                readonly
                class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Customer Phone</label>
              <input
                :value="selectedExport?.customerPhone"
                readonly
                class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Customer Address</label>
              <input
                :value="selectedExport?.customerAddress"
                readonly
                class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
              />
            </div>
          </div>

          <!-- Invoice Details -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Payment Condition *</label>
              <select
                v-model="localForm.paymentCondition"
                @blur="validateField('paymentCondition')"
                @change="clearFieldError('paymentCondition')"
                required
                :class="[
                  'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500',
                  fieldErrors.paymentCondition ? 'border-red-500' : 'border-gray-300'
                ]"
              >
                <option value="">Select payment condition</option>
                <option value="cash">Cash</option>
                <option value="net15">Net 15 days</option>
                <option value="net30">Net 30 days</option>
                <option value="net45">Net 45 days</option>
                <option value="net60">Net 60 days</option>
              </select>
              <p v-if="fieldErrors.paymentCondition" class="mt-1 text-sm text-red-600">{{ fieldErrors.paymentCondition }}</p>
              <p v-if="localForm.paymentCondition && !fieldErrors.paymentCondition" class="mt-1 text-xs text-gray-500">
                Payment condition validated on server
              </p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Currency *</label>
              <select
                v-model="localForm.currency"
                @blur="validateField('currency')"
                @change="clearFieldError('currency')"
                required
                :class="[
                  'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500',
                  fieldErrors.currency ? 'border-red-500' : 'border-gray-300'
                ]"
              >
                <option value="">Select currency</option>
                <option value="VND">VND</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
              <p v-if="fieldErrors.currency" class="mt-1 text-sm text-red-600">{{ fieldErrors.currency }}</p>
              <p v-if="localForm.currency && !fieldErrors.currency" class="mt-1 text-xs text-gray-500">
                Currency validated on server
              </p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">VAT Rate (%)</label>
              <input
                v-model.number="localForm.vatRate"
                @blur="validateField('vatRate')"
                @input="clearFieldError('vatRate')"
                type="number"
                min="0"
                max="100"
                step="0.1"
                :class="[
                  'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500',
                  fieldErrors.vatRate ? 'border-red-500' : 'border-gray-300'
                ]"
              />
              <p v-if="fieldErrors.vatRate" class="mt-1 text-sm text-red-600">{{ fieldErrors.vatRate }}</p>
              <p v-if="localForm.vatRate && !fieldErrors.vatRate" class="mt-1 text-xs text-gray-500">
                VAT rate must be between 0-100% (validated on server)
              </p>
            </div>
          </div>

          <!-- Export Receipt Preview -->
          <div v-if="selectedExport" class="border rounded-lg p-4 bg-gray-50">
            <h4 class="font-medium text-gray-900 mb-3">Invoice Preview</h4>

            <!-- Products Table -->
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-100">
                  <tr>
                    <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                    <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                    <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                    <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                    <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  <tr
                    v-for="(detail, idx) in selectedExport.details || []"
                    :key="detail._id || detail.productId"
                  >
                    <td class="px-3 py-2 text-sm text-gray-900">{{ idx + 1 }}</td>
                    <td class="px-3 py-2 text-sm text-gray-900">{{ getProductName(detail) }}</td>
                    <td class="px-3 py-2 text-sm text-gray-500">{{ detail.quantity }}</td>
                    <td class="px-3 py-2 text-sm text-gray-500">{{ formatCurrency(convertPrice(getProductPrice(detail))) }} {{ localForm.currency }}</td>
                    <td class="px-3 py-2 text-sm text-gray-900">{{ formatCurrency(convertPrice(getProductPrice(detail) * detail.quantity)) }} {{ localForm.currency }}</td>
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
            <textarea
              v-model="localForm.note"
              rows="3"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Additional notes for the invoice..."
            ></textarea>
          </div>

          <!-- Actions -->
          <div class="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              @click="onClose"
              class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="isSubmitting"
              class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <span v-if="isSubmitting">Creating...</span>
              <span v-else>Create Invoice</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
/*
  CreateInvoiceModal.vue
  - Now performs invoice creation (POST /api/invoices) internally
  - Uses Vue Toastification to show success/error toasts inside the modal
  - Emits 'created' with new invoice data on success, 'close' when closed
  Note: ensure you registered Toastification plugin in your app (main.js)
    import Toast from 'vue-toastification'
    import 'vue-toastification/dist/index.css'
    app.use(Toast, { position: 'top-right' })
*/

import { reactive, watch, computed, ref, onMounted, onUnmounted } from 'vue';
import axios from 'axios';
import { useToast } from 'vue-toastification';

const props = defineProps({
  visible: { type: Boolean, default: false },
  selectedExport: { type: Object, default: null },
});

const emit = defineEmits(['created', 'close', 'error']);

const toast = useToast();

// Scroll management
const scrollY = ref(0); // Store scroll position for body scroll prevention

// Exchange rates (USD as base currency) - consider moving to a shared store or API for real app
const exchangeRates = {
  USD: 1,
  VND: 26363,
  EUR: 0.86,
};

const defaultForm = () => ({
  paymentCondition: 'net30',
  currency: 'USD',
  vatRate: 10,
  note: '',
});

const localForm = reactive(defaultForm());
const isSubmitting = ref(false);
const fieldErrors = reactive({});

// Computed: subtotal / vat / total in USD (assuming stored prices are in USD)
const subtotalUSD = computed(() => {
  if (!props.selectedExport?.details) return 0;
  return props.selectedExport.details.reduce((sum, detail) => {
    const price = Number(getProductPrice(detail) || 0);
    const quantity = Number(detail.quantity || 0);
    return sum + price * quantity;
  }, 0);
});

const vatAmountUSD = computed(() => {
  return subtotalUSD.value * (Number(localForm.vatRate || 0) / 100);
});

const totalUSD = computed(() => {
  return subtotalUSD.value + vatAmountUSD.value;
});

// Helper functions
function getProductName(detail) {
  return detail.productName || (detail.productId && detail.productId.name) || detail.productId || 'Unknown Product';
}

function getProductPrice(detail) {
  // Prefer explicit unitPrice on detail
  if (detail.unitPrice != null) return Number(detail.unitPrice);

  // If product is populated object
  if (detail.productId && typeof detail.productId === 'object') {
    return Number(detail.productId.finalPrice ?? detail.productId.basePrice ?? detail.productId.price ?? 0);
  }

  // Fallback
  return 0;
}

function convertPrice(usdAmount) {
  const rate = Number(exchangeRates[localForm.currency] ?? 1);
  const converted = Number(usdAmount || 0) * rate;
  // round to 2 decimals
  return Math.round((converted + Number.EPSILON) * 100) / 100;
}

function formatCurrency(amount) {
  const value = Number(amount || 0);
  try {
    // Use currency-aware formatter
    return new Intl.NumberFormat(undefined, { style: 'decimal', maximumFractionDigits: 2 }).format(value);
  } catch (e) {
    return value.toLocaleString();
  }
}

// reset form when closing and handle body scroll
watch(
  () => props.visible,
  (v) => {
    if (v) {
      // Prevent body scroll when modal opens
      preventBodyScroll();
    } else {
      // Allow body scroll when modal closes
      allowBodyScroll();
      Object.assign(localForm, defaultForm());
      isSubmitting.value = false;
      Object.keys(fieldErrors).forEach(key => delete fieldErrors[key]);
    }
  },
);

// Frontend validation methods
function validateField(fieldName) {
  clearFieldError(fieldName);

  switch (fieldName) {
    case 'paymentCondition':
      if (!localForm.paymentCondition) {
        fieldErrors.paymentCondition = 'Payment condition is required';
      } else if (!['cash', 'net15', 'net30', 'net45', 'net60'].includes(localForm.paymentCondition)) {
        fieldErrors.paymentCondition = 'Invalid payment condition';
      }
      break;

    case 'currency':
      if (!localForm.currency) {
        fieldErrors.currency = 'Currency is required';
      } else if (!['VND', 'USD', 'EUR'].includes(localForm.currency)) {
        fieldErrors.currency = 'Invalid currency';
      }
      break;

    case 'vatRate':
      if (isNaN(localForm.vatRate)) {
        fieldErrors.vatRate = 'VAT rate must be a valid number';
      } else if (localForm.vatRate < 0) {
        fieldErrors.vatRate = 'VAT rate must be ≥ 0';
      } else if (localForm.vatRate > 100) {
        fieldErrors.vatRate = 'VAT rate must be ≤ 100';
      }
      break;
  }
}

function clearFieldError(fieldName) {
  if (fieldErrors[fieldName]) {
    delete fieldErrors[fieldName];
  }
}

function validate() {
  // Clear previous errors
  Object.keys(fieldErrors).forEach(key => delete fieldErrors[key]);

  // Validate all fields
  validateField('paymentCondition');
  validateField('currency');
  validateField('vatRate');

  // Check if any field has errors
  const hasFieldErrors = Object.keys(fieldErrors).length > 0;

  if (hasFieldErrors) {
    toast.error('Please fix the highlighted fields above');
    emit('error', 'Please fix the highlighted fields above');
    return false;
  }

  if (!props.selectedExport || !props.selectedExport._id) {
    toast.error('No export receipt selected');
    emit('error', 'No export receipt selected');
    return false;
  }

  return true;
}

async function submit() {
  if (!validate()) return;

  const payload = {
    exportReceiptId: props.selectedExport._id,
    paymentCondition: localForm.paymentCondition,
    currency: localForm.currency,
    vatRate: Number(localForm.vatRate),
    note: localForm.note,
    // Optionally include line items if backend expects them
    items: (props.selectedExport.details || []).map((d) => ({
      productId: d.productId && typeof d.productId === 'object' ? d.productId._id ?? d.productId.id : d.productId,
      productName: getProductName(d),
      unitPrice: getProductPrice(d),
      quantity: d.quantity || 0,
    })),
    subtotal: subtotalUSD.value,
    vatAmount: vatAmountUSD.value,
    total: totalUSD.value,
  };

  isSubmitting.value = true;
  try {
    const res = await axios.post('/api/invoices/from-export', payload);
    // Assume API returns created invoice in res.data
    toast.success('Invoice created successfully');
    emit('created', res.data);
    // auto-close modal after short delay to let user see toast
    setTimeout(() => {
      emit('close');
    }, 400);
  } catch (err) {
    const msg = err?.response?.data?.message || err.message || 'Failed to create invoice';
    toast.error(msg);
    emit('error', msg);
  } finally {
    isSubmitting.value = false;
  }
}

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
</script>

<style scoped>
/* small scoped tweaks if needed */
</style>
