const express = require('express');
const router = express.Router();

const importController = require('../controller/ImportController');
const { verifyToken, requireWarehouseAccess, requireStaffOrAbove } = require('../middlewares/auth');

// Middleware để kiểm tra quyền truy cập warehouse
const warehouseAccess = requireWarehouseAccess('warehouseId');

// Staff routes - get import receipts for their warehouse
router.get('/receipts', verifyToken, requireStaffOrAbove, importController.getImportReceiptsForStaff);

// Get import receipt detail by ID
router.get('/receipts/:id', verifyToken, requireStaffOrAbove, importController.getImportReceiptById);

// Lấy danh sách phiếu nhập kho theo warehouse (có phân quyền) - legacy route
router.get('/warehouse/:warehouseId', verifyToken, warehouseAccess, importController.getImportsByWarehouse);

module.exports = router;
