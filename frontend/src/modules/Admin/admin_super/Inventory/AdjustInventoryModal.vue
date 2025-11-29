<template>
  <div
    v-if="show"
    class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
    @click.self="close"
  >
    <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
      <div class="mt-3">
        <!-- Header -->
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-bold text-gray-900">Adjust Inventory</h3>
          <button
            @click="close"
            class="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Product Info -->
        <div v-if="inventory || loadedInventory" class="mb-4 p-3 bg-gray-50 rounded-lg">
          <div class="text-sm text-gray-600 mb-1">Product</div>
          <div class="font-medium text-gray-900">{{ (inventory || loadedInventory)?.productId?.name || 'N/A' }}</div>
          <div class="text-xs text-gray-500 mt-1">SKU: {{ (inventory || loadedInventory)?.productId?.sku || 'N/A' }}</div>
          <div class="text-sm text-gray-600 mt-2">Warehouse</div>
          <div class="font-medium text-gray-900">{{ (inventory || loadedInventory)?.warehouseId?.name || 'N/A' }}</div>
        </div>

        <!-- Product and Warehouse Selection (when inventory is null) -->
        <div v-if="!inventory" class="mb-4 space-y-4">
          <div>
            <label for="selectedProduct" class="block text-sm font-medium text-gray-700 mb-2">
              Select Product <span class="text-red-500">*</span>
            </label>
            <select
              id="selectedProduct"
              v-model="selectedProductId"
              @change="onProductSelected"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Choose a product...</option>
              <option v-for="product in availableProducts" :key="product._id" :value="product._id">
                {{ product.name }} ({{ product.sku }})
              </option>
            </select>
          </div>

          <div>
            <label for="selectedWarehouse" class="block text-sm font-medium text-gray-700 mb-2">
              Select Warehouse <span class="text-red-500">*</span>
            </label>
            <select
              id="selectedWarehouse"
              v-model="selectedWarehouseId"
              @change="onWarehouseSelected"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Choose a warehouse...</option>
              <option v-for="warehouse in warehouses" :key="warehouse._id" :value="warehouse._id">
                {{ warehouse.name }} - {{ warehouse.location }}
              </option>
            </select>
          </div>

          <div v-if="isLoadingInventory" class="text-center py-4">
            <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
            <p class="text-sm text-gray-600 mt-2">Loading inventory...</p>
          </div>
        </div>

        <!-- Current Quantity -->
        <div v-if="inventory || loadedInventory" class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-1">Current Quantity</label>
          <div class="text-lg font-semibold text-gray-900">
            {{ formatNumber((inventory || loadedInventory)?.quantity || 0) }} {{ (inventory || loadedInventory)?.productId?.unit || '' }}
          </div>
        </div>

        <!-- New Quantity -->
        <div v-if="inventory || loadedInventory" class="mb-4">
          <label for="newQuantity" class="block text-sm font-medium text-gray-700 mb-2">
            New Quantity <span class="text-red-500">*</span>
          </label>
          <input
            id="newQuantity"
            v-model.number="newQuantity"
            type="number"
            min="0"
            step="1"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter new quantity"
          />
        </div>

        <!-- Notes -->
        <div class="mb-4">
          <label for="notes" class="block text-sm font-medium text-gray-700 mb-2">
            Notes (optional)
          </label>
          <textarea
            id="notes"
            v-model="notes"
            rows="3"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Reason for adjustment..."
          ></textarea>
        </div>

        <!-- Adjustment Preview -->
        <div v-if="newQuantity !== null && (inventory || loadedInventory)" class="mb-4 p-3 bg-blue-50 rounded-lg">
          <div class="text-sm text-gray-600 mb-1">Adjustment</div>
          <div class="flex items-center gap-2">
            <span class="text-sm text-gray-700">{{ formatNumber((inventory || loadedInventory).quantity) }}</span>
            <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
            <span class="text-sm font-semibold text-blue-600">{{ formatNumber(newQuantity) }}</span>
            <span
              :class="[
                'text-sm font-semibold ml-2',
                quantityChange > 0 ? 'text-green-600' : quantityChange < 0 ? 'text-red-600' : 'text-gray-600'
              ]"
            >
              ({{ quantityChange > 0 ? '+' : '' }}{{ formatNumber(quantityChange) }})
            </span>
          </div>
        </div>

        <!-- Error Message -->
        <div v-if="error" class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div class="text-sm text-red-800">{{ error }}</div>
        </div>

        <!-- Actions -->
        <div class="flex justify-end gap-3 mt-6">
          <button
            @click="close"
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Cancel
          </button>
          <button
            @click="handleSubmit"
            :disabled="isSubmitting || (!inventory && !loadedInventory) || newQuantity === null || newQuantity < 0"
            class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ isSubmitting ? 'Updating...' : 'Update Inventory' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { inventoryService } from '@/services/inventoryService';

import axios from 'axios';

export default {
  name: 'AdjustInventoryModal',
  props: {
    show: {
      type: Boolean,
      default: false,
    },
    inventory: {
      type: Object,
      default: null,
    },
    warehouses: {
      type: Array,
      default: () => [],
    },
  },
  emits: ['close', 'updated', 'inventory-selected'],
  data() {
    return {
      newQuantity: null,
      notes: '',
      isSubmitting: false,
      error: null,
      selectedProductId: '',
      selectedWarehouseId: '',
      availableProducts: [],
      isLoadingInventory: false,
      loadedInventory: null,
    };
  },
  computed: {
    quantityChange() {
      const currentInventory = this.inventory || this.loadedInventory;
      if (this.newQuantity === null || !currentInventory) return 0;
      return this.newQuantity - (currentInventory.quantity || 0);
    },
  },
  watch: {
    show(newVal) {
      console.log('🔧 AdjustInventoryModal show changed:', newVal, 'inventory:', this.inventory);
      if (newVal) {
        if (this.inventory) {
          this.newQuantity = this.inventory.quantity || 0;
          this.notes = '';
          this.error = null;
          this.loadedInventory = this.inventory;
          console.log('✅ Modal initialized with inventory:', this.inventory);
        } else {
          // Reset form when opening without inventory
          this.selectedProductId = '';
          this.selectedWarehouseId = '';
          this.newQuantity = null;
          this.notes = '';
          this.error = null;
          this.loadedInventory = null;
          this.fetchProducts();
        }
      }
    },
    inventory(newVal) {
      console.log('🔧 AdjustInventoryModal inventory prop changed:', newVal);
      if (this.show && newVal) {
        this.newQuantity = newVal.quantity || 0;
        this.notes = '';
        this.error = null;
        this.loadedInventory = newVal;
      }
    },
  },
  methods: {
    close() {
      this.selectedProductId = '';
      this.selectedWarehouseId = '';
      this.loadedInventory = null;
      this.$emit('close');
    },
    async fetchProducts() {
      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        const response = await axios.get('/api/products', {
          params: { all: 'true' },
          headers: { Authorization: `Bearer ${token}` },
        });
        this.availableProducts = response.data.products || [];
        console.log('✅ Fetched products:', this.availableProducts.length);
      } catch (error) {
        console.error('❌ Error fetching products:', error);
        this.error = 'Failed to load products. Please try again.';
      }
    },
    async onProductSelected() {
      if (this.selectedProductId && this.selectedWarehouseId) {
        await this.fetchInventory();
      }
    },
    async onWarehouseSelected() {
      if (this.selectedProductId && this.selectedWarehouseId) {
        await this.fetchInventory();
      }
    },
    async fetchInventory() {
      if (!this.selectedProductId || !this.selectedWarehouseId) {
        return;
      }

      this.isLoadingInventory = true;
      this.error = null;

      try {
        console.log('📡 Fetching inventory for product:', this.selectedProductId, 'warehouse:', this.selectedWarehouseId);
        const response = await inventoryService.getInventoryByProductAndWarehouse(
          this.selectedProductId,
          this.selectedWarehouseId
        );

        console.log('📥 Inventory response:', response);

        if (response?.success) {
          const rawData = response.rawResponse?.data || response.data;
          if (rawData?.inventory) {
            this.loadedInventory = rawData.inventory;
            this.newQuantity = rawData.inventory.quantity || 0;
            this.notes = '';
            console.log('✅ Inventory loaded:', this.loadedInventory);
            // Emit event to parent to update selectedInventory
            this.$emit('inventory-selected', this.loadedInventory);
          } else {
            this.error = 'Inventory record not found for this product and warehouse. Please sync inventory first.';
            this.loadedInventory = null;
          }
        } else {
          this.error = response?.message || 'Failed to load inventory';
          this.loadedInventory = null;
        }
      } catch (error) {
        console.error('❌ Error fetching inventory:', error);
        this.error = error.response?.data?.message || 'Failed to load inventory. Please try again.';
        this.loadedInventory = null;
      } finally {
        this.isLoadingInventory = false;
      }
    },
    async handleSubmit() {
      if (this.newQuantity === null || this.newQuantity < 0) {
        this.error = 'Please enter a valid quantity (>= 0)';
        return;
      }

      const currentInventory = this.inventory || this.loadedInventory;
      if (!currentInventory || !currentInventory._id) {
        this.error = 'Invalid inventory record. Please select a product and warehouse.';
        return;
      }

      this.isSubmitting = true;
      this.error = null;

      try {
        const response = await inventoryService.updateInventory(currentInventory._id, {
          quantity: this.newQuantity,
          notes: this.notes,
        });

        if (response?.success || response?.data?.success) {
          const updatedInventory = response?.data?.inventory || response?.rawResponse?.data?.inventory;
          this.$toast?.success('Inventory updated successfully');
          this.$emit('updated', updatedInventory);
          this.close();
        } else {
          this.error = response?.message || response?.data?.message || 'Failed to update inventory';
        }
      } catch (error) {
        console.error('Error updating inventory:', error);
        this.error = error.response?.data?.message || 'Failed to update inventory';
      } finally {
        this.isSubmitting = false;
      }
    },
    formatNumber(num) {
      return new Intl.NumberFormat('vi-VN').format(num);
    },
  },
};
</script>

<style scoped>
/* Custom styles if needed */
</style>

