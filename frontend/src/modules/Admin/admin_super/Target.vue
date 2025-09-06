<template>
  <div class="flex h-screen bg-gray-50">
    <Sidebar />
    <div class="flex-1 flex flex-col overflow-hidden">
      <Header />
      <div class="p-6 max-w-6xl mx-auto">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-2xl font-semibold">Target Management</h2>
          <div class="flex items-center space-x-3">
            <select v-model="selectedWarehouse" @change="onWarehouseChange" class="border rounded px-3 py-2">
              <option disabled value="">Select warehouse</option>
              <option v-for="w in warehouses" :key="w._id" :value="w._id">{{ w.name }}</option>
            </select>

            <input
              v-model.number="filterYear"
              type="number"
              min="2000"
              :max="maxYear"
              class="border rounded px-3 py-2 w-28"
            />

            <button @click="fetchTargets" class="bg-blue-600 text-white px-4 py-2 rounded">Load</button>
          </div>
        </div>

        <div v-if="!selectedWarehouse" class="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <p class="text-sm text-yellow-800">Please select a warehouse to manage targets.</p>
        </div>

        <div v-if="selectedWarehouse" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Form to add / edit target -->
          <div class="bg-white rounded shadow p-4">
            <h3 class="font-semibold mb-3">Set / Edit Target</h3>
            <form @submit.prevent="saveTarget">
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="text-sm block mb-1">Warehouse</label>
                  <select v-model="form.warehouse" class="border rounded px-3 py-2 w-full">
                    <option disabled value="">Select warehouse</option>
                    <option v-for="w in warehouses" :key="w._id" :value="w._id">{{ w.name }}</option>
                  </select>
                </div>
                <div>
                  <label class="text-sm block mb-1">Year</label>
                  <input
                    v-model.number="form.year"
                    type="number"
                    min="2000"
                    :max="maxYear"
                    class="border rounded px-3 py-2 w-full"
                  />
                </div>
              </div>

              <div class="mt-3">
                <label class="text-sm block mb-1">Month</label>
                <select v-model.number="form.month" class="border rounded px-3 py-2 w-full">
                  <option v-for="m in 12" :key="m" :value="m">{{ m }}</option>
                </select>
              </div>

              <div class="mt-3">
                <label class="text-sm block mb-1">Amount</label>
                <input
                  v-model.number="form.amount"
                  type="number"
                  min="0"
                  step="0.01"
                  class="border rounded px-3 py-2 w-full"
                />
              </div>

              <div class="mt-4 flex items-center space-x-2">
                <button :disabled="saving" type="submit" class="bg-green-600 text-white px-4 py-2 rounded">
                  {{ form._id ? 'Update' : 'Create' }}
                </button>
                <button type="button" @click="resetForm" class="px-4 py-2 border rounded">Clear</button>
              </div>

              <p v-if="formError" class="text-sm text-red-600 mt-3">{{ formError }}</p>
            </form>

          </div>

          <!-- Targets list -->
          <div class="bg-white rounded shadow p-4">
            <h3 class="font-semibold mb-3">
              Targets for {{ displayYear }} — Warehouse: {{ selectedWarehouseName }}
            </h3>

            <table class="w-full text-sm">
              <thead>
                <tr class="text-left text-xs text-gray-500 border-b">
                  <th class="py-2">Month</th>
                  <th class="py-2">Amount</th>
                  <th class="py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="loadingTargets">
                  <td colspan="3" class="py-4 text-center">Loading...</td>
                </tr>
                <tr v-if="!loadingTargets && targets.length === 0">
                  <td colspan="3" class="py-4 text-center text-gray-500">No targets set for this year.</td>
                </tr>
                <tr v-for="t in targets" :key="t._id" class="border-b hover:bg-gray-50">
                  <td class="py-2">{{ t.month }}</td>
                  <td class="py-2">{{ formatCurrency(t.amount) }}</td>
                  <td class="py-2">
                    <button @click="editTarget(t)" class="text-blue-600 mr-3">Edit</button>
                    <button @click="confirmDelete(t)" class="text-red-600">Delete</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- confirm delete modal -->
        <div v-if="showDeleteModal" class="fixed inset-0 flex items-center justify-center z-50">
          <div class="absolute inset-0 bg-black opacity-40" @click="showDeleteModal = false"></div>
          <div class="bg-white rounded p-6 z-60 w-96">
            <h4 class="font-semibold mb-3">Delete Target</h4>
            <p class="text-sm mb-4">
              Are you sure you want to delete target for month {{ deletingTarget?.month }} /
              {{ deletingTarget?.year }}?
            </p>
            <div class="flex justify-end space-x-2">
              <button @click="showDeleteModal = false" class="px-3 py-2 border rounded">Cancel</button>
              <button @click="deleteTarget()" class="px-3 py-2 bg-red-600 text-white rounded">Delete</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';
import Sidebar from './Sidebar.vue';
import Header from './header.vue';

const warehouses = ref([]);
const selectedWarehouse = ref('');
const filterYear = ref(new Date().getFullYear());

const targets = ref([]);
const loadingTargets = ref(false);
const saving = ref(false);
const form = ref({ _id: null, warehouse: '', year: filterYear.value, month: 1, amount: 0 });
const formError = ref('');

const showDeleteModal = ref(false);
const deletingTarget = ref(null);

const maxYear = new Date().getFullYear();

const selectedWarehouseName = computed(() => {
  const w = warehouses.value.find((x) => x._id === selectedWarehouse.value);
  return w ? w.name : '';
});

const displayYear = computed(() => filterYear.value);

function formatCurrency(v) {
  if (v === null || v === undefined) return '-';
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(v);
}

// helper to extract warehouse id from target.warehouse which might be object or id
function getWarehouseId(w) {
  if (!w) return '';
  if (typeof w === 'string') return w;
  if (typeof w === 'object') return w._id || w.id || '';
  return '';
}

// Fetch warehouses
async function fetchWarehouses() {
  try {
    const res = await axios.get('/api/warehouses');
    warehouses.value = res.data?.warehouses || res.data || [];
    // if none selected, set first
    if (!selectedWarehouse.value && warehouses.value.length) {
      selectedWarehouse.value = warehouses.value[0]._id;
      // also set form.warehouse default
      form.value.warehouse = selectedWarehouse.value;
    }
  } catch (err) {
    console.error('Error loading warehouses', err);
  }
}

// Fetch targets for selected warehouse & year
async function fetchTargets() {
  if (!selectedWarehouse.value) return;
  loadingTargets.value = true;
  try {
    const res = await axios.get('/api/targets', {
      params: { warehouse: selectedWarehouse.value, year: filterYear.value },
    });

    const data = res.data;

    // Normalize possible response shapes into an array
    let list = [];

    if (!data) {
      list = [];
    } else if (Array.isArray(data)) {
      // API returned an array directly
      list = data;
    } else if (Array.isArray(data.targets)) {
      // API returned { targets: [...] }
      list = data.targets;
    } else if (Array.isArray(data.data)) {
      // some APIs return { data: [...] }
      list = data.data;
    } else if (data.targets) {
      // single object -> wrap into array
      list = Array.isArray(data.targets) ? data.targets : [data.targets];
    } else if (data.target) {
      // single target field
      list = Array.isArray(data.target) ? data.target : [data.target];
    } else if (data.results) {
      // other possible key
      list = Array.isArray(data.results) ? data.results : [];
    } else {
      // fallback: if the response looks like a single target object with fields (year, month, amount)
      if (typeof data === 'object' && (data.month || data.amount || data.year)) {
        list = [data];
      } else {
        list = [];
      }
    }

    // ensure it's an array
    if (!Array.isArray(list)) list = [];

    targets.value = list;

    // normalize months (ensure sorted) only if array
    if (Array.isArray(targets.value)) {
      targets.value.sort((a, b) => (Number(a.month) || 0) - (Number(b.month) || 0));
    }

    // If form has no warehouse selected, prefill with selectedWarehouse
    if (!form.value.warehouse) {
      form.value.warehouse = selectedWarehouse.value;
    }
  } catch (err) {
    console.error('Error loading targets', err);
    // helpful debug info
    if (err.response) {
      console.error('Response status:', err.response.status);
      console.error('Response data:', err.response.data);
    }
    targets.value = [];
  } finally {
    loadingTargets.value = false;
  }
}

function onWarehouseChange() {
  // reset form and load targets
  resetForm();
  // default form.warehouse to the selected warehouse
  form.value.warehouse = selectedWarehouse.value || '';
  fetchTargets();
}

function resetForm() {
  form.value = {
    _id: null,
    warehouse: selectedWarehouse.value || '',
    year: filterYear.value,
    month: 1,
    amount: 0,
  };
  formError.value = '';
}

function editTarget(t) {
  // t.warehouse may be an object or id
  form.value = {
    _id: t._id,
    warehouse: getWarehouseId(t.warehouse) || selectedWarehouse.value || '',
    year: t.year,
    month: t.month,
    amount: t.amount,
  };
}

function confirmDelete(t) {
  deletingTarget.value = t;
  showDeleteModal.value = true;
}

async function deleteTarget() {
  if (!deletingTarget.value) return;
  try {
    await axios.delete(`/api/targets/${deletingTarget.value._id}`);
    showDeleteModal.value = false;
    deletingTarget.value = null;
    fetchTargets();
  } catch (err) {
    console.error('Delete target failed', err);
    alert('Delete failed');
  }
}

// Save (create or update) target
async function saveTarget() {
  formError.value = '';

  // Use warehouse from form if present; fallback to selectedWarehouse
  const warehouseToUse = form.value.warehouse || selectedWarehouse.value;
  if (!warehouseToUse) {
    formError.value = 'Please select a warehouse';
    return;
  }

  if (!form.value.year || form.value.year < 2000 || form.value.year > maxYear) {
    formError.value = 'Invalid year';
    return;
  }
  if (!form.value.month || form.value.month < 1 || form.value.month > 12) {
    formError.value = 'Invalid month';
    return;
  }
  if (
    form.value.amount === null ||
    form.value.amount === undefined ||
    isNaN(form.value.amount) ||
    form.value.amount < 0
  ) {
    formError.value = 'Invalid amount';
    return;
  }

  saving.value = true;
  try {
    if (form.value._id) {
      // update
      await axios.put(`/api/targets/${form.value._id}`, { amount: Number(form.value.amount) });
    } else {
      // create
      await axios.post('/api/targets', {
        warehouse: warehouseToUse,
        year: form.value.year,
        month: form.value.month,
        amount: Number(form.value.amount),
      });
    }

    resetForm();
    await fetchTargets();
  } catch (err) {
    console.error('Save target failed', err);
    formError.value = err.response?.data?.message || 'Save failed';
  } finally {
    saving.value = false;
  }
}

onMounted(async () => {
  await fetchWarehouses();
  // if we have warehouses, fetch targets for the current selection
  if (selectedWarehouse.value) {
    // ensure form default warehouse set
    if (!form.value.warehouse) form.value.warehouse = selectedWarehouse.value;
    await fetchTargets();
  }
});
</script>

<style scoped>
/* simple scoped styles if needed */
</style>
