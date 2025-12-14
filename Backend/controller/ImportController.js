const ImportReceipt = require('../models/import/ImportReceipt');
const ImportDetail = require('../models/import/ImportDetail');
const User = require('../models/User');
const mongoose = require('mongoose');

// Admin accept phiếu nhập kho

// Lấy danh sách phiếu nhập kho theo warehouse (có phân quyền)
exports.getImportsByWarehouse = async (req, res, next) => {
  try {
    const { warehouseId } = req.params;
    const { status } = req.query;

    if (!warehouseId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid warehouse ID format." });
    }

    // Kiểm tra quyền truy cập warehouse
    const user = await User.findById(req.user.sub).lean();
    if (!user) {
      return res.status(401).json({ message: "User not found." });
    }

    let hasAccess = false;

    // Super admin có quyền truy cập tất cả
    if (user.admin && user.admin.isSuperAdmin) {
      hasAccess = true;
    }
    // Admin thường chỉ có quyền truy cập warehouse mình quản lý
    else if (user.role === 'admin' && user.admin) {
      hasAccess = user.admin.managedWarehouses.some(
        id => String(id) === String(warehouseId)
      );
    }
    // Manager chỉ có quyền truy cập warehouse mình quản lý
    else if (user.role === 'manager' && user.manager) {
      hasAccess = String(user.manager.warehouseId) === String(warehouseId);
    }
    // Staff chỉ có quyền truy cập warehouse mình thuộc về
    else if (user.role === 'staff' && user.staff) {
      hasAccess = String(user.staff.warehouseId) === String(warehouseId);
    }
    // Accounter chỉ có quyền truy cập warehouse mình thuộc về
    else if (user.role === 'accounter' && user.accounter) {
      hasAccess = String(user.accounter.warehouseId) === String(warehouseId);
    }

    if (!hasAccess) {
      return res.status(403).json({ 
        message: "Access denied. Warehouse not accessible." 
      });
    }

    // Xây dựng query
    let query = { warehouseId };
    
    if (status && ['created'].includes(status)) {
      query.status = status;
    }

    const importReceipts = await ImportReceipt.find(query)
      .populate('createdByStaff', 'staff.fullName')
      .populate('supplierId', 'name')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ 
      importReceipts,
      count: importReceipts.length,
      warehouseId,
      filters: { status: status || 'all' }
    });

  } catch (error) {
    console.error('Get imports by warehouse error:', error);
    next(error);
  }
};

// Get import receipts for staff (only their warehouse)
exports.getImportReceiptsForStaff = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    // Get user info to determine warehouse
    const user = await User.findById(req.user.sub).lean();
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    let warehouseId = null;
    const role = req.user.role;

    if (role === 'staff' && user.staff?.warehouseId) {
      warehouseId = user.staff.warehouseId;
    } else if (role === 'manager' && user.manager?.warehouseId) {
      warehouseId = user.manager.warehouseId;
    } else if (role === 'accounter' && user.accounter?.warehouseId) {
      warehouseId = user.accounter.warehouseId;
    } else if (role === 'admin' && user.admin?.managedWarehouses?.length > 0) {
      warehouseId = user.admin.managedWarehouses[0];
    }

    if (!warehouseId) {
      return res.status(403).json({
        success: false,
        message: 'No warehouse access'
      });
    }

    // Build query
    let query = { warehouseId, deletedAt: null };

    if (status && ['created'].includes(status)) {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const importReceipts = await ImportReceipt.find(query)
      .populate('createdByStaff', 'staff.fullName')
      .populate('supplierId', 'name')
      .populate('warehouseId', 'name location')
      .populate('details.productId', 'name sku')
      .populate('details.supplierId', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await ImportReceipt.countDocuments(query);

    // Prevent caching
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });

    res.json({
      success: true,
      importReceipts,
      pagination: {
        current: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Get import receipts for staff error:', error);
    next(error);
  }
};

// Get import receipt detail by ID
exports.getImportReceiptById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid import receipt ID'
      });
    }

    // Get user info to check warehouse access
    const user = await User.findById(req.user.sub).lean();
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const importReceipt = await ImportReceipt.findById(id)
      .populate('createdByStaff', 'staff.fullName')
      .populate('supplierId', 'name contactInfo')
      .populate('warehouseId', 'name location')
      .populate('details.productId', 'name sku unit basePrice finalPrice productBatch')
      .populate('details.supplierId', 'name contactInfo')
      .lean();

    if (!importReceipt) {
      return res.status(404).json({
        success: false,
        message: 'Import receipt not found'
      });
    }

    // Check warehouse access
    let hasAccess = false;
    const role = req.user.role;

    if (role === 'staff' && user.staff?.warehouseId) {
      hasAccess = String(user.staff.warehouseId) === String(importReceipt.warehouseId._id);
    } else if (role === 'manager' && user.manager?.warehouseId) {
      hasAccess = String(user.manager.warehouseId) === String(importReceipt.warehouseId._id);
    } else if (role === 'accounter' && user.accounter?.warehouseId) {
      hasAccess = String(user.accounter.warehouseId) === String(importReceipt.warehouseId._id);
    } else if (role === 'admin' && user.admin?.managedWarehouses) {
      hasAccess = user.admin.managedWarehouses.some(
        wId => String(wId) === String(importReceipt.warehouseId._id)
      );
    }

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this import receipt'
      });
    }

    // Prevent caching
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });

    res.json({
      success: true,
      importReceipt
    });

  } catch (error) {
    console.error('Get import receipt by ID error:', error);
    next(error);
  }
};
