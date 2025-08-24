const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloudinary_url: process.env.CLOUDINARY_URL
});

// Alternative configuration (if CLOUDINARY_URL doesn't work)
// cloudinary.config({
//   cloud_name: 'dpvo1pmk6',
//   api_key: '977684429129561',
//   api_secret: 'IiqsuX7zzomPo-nctnh5g_RCrdY'
// });

/**
 * Upload image to Cloudinary
 * @param {Buffer|String} file - File buffer or file path
 * @param {Object} options - Upload options
 * @returns {Promise<Object>} Upload result
 */
const uploadImage = async (file, options = {}) => {
  try {
    const defaultOptions = {
      folder: 'warehouse/products', // Organize images in folders
      resource_type: 'image',
      format: 'jpg', // Convert to JPG for consistency
      quality: 'auto:good', // Optimize quality
      transformation: [
        { width: 800, height: 600, crop: 'limit' }, // Limit max size
        { quality: 'auto:good' }
      ]
    };

    const uploadOptions = { ...defaultOptions, ...options };
    
    const result = await cloudinary.uploader.upload(file, uploadOptions);
    
    return {
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Delete image from Cloudinary
 * @param {String} publicId - Cloudinary public_id
 * @returns {Promise<Object>} Deletion result
 */
const deleteImage = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    
    return {
      success: result.result === 'ok',
      result: result.result
    };
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Generate optimized image URL with transformations
 * @param {String} publicId - Cloudinary public_id
 * @param {Object} transformations - Image transformations
 * @returns {String} Optimized image URL
 */
const getOptimizedImageUrl = (publicId, transformations = {}) => {
  const defaultTransformations = {
    quality: 'auto:good',
    fetch_format: 'auto'
  };

  const finalTransformations = { ...defaultTransformations, ...transformations };
  
  return cloudinary.url(publicId, finalTransformations);
};

/**
 * Generate multiple image sizes for responsive design
 * @param {String} publicId - Cloudinary public_id
 * @returns {Object} Object with different image sizes
 */
const getResponsiveImageUrls = (publicId) => {
  return {
    thumbnail: getOptimizedImageUrl(publicId, { width: 150, height: 150, crop: 'fill' }),
    small: getOptimizedImageUrl(publicId, { width: 300, height: 225, crop: 'fill' }),
    medium: getOptimizedImageUrl(publicId, { width: 600, height: 450, crop: 'fill' }),
    large: getOptimizedImageUrl(publicId, { width: 1200, height: 900, crop: 'limit' }),
    original: getOptimizedImageUrl(publicId)
  };
};

module.exports = {
  cloudinary,
  uploadImage,
  deleteImage,
  getOptimizedImageUrl,
  getResponsiveImageUrls
};
