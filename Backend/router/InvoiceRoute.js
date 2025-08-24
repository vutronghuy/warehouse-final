const express = require('express');
const router = express.Router();

const invoiceController = require('../controller/InvoiceController');
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

const requireAccounter = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required.' });
  }
  if (req.user.role !== 'accounter') {
    return res.status(403).json({ success: false, message: 'Access denied. Accounter only.' });
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

// Middleware kiểm tra quyền truy cập
const requireAccess = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required.' });
  }
  
  const allowedRoles = ['staff', 'accounter', 'admin', 'manager'];
  if (!allowedRoles.includes(req.user.role) && !req.user.isSuperAdmin) {
    return res.status(403).json({ success: false, message: 'Access denied.' });
  }
  
  next();
};

router.get('/:id', verifyToken, requireAccess, invoiceController.getInvoiceById);
const requireStaffOrAbove = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required.' });
  }
  const allowedRoles = ['staff', 'accounter', 'manager', 'admin'];
  if (!allowedRoles.includes(req.user.role) && !req.user.isSuperAdmin) {
    return res.status(403).json({ success: false, message: 'Access denied. Staff or above required.' });
  }
  next();
};

const requireAccounterOrAbove = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required.' });
  }
  const allowedRoles = ['accounter', 'manager', 'admin'];
  if (!allowedRoles.includes(req.user.role) && !req.user.isSuperAdmin) {
    return res.status(403).json({ success: false, message: 'Access denied. Accounter or above required.' });
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

// Routes for invoice management

// GET /api/invoices - Get all invoices (filtered by user role)
router.get('/', disableCache, verifyToken, requireStaffOrAbove, invoiceController.getInvoices);

// GET /api/invoices/:id - Get single invoice
router.get('/:id', verifyToken, requireStaffOrAbove, invoiceController.getInvoiceById);

// POST /api/invoices/from-export - Create new invoice from export receipt (Staff only)
router.post('/from-export', verifyToken, requireStaff, invoiceController.createInvoiceFromExport);

// PUT /api/invoices/:id - Update invoice (Staff only, before review)
router.put('/:id', verifyToken, requireStaff, invoiceController.updateInvoice);

// PUT /api/invoices/:id/review - Accounter review invoice (approve/reject)
router.put('/:id/review', verifyToken, requireAccounter, invoiceController.reviewInvoice);

// DELETE /api/invoices/:id - Delete invoice (Staff only, before review)
router.delete('/:id', verifyToken, requireStaff, invoiceController.deleteInvoice);

module.exports = router;
