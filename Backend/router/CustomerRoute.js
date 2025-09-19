const express = require('express');
const router = express.Router();
const customerController = require('../controller/CustomerController');
const { verifyToken, requireSuperAdmin, requireAdminOrSuperAdmin, requireStaffOrAbove } = require('../middlewares/auth');

// Middleware to disable caching
const disableCache = (req, res, next) => {
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    'Last-Modified': new Date().toUTCString(),
    'ETag': Math.random().toString()
  });
  next();
};

// Debug middleware
router.use((req, res, next) => {
  console.log(`🔍 Customer API: ${req.method} ${req.path}`);
  next();
});

// Routes for customer management (with cache-busting)
// GET /api/customers - Get all customers with pagination and filters
router.get('/', disableCache, verifyToken, requireAdminOrSuperAdmin, customerController.getAllCustomers);

// GET /api/customers/active - Get active customers for dropdown (staff can access)
router.get('/active', disableCache, verifyToken, requireStaffOrAbove, customerController.getActiveCustomers);

// GET /api/customers/stats - Get customer statistics
router.get('/stats', disableCache, verifyToken, requireAdminOrSuperAdmin, customerController.getCustomerStats);

// GET /api/customers/dashboard
router.get('/dashboard', disableCache, verifyToken, requireStaffOrAbove, customerController.getCustomerDashboard);
// GET /api/customers/:id - Get customer by ID
router.get('/:id', disableCache, verifyToken, requireAdminOrSuperAdmin, customerController.getCustomerById);


// POST /api/customers - Create new customer (Admin and Super Admin only)
router.post('/', verifyToken, requireAdminOrSuperAdmin, customerController.createCustomer);

// Test route to debug
router.get('/test', (req, res) => {
  res.json({ success: true, message: 'Customer route is working', timestamp: new Date() });
});

// POST /api/customers/staff - Create new customer (Staff can create for export receipts)
router.post('/staff', (req, res, next) => {
  console.log('🔍 Staff customer creation endpoint hit');
  console.log('🔍 Request body:', req.body);
  console.log('🔍 Request user:', req.user);
  next();
}, verifyToken, requireStaffOrAbove, customerController.createCustomerByStaff);

// PUT /api/customers/:id - Update customer (Admin and Super Admin only)
router.put('/:id', verifyToken, requireAdminOrSuperAdmin, customerController.updateCustomer);

// DELETE /api/customers/:id - Delete customer (Super Admin only)
router.delete('/:id', verifyToken, requireSuperAdmin, customerController.deleteCustomer);

module.exports = router;
