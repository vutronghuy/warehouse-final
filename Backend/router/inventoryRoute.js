const express = require('express');
const router = express.Router();

const inventoryController = require('../controller/InventoryController');
const inventoryTransactionController = require('../controller/InventoryTransactionController');
const { verifyToken } = require('../middlewares/auth');

// Middleware để disable cache
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

// ============================================
// INVENTORY ROUTES
// ============================================
// IMPORTANT: Specific routes must be defined BEFORE parameterized routes
// to avoid route conflicts (e.g., /transactions should come before /:id)

// GET /api/inventory/stats - Get inventory statistics
router.get('/stats', disableCache, verifyToken, inventoryController.getInventoryStats);

// GET /api/inventory/product/:productId/warehouse/:warehouseId - Get inventory by product and warehouse
router.get('/product/:productId/warehouse/:warehouseId', disableCache, verifyToken, inventoryController.getInventoryByProductAndWarehouse);

// POST /api/inventory/sync - Sync inventory from Product.quantity (Admin and Super Admin only)
router.post('/sync', verifyToken, inventoryController.syncInventory);

// ============================================
// INVENTORY TRANSACTION ROUTES (must be before /:id route)
// ============================================

// GET /api/inventory/transactions/stats - Get transaction statistics
router.get('/transactions/stats', disableCache, verifyToken, inventoryTransactionController.getTransactionStats);

// GET /api/inventory/transactions - Get all transactions with pagination and filters
router.get('/transactions', disableCache, verifyToken, inventoryTransactionController.getAllTransactions);

// POST /api/inventory/transactions - Create manual transaction (Admin and Super Admin only)
router.post('/transactions', verifyToken, inventoryTransactionController.createTransaction);

// GET /api/inventory/transactions/:id - Get transaction by ID
router.get('/transactions/:id', disableCache, verifyToken, inventoryTransactionController.getTransactionById);

// ============================================
// INVENTORY ROUTES (parameterized routes must come last)
// ============================================

// GET /api/inventory - Get all inventory with pagination and filters
router.get('/', disableCache, verifyToken, inventoryController.getAllInventory);

// GET /api/inventory/:id - Get inventory by ID
router.get('/:id', disableCache, verifyToken, inventoryController.getInventoryById);

// PUT /api/inventory/:id - Update inventory (Admin and Super Admin only)
router.put('/:id', verifyToken, inventoryController.updateInventory);

module.exports = router;

