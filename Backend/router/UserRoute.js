const express = require('express');
const router = express.Router();

const userController = require('../controller/UserController');
const { verifyToken, requireSuperAdmin, checkUserStatus } = require('../middlewares/auth');

// Routes chỉ dành cho Super Admin
router.post('/init', verifyToken, requireSuperAdmin, userController.initSuperAdmin);
router.post('/create', verifyToken, requireSuperAdmin, userController.createUser);
router.put('/:id', verifyToken, requireSuperAdmin, userController.updateUser);
router.delete('/:id', verifyToken, requireSuperAdmin, userController.deleteUser);
router.post('/assign-warehouse', verifyToken, requireSuperAdmin, userController.assignWarehouseToAdmin);

// Password reset by admin (separate from edit user)
router.post('/:id/reset-password', verifyToken, requireSuperAdmin, userController.adminResetUserPassword);

// Toggle user status (active/inactive) - Super Admin only
router.put('/:id/toggle-status', verifyToken, requireSuperAdmin, userController.toggleUserStatus);

// Debug endpoint to check current user permissions
router.get('/me/permissions', verifyToken, userController.checkCurrentUserPermissions);

// Routes dành cho cả Admin và Super Admin (để xem thông tin)
router.get('/', verifyToken, checkUserStatus, userController.getAllUsers);
router.get('/:id', verifyToken, checkUserStatus, userController.getUserById);
router.get('/warehouses/me', verifyToken, checkUserStatus, userController.getAdminWarehouses);
router.get('/me/info', verifyToken, checkUserStatus, userController.getCurrentUserInfo);

module.exports = router;