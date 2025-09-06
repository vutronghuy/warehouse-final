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

module.exports = router;
