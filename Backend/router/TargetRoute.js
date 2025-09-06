// routes/TargetRoute.js
const express = require('express');
const router = express.Router();
const targetController = require('../controller/TargetController');
const { verifyToken, requireAdminOrSuperAdmin } = require('../middlewares/auth');

// Disable cache middleware (prevents browser 304 caching)
const disableCache = (req, res, next) => {
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    'Last-Modified': new Date().toUTCString()
  });
  next();
};

// Public for authorized roles
router.get('/', disableCache, verifyToken, targetController.getTargets);

// Create -> Admin or SuperAdmin (or allow staff via setTarget if desired)
router.post('/', verifyToken, requireAdminOrSuperAdmin, targetController.createTarget);

// Optional upsert (allow staff/admin): replace or set target in one call
router.post('/set', verifyToken, requireAdminOrSuperAdmin, targetController.setTarget);

// Update by id
router.put('/:id', verifyToken, requireAdminOrSuperAdmin, targetController.updateTarget);

// Delete (soft delete)
router.delete('/:id', verifyToken, requireAdminOrSuperAdmin, targetController.deleteTarget);

module.exports = router;
