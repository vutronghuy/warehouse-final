const express = require('express');
const router = express.Router();

const supplierController = require('../controller/SupplierController');
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

// Routes for supplier management (with cache-busting)
// GET /api/suppliers - Get all suppliers with pagination and filters
router.get('/', disableCache, verifyToken, supplierController.getAllSuppliers);

// GET /api/suppliers/:id - Get supplier by ID
router.get('/:id', disableCache, verifyToken, supplierController.getSupplierById);

// POST /api/suppliers - Create new supplier (Admin and Super Admin only)
router.post('/', verifyToken, requireAdminOrSuperAdmin, supplierController.createSupplier);

// PUT /api/suppliers/:id - Update supplier (Admin and Super Admin only)
router.put('/:id', verifyToken, requireAdminOrSuperAdmin, supplierController.updateSupplier);

// DELETE /api/suppliers/:id - Soft delete supplier (Super Admin only)
// Query param: ?hardDelete=true for permanent deletion (Super Admin only)
router.delete('/:id', verifyToken, requireSuperAdmin, supplierController.deleteSupplier);

// POST /api/suppliers/:id/restore - Restore soft-deleted supplier (Super Admin only)
router.post('/:id/restore', verifyToken, requireSuperAdmin, supplierController.restoreSupplier);

// Legacy route for backward compatibility
router.post('/create', supplierController.createSupplier);

module.exports = router;