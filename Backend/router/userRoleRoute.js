// routes/userRoleRoute.js
const express = require('express');
const router = express.Router();
const userRoleController = require('../controller/UserRoleController');
const { verifyToken, requireSuperAdmin } = require('../middlewares/auth');

// Apply authentication middleware to all routes in this router
router.use(verifyToken);

// Change user role (Super Admin only) — now guarded by requireSuperAdmin
router.post('/change-role', requireSuperAdmin, userRoleController.changeUserRole);

// Get available roles for role change (any authenticated user can query; adjust if needed)
router.get('/available-roles', userRoleController.getAvailableRoles);

// Get role change history (Super Admin only)
router.get('/role-change-history', requireSuperAdmin, userRoleController.getRoleChangeHistory);

module.exports = router;
