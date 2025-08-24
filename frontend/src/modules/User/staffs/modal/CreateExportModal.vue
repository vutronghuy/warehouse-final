<template>
  <div v-if="visible" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
    <div class="relative top-10 mx-auto p-6 border w-11/12 md:w-3/4 lg:w-2/3 shadow-lg rounded-md bg-white">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-medium text-gray-900">Create Export Receipt</h3>
        <button @click="$emit('close')" class="text-gray-400 hover:text-gray-600">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <div class="space-y-4">
        <!-- Customer info -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700">Customer Name *</label>
            <input v-model="form.customerName" type="text" class="w-full px-3 py-2 border rounded" placeholder="Enter customer name" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Customer Phone</label>
            <input v-model="form.customerPhone" type="tel" class="w-full px-3 py-2 border rounded" placeholder="Enter phone" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Customer Address</label>
            <input v-model="form.customerAddress" type="text" class="w-full px-3 py-2 border rounded" placeholder="Enter address" />
          </div>
        </div>

        <!-- product lines -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Products</label>
          <div class="space-y-3">
            <div v-for="(line, idx) in form.details" :key="idx" class="flex items-center space-x-3 p-3 border rounded">
              <div class="flex-1">
                <select v-model="line.productId" @change="onProductChange(idx)" class="w-full px-3 py-2 border rounded">
                  <option value="">Select a product...</option>
                  <option v-for="p in availableProducts" :key="p._id" :value="p._id">
                    {{ p.name }} ({{ p.sku }}) - Stock: {{ p.quantity }}
                  </option>
                </select>
              </div>

              <div class="w-28">
                <input v-model.number="line.quantity" type="number" min="1" :max="getMaxQuantity(line.productId)" class="w-full px-3 py-2 border rounded" />
              </div>

              <div class="w-24 text-sm text-gray-700">
                ${{ calculateProductPrice(line.productId) }}
              </div>

              <button @click="removeLine(idx)" class="text-red-600 hover:text-red-800" type="button" title="Remove">
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
          <textarea v-model="form.notes" rows="3" class="w-full px-3 py-2 border rounded" placeholder="Optional notes..."></textarea>
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
            {{ isSubmitting ? 'Creating...' : 'Create Export Receipt' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'CreateExportModal',
  props: {
    visible: { type: Boolean, default: false },
    availableProducts: { type: Array, default: () => [] }, // parent should include products (including selected ones)
    isSubmitting: { type: Boolean, default: false },
    getProductPrice: { type: Function, required: false }, // optional helper
  },
  data() {
    return {
      form: {
        customerName: '',
        customerPhone: '',
        customerAddress: '',
        details: [{ productId: '', quantity: 1 }],
        notes: ''
      }
    };
  },
  computed: {
    totalAmount() {
      return this.form.details.reduce((sum, d) => {
        const prod = this.availableProducts.find(p => p._id === d.productId);
        const price = prod ? (prod.basePrice ?? prod.price ?? 0) : 0;
        const q = Number(d.quantity) || 0;
        return sum + (price * q);
      }, 0).toFixed(2);
    }
  },
  methods: {
    addLine() {
      this.form.details.push({ productId: '', quantity: 1 });
    },
    removeLine(idx) {
      if (this.form.details.length > 1) this.form.details.splice(idx, 1);
    },
    onProductChange(idx) {
      // reset quantity when product changes
      this.form.details[idx].quantity = 1;
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
      if (!this.form.customerName.trim()) {
        this.$emit('error', 'Customer name is required');
        return false;
      }
      const validDetails = this.form.details.filter(d => d.productId && d.quantity > 0);
      if (!validDetails.length) {
        this.$emit('error', 'Add at least one product with quantity > 0');
        return false;
      }
      // validate stock
      const invalid = validDetails.some(d => {
        const p = this.availableProducts.find(x => x._id === d.productId);
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
      // emit payload for parent to call API
      const payload = {
        customerName: this.form.customerName,
        customerPhone: this.form.customerPhone,
        customerAddress: this.form.customerAddress,
        notes: this.form.notes,
        details: this.form.details.map(d => ({ productId: d.productId, quantity: Number(d.quantity) }))
      };
      this.$emit('submit', payload);
    }
  },
  watch: {
    visible(val) {
      if (!val) {
        // reset form when closed
        this.form = { customerName: '', customerPhone: '', customerAddress: '', details: [{ productId: '', quantity: 1 }], notes: '' };
      }
    }
  }
};
</script>
