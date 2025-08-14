const express = require('express');
const router = express.Router();

const exportController = require('../controller/ExportController');
const { verifyToken, requireWarehouseAccess } = require('../middlewares/auth');

// Middleware để kiểm tra quyền truy cập warehouse
const warehouseAccess = requireWarehouseAccess('warehouseId');

// Admin approve/reject phiếu xuất kho
router.put('/:id/approve', verifyToken, exportController.adminApproveExport);
router.put('/:id/reject', verifyToken, exportController.adminRejectExport);

// Accounter confirm phiếu xuất kho
router.put('/:id/confirm', verifyToken, exportController.accounterConfirmExport);

// Lấy danh sách phiếu xuất kho theo warehouse (có phân quyền)
router.get('/warehouse/:warehouseId', verifyToken, warehouseAccess, exportController.getExportsByWarehouse);

module.exports = router;

