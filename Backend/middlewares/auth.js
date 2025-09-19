// const User = require('../models/User');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;

exports.verifyToken = (req, res, next) => {
  try {
    const auth = req.headers.authorization || req.headers.Authorization;
    if (!auth || !auth.startsWith('Bearer ')) {
      return res.status(401).json({ ok: false, message: 'No token provided.' });
    }

    const token = auth.split(' ')[1];

    // Debug: Log token info (first/last few chars only for security)
    console.log('🔍 Token debug:', {
      tokenLength: token ? token.length : 0,
      tokenStart: token ? token.substring(0, 10) + '...' : 'null',
      tokenEnd: token ? '...' + token.substring(token.length - 10) : 'null'
    });

    // Validate token format
    if (!token || token.length < 10) {
      console.error('❌ Token too short or empty');
      return res.status(401).json({ ok: false, message: 'Invalid token format.' });
    }

    // Check if token has proper JWT structure (3 parts separated by dots)
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      console.error('❌ Token does not have 3 parts:', tokenParts.length);
      return res.status(401).json({ ok: false, message: 'Malformed token structure.' });
    }

    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    return next();
  } catch (err) {
    console.error('verifyToken error:', err);
    // Nếu token hết hạn, trả mã và payload thông tin expired
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        ok: false,
        message: 'token_expired',
        expiredAt: err.expiredAt,
      });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({
        ok: false,
        message: 'Token is malformed. Please login again.',
        error: 'jwt_malformed'
      });
    }
    return res.status(401).json({ ok: false, message: 'Invalid or expired token.' });
  }
};

exports.requireSuperAdmin = (req, res, next) => {
  // Assumes verifyToken ran previously (so req.user exists)
  if (!req.user) {
    return res.status(401).json({ ok: false, message: 'Authentication required.' });
  }
  if (!req.user.isSuperAdmin) {
    return res.status(403).json({ ok: false, message: 'Access denied. Super admin only.' });
  }
  next();
};

exports.requireAdmin = (req, res, next) => {
  // Assumes verifyToken ran previously (so req.user exists)
  if (!req.user) {
    return res.status(401).json({ ok: false, message: 'Authentication required.' });
  }
  // Allow both admin and super admin
  if (req.user.role !== 'admin' && !req.user.isSuperAdmin) {
    return res.status(403).json({ ok: false, message: 'Access denied. Admin or Super admin only.' });
  }
  next();
};

// Middleware cho admin hoặc super admin
exports.requireAdminOrSuperAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ ok: false, message: 'Authentication required.' });
  }
  // Allow both admin and super admin
  if (req.user.role !== 'admin' && !req.user.isSuperAdmin) {
    return res.status(403).json({ ok: false, message: 'Access denied. Admin or Super admin only.' });
  }
  next();
};

// Middleware cho staff trở lên (staff, manager, admin, super admin)
exports.requireStaffOrAbove = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ ok: false, message: 'Authentication required.' });
  }

  const allowedRoles = ['staff', 'manager', 'admin', 'accounter'];
  if (!allowedRoles.includes(req.user.role) && !req.user.isSuperAdmin) {
    return res.status(403).json({ ok: false, message: 'Access denied. Staff level or above required.' });
  }
  next();
};

// Middleware để kiểm tra admin có quyền quản lý warehouse cụ thể
exports.requireWarehouseAccess = (warehouseIdParam = 'warehouseId') => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ ok: false, message: 'Authentication required.' });
      }

      // Super admin có quyền truy cập tất cả warehouse
      if (req.user.isSuperAdmin) {
        return next();
      }

      // Admin thường chỉ có quyền truy cập warehouse mình quản lý
      if (req.user.role === 'admin' && req.user.roleKey === 'admin') {
        const warehouseId = req.params[warehouseIdParam] || req.body.warehouseId;
        if (!warehouseId) {
          return res.status(400).json({ ok: false, message: 'warehouseId is required.' });
        }

        // Kiểm tra xem admin có quản lý warehouse này không
        const User = require('../models/User');
        const admin = await User.findById(req.user.sub).lean();
        
        if (!admin || !admin.admin || !admin.admin.managedWarehouses) {
          return res.status(403).json({ ok: false, message: 'Access denied. No warehouses managed.' });
        }

        const hasAccess = admin.admin.managedWarehouses.some(
          id => String(id) === String(warehouseId)
        );

        if (!hasAccess) {
          return res.status(403).json({ ok: false, message: 'Access denied. Warehouse not managed by this admin.' });
        }

        return next();
      }

      // Manager chỉ có quyền truy cập warehouse mình quản lý
      if (req.user.role === 'manager' && req.user.roleKey === 'manager') {
        const warehouseId = req.params[warehouseIdParam] || req.body.warehouseId;
        if (!warehouseId) {
          return res.status(400).json({ ok: false, message: 'warehouseId is required.' });
        }

        if (String(req.user.warehouseId) !== String(warehouseId)) {
          return res.status(403).json({ ok: false, message: 'Access denied. Warehouse not managed by this manager.' });
        }

        return next();
      }

      // Staff chỉ có quyền truy cập warehouse mình thuộc về
      if (req.user.role === 'staff' && req.user.roleKey === 'staff') {
        const warehouseId = req.params[warehouseIdParam] || req.body.warehouseId;
        if (!warehouseId) {
          return res.status(400).json({ ok: false, message: 'warehouseId is required.' });
        }

        if (String(req.user.warehouseId) !== String(warehouseId)) {
          return res.status(403).json({ ok: false, message: 'Access denied. Warehouse not assigned to this staff.' });
        }

        return next();
      }

      // Accounter chỉ có quyền truy cập warehouse mình thuộc về
      if (req.user.role === 'accounter' && req.user.roleKey === 'accounter') {
        const warehouseId = req.params[warehouseIdParam] || req.body.warehouseId;
        if (!warehouseId) {
          return res.status(400).json({ ok: false, message: 'warehouseId is required.' });
        }

        if (String(req.user.warehouseId) !== String(warehouseId)) {
          return res.status(403).json({ ok: false, message: 'Access denied. Warehouse not assigned to this accounter.' });
        }

        return next();
      }

      return res.status(403).json({ ok: false, message: 'Access denied. Insufficient permissions.' });
    } catch (error) {
      console.error('requireWarehouseAccess error:', error);
      return res.status(500).json({ ok: false, message: 'Internal server error.' });
    }
  };
};