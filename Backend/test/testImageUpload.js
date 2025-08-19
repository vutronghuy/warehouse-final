const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// Test image upload functionality
const testImageUpload = async () => {
  try {
    console.log('🧪 Testing Product Image Upload...');

    // You need to replace this with a valid JWT token
    const token = 'YOUR_JWT_TOKEN_HERE';
    
    if (token === 'YOUR_JWT_TOKEN_HERE') {
      console.log('⚠️ Please replace YOUR_JWT_TOKEN_HERE with a valid JWT token');
      return;
    }

    const baseURL = 'http://localhost:3003/api';
    
    // Set authorization header
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    // Test 1: Create a product first
    console.log('📝 Step 1: Creating a test product...');
    
    const productData = {
      name: 'Test Product with Image',
      sku: 'TEST-IMG-' + Date.now(),
      description: 'Test product for image upload',
      unit: 'pcs',
      basePrice: 100,
      categoryId: '507f1f77bcf86cd799439011', // Replace with valid category ID
      primarySupplierId: '507f1f77bcf86cd799439012', // Replace with valid supplier ID
      minStockLevel: 10
    };

    const createResponse = await axios.post(`${baseURL}/products`, productData);
    
    if (!createResponse.data.success) {
      throw new Error('Failed to create product');
    }

    const productId = createResponse.data.product._id;
    console.log('✅ Product created:', productId);

    // Test 2: Create a test image file (you can replace this with actual image path)
    console.log('📸 Step 2: Preparing test image...');
    
    // Create a simple test image buffer (1x1 pixel PNG)
    const testImageBuffer = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4, 0x89, 0x00, 0x00, 0x00,
      0x0A, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,
      0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00, 0x00, 0x00, 0x00, 0x49,
      0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
    ]);

    // Test 3: Upload image using separate endpoint
    console.log('📤 Step 3: Uploading image to product...');
    
    const formData = new FormData();
    formData.append('image', testImageBuffer, {
      filename: 'test-image.png',
      contentType: 'image/png'
    });

    const uploadResponse = await axios.post(
      `${baseURL}/products/${productId}/upload-image`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          'Authorization': `Bearer ${token}`
        }
      }
    );

    if (uploadResponse.data.success) {
      console.log('✅ Image uploaded successfully!');
      console.log('🖼️ Image URL:', uploadResponse.data.image.url);
      console.log('🆔 Public ID:', uploadResponse.data.image.publicId);
      
      if (uploadResponse.data.image.responsiveUrls) {
        console.log('📱 Responsive URLs:');
        Object.entries(uploadResponse.data.image.responsiveUrls).forEach(([size, url]) => {
          console.log(`   ${size}: ${url}`);
        });
      }
    } else {
      console.error('❌ Image upload failed:', uploadResponse.data.message);
    }

    // Test 4: Get product to verify image is saved
    console.log('🔍 Step 4: Verifying image is saved...');
    
    const getResponse = await axios.get(`${baseURL}/products/${productId}`);
    
    if (getResponse.data.success && getResponse.data.product.image) {
      console.log('✅ Image verified in product data');
      console.log('🖼️ Saved image URL:', getResponse.data.product.image.url);
    } else {
      console.log('❌ Image not found in product data');
    }

    // Test 5: Delete image
    console.log('🗑️ Step 5: Deleting image...');
    
    const deleteImageResponse = await axios.delete(`${baseURL}/products/${productId}/delete-image`);
    
    if (deleteImageResponse.data.success) {
      console.log('✅ Image deleted successfully');
    } else {
      console.error('❌ Image deletion failed:', deleteImageResponse.data.message);
    }

    // Test 6: Cleanup - delete test product
    console.log('🧹 Step 6: Cleaning up test product...');
    
    const deleteProductResponse = await axios.delete(`${baseURL}/products/${productId}`);
    
    if (deleteProductResponse.data.success) {
      console.log('✅ Test product deleted successfully');
    } else {
      console.error('❌ Failed to delete test product');
    }

    console.log('🎉 Image upload test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
  }
};

// Test creating product with image in single request
const testCreateProductWithImage = async () => {
  try {
    console.log('🧪 Testing Create Product with Image...');

    const token = 'YOUR_JWT_TOKEN_HERE';
    
    if (token === 'YOUR_JWT_TOKEN_HERE') {
      console.log('⚠️ Please replace YOUR_JWT_TOKEN_HERE with a valid JWT token');
      return;
    }

    const baseURL = 'http://localhost:3003/api';

    // Create form data with product data and image
    const formData = new FormData();
    
    // Add product fields
    formData.append('name', 'Product with Image');
    formData.append('sku', 'PROD-IMG-' + Date.now());
    formData.append('description', 'Product created with image');
    formData.append('unit', 'pcs');
    formData.append('basePrice', '150');
    formData.append('categoryId', '507f1f77bcf86cd799439011'); // Replace with valid category ID
    formData.append('primarySupplierId', '507f1f77bcf86cd799439012'); // Replace with valid supplier ID
    formData.append('minStockLevel', '5');

    // Add test image
    const testImageBuffer = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4, 0x89, 0x00, 0x00, 0x00,
      0x0A, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,
      0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00, 0x00, 0x00, 0x00, 0x49,
      0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
    ]);

    formData.append('image', testImageBuffer, {
      filename: 'product-image.png',
      contentType: 'image/png'
    });

    const response = await axios.post(`${baseURL}/products`, formData, {
      headers: {
        ...formData.getHeaders(),
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.data.success) {
      console.log('✅ Product created with image successfully!');
      console.log('📦 Product ID:', response.data.product._id);
      
      if (response.data.product.image) {
        console.log('🖼️ Image URL:', response.data.product.image.url);
        console.log('🆔 Public ID:', response.data.product.image.publicId);
      }
    } else {
      console.error('❌ Failed to create product with image');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
};

// Run tests
if (require.main === module) {
  console.log('🚀 Starting image upload tests...');
  console.log('⚠️ Make sure to:');
  console.log('   1. Replace JWT token with valid token');
  console.log('   2. Replace category and supplier IDs with valid ones');
  console.log('   3. Make sure server is running on localhost:3003');
  console.log('');
  
  // Uncomment the test you want to run:
  // testImageUpload();
  // testCreateProductWithImage();
}

module.exports = {
  testImageUpload,
  testCreateProductWithImage
};
