const express = require('express');
const router = express.Router();

const productController = require('../controller/ProductController');
const { verifyToken, requireSuperAdmin } = require('../middlewares/auth');

// Simple admin check middleware
const requireAdminOrSuperAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ ok: false, message: 'Authentication required.' });
  }
  // Allow both admin and super admin
  if (req.user.role !== 'admin' && !req.user.isSuperAdmin) {
    return res.status(403).json({ ok: false, message: 'Access denied. Admin or Super admin only.' });
  }
  next();
};

// Routes for product management
// GET /api/products - Get all products with pagination and filters
router.get('/', verifyToken, productController.getAllProducts);

// GET /api/products/active - Get active products for dropdown
router.get('/active', verifyToken, productController.getActiveProducts);

// GET /api/products/stats - Get product statistics
router.get('/stats', verifyToken, requireAdminOrSuperAdmin, productController.getProductStats);

// GET /api/products/search - Search products
router.get('/search', verifyToken, productController.searchProducts);

// GET /api/products/category/:categoryId - Get products by category
router.get('/category/:categoryId', verifyToken, productController.getProductsByCategory);

// GET /api/products/:id - Get product by ID
router.get('/:id', verifyToken, productController.getProductById);

// POST /api/products - Create new product (Admin and Super Admin only)
router.post('/', verifyToken, requireAdminOrSuperAdmin, productController.createProduct);

// PUT /api/products/:id - Update product (Admin and Super Admin only)
router.put('/:id', verifyToken, requireAdminOrSuperAdmin, productController.updateProduct);

// DELETE /api/products/:id - Delete product (Super Admin only)
router.delete('/:id', verifyToken, requireSuperAdmin, productController.deleteProduct);

module.exports = router;
