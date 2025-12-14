const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const productController = require('../controller/ProductController');
const { verifyToken, requireSuperAdmin } = require('../middlewares/auth');

// Cache-busting middleware to prevent 304 Not Modified
const disableCache = (req, res, next) => {
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    'ETag': '',
    'Last-Modified': new Date().toUTCString()
  });
  next();
};

// Ensure upload directory exists and use absolute path (avoid multer saving errors)
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  try {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log('✅ Upload directory created:', uploadDir);
  } catch (err) {
    console.error('❌ Failed to create upload directory:', err);
  }
}

// Configure multer for file uploads (use absolute uploadDir)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    // Accept only Excel files (check both mimetype and extension)
    const allowedMimes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ];
    const allowedExt = ['.xlsx', '.xls'];
    const ext = path.extname(file.originalname).toLowerCase();

    if (allowedMimes.includes(file.mimetype) && allowedExt.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files are allowed (.xlsx, .xls)!'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Simple admin check middleware
const requireAdminOrSuperAdmin = (req, res, next) => {
  console.log('🔐 requireAdminOrSuperAdmin middleware called');
  console.log('🔐 User:', req.user);

  if (!req.user) {
    console.log('❌ No user found in request');
    return res.status(401).json({ ok: false, message: 'Authentication required.' });
  }

  // Allow both admin and super admin
  if (req.user.role !== 'admin' && !req.user.isSuperAdmin) {
    console.log('❌ Access denied - role:', req.user.role, 'isSuperAdmin:', req.user.isSuperAdmin);
    return res.status(403).json({ ok: false, message: 'Access denied. Admin or Super admin only.' });
  }

  console.log('✅ Access granted - role:', req.user.role, 'isSuperAdmin:', req.user.isSuperAdmin);
  next();
};

// Staff access middleware (staff, manager, admin can read and import products)
const requireStaffOrAbove = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ ok: false, message: 'Authentication required.' });
  }
  // Allow staff, manager, admin, and super admin
  const allowedRoles = ['staff', 'manager', 'admin'];
  if (!allowedRoles.includes(req.user.role) && !req.user.isSuperAdmin) {
    return res.status(403).json({ ok: false, message: 'Access denied. Staff access or above required.' });
  }
  next();
};

// ------------------
// Routes for product management
// NOTE: put more-specific GET routes BEFORE the parameterized GET '/:id' to avoid route collisions
// ------------------

// GET /api/products - Get all products with pagination and filters (Staff can access)
router.get('/', disableCache, verifyToken, requireStaffOrAbove, productController.getAllProducts);

// GET /api/products/active - Get active products for dropdown
router.get('/active', disableCache, verifyToken, productController.getActiveProducts);

// GET /api/products/ending-inventory?month=MM&year=YYYY - Ending inventory theo tháng (dùng transaction logs)
router.get(
  '/ending-inventory',
  disableCache,
  verifyToken,
  requireStaffOrAbove,
  productController.getEndingInventoryByMonth
);

// GET /api/products/stats - Get product statistics
router.get('/stats', disableCache, verifyToken, requireAdminOrSuperAdmin, productController.getProductStats);

// GET /api/products/search - Search products
router.get('/search', disableCache, verifyToken, productController.searchProducts);

// GET /api/products/category/:categoryId - Get products by category
router.get('/category/:categoryId', disableCache, verifyToken, productController.getProductsByCategory);

// PUT /api/products/bulk-status - Bulk update product status (Admin and Super Admin only) - MOVED UP
router.put('/bulk-status', (req, res, next) => {
  console.log('🎯 BULK-STATUS ROUTE HIT!');
  console.log('🎯 Request body:', JSON.stringify(req.body, null, 2));
  console.log('🎯 Request headers:', req.headers);
  next();
}, verifyToken, requireAdminOrSuperAdmin, productController.bulkUpdateStatus);

// PUT /api/products/bulk-min-stock - Bulk update min stock level (Admin and Super Admin only)
router.put('/bulk-min-stock', (req, res, next) => {
  console.log('🎯 BULK-MIN-STOCK ROUTE HIT!');
  console.log('🎯 Request body:', JSON.stringify(req.body, null, 2));
  console.log('🎯 Request headers:', req.headers);
  next();
}, verifyToken, requireAdminOrSuperAdmin, productController.bulkUpdateMinStock);

// PUT /api/products/bulk-pricing - Bulk update product pricing (Admin and Super Admin only)
router.put('/bulk-pricing', (req, res, next) => {
  console.log('🎯 BULK-PRICING ROUTE HIT!');
  console.log('🎯 Request body:', JSON.stringify(req.body, null, 2));
  console.log('🎯 Request headers:', req.headers);
  next();
}, verifyToken, requireAdminOrSuperAdmin, productController.bulkUpdatePricing);

// PUT /api/products/min-stock - Update min stock level (Admin and Super Admin only) - MOVED UP
router.put('/min-stock', (req, res, next) => {
  console.log('🎯 MIN-STOCK ROUTE HIT!');
  console.log('🎯 Request body:', JSON.stringify(req.body, null, 2));
  console.log('🎯 Request headers:', req.headers);
  next();
}, verifyToken, requireAdminOrSuperAdmin, productController.updateMinStock);

// POST /api/products/test-objectid - Test ObjectId validation (Admin and Super Admin only) - MOVED UP
router.post('/test-objectid', verifyToken, requireAdminOrSuperAdmin, productController.testObjectIdValidation);

// ------------------
// Import routes (Staff can import products)
// Place BEFORE the parameterized '/:id' GET route to avoid conflicts like '/import' matching '/:id'
// ------------------

// GET /api/products/import/template - Download Excel template
router.get('/import/template', verifyToken, requireStaffOrAbove, productController.generateTemplate);

// POST /api/products/import - Import products from Excel (Staff can import)
router.post('/import', verifyToken, requireStaffOrAbove, upload.single('file'), productController.importProducts);

// ------------------
// Parameterized and CRUD routes (keep after specific routes)
// ------------------

// GET /api/products/:id - Get product by ID
router.get('/:id', disableCache, verifyToken, productController.getProductById);

// POST /api/products - Create new product (Admin and Super Admin only)
router.post('/', verifyToken, requireAdminOrSuperAdmin, productController.createProduct);

// PUT /api/products/:id - Update product (Admin and Super Admin only)
router.put('/:id', verifyToken, requireAdminOrSuperAdmin, productController.updateProduct);

// DELETE /api/products/:id - Soft delete product (Super Admin only)
// Query param: ?hardDelete=true for permanent deletion (Super Admin only)
router.delete('/:id', verifyToken, requireSuperAdmin, productController.deleteProduct);

// POST /api/products/:id/restore - Restore soft-deleted product (Super Admin only)
router.post('/:id/restore', verifyToken, requireSuperAdmin, productController.restoreProduct);

module.exports = router;
