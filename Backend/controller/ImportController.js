const ImportReceipt = require('../models/import/ImportReceipt');
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
    
    if (status && ['created', 'reviewed', 'approved', 'confirmed', 'rejected'].includes(status)) {
      query.status = status;
    }

    const importReceipts = await ImportReceipt.find(query)
      .populate('createdByStaff', 'staff.fullName')
      .populate('managerReview.reviewedBy', 'manager.fullName')
      .populate('adminApproval.approvedBy', 'admin.fullName')
      .populate('accounterConfirmation.confirmedBy', 'accounter.fullName')
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
