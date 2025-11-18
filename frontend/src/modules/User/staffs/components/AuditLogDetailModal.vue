<template>
  <Teleport to="body">
    <div
      v-if="open && log"
      class="fixed inset-0 bg-gray-600 bg-opacity-50 z-50 flex items-center justify-center p-4"
    >
      <div class="w-full max-w-4xl max-h-[90vh] bg-white rounded-lg shadow-lg overflow-hidden flex flex-col">
        <div class="flex items-center justify-between p-6 border-b border-gray-200 bg-white">
          <div>
            <h3 class="text-lg font-medium text-gray-900">Activity Details</h3>
            <p class="text-sm text-gray-500 mt-1">
              {{ formatAction(log.action) }} · {{ formatDate(log.createdAt) }}
            </p>
          </div>
          <button @click="emitClose" class="text-gray-400 hover:text-gray-600">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class="flex-1 overflow-y-auto p-6">
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700">Action</label>
              <p class="mt-1 text-sm text-gray-900">{{ formatAction(log.action) }}</p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700">Actor</label>
              <p class="mt-1 text-sm text-gray-900">
                {{ log.actor?.name || 'N/A' }} ({{ log.actor?.email || 'N/A' }})
              </p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700">Target</label>
              <p class="mt-1 text-sm text-gray-900">{{ log.target?.type }} - {{ log.target?.id }}</p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700">Outcome</label>
              <span :class="getOutcomeClass(log.outcome)" class="inline-block px-2 py-1 text-xs font-semibold rounded-full">
                {{ log.outcome }}
              </span>
            </div>

            <div v-if="log.reason">
              <label class="block text-sm font-medium text-gray-700">Reason</label>
              <p class="mt-1 text-sm text-gray-900">{{ log.reason }}</p>
            </div>

            <div v-if="log.error">
              <label class="block text-sm font-medium text-gray-700">Error</label>
              <p class="mt-1 text-sm text-red-600">{{ log.error }}</p>
            </div>

            <div v-if="log.before || log.after" class="space-y-4">
              <h4 class="text-sm font-medium text-gray-700">Change Details</h4>

              <div v-if="log.before" class="border rounded-lg p-3 bg-red-50">
                <h5 class="text-xs font-medium text-red-800 mb-2">Before</h5>
                <div class="space-y-2">
                  <div v-for="(value, key) in log.before" :key="`before-${key}`" class="text-sm">
                    <span class="font-medium text-red-700">{{ getFieldLabel(key) }}:</span>
                    <span class="ml-2 text-red-600">{{ formatFieldValue(key, value) }}</span>
                  </div>
                </div>
              </div>

              <div v-if="log.after" class="border rounded-lg p-3 bg-green-50">
                <h5 class="text-xs font-medium text-green-800 mb-2">After</h5>
                <div class="space-y-2">
                  <div v-for="(value, key) in log.after" :key="`after-${key}`" class="text-sm">
                    <span class="font-medium text-green-700">{{ getFieldLabel(key) }}:</span>
                    <span class="ml-2 text-green-600">{{ formatFieldValue(key, value) }}</span>
                  </div>
                </div>
              </div>

              <div v-if="log.before && log.after" class="border rounded-lg p-3 bg-yellow-50">
                <h5 class="text-xs font-medium text-yellow-800 mb-2">Differences</h5>
                <div class="space-y-2">
                  <div v-for="(afterValue, key) in log.after" :key="`diff-${key}`" class="text-sm">
                    <div v-if="!log.before[key]" class="text-green-600">
                      <span class="font-medium">+ {{ getFieldLabel(key) }}:</span>
                      <span class="ml-2">{{ formatFieldValue(key, afterValue) }}</span>
                    </div>
                    <div v-else-if="log.before[key] !== afterValue" class="text-yellow-600">
                      <span class="font-medium">~ {{ getFieldLabel(key) }}:</span>
                      <span class="ml-2">
                        <span class="text-red-500 line-through">{{ formatFieldValue(key, log.before[key]) }}</span>
                        <span class="mx-1">→</span>
                        <span class="text-green-600">{{ formatFieldValue(key, afterValue) }}</span>
                      </span>
                    </div>
                  </div>

                  <div v-for="(beforeValue, key) in log.before" :key="`removed-${key}`" v-if="!log.after[key]" class="text-sm">
                    <span class="font-medium text-red-600">- {{ getFieldLabel(key) }}:</span>
                    <span class="ml-2 line-through">{{ formatFieldValue(key, beforeValue) }}</span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700">Date</label>
              <p class="mt-1 text-sm text-gray-900">{{ formatDate(log.createdAt) }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { defineProps, defineEmits, watch, ref, onUnmounted } from 'vue';

const props = defineProps({
  log: {
    type: Object,
    default: null
  },
  open: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['close']);
const scrollY = ref(0);

const emitClose = () => {
  emit('close');
};

const preventBodyScroll = () => {
  scrollY.value = window.scrollY;
  document.body.style.position = 'fixed';
  document.body.style.top = `-${scrollY.value}px`;
  document.body.style.width = '100%';
  document.body.style.overflow = 'hidden';
};

const allowBodyScroll = () => {
  document.body.style.position = '';
  document.body.style.top = '';
  document.body.style.width = '';
  document.body.style.overflow = '';
  window.scrollTo(0, scrollY.value || 0);
};

watch(
  () => props.open,
  (newVal) => {
    if (newVal) {
      preventBodyScroll();
    } else {
      allowBodyScroll();
    }
  }
);

onUnmounted(() => {
  allowBodyScroll();
});

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
};

const formatAction = (action) => {
  const actionMap = {
    IMPORT_PRODUCT_EXCEL: 'Import Products from Excel',
    CREATE_EXPORT_SLIP: 'Create Export Slip',
    UPDATE_EXPORT_SLIP: 'Update Export Slip',
    DELETE_EXPORT_SLIP: 'Delete Export Slip',
    CREATE_INVOICE: 'Create Invoice',
    UPDATE_INVOICE: 'Update Invoice',
    DELETE_INVOICE: 'Delete Invoice'
  };
  return actionMap[action] || action;
};

const getFieldLabel = (fieldName) => {
  const fieldLabels = {
    customerName: 'Khách hàng',
    customerPhone: 'Số điện thoại',
    customerAddress: 'Địa chỉ',
    totalAmount: 'Tổng tiền',
    finalAmount: 'Thành tiền sau giảm',
    vatAmount: 'Tiền VAT',
    vatRate: 'Tỷ lệ VAT',
    status: 'Trạng thái',
    paymentCondition: 'Điều kiện thanh toán',
    currency: 'Tiền tệ',
    invoiceNumber: 'Số hóa đơn',
    receiptNumber: 'Số phiếu',
    fileName: 'Tên file',
    productCount: 'Số sản phẩm',
    successCount: 'Số thành công',
    errorCount: 'Số lỗi',
    itemCount: 'Số mục',
    notes: 'Ghi chú',
    note: 'Ghi chú',
    reason: 'Lý do',
    createdAt: 'Ngày tạo',
    updatedAt: 'Ngày cập nhật',
    issueDate: 'Ngày phát hành',
    dueDate: 'Ngày đến hạn'
  };
  return fieldLabels[fieldName] || fieldName;
};

const formatCurrency = (amount, currency = 'VND') => {
  const num = Number(amount || 0);
  try {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency
    }).format(num);
  } catch (e) {
    return `${new Intl.NumberFormat('vi-VN').format(num)} ${currency}`;
  }
};

const formatFieldValue = (fieldName, value) => {
  if (value === null || value === undefined) return 'N/A';

  if (['totalAmount', 'finalAmount', 'vatAmount', 'basePrice', 'unitPrice', 'lineTotal'].includes(fieldName)) {
    return formatCurrency(value);
  }

  if (['createdAt', 'updatedAt', 'issueDate', 'dueDate', 'reviewedAt', 'approvedAt'].includes(fieldName)) {
    return formatDate(value);
  }

  if (['vatRate', 'priceMarkupPercent'].includes(fieldName)) {
    return `${value}%`;
  }

  if (fieldName === 'status') {
    const statusMap = {
      created: 'Đã tạo',
      pending_review: 'Chờ duyệt',
      approved: 'Đã duyệt',
      rejected: 'Từ chối',
      paid: 'Đã thanh toán',
      draft: 'Bản nháp',
      reviewed: 'Đã xem xét',
      'in stock': 'Còn hàng',
      'out of stock': 'Hết hàng'
    };
    return statusMap[value] || value;
  }

  if (fieldName === 'paymentCondition') {
    const paymentMap = {
      cash: 'Tiền mặt',
      net15: '15 ngày',
      net30: '30 ngày',
      net45: '45 ngày',
      net60: '60 ngày'
    };
    return paymentMap[value] || value;
  }

  if (fieldName === 'currency') {
    const currencyMap = {
      VND: 'Việt Nam Đồng',
      USD: 'Đô la Mỹ',
      EUR: 'Euro'
    };
    return currencyMap[value] || value;
  }

  if (typeof value === 'string' && value.match(/^[0-9a-fA-F]{24}$/)) {
    return `${value.substring(0, 8)}...`;
  }

  if (Array.isArray(value)) {
    return `${value.length} mục`;
  }

  if (typeof value === 'object') {
    return JSON.stringify(value, null, 2);
  }

  return String(value);
};

const getOutcomeClass = (outcome) => {
  const baseClass = 'inline-flex px-2 py-1 text-xs font-semibold rounded-full';
  switch (outcome) {
    case 'SUCCESS':
      return `${baseClass} bg-green-100 text-green-800`;
    case 'FAILED':
      return `${baseClass} bg-red-100 text-red-800`;
    default:
      return `${baseClass} bg-gray-100 text-gray-800`;
  }
};
</script>

