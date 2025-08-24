const express = require('express');
const router = express.Router();

const exportReceiptController = require('../controller/ExportReceiptController');
const { verifyToken, requireSuperAdmin } = require('../middlewares/auth');

// Simple role check middlewares
const requireStaff = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required.' });
  }
  if (req.user.role !== 'staff') {
    return res.status(403).json({ success: false, message: 'Access denied. Staff only.' });
  }
  next();
};

const requireManager = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required.' });
  }
  if (req.user.role !== 'manager') {
    return res.status(403).json({ success: false, message: 'Access denied. Manager only.' });
  }
  next();
};

const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required.' });
  }
  if (req.user.role !== 'admin' && !req.user.isSuperAdmin) {
    return res.status(403).json({ success: false, message: 'Access denied. Admin only.' });
  }
  next();
};

const requireStaffOrAbove = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required.' });
  }
  const allowedRoles = ['staff', 'manager', 'admin'];
  if (!allowedRoles.includes(req.user.role) && !req.user.isSuperAdmin) {
    return res.status(403).json({ success: false, message: 'Access denied. Staff or above required.' });
  }
  next();
};

// Cache-busting middleware
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

// Routes for export receipt management

// GET /api/export-receipts - Get all export receipts (filtered by user role)
router.get('/', disableCache, verifyToken, requireStaffOrAbove, exportReceiptController.getExportReceipts);

// GET /api/export-receipts/confirmed - Get confirmed export receipts for invoice creation
router.get('/confirmed', disableCache, verifyToken, requireStaffOrAbove, exportReceiptController.getConfirmedExportReceipts);

// GET /api/export-receipts/:id - Get single export receipt
router.get('/:id', disableCache, verifyToken, requireStaffOrAbove, exportReceiptController.getExportReceiptById);

// POST /api/export-receipts - Create new export receipt (Staff only)
router.post('/', verifyToken, requireStaff, exportReceiptController.createExportReceipt);

// PUT /api/export-receipts/:id - Update export receipt (Staff only, status must be 'created')
router.put('/:id', verifyToken, requireStaff, exportReceiptController.updateExportReceipt);

// PUT /api/export-receipts/:id/manager-review - Manager review receipt
router.put('/:id/manager-review', verifyToken, requireManager, exportReceiptController.managerReviewReceipt);

// PUT /api/export-receipts/:id/admin-approve - Admin approve receipt
router.put('/:id/admin-approve', verifyToken, requireAdmin, exportReceiptController.adminApproveReceipt);

module.exports = router;
