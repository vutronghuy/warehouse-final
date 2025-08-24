const express = require('express');
const router = express.Router();

const importController = require('../controller/ImportController');
const { verifyToken, requireWarehouseAccess } = require('../middlewares/auth');

// Middleware để kiểm tra quyền truy cập warehouse
const warehouseAccess = requireWarehouseAccess('warehouseId');

// Admin approve/reject phiếu nhập kho
router.put('/:id/approve', verifyToken, importController.adminApproveImport);
router.put('/:id/reject', verifyToken, importController.adminRejectImport);

// Accounter confirm phiếu nhập kho
router.put('/:id/confirm', verifyToken, importController.accounterConfirmImport);

// Lấy danh sách phiếu nhập kho theo warehouse (có phân quyền)
router.get('/warehouse/:warehouseId', verifyToken, warehouseAccess, importController.getImportsByWarehouse);

module.exports = router;
