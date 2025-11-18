const AuditService = require('../services/auditService');
const User = require('../models/User');

// Get audit logs for staff (with filtering and pagination)
exports.getStaffAuditLogs = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      action = null,
      targetType = null,
      startDate = null,
      endDate = null,
      outcome = null
    } = req.query;

    // Get user info
    const user = await User.findById(req.user.sub);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Build options for audit service
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      action,
      targetType,
      startDate,
      endDate,
      outcome
    };

    // If user is staff, only show their own logs
    if (user.role === 'staff') {
      options.actorId = user._id;
    }
    // If user is manager, show logs for their warehouse staff
    else if (user.role === 'manager' && user.manager?.warehouseId) {
      // Get all staff in the same warehouse
      const warehouseStaff = await User.find({
        role: 'staff',
        'staff.warehouseId': user.manager.warehouseId
      }).select('_id');
      
      options.actorIds = warehouseStaff.map(staff => staff._id);
    }
    // If user is admin, show logs for their managed warehouses
    else if (user.role === 'admin' && user.admin?.managedWarehouses) {
      // Get all staff in managed warehouses
      const warehouseStaff = await User.find({
        role: 'staff',
        'staff.warehouseId': { $in: user.admin.managedWarehouses }
      }).select('_id');
      
      options.actorIds = warehouseStaff.map(staff => staff._id);
    }
    // Super admin can see all logs
    else if (user.admin?.isSuperAdmin) {
      // No restrictions
    } else {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const result = await AuditService.getStaffAuditLogs(options);

    res.json({
      success: true,
      auditLogs: result.logs,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    next(error);
  }
};

// Get audit statistics
exports.getAuditStats = async (req, res, next) => {
  try {
    const { startDate = null, endDate = null } = req.query;

    // Get user info
    const user = await User.findById(req.user.sub);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const options = {
      startDate,
      endDate
    };

    // If user is staff, only show their own stats
    if (user.role === 'staff') {
      options.actorId = user._id;
    }
    // If user is manager, show stats for their warehouse staff
    else if (user.role === 'manager' && user.manager?.warehouseId) {
      const warehouseStaff = await User.find({
        role: 'staff',
        'staff.warehouseId': user.manager.warehouseId
      }).select('_id');
      
      options.actorIds = warehouseStaff.map(staff => staff._id);
    }
    // If user is admin, show stats for their managed warehouses
    else if (user.role === 'admin' && user.admin?.managedWarehouses) {
      const warehouseStaff = await User.find({
        role: 'staff',
        'staff.warehouseId': { $in: user.admin.managedWarehouses }
      }).select('_id');
      
      options.actorIds = warehouseStaff.map(staff => staff._id);
    }
    // Super admin can see all stats
    else if (user.admin?.isSuperAdmin) {
      // No restrictions
    } else {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const stats = await AuditService.getAuditStats(options);

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error fetching audit stats:', error);
    next(error);
  }
};

// Get available actions for filtering
exports.getAvailableActions = async (req, res, next) => {
  try {
    const AuditLog = require('../models/AuditLog');
    
    const actions = await AuditLog.distinct('action', { category: 'BUSINESS' });
    
    res.json({
      success: true,
      actions: actions.sort()
    });
  } catch (error) {
    console.error('Error fetching available actions:', error);
    next(error);
  }
};

// Get available target types for filtering
exports.getAvailableTargetTypes = async (req, res, next) => {
  try {
    const AuditLog = require('../models/AuditLog');
    
    const targetTypes = await AuditLog.distinct('target.type', { category: 'BUSINESS' });
    
    res.json({
      success: true,
      targetTypes: targetTypes.sort()
    });
  } catch (error) {
    console.error('Error fetching available target types:', error);
    next(error);
  }
};
