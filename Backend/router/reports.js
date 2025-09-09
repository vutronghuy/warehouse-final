// routes/reports.js
const express = require('express');
const router = express.Router();
const reportsController = require('../controller/ReportController');
const { verifyToken } = require('../middlewares/auth');

// Optional: middleware to restrict to accounter/admin roles
const requireAccounterOrAdmin = (req, res, next) => {
  if (!req.user) return res.status(401).json({ ok: false, message: 'Unauthorized' });
  const allowed = ['accounter', 'admin'];
  if (req.user.isSuperAdmin || allowed.includes(req.user.role)) return next();
  return res.status(403).json({ ok: false, message: 'Access denied' });
};

// GET /api/reports/accounting
router.get('/accounting', verifyToken, requireAccounterOrAdmin, reportsController.getAccountingDashboard);

// GET /api/reports/top-products - Top sản phẩm xuất nhiều nhất
router.get('/top-products', verifyToken, requireAccounterOrAdmin, reportsController.getTopProducts);

// GET /api/reports/cash-flow - Dòng tiền nhập-xuất kho
router.get('/cash-flow', verifyToken, requireAccounterOrAdmin, reportsController.getCashFlow);

// GET /api/reports/inventory-value - Giá trị hàng hóa tồn kho theo thời gian
router.get('/inventory-value', verifyToken, requireAccounterOrAdmin, reportsController.getInventoryValue);

// GET /api/reports/cash-flow-time-series - Dữ liệu cash flow theo thời gian (cho line chart)
router.get('/cash-flow-time-series', verifyToken, requireAccounterOrAdmin, reportsController.getCashFlowTimeSeries);

// Test endpoints without authentication (for development only)
router.get('/test/top-products', reportsController.getTopProducts);
router.get('/test/cash-flow', reportsController.getCashFlow);
router.get('/test/inventory-value', reportsController.getInventoryValue);
router.get('/test/cash-flow-time-series', reportsController.getCashFlowTimeSeries);

module.exports = router;
