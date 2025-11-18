// middlewares/auth.js
'use strict';

const User = require('../models/User');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Helper: safe logger (only prints details in non-production)
 */
function devLog(...args) {
  if (process.env.NODE_ENV !== 'production') {
    console.log(...args);
  }
}

/**
 * verifyToken: kiểm tra JWT (header Bearer hoặc cookie.token),
 *            attach decoded payload -> req.user (normalized)
 */
exports.verifyToken = (req, res, next) => {
  try {
    // Try Authorization header first
    const authHeader = req.headers?.authorization;
    let token = null;

    if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    // Fallback: cookie (if you use cookie-based tokens)
    if (!token && req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    if (!JWT_SECRET) {
      // Helpful in dev, but avoid leaking in production
      console.error('JWT_SECRET is not defined in environment - jwt.verify will fail.');
      return res.status(500).json({ success: false, message: 'Server misconfiguration (missing JWT secret).' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (verifyErr) {
      devLog('Token verification failed:', verifyErr.message);
      return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }

    // Normalize and attach convenient fields
    req.user = decoded || {};

    // Ensure both .sub and .id exist for downstream compatibility
    if (!req.user.id && req.user.sub) req.user.id = req.user.sub;
    if (!req.user.sub && req.user.id) req.user.sub = req.user.id;

    // Normalize common flags and role
    req.user.isSuperAdmin = !!req.user.isSuperAdmin;
    req.user.role = req.user.role || null;

    return next();
  } catch (error) {
    console.error('Unexpected error in verifyToken:', error);
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

/**
 * requireSuperAdmin: kiểm tra trực tiếp trên DB để đảm bảo quyền hiện tại của user
 * (bảo đảm token cũ / quyền bị thay đổi cũng được phát hiện)
 */
exports.requireSuperAdmin = async (req, res, next) => {
  try {
    if (!req.user || !req.user.sub) {
      devLog('❌ No user or sub in token');
      return res.status(401).json({ ok: false, message: 'Authentication required.' });
    }

    devLog('🔍 Checking admin for user:', req.user.sub);
    const admin = await User.findById(req.user.sub).lean();

    devLog('👤 User found:', {
      id: admin?._id,
      role: admin?.role,
      hasAdmin: !!admin?.admin,
      isSuperAdmin: admin?.admin?.isSuperAdmin
    });

    // Only allow super admin users
    if (!admin || !admin.admin || !admin.admin.isSuperAdmin) {
      devLog('❌ User is not super admin');
      // Avoid leaking internals in production responses
      return res.status(403).json({
        ok: false,
        message: 'Access denied. Super admin only.'
      });
    }

    // attach fresh user info (non-sensitive) to req.currentUser
    req.currentUser = {
      id: admin._id,
      email: admin.admin?.email,
      fullName: admin.admin?.fullName,
      role: admin.role,
      isSuperAdmin: !!admin.admin?.isSuperAdmin
    };

    return next();
  } catch (err) {
    console.error('requireSuperAdmin error:', err);
    return res.status(500).json({ ok: false, message: 'Internal server error.' });
  }
};

/**
 * requireAdmin: nhanh (dựa trên token). Nếu cần bảo mật cao, đổi sang DB-check tương tự requireSuperAdmin.
 * Allowed if token indicates role 'admin' OR isSuperAdmin flag present.
 */
exports.requireAdmin = (req, res, next) => {
  if (!req.user) return res.status(401).json({ ok: false, message: 'Authentication required.' });

  if (req.user.role !== 'admin' && !req.user.isSuperAdmin) {
    return res.status(403).json({ ok: false, message: 'Access denied. Admin or Super admin only.' });
  }
  next();
};

// alias
exports.requireAdminOrSuperAdmin = exports.requireAdmin;

/**
 * requireStaffOrAbove: token-only check for staff/manager/admin/accounter
 */
exports.requireStaffOrAbove = (req, res, next) => {
  if (!req.user) return res.status(401).json({ ok: false, message: 'Authentication required.' });

  const allowedRoles = ['staff', 'manager', 'admin', 'accounter'];
  if (!allowedRoles.includes(req.user.role) && !req.user.isSuperAdmin) {
    return res.status(403).json({ ok: false, message: 'Access denied. Staff level or above required.' });
  }
  next();
};

/**
 * requireWarehouseAccess: factory middleware to check warehouse access
 * - warehouseIdParam: param name in req.params to look for (default 'warehouseId')
 * Behavior:
 * - super admin -> allow
 * - admin -> DB-check admin.admin.managedWarehouses includes warehouseId
 * - manager/staff/accounter -> verify req.user.warehouseId matches (token must include warehouseId)
 */
exports.requireWarehouseAccess = (warehouseIdParam = 'warehouseId') => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.sub) {
        return res.status(401).json({ ok: false, message: 'Authentication required.' });
      }

      // Super admin has access to all
      if (req.user.isSuperAdmin) return next();

      const warehouseId = req.params?.[warehouseIdParam] || req.body?.warehouseId || req.query?.warehouseId;
      if (!warehouseId) return res.status(400).json({ ok: false, message: 'warehouseId is required.' });

      // Admin: check managedWarehouses in DB
      if (req.user.role === 'admin') {
        const admin = await User.findById(req.user.sub).lean();
        if (!admin || !admin.admin || !admin.admin.managedWarehouses) {
          return res.status(403).json({ ok: false, message: 'Access denied. No warehouses managed.' });
        }
        const hasAccess = admin.admin.managedWarehouses.some(id => String(id) === String(warehouseId));
        if (!hasAccess) return res.status(403).json({ ok: false, message: 'Access denied. Warehouse not managed by this admin.' });
        return next();
      }

      // Manager / Staff / Accounter: compare warehouseId inside token (token must contain warehouseId)
      if (['manager', 'staff', 'accounter'].includes(req.user.role)) {
        if (!req.user.warehouseId) {
          return res.status(403).json({ ok: false, message: 'Access denied. Token missing warehouse assignment.' });
        }
        if (String(req.user.warehouseId) !== String(warehouseId)) {
          return res.status(403).json({ ok: false, message: 'Access denied. Warehouse not assigned to you.' });
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

/**
 * checkUserStatus: kiểm tra user có bị deactivate không
 * - bảo đảm user vẫn active ở DB (DB-check)
 * - optional: invalidate token if token issued before lastPasswordChangeAt
 */
exports.checkUserStatus = async (req, res, next) => {
  try {
    const userId = req.user?.sub || req.user?.id;
    if (!userId) return next();

    const user = await User.findById(userId).lean();
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found.",
        code: 'USER_NOT_FOUND'
      });
    }

    const role = user.role;
    const userRoleData = user[role];

    // If role data missing, deny access
    if (!userRoleData) {
      return res.status(403).json({
        success: false,
        message: 'Account role data missing. Access denied.',
        code: 'ROLE_DATA_MISSING'
      });
    }

    const userStatus = userRoleData.status;
    const isActive = !!userRoleData.isActive;

    // Check if user is active
    if (userStatus !== 'active' || !isActive) {
      return res.status(403).json({
        success: false,
        message: "Tài khoản của bạn đã bị vô hiệu hóa. Vui lòng liên hệ với quản trị viên.",
        code: 'ACCOUNT_DEACTIVATED'
      });
    }

    // Special check for super admin - if they are deactivated, deny
    if (role === 'admin' && user.admin?.isSuperAdmin) {
      if (userStatus !== 'active' || !isActive) {
        return res.status(403).json({
          success: false,
          message: "Super admin account has been deactivated. Access denied.",
          code: 'SUPER_ADMIN_DEACTIVATED'
        });
      }
    }

    // OPTIONAL: invalidate token if issued before lastPasswordChangeAt
    try {
      const tokenIat = req.user?.iat; // jwt iat in seconds
      const lastChange = userRoleData.lastPasswordChangeAt;
      if (tokenIat && lastChange) {
        const lastChangeSec = Math.floor(new Date(lastChange).getTime() / 1000);
        if (tokenIat < lastChangeSec) {
          return res.status(401).json({
            success: false,
            message: 'Token invalid (password changed). Please login again.',
            code: 'TOKEN_INVALIDATED_BY_PASSWORD_CHANGE'
          });
        }
      }
    } catch (e) {
      // Non-fatal: if comparing fails, continue (we already checked active status)
      devLog('Password-change token invalidation check failed:', e.message);
    }

    // attach sanitized current user info for downstream handlers (optional)
    req.currentUser = req.currentUser || {
      id: user._id,
      role: user.role,
      email: user[role]?.email || null,
      fullName: user[role]?.fullName || null,
      isSuperAdmin: !!user.admin?.isSuperAdmin
    };

    next();
  } catch (error) {
    console.error('Error checking user status:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error.'
    });
  }
};
