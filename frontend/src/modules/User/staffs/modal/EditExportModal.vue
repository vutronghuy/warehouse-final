<template>
  <div v-if="visible" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
    <div class="relative top-10 mx-auto p-6 border w-11/12 md:w-3/4 lg:w-2/3 shadow-lg rounded-md bg-white">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-medium text-gray-900">{{ isResubmit ? 'Resubmit Export Receipt' : 'Edit Export Receipt' }}</h3>
        <button @click="$emit('close')" class="text-gray-400 hover:text-gray-600">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <div class="space-y-4">
        <!-- customer -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700">Customer Name *</label>
            <input v-model="local.customerName" type="text" class="w-full px-3 py-2 border rounded" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Customer Phone</label>
            <input v-model="local.customerPhone" type="tel" class="w-full px-3 py-2 border rounded" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Customer Address</label>
            <input v-model="local.customerAddress" type="text" class="w-full px-3 py-2 border rounded" />
          </div>
        </div>

        <!-- products -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Products</label>
          <div class="space-y-3">
            <div v-for="(d, idx) in local.details" :key="idx" class="flex items-center space-x-3 p-3 border rounded">
              <div class="flex-1">
                <select v-model="d.productId" @change="onProductChange(idx)" class="w-full px-3 py-2 border rounded">
                  <option value="">Select a product...</option>
                  <option v-for="p in availableProducts" :key="p._id" :value="p._id">
                    {{ p.name }} ({{ p.sku }}) - Stock: {{ p.quantity }}
                  </option>
                </select>
              </div>

              <div class="w-28">
                <input v-model.number="d.quantity" type="number" min="1" :max="getMaxQuantity(d.productId)" class="w-full px-3 py-2 border rounded" />
              </div>

              <div class="w-24 text-sm text-gray-700">${{ calculateProductPrice(d.productId) }}</div>

              <button @click="removeLine(idx)" class="text-red-600 hover:text-red-800" type="button">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6"/>
                </svg>
              </button>
            </div>
          </div>

          <button @click="addLine" type="button" class="mt-3 px-3 py-2 border rounded inline-flex items-center">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
            </svg>
            Add Product
          </button>
        </div>

        <!-- notes -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Notes</label>
          <textarea v-model="local.notes" rows="3" class="w-full px-3 py-2 border rounded"></textarea>
        </div>

        <!-- total -->
        <div class="p-3 bg-gray-50 rounded flex justify-between items-center">
          <div class="font-medium">Total Amount</div>
          <div class="text-xl font-bold text-blue-600">${{ totalAmount }}</div>
        </div>

        <!-- actions -->
        <div class="flex justify-end space-x-3">
          <button @click="$emit('close')" type="button" class="px-4 py-2 border rounded">Cancel</button>
          <button @click="onSubmit" :disabled="isSubmitting" type="button" class="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50">
            {{ isSubmitting ? (isResubmit ? 'Resubmitting...' : 'Updating...') : (isResubmit ? 'Resubmit Receipt' : 'Update Receipt') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'EditExportModal',
  props: {
    visible: { type: Boolean, default: false },
    receipt: { type: Object, default: null },
    availableProducts: { type: Array, default: () => [] }, // should include selected products even if out of stock
    isSubmitting: { type: Boolean, default: false },
    getProductPrice: { type: Function, required: false }
  },
  data() {
    return {
      local: {
        customerName: '',
        customerPhone: '',
        customerAddress: '',
        details: [],
        notes: ''
      }
    };
  },
  computed: {
    totalAmount() {
      return this.local.details.reduce((sum, d) => {
        const p = this.availableProducts.find(x => x._id === d.productId);
        const price = p ? (p.basePrice ?? p.price ?? 0) : 0;
        return sum + (Number(d.quantity || 0) * Number(price || 0));
      }, 0).toFixed(2);
    },
    isResubmit() {
      return this.receipt && this.receipt.status === 'rejected';
    }
  },
  watch: {
    receipt: {
      immediate: true,
      handler(r) {
        if (!r) {
          this.local = { customerName: '', customerPhone: '', customerAddress: '', details: [], notes: '' };
          return;
        }
        this.local.customerName = r.customerName || '';
        this.local.customerPhone = r.customerPhone || '';
        this.local.customerAddress = r.customerAddress || '';
        this.local.notes = r.notes || '';
        // normalize details: if productId is object, extract id
        this.local.details = (r.details || []).map(d => ({
          productId: (typeof d.productId === 'object' ? (d.productId._id || d.productId.id) : d.productId),
          quantity: d.quantity
        }));
        if (!this.local.details.length) this.local.details = [{ productId: '', quantity: 1 }];
      }
    }
  },
  methods: {
    addLine() {
      this.local.details.push({ productId: '', quantity: 1 });
    },
    removeLine(idx) {
      if (this.local.details.length > 1) this.local.details.splice(idx, 1);
    },
    onProductChange(idx) {
      this.local.details[idx].quantity = 1;
    },
    getMaxQuantity(productId) {
      const p = this.availableProducts.find(x => x._id === productId);
      return p ? p.quantity : 0;
    },
    calculateProductPrice(productId) {
      if (this.getProductPrice) return this.getProductPrice(productId);
      const p = this.availableProducts.find(x => x._id === productId);
      return p ? (Number(p.basePrice ?? p.price ?? 0).toFixed(2)) : '0.00';
    },
    validate() {
      if (!this.local.customerName.trim()) {
        this.$emit('error', 'Customer name is required');
        return false;
      }
      const valid = this.local.details.filter(d => d.productId && d.quantity > 0);
      if (!valid.length) {
        this.$emit('error', 'Add at least one product with quantity > 0');
        return false;
      }
      const invalid = valid.some(d => {
        const p = this.availableProducts.find(x => x._id === d.productId);
        // allow product that is selected even if current stock 0 (parent should include selected)
        return !p || Number(d.quantity) > Number(p.quantity);
      });
      if (invalid) {
        this.$emit('error', 'One or more quantities exceed available stock');
        return false;
      }
      return true;
    },
    onSubmit() {
      if (!this.validate()) return;
      const payload = {
        customerName: this.local.customerName,
        customerPhone: this.local.customerPhone,
        customerAddress: this.local.customerAddress,
        notes: this.local.notes,
        details: this.local.details.map(d => ({ productId: d.productId, quantity: Number(d.quantity) }))
      };
      this.$emit('submit', payload);
    }
  }
};
</script>
