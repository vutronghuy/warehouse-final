const express = require('express');
const router = express.Router();
const auditController = require('../controller/AuditController');
const { verifyToken } = require('../middlewares/auth');

// Apply authentication middleware to all routes
router.use(verifyToken);

// Get audit logs with filtering and pagination
router.get('/logs', auditController.getStaffAuditLogs);

// Get audit statistics
router.get('/stats', auditController.getAuditStats);

// Get available actions for filtering
router.get('/actions', auditController.getAvailableActions);

// Get available target types for filtering
router.get('/target-types', auditController.getAvailableTargetTypes);

module.exports = router;
