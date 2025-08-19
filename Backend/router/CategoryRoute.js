const express = require('express');
const router = express.Router();

const categoryController = require('../controller/CategoryController');
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

// Routes for category management (with cache-busting)
// GET /api/categories - Get all categories with pagination and filters
router.get('/', disableCache, verifyToken, categoryController.getAllCategories);

// GET /api/categories/active - Get active categories for dropdown
router.get('/active', disableCache, verifyToken, categoryController.getActiveCategories);

// GET /api/categories/stats - Get category statistics
router.get('/stats', disableCache, verifyToken, requireAdminOrSuperAdmin, categoryController.getCategoryStats);

// GET /api/categories/:id - Get category by ID
router.get('/:id', disableCache, verifyToken, categoryController.getCategoryById);

// POST /api/categories - Create new category (Admin and Super Admin only)
router.post('/', verifyToken, requireAdminOrSuperAdmin, categoryController.createCategory);

// PUT /api/categories/:id - Update category (Admin and Super Admin only)
router.put('/:id', verifyToken, requireAdminOrSuperAdmin, categoryController.updateCategory);

// DELETE /api/categories/:id - Delete category (Super Admin only)
router.delete('/:id', verifyToken, requireSuperAdmin, categoryController.deleteCategory);

module.exports = router;
