const ExportReceipt = require('../models/export/ExportReceipt');
const User = require('../models/User');
const mongoose = require('mongoose');

// Admin accept phiếu xuất kho
exports.adminApproveExport = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;
    const adminId = req.user.sub;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid export receipt ID format." });
    }

    // Tìm phiếu xuất kho
    const exportReceipt = await ExportReceipt.findById(id);
    if (!exportReceipt) {
      return res.status(404).json({ message: "Export receipt not found." });
    }

    // Kiểm tra trạng thái phiếu
    if (exportReceipt.status !== 'reviewed') {
      return res.status(400).json({ 
        message: "Export receipt must be reviewed by manager before admin approval." 
      });
    }

    // Kiểm tra xem admin có quyền quản lý warehouse này không
    const admin = await User.findById(adminId).lean();
    if (!admin || !admin.admin || !admin.admin.managedWarehouses) {
      return res.status(403).json({ message: "Access denied. No warehouses managed." });
    }

    const hasAccess = admin.admin.managedWarehouses.some(
      id => String(id) === String(exportReceipt.warehouseId)
    );

    if (!hasAccess) {
      return res.status(403).json({ 
        message: "Access denied. Warehouse not managed by this admin." 
      });
    }

    // Cập nhật trạng thái và thông tin admin approval
    exportReceipt.status = 'approved';
    exportReceipt.adminApproval = {
      approvedBy: adminId,
      approvedAt: new Date(),
      comment: comment || ''
    };

    await exportReceipt.save();

    res.json({ 
      message: "Export receipt approved successfully.", 
      exportReceipt: exportReceipt 
    });

  } catch (error) {
    console.error('Admin approve export error:', error);
    next(error);
  }
};

// Admin reject phiếu xuất kho
exports.adminRejectExport = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;
    const adminId = req.user.sub;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid export receipt ID format." });
    }

    // Tìm phiếu xuất kho
    const exportReceipt = await ExportReceipt.findById(id);
    if (!exportReceipt) {
      return res.status(404).json({ message: "Export receipt not found." });
    }

    // Kiểm tra trạng thái phiếu
    if (exportReceipt.status !== 'reviewed') {
      return res.status(400).json({ 
        message: "Export receipt must be reviewed by manager before admin approval." 
      });
    }

    // Kiểm tra xem admin có quyền quản lý warehouse này không
    const admin = await User.findById(adminId).lean();
    if (!admin || !admin.admin || !admin.admin.managedWarehouses) {
      return res.status(403).json({ message: "Access denied. No warehouses managed." });
    }

    const hasAccess = admin.admin.managedWarehouses.some(
      id => String(id) === String(exportReceipt.warehouseId)
    );

    if (!hasAccess) {
      return res.status(403).json({ 
        message: "Access denied. Warehouse not managed by this admin." 
      });
    }

    // Cập nhật trạng thái và thông tin admin rejection
    exportReceipt.status = 'rejected';
    exportReceipt.adminApproval = {
      approvedBy: adminId,
      approvedAt: new Date(),
      comment: comment || 'Rejected by admin'
    };

    await exportReceipt.save();

    res.json({ 
      message: "Export receipt rejected successfully.", 
      exportReceipt: exportReceipt 
    });

  } catch (error) {
    console.error('Admin reject export error:', error);
    next(error);
  }
};

// Accounter confirm phiếu xuất kho
exports.accounterConfirmExport = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;
    const accounterId = req.user.sub;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid export receipt ID format." });
    }

    // Tìm phiếu xuất kho
    const exportReceipt = await ExportReceipt.findById(id);
    if (!exportReceipt) {
      return res.status(404).json({ message: "Export receipt not found." });
    }

    // Kiểm tra trạng thái phiếu
    if (exportReceipt.status !== 'approved') {
      return res.status(400).json({ 
        message: "Export receipt must be approved by admin before accounter confirmation." 
      });
    }

    // Kiểm tra xem accounter có thuộc warehouse này không
    const accounter = await User.findById(accounterId).lean();
    if (!accounter || !accounter.accounter || !accounter.accounter.warehouseId) {
      return res.status(403).json({ message: "Access denied. Invalid accounter." });
    }

    if (String(accounter.accounter.warehouseId) !== String(exportReceipt.warehouseId)) {
      return res.status(403).json({ 
        message: "Access denied. Accounter not assigned to this warehouse." 
      });
    }

    // Cập nhật trạng thái và thông tin accounter confirmation
    exportReceipt.status = 'confirmed';
    exportReceipt.accounterConfirmation = {
      confirmedBy: accounterId,
      confirmedAt: new Date(),
      comment: comment || ''
    };

    await exportReceipt.save();

    res.json({ 
      message: "Export receipt confirmed successfully.", 
      exportReceipt: exportReceipt 
    });

  } catch (error) {
    console.error('Accounter confirm export error:', error);
    next(error);
  }
};

// Lấy danh sách phiếu xuất kho theo warehouse (có phân quyền)
exports.getExportsByWarehouse = async (req, res, next) => {
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

    const exportReceipts = await ExportReceipt.find(query)
      .populate('createdByStaff', 'staff.fullName')
      .populate('managerReview.reviewedBy', 'manager.fullName')
      .populate('adminApproval.approvedBy', 'admin.fullName')
      .populate('accounterConfirmation.confirmedBy', 'accounter.fullName')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ 
      exportReceipts,
      count: exportReceipts.length,
      warehouseId,
      filters: { status: status || 'all' }
    });

  } catch (error) {
    console.error('Get exports by warehouse error:', error);
    next(error);
  }
};

