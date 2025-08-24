<template>
  <div class="min-h-screen bg-gray-50 p-6">
    <!-- Header -->
    <div class="mb-8">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Import Products from Excel</h1>
          <p class="text-gray-600 mt-1">Upload Excel file to import multiple products at once</p>
        </div>
        <button
          @click="downloadTemplate"
          class="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Download Template
        </button>
      </div>
    </div>

    <!-- Upload Section -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      <h2 class="text-lg font-medium text-gray-900 mb-4">Upload Excel File</h2>

      <!-- File Upload Area -->
      <div
        @drop="handleDrop"
        @dragover.prevent
        @dragenter.prevent
        class="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors"
        :class="{ 'border-blue-400 bg-blue-50': isDragging }"
      >
        <input
          ref="fileInput"
          type="file"
          accept=".xlsx,.xls"
          @change="handleFileSelect"
          class="hidden"
        />

        <div v-if="!selectedFile">
          <svg class="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          <div class="mt-4">
            <button
              @click="$refs.fileInput.click()"
              class="text-blue-600 hover:text-blue-500 font-medium"
            >
              Click to upload
            </button>
            <span class="text-gray-500"> or drag and drop</span>
          </div>
          <p class="text-xs text-gray-500 mt-2">Excel files only (.xlsx, .xls)</p>
        </div>

        <div v-else class="text-center">
          <svg class="mx-auto h-12 w-12 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div class="mt-2">
            <p class="text-sm font-medium text-gray-900">{{ selectedFile.name }}</p>
            <p class="text-xs text-gray-500">{{ formatFileSize(selectedFile.size) }}</p>
          </div>
          <button
            @click="removeFile"
            class="mt-2 text-red-600 hover:text-red-500 text-sm"
          >
            Remove file
          </button>
        </div>
      </div>

      <!-- Upload Button -->
      <div class="mt-4 flex justify-end">
        <button
          @click="uploadFile"
          :disabled="!selectedFile || isUploading"
          class="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          <svg v-if="isUploading" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {{ isUploading ? 'Uploading...' : 'Upload & Import' }}
        </button>
      </div>
    </div>

    <!-- Results Section -->
    <div v-if="importResults" class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 class="text-lg font-medium text-gray-900 mb-4">Import Results</h2>

      <!-- Summary -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div class="bg-green-50 border border-green-200 rounded-lg p-4">
          <div class="flex items-center">
            <svg class="h-8 w-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div class="ml-3">
              <p class="text-sm font-medium text-green-800">Successful</p>
              <p class="text-2xl font-bold text-green-900">{{ importResults.successful }}</p>
            </div>
          </div>
        </div>

        <div class="bg-red-50 border border-red-200 rounded-lg p-4">
          <div class="flex items-center">
            <svg class="h-8 w-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div class="ml-3">
              <p class="text-sm font-medium text-red-800">Failed</p>
              <p class="text-2xl font-bold text-red-900">{{ importResults.failed }}</p>
            </div>
          </div>
        </div>

        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div class="flex items-center">
            <svg class="h-8 w-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <div class="ml-3">
              <p class="text-sm font-medium text-blue-800">Total</p>
              <p class="text-2xl font-bold text-blue-900">{{ importResults.total }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Error Details -->
      <div v-if="importResults.errors && importResults.errors.length > 0" class="mt-6">
        <h3 class="text-md font-medium text-red-800 mb-3">Import Errors</h3>
        <div class="bg-red-50 border border-red-200 rounded-lg p-4 max-h-60 overflow-y-auto">
          <div v-for="(error, index) in importResults.errors" :key="index" class="mb-2 last:mb-0">
            <p class="text-sm text-red-700">
              <span class="font-medium">Row {{ error.row }}:</span> {{ error.message }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Instructions -->
    <div class="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
      <h3 class="text-lg font-medium text-blue-900 mb-3">Instructions</h3>
      <div class="text-sm text-blue-800 space-y-2">
        <p><strong>Required columns in Excel file:</strong></p>
        <ul class="list-disc list-inside ml-4 space-y-1">
          <li><strong>name</strong> - Product name (required)</li>
          <li><strong>sku</strong> - Product SKU (required, must be unique)</li>
          <li><strong>description</strong> - Product description (optional)</li>
          <li><strong>unit</strong> - Unit (pcs, kg, liter, box, pack)</li>
          <li><strong>basePrice</strong> - Base price (number)</li>
          <li><strong>quantity</strong> - Initial stock quantity (number, optional)</li>
          <li><strong>category</strong> - Category name (must exist in system)</li>
          <li><strong>primarySupplier</strong> - Supplier name (must exist in system)</li>
          <li><strong>minStockLevel</strong> - Minimum stock level (number, optional)</li>
        </ul>
        <p class="mt-3"><strong>Note:</strong> Import date, status, and warehouse will be set automatically. Products will be assigned to your warehouse.</p>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'ImportProduct',
  data() {
    return {
      selectedFile: null,
      isDragging: false,
      isUploading: false,
      importResults: null
    };
  },
  methods: {
    handleDrop(e) {
      e.preventDefault();
      this.isDragging = false;
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        this.handleFileSelect({ target: { files } });
      }
    },

    handleFileSelect(e) {
      const file = e.target.files[0];
      if (file && (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                   file.type === 'application/vnd.ms-excel')) {
        this.selectedFile = file;
        this.importResults = null;
      } else {
        alert('Please select a valid Excel file (.xlsx or .xls)');
      }
    },

    removeFile() {
      this.selectedFile = null;
      this.$refs.fileInput.value = '';
      this.importResults = null;
    },

    formatFileSize(bytes) {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    async downloadTemplate() {
      try {
        const response = await axios.get('/api/products/import/template', {
          responseType: 'blob',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token') || sessionStorage.getItem('token')}`
          }
        });

        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'product_import_template.xlsx');
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Error downloading template:', error);
        alert('Failed to download template. Please try again.');
      }
    },

    async uploadFile() {
      if (!this.selectedFile) return;

      this.isUploading = true;
      const formData = new FormData();
      formData.append('file', this.selectedFile);

      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        const response = await axios.post('/api/products/import', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
          }
        });

        this.importResults = response.data;

        if (response.data.successful > 0) {
          this.$emit('imported'); // Emit event to refresh product list
        }
      } catch (error) {
        console.error('Error uploading file:', error);
        alert('Failed to import products. Please check your file and try again.');
      } finally {
        this.isUploading = false;
      }
    }
  }
};
</script>

<style scoped>
/* Custom styles for drag and drop */
.border-dashed {
  border-style: dashed;
}
</style>
