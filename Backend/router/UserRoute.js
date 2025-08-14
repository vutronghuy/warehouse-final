const express = require('express');
const router = express.Router();

const userController = require('../controller/UserController');
const { verifyToken, requireSuperAdmin } = require('../middlewares/auth');

// Routes chỉ dành cho Super Admin
router.post('/init', verifyToken, requireSuperAdmin, userController.initSuperAdmin);
router.post('/create', verifyToken, requireSuperAdmin, userController.createUser);
router.put('/:id', verifyToken, requireSuperAdmin, userController.updateUser);
router.delete('/:id', verifyToken, requireSuperAdmin, userController.deleteUser);
router.post('/assign-warehouse', verifyToken, requireSuperAdmin, userController.assignWarehouseToAdmin);

// Password reset by admin (separate from edit user)
router.post('/:id/reset-password', verifyToken, requireSuperAdmin, userController.adminResetUserPassword);

// Routes dành cho cả Admin và Super Admin (để xem thông tin)
router.get('/', verifyToken, userController.getAllUsers);
router.get('/:id', verifyToken, userController.getUserById);
router.get('/warehouses/me', verifyToken, userController.getAdminWarehouses);
router.get('/me/info', verifyToken, userController.getCurrentUserInfo);

module.exports = router;