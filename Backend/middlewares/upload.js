const multer = require('multer');
const path = require('path');

// Configure multer for memory storage (we'll upload to Cloudinary directly)
const storage = multer.memoryStorage();

// File filter function
const fileFilter = (req, file, cb) => {
  // Check if file is an image
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1 // Only 1 file at a time
  }
});

// Middleware for single image upload
const uploadSingleImage = upload.single('image');

// Middleware wrapper with error handling
const handleImageUpload = (req, res, next) => {
  uploadSingleImage(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'File too large. Maximum size is 5MB.'
        });
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({
          success: false,
          message: 'Too many files. Only 1 file allowed.'
        });
      }
      return res.status(400).json({
        success: false,
        message: `Upload error: ${err.message}`
      });
    } else if (err) {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }
    
    // Continue to next middleware
    next();
  });
};

// Middleware for multiple images (if needed in future)
const uploadMultipleImages = upload.array('images', 5); // Max 5 images

const handleMultipleImageUpload = (req, res, next) => {
  uploadMultipleImages(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'One or more files too large. Maximum size is 5MB per file.'
        });
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({
          success: false,
          message: 'Too many files. Maximum 5 files allowed.'
        });
      }
      return res.status(400).json({
        success: false,
        message: `Upload error: ${err.message}`
      });
    } else if (err) {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }
    
    next();
  });
};

// Utility function to validate image file
const validateImageFile = (file) => {
  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'image/webp'
  ];
  
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  
  if (!file) {
    return { valid: false, message: 'No file provided' };
  }
  
  if (!allowedMimeTypes.includes(file.mimetype)) {
    return { 
      valid: false, 
      message: 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.' 
    };
  }
  
  const fileExtension = path.extname(file.originalname).toLowerCase();
  if (!allowedExtensions.includes(fileExtension)) {
    return { 
      valid: false, 
      message: 'Invalid file extension. Only .jpg, .jpeg, .png, .gif, .webp are allowed.' 
    };
  }
  
  if (file.size > 5 * 1024 * 1024) {
    return { 
      valid: false, 
      message: 'File too large. Maximum size is 5MB.' 
    };
  }
  
  return { valid: true };
};

module.exports = {
  handleImageUpload,
  handleMultipleImageUpload,
  validateImageFile,
  upload
};
