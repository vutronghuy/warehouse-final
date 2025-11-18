// routes/reports.js
const express = require('express');
const router = express.Router();
const reportsController = require('../controller/ReportController');
const { verifyToken } = require('../middlewares/auth');
const User = require('../models/User');

// Optional: middleware to restrict to accounter/admin roles
const requireAccounterOrAdmin = async (req, res, next) => {
  try {
    if (!req.user) return res.status(401).json({ ok: false, message: 'Unauthorized' });
    const allowed = ['accounter', 'admin'];
    if (!req.user.isSuperAdmin && !allowed.includes(req.user.role)) {
      return res.status(403).json({ ok: false, message: 'Access denied' });
    }

    if (req.user.isSuperAdmin || req.user.role === 'admin') {
      return next();
    }

    // Accounter must be scoped to their warehouse
    let warehouseId = req.user.warehouseId;
    if (!warehouseId) {
      const userDoc = await User.findById(req.user.sub).select('accounter.warehouseId').lean();
      warehouseId = userDoc?.accounter?.warehouseId?.toString() || null;
    }

    if (!warehouseId) {
      return res.status(403).json({ ok: false, message: 'Accounter is not assigned to any warehouse.' });
    }

    req.user.warehouseId = warehouseId;
    req.query.warehouse = warehouseId;
    req.accounterWarehouseId = warehouseId;
    return next();
  } catch (error) {
    console.error('requireAccounterOrAdmin error:', error);
    return res.status(500).json({ ok: false, message: 'Internal server error' });
  }
};

// GET /api/reports/accounting
router.get('/accounting', verifyToken, requireAccounterOrAdmin, reportsController.getAccountingDashboard);

// GET /api/reports/top-products - Top sản phẩm xuất nhiều nhất
router.get('/top-products', verifyToken, requireAccounterOrAdmin, reportsController.getTopProducts);

// GET /api/reports/cash-flow - Dòng tiền nhập-xuất kho
router.get('/cash-flow', verifyToken, requireAccounterOrAdmin, reportsController.getCashFlow);

// GET /api/reports/inventory-value - Giá trị hàng hóa tồn kho theo thời gian
router.get('/inventory-value', verifyToken, requireAccounterOrAdmin, reportsController.getInventoryValue);
// FIFO-based ending inventory
router.get('/inventory-value-fifo', verifyToken, requireAccounterOrAdmin, reportsController.getInventoryValueFIFO);

// GET /api/reports/cash-flow-time-series - Dữ liệu cash flow theo thời gian (cho line chart)
router.get('/cash-flow-time-series', verifyToken, requireAccounterOrAdmin, reportsController.getCashFlowTimeSeries);

// GET /api/reports/total-import-cost - Tổng chi phí từ ImportReceipt
router.get('/total-import-cost', verifyToken, requireAccounterOrAdmin, reportsController.getTotalImportCost);

// Test endpoints without authentication (for development only)
router.get('/test/top-products', reportsController.getTopProducts);
router.get('/test/cash-flow', reportsController.getCashFlow);
router.get('/test/inventory-value', reportsController.getInventoryValue);
router.get('/test/cash-flow-time-series', reportsController.getCashFlowTimeSeries);
router.get('/test/total-import-cost', reportsController.getTotalImportCost);

module.exports = router;
