<template>
  <div class="image-upload-container">
    <!-- Current Image Display -->
    <div v-if="currentImageUrl" class="current-image mb-4">
      <h4 class="text-sm font-medium text-gray-700 mb-2">Current Image:</h4>
      <div class="relative inline-block">
        <img 
          :src="currentImageUrl" 
          :alt="altText"
          class="w-32 h-32 object-cover rounded-lg border border-gray-300"
        />
        <button
          v-if="allowDelete"
          @click="deleteImage"
          :disabled="deleting"
          class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 disabled:opacity-50"
          title="Delete image"
        >
          <span v-if="deleting">⏳</span>
          <span v-else>×</span>
        </button>
      </div>
    </div>

    <!-- Upload Area -->
    <div class="upload-area">
      <h4 class="text-sm font-medium text-gray-700 mb-2">
        {{ currentImageUrl ? 'Replace Image:' : 'Upload Image:' }}
      </h4>
      
      <!-- File Input -->
      <div class="flex items-center space-x-4">
        <input
          ref="fileInput"
          type="file"
          accept="image/*"
          @change="handleFileSelect"
          class="hidden"
        />
        
        <button
          @click="$refs.fileInput.click()"
          :disabled="uploading"
          class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ uploading ? 'Uploading...' : 'Choose Image' }}
        </button>

        <button
          v-if="selectedFile"
          @click="uploadImage"
          :disabled="uploading"
          class="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ uploading ? 'Uploading...' : 'Upload' }}
        </button>

        <button
          v-if="selectedFile"
          @click="clearSelection"
          :disabled="uploading"
          class="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 disabled:opacity-50"
        >
          Cancel
        </button>
      </div>

      <!-- Selected File Info -->
      <div v-if="selectedFile" class="mt-3 p-3 bg-gray-50 rounded-md">
        <p class="text-sm text-gray-600">
          <strong>Selected:</strong> {{ selectedFile.name }}
        </p>
        <p class="text-sm text-gray-600">
          <strong>Size:</strong> {{ formatFileSize(selectedFile.size) }}
        </p>
        <p class="text-sm text-gray-600">
          <strong>Type:</strong> {{ selectedFile.type }}
        </p>
      </div>

      <!-- Upload Progress -->
      <div v-if="uploading" class="mt-3">
        <div class="w-full bg-gray-200 rounded-full h-2">
          <div class="bg-blue-600 h-2 rounded-full transition-all duration-300" :style="{ width: uploadProgress + '%' }"></div>
        </div>
        <p class="text-sm text-gray-600 mt-1">{{ uploadProgress }}% uploaded</p>
      </div>

      <!-- Error Message -->
      <div v-if="error" class="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
        <p class="text-sm text-red-600">{{ error }}</p>
      </div>

      <!-- Success Message -->
      <div v-if="success" class="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
        <p class="text-sm text-green-600">{{ success }}</p>
      </div>
    </div>

    <!-- Image Guidelines -->
    <div class="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
      <h5 class="text-sm font-medium text-blue-800 mb-1">Image Guidelines:</h5>
      <ul class="text-xs text-blue-700 space-y-1">
        <li>• Supported formats: JPEG, PNG, GIF, WebP</li>
        <li>• Maximum file size: 5MB</li>
        <li>• Recommended size: 800x600 pixels or larger</li>
        <li>• Images will be automatically optimized</li>
      </ul>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'ImageUpload',
  props: {
    productId: {
      type: String,
      required: true
    },
    currentImageUrl: {
      type: String,
      default: null
    },
    altText: {
      type: String,
      default: 'Product image'
    },
    allowDelete: {
      type: Boolean,
      default: true
    }
  },
  emits: ['image-uploaded', 'image-deleted', 'upload-error'],
  data() {
    return {
      selectedFile: null,
      uploading: false,
      deleting: false,
      uploadProgress: 0,
      error: null,
      success: null
    };
  },
  methods: {
    handleFileSelect(event) {
      const file = event.target.files[0];
      if (!file) return;

      // Reset messages
      this.error = null;
      this.success = null;

      // Validate file
      const validation = this.validateFile(file);
      if (!validation.valid) {
        this.error = validation.message;
        return;
      }

      this.selectedFile = file;
    },

    validateFile(file) {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      const maxSize = 5 * 1024 * 1024; // 5MB

      if (!allowedTypes.includes(file.type)) {
        return {
          valid: false,
          message: 'Invalid file type. Please select a JPEG, PNG, GIF, or WebP image.'
        };
      }

      if (file.size > maxSize) {
        return {
          valid: false,
          message: 'File too large. Maximum size is 5MB.'
        };
      }

      return { valid: true };
    },

    async uploadImage() {
      if (!this.selectedFile) return;

      this.uploading = true;
      this.uploadProgress = 0;
      this.error = null;
      this.success = null;

      try {
        const formData = new FormData();
        formData.append('image', this.selectedFile);

        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        
        const response = await axios.post(
          `/api/products/${this.productId}/upload-image`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
              'Authorization': `Bearer ${token}`
            },
            onUploadProgress: (progressEvent) => {
              this.uploadProgress = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
            }
          }
        );

        if (response.data.success) {
          this.success = 'Image uploaded successfully!';
          this.clearSelection();
          this.$emit('image-uploaded', response.data.image);
          
          // Clear success message after 3 seconds
          setTimeout(() => {
            this.success = null;
          }, 3000);
        } else {
          this.error = response.data.message || 'Upload failed';
          this.$emit('upload-error', this.error);
        }
      } catch (error) {
        console.error('Upload error:', error);
        this.error = error.response?.data?.message || 'Upload failed. Please try again.';
        this.$emit('upload-error', this.error);
      } finally {
        this.uploading = false;
        this.uploadProgress = 0;
      }
    },

    async deleteImage() {
      if (!this.currentImageUrl) return;

      this.deleting = true;
      this.error = null;
      this.success = null;

      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        
        const response = await axios.delete(
          `/api/products/${this.productId}/delete-image`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );

        if (response.data.success) {
          this.success = 'Image deleted successfully!';
          this.$emit('image-deleted');
          
          // Clear success message after 3 seconds
          setTimeout(() => {
            this.success = null;
          }, 3000);
        } else {
          this.error = response.data.message || 'Delete failed';
        }
      } catch (error) {
        console.error('Delete error:', error);
        this.error = error.response?.data?.message || 'Delete failed. Please try again.';
      } finally {
        this.deleting = false;
      }
    },

    clearSelection() {
      this.selectedFile = null;
      this.$refs.fileInput.value = '';
      this.error = null;
    },

    formatFileSize(bytes) {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
  }
};
</script>

<style scoped>
.image-upload-container {
  max-width: 500px;
}

.current-image img {
  transition: opacity 0.3s ease;
}

.current-image img:hover {
  opacity: 0.8;
}

.upload-area {
  border: 2px dashed #e5e7eb;
  border-radius: 8px;
  padding: 1rem;
  transition: border-color 0.3s ease;
}

.upload-area:hover {
  border-color: #3b82f6;
}
</style>
