const express = require('express');
const router = express.Router();

const warehouseController = require('../controller/WarehouseController');
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

// Routes for warehouse management
// GET /api/warehouses - Get all warehouses with pagination and filters
router.get('/', verifyToken, warehouseController.getAllWarehouses);

// GET /api/warehouses/active - Get active warehouses for dropdown
router.get('/active', verifyToken, warehouseController.getActiveWarehouses);

// GET /api/warehouses/stats - Get warehouse statistics
router.get('/stats', verifyToken, requireAdminOrSuperAdmin, warehouseController.getWarehouseStats);

// GET /api/warehouses/:id - Get warehouse by ID
router.get('/:id', verifyToken, warehouseController.getWarehouseById);

// POST /api/warehouses/:id/refresh - Force refresh warehouse data
router.post('/:id/refresh', verifyToken, warehouseController.forceRefreshWarehouse);

// GET /api/warehouses/:id/debug - Debug warehouse staff data
router.get('/:id/debug', verifyToken, warehouseController.debugWarehouseStaff);

// POST /api/warehouses/sync - Sync all warehouses with user data
router.post('/sync', verifyToken, requireSuperAdmin, warehouseController.syncAllWarehouses);

// POST /api/warehouses - Create new warehouse (Admin and Super Admin only)
router.post('/create', verifyToken, requireAdminOrSuperAdmin, warehouseController.createWarehouse);

// PUT /api/warehouses/:id - Update warehouse (Admin and Super Admin only)
router.put('/:id', verifyToken, requireAdminOrSuperAdmin, warehouseController.updateWarehouse);

// DELETE /api/warehouses/:id - Delete warehouse (Super Admin only)
router.delete('/:id', verifyToken, requireSuperAdmin, warehouseController.deleteWarehouse);

module.exports = router;
