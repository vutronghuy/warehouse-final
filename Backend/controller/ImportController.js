const ImportReceipt = require('../models/import/ImportReceipt');
const User = require('../models/User');
const mongoose = require('mongoose');

// Admin accept phiếu nhập kho
exports.adminApproveImport = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;
    const adminId = req.user.sub;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid import receipt ID format." });
    }

    // Tìm phiếu nhập kho
    const importReceipt = await ImportReceipt.findById(id);
    if (!importReceipt) {
      return res.status(404).json({ message: "Import receipt not found." });
    }

    // Kiểm tra trạng thái phiếu
    if (importReceipt.status !== 'reviewed') {
      return res.status(400).json({ 
        message: "Import receipt must be reviewed by manager before admin approval." 
      });
    }

    // Kiểm tra xem admin có quyền quản lý warehouse này không
    const admin = await User.findById(adminId).lean();
    if (!admin || !admin.admin || !admin.admin.managedWarehouses) {
      return res.status(403).json({ message: "Access denied. No warehouses managed." });
    }

    const hasAccess = admin.admin.managedWarehouses.some(
      id => String(id) === String(importReceipt.warehouseId)
    );

    if (!hasAccess) {
      return res.status(403).json({ 
        message: "Access denied. Warehouse not managed by this admin." 
      });
    }

    // Cập nhật trạng thái và thông tin admin approval
    importReceipt.status = 'approved';
    importReceipt.adminApproval = {
      approvedBy: adminId,
      approvedAt: new Date(),
      comment: comment || ''
    };

    await importReceipt.save();

    res.json({ 
      message: "Import receipt approved successfully.", 
      importReceipt: importReceipt 
    });

  } catch (error) {
    console.error('Admin approve import error:', error);
    next(error);
  }
};

// Admin reject phiếu nhập kho
exports.adminRejectImport = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;
    const adminId = req.user.sub;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid import receipt ID format." });
    }

    // Tìm phiếu nhập kho
    const importReceipt = await ImportReceipt.findById(id);
    if (!importReceipt) {
      return res.status(404).json({ message: "Import receipt not found." });
    }

    // Kiểm tra trạng thái phiếu
    if (importReceipt.status !== 'reviewed') {
      return res.status(400).json({ 
        message: "Import receipt must be reviewed by manager before admin approval." 
      });
    }

    // Kiểm tra xem admin có quyền quản lý warehouse này không
    const admin = await User.findById(adminId).lean();
    if (!admin || !admin.admin || !admin.admin.managedWarehouses) {
      return res.status(403).json({ message: "Access denied. No warehouses managed." });
    }

    const hasAccess = admin.admin.managedWarehouses.some(
      id => String(id) === String(importReceipt.warehouseId)
    );

    if (!hasAccess) {
      return res.status(403).json({ 
        message: "Access denied. Warehouse not managed by this admin." 
      });
    }

    // Cập nhật trạng thái và thông tin admin rejection
    importReceipt.status = 'rejected';
    importReceipt.adminApproval = {
      approvedBy: adminId,
      approvedAt: new Date(),
      comment: comment || 'Rejected by admin'
    };

    await importReceipt.save();

    res.json({ 
      message: "Import receipt rejected successfully.", 
      importReceipt: importReceipt 
    });

  } catch (error) {
    console.error('Admin reject import error:', error);
    next(error);
  }
};

// Accounter confirm phiếu nhập kho
exports.accounterConfirmImport = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;
    const accounterId = req.user.sub;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid import receipt ID format." });
    }

    // Tìm phiếu nhập kho
    const importReceipt = await ImportReceipt.findById(id);
    if (!importReceipt) {
      return res.status(404).json({ message: "Import receipt not found." });
    }

    // Kiểm tra trạng thái phiếu
    if (importReceipt.status !== 'approved') {
      return res.status(400).json({ 
        message: "Import receipt must be approved by admin before accounter confirmation." 
      });
    }

    // Kiểm tra xem accounter có thuộc warehouse này không
    const accounter = await User.findById(accounterId).lean();
    if (!accounter || !accounter.accounter || !accounter.accounter.warehouseId) {
      return res.status(403).json({ message: "Access denied. Invalid accounter." });
    }

    if (String(accounter.accounter.warehouseId) !== String(importReceipt.warehouseId)) {
      return res.status(403).json({ 
        message: "Access denied. Accounter not assigned to this warehouse." 
      });
    }

    // Cập nhật trạng thái và thông tin accounter confirmation
    importReceipt.status = 'confirmed';
    importReceipt.accounterConfirmation = {
      confirmedBy: accounterId,
      confirmedAt: new Date(),
      comment: comment || ''
    };

    await importReceipt.save();

    res.json({ 
      message: "Import receipt confirmed successfully.", 
      importReceipt: importReceipt 
    });

  } catch (error) {
    console.error('Accounter confirm import error:', error);
    next(error);
  }
};

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
