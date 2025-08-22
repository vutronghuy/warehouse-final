const ExportReceipt = require('../models/export/ExportReceipt');
const Product = require('../models/products/product');
const User = require('../models/User');
const mongoose = require('mongoose');

// Generate receipt number
const generateReceiptNumber = async () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  
  const prefix = `EXP${year}${month}${day}`;
  
  // Find the latest receipt number for today
  const latestReceipt = await ExportReceipt.findOne({
    receiptNumber: { $regex: `^${prefix}` }
  }).sort({ receiptNumber: -1 });
  
  let sequence = 1;
  if (latestReceipt) {
    const lastSequence = parseInt(latestReceipt.receiptNumber.slice(-4));
    sequence = lastSequence + 1;
  }
  
  return `${prefix}${String(sequence).padStart(4, '0')}`;
};

// Create export receipt (Staff only)
exports.createExportReceipt = async (req, res, next) => {
  try {
    console.log('🚀 CREATE EXPORT RECEIPT CALLED!');
    console.log('🔍 Request body:', JSON.stringify(req.body, null, 2));
    console.log('🔍 User:', req.user);

    const { customerName, customerPhone, customerAddress, details, notes } = req.body;

    // Validate required fields
    if (!customerName || !details || !Array.isArray(details) || details.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Customer name and export details are required'
      });
    }

    // Get user info to determine warehouse
    const user = await User.findById(req.user.sub).lean();
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    let warehouseId;
    if (req.user.role === 'staff' && user.staff?.warehouseId) {
      warehouseId = user.staff.warehouseId;
    } else {
      return res.status(403).json({
        success: false,
        message: 'Only staff can create export receipts'
      });
    }

    // Validate products and check stock
    let totalAmount = 0;
    const validatedDetails = [];

    for (const detail of details) {
      const { productId, quantity } = detail;

      if (!productId || !quantity || quantity <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid product or quantity in export details'
        });
      }

      // Check if product exists and belongs to the same warehouse
      const product = await Product.findOne({
        _id: productId,
        warehouseId: warehouseId
      });

      if (!product) {
        return res.status(400).json({
          success: false,
          message: `Product not found or not in your warehouse`
        });
      }

      // Check stock availability
      if (product.quantity < quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}. Available: ${product.quantity}, Requested: ${quantity}`
        });
      }

      validatedDetails.push({
        productId,
        quantity: parseInt(quantity)
      });

      totalAmount += product.basePrice * quantity;
    }

    // Generate receipt number
    const receiptNumber = await generateReceiptNumber();

    // Create export receipt
    const exportReceipt = new ExportReceipt({
      receiptNumber,
      customerName: customerName.trim(),
      customerPhone: customerPhone?.trim() || '',
      customerAddress: customerAddress?.trim() || '',
      warehouseId,
      createdByStaff: req.user.sub,
      details: validatedDetails,
      totalAmount,
      notes: notes?.trim() || '',
      status: 'created'
    });

    await exportReceipt.save();

    // Populate for response
    await exportReceipt.populate([
      { path: 'warehouseId', select: 'name location' },
      { path: 'createdByStaff', select: 'staff.fullName' },
      { path: 'details.productId', select: 'name sku basePrice' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Export receipt created successfully',
      exportReceipt
    });
  } catch (error) {
    console.error('❌ Error creating export receipt:', error);
    next(error);
  }
};

// Get export receipts (filtered by user role and warehouse)
exports.getExportReceipts = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;

    // Get user info to determine warehouse access
    const user = await User.findById(req.user.sub).lean();
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Build filter based on user role
    const filter = { deletedAt: null };

    if (req.user.role === 'staff' && user.staff?.warehouseId) {
      filter.warehouseId = user.staff.warehouseId;
      filter.createdByStaff = req.user.sub; // Staff can only see their own receipts
    } else if (req.user.role === 'manager' && user.manager?.warehouseId) {
      filter.warehouseId = user.manager.warehouseId;
    } else if (req.user.role === 'admin' && user.admin?.managedWarehouses) {
      filter.warehouseId = { $in: user.admin.managedWarehouses };
    } else if (req.user.isSuperAdmin) {
      // Super admin can see all
    } else {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Add status filter
    if (status) {
      filter.status = status;
    }

    // Add search filter
    if (search) {
      filter.$or = [
        { receiptNumber: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const exportReceipts = await ExportReceipt.find(filter)
      .populate('warehouseId', 'name location')
      .populate('createdByStaff', 'staff.fullName')
      .populate('managerReview.reviewedBy', 'manager.fullName')
      .populate('adminApproval.approvedBy', 'admin.fullName')
      .populate('details.productId', 'name sku basePrice')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await ExportReceipt.countDocuments(filter);

    res.json({
      success: true,
      exportReceipts,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalReceipts: total,
        hasNext: skip + exportReceipts.length < total,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('❌ Error fetching export receipts:', error);
    next(error);
  }
};

// Get approved export receipts for invoice creation (Staff can see all approved receipts in their warehouse)
exports.getConfirmedExportReceipts = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, search } = req.query;

    // Get user info to determine warehouse access
    const user = await User.findById(req.user.sub).lean();
    console.log('👤 User info:', {
      id: req.user.sub,
      role: req.user.role,
      warehouseId: user?.staff?.warehouseId
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Build filter based on user role
    const filter = {
      deletedAt: null,
      status: 'approved' // Only approved receipts can be used for invoice creation
    };

    if (req.user.role === 'staff' && user.staff?.warehouseId) {
      filter.warehouseId = user.staff.warehouseId;
      // Note: Staff can see ALL approved receipts in their warehouse, not just their own
    } else if (req.user.role === 'manager' && user.manager?.warehouseId) {
      filter.warehouseId = user.manager.warehouseId;
    } else if (req.user.role === 'admin' && user.admin?.managedWarehouses) {
      filter.warehouseId = { $in: user.admin.managedWarehouses };
    } else if (req.user.isSuperAdmin) {
      // Super admin can see all
    } else {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    console.log('🔍 Filter for approved export receipts:', filter);

    // Add search filter
    if (search) {
      filter.$or = [
        { receiptNumber: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const exportReceipts = await ExportReceipt.find(filter)
      .populate('warehouseId', 'name location')
      .populate('createdByStaff', 'staff.fullName')
      .populate('details.productId', 'name sku basePrice unit')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    console.log(`📦 Found ${exportReceipts.length} approved export receipts for user ${req.user.sub}`);

    const total = await ExportReceipt.countDocuments(filter);

    res.json({
      success: true,
      exportReceipts,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalReceipts: total,
        hasNext: skip + exportReceipts.length < total,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('❌ Error fetching confirmed export receipts:', error);
    next(error);
  }
};

// Get single export receipt
exports.getExportReceiptById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const exportReceipt = await ExportReceipt.findById(id)
      .populate('warehouseId', 'name location')
      .populate('createdByStaff', 'staff.fullName')
      .populate('managerReview.reviewedBy', 'manager.fullName')
      .populate('adminApproval.approvedBy', 'admin.fullName')
      .populate('details.productId', 'name sku basePrice quantity')
      .lean();

    if (!exportReceipt) {
      return res.status(404).json({
        success: false,
        message: 'Export receipt not found'
      });
    }

    // Check access permissions
    const user = await User.findById(req.user.sub).lean();
    let hasAccess = false;

    if (req.user.isSuperAdmin) {
      hasAccess = true;
    } else if (req.user.role === 'staff' && user.staff?.warehouseId) {
      hasAccess = exportReceipt.warehouseId._id.toString() === user.staff.warehouseId.toString() &&
                  exportReceipt.createdByStaff.toString() === req.user.sub;
    } else if (req.user.role === 'manager' && user.manager?.warehouseId) {
      hasAccess = exportReceipt.warehouseId._id.toString() === user.manager.warehouseId.toString();
    } else if (req.user.role === 'admin' && user.admin?.managedWarehouses) {
      hasAccess = user.admin.managedWarehouses.some(wh => 
        wh.toString() === exportReceipt.warehouseId._id.toString()
      );
    }

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      exportReceipt
    });
  } catch (error) {
    console.error('❌ Error fetching export receipt:', error);
    next(error);
  }
};

// Manager review export receipt
exports.managerReviewReceipt = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { action, comment } = req.body; // action: 'approve' or 'reject'

    if (!action || !['approve', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid action. Must be "approve" or "reject"'
      });
    }

    const exportReceipt = await ExportReceipt.findById(id);
    if (!exportReceipt) {
      return res.status(404).json({
        success: false,
        message: 'Export receipt not found'
      });
    }

    // Check if receipt is in correct status
    if (exportReceipt.status !== 'created') {
      return res.status(400).json({
        success: false,
        message: 'Receipt can only be reviewed when in "created" status'
      });
    }

    // Check if manager has access to this warehouse
    const user = await User.findById(req.user.sub).lean();
    if (!user || req.user.role !== 'manager' || !user.manager?.warehouseId) {
      return res.status(403).json({
        success: false,
        message: 'Only managers can review export receipts'
      });
    }

    if (exportReceipt.warehouseId.toString() !== user.manager.warehouseId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only review receipts from your warehouse'
      });
    }

    // Update receipt
    exportReceipt.managerReview = {
      reviewedBy: req.user.sub,
      reviewedAt: new Date(),
      comment: comment?.trim() || ''
    };

    if (action === 'approve') {
      exportReceipt.status = 'reviewed';
    } else {
      exportReceipt.status = 'rejected';
    }

    exportReceipt.updatedBy = req.user.sub;
    await exportReceipt.save();

    // Populate for response
    await exportReceipt.populate([
      { path: 'warehouseId', select: 'name location' },
      { path: 'createdByStaff', select: 'staff.fullName' },
      { path: 'managerReview.reviewedBy', select: 'manager.fullName' },
      { path: 'details.productId', select: 'name sku basePrice' }
    ]);

    res.json({
      success: true,
      message: `Export receipt ${action}d by manager successfully`,
      exportReceipt
    });
  } catch (error) {
    console.error('❌ Error in manager review:', error);
    next(error);
  }
};

// Admin approve export receipt
exports.adminApproveReceipt = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { action, comment } = req.body; // action: 'approve' or 'reject'

    if (!action || !['approve', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid action. Must be "approve" or "reject"'
      });
    }

    const exportReceipt = await ExportReceipt.findById(id);
    if (!exportReceipt) {
      return res.status(404).json({
        success: false,
        message: 'Export receipt not found'
      });
    }

    // Check if receipt is in correct status
    if (exportReceipt.status !== 'reviewed') {
      return res.status(400).json({
        success: false,
        message: 'Receipt can only be approved when in "reviewed" status'
      });
    }

    // Check if admin has access to this warehouse
    const user = await User.findById(req.user.sub).lean();
    if (!user || req.user.role !== 'admin' || !user.admin?.managedWarehouses) {
      return res.status(403).json({
        success: false,
        message: 'Only admins can approve export receipts'
      });
    }

    const hasAccess = user.admin.managedWarehouses.some(wh =>
      wh.toString() === exportReceipt.warehouseId.toString()
    );

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'You can only approve receipts from warehouses you manage'
      });
    }

    // Update receipt
    exportReceipt.adminApproval = {
      approvedBy: req.user.sub,
      approvedAt: new Date(),
      comment: comment?.trim() || ''
    };

    if (action === 'approve') {
      exportReceipt.status = 'approved';

      // Update product quantities when approved
      for (const detail of exportReceipt.details) {
        await Product.findByIdAndUpdate(
          detail.productId,
          {
            $inc: { quantity: -detail.quantity },
            updatedBy: req.user.sub,
            updatedAt: new Date()
          }
        );
      }
    } else {
      exportReceipt.status = 'rejected';
    }

    exportReceipt.updatedBy = req.user.sub;
    await exportReceipt.save();

    // Populate for response
    await exportReceipt.populate([
      { path: 'warehouseId', select: 'name location' },
      { path: 'createdByStaff', select: 'staff.fullName' },
      { path: 'managerReview.reviewedBy', select: 'manager.fullName' },
      { path: 'adminApproval.approvedBy', select: 'admin.fullName' },
      { path: 'details.productId', select: 'name sku basePrice' }
    ]);

    res.json({
      success: true,
      message: `Export receipt ${action}d successfully. ${action === 'approve' ? 'Product quantities updated.' : ''}`,
      exportReceipt
    });
  } catch (error) {
    console.error('❌ Error in admin approval:', error);
    next(error);
  }
};

// Update export receipt (Staff can edit only if status is 'created')
exports.updateExportReceipt = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { customerName, customerPhone, customerAddress, details, notes } = req.body;

    const exportReceipt = await ExportReceipt.findById(id);
    if (!exportReceipt) {
      return res.status(404).json({
        success: false,
        message: 'Export receipt not found'
      });
    }

    // Check if receipt can be edited
    if (exportReceipt.status !== 'created' && exportReceipt.status !== 'rejected') {
      return res.status(400).json({
        success: false,
        message: 'Can only edit receipts in "created" or "rejected" status'
      });
    }

    // Check if user is the creator
    if (exportReceipt.createdByStaff.toString() !== req.user.sub) {
      return res.status(403).json({
        success: false,
        message: 'You can only edit your own export receipts'
      });
    }

    // Validate and update details if provided
    if (details && Array.isArray(details)) {
      let totalAmount = 0;
      const validatedDetails = [];

      for (const detail of details) {
        const { productId, quantity } = detail;

        if (!productId || !quantity || quantity <= 0) {
          return res.status(400).json({
            success: false,
            message: 'Invalid product or quantity in export details'
          });
        }

        const product = await Product.findOne({
          _id: productId,
          warehouseId: exportReceipt.warehouseId
        });

        if (!product) {
          return res.status(400).json({
            success: false,
            message: `Product not found or not in your warehouse`
          });
        }

        if (product.quantity < quantity) {
          return res.status(400).json({
            success: false,
            message: `Insufficient stock for ${product.name}. Available: ${product.quantity}, Requested: ${quantity}`
          });
        }

        validatedDetails.push({
          productId,
          quantity: parseInt(quantity)
        });

        totalAmount += product.basePrice * quantity;
      }

      exportReceipt.details = validatedDetails;
      exportReceipt.totalAmount = totalAmount;
    }

    // Update other fields
    if (customerName) exportReceipt.customerName = customerName.trim();
    if (customerPhone !== undefined) exportReceipt.customerPhone = customerPhone?.trim() || '';
    if (customerAddress !== undefined) exportReceipt.customerAddress = customerAddress?.trim() || '';
    if (notes !== undefined) exportReceipt.notes = notes?.trim() || '';

    // If receipt was rejected and now being updated, reset to 'created' status for resubmission
    if (exportReceipt.status === 'rejected') {
      exportReceipt.status = 'created';
      // Clear previous manager review when resubmitting
      exportReceipt.managerReview = undefined;
      console.log('🔄 Receipt resubmitted - status reset to "created"');
    }

    exportReceipt.updatedBy = req.user.sub;
    exportReceipt.updatedAt = new Date();
    await exportReceipt.save();

    // Populate for response
    await exportReceipt.populate([
      { path: 'warehouseId', select: 'name location' },
      { path: 'createdByStaff', select: 'staff.fullName' },
      { path: 'details.productId', select: 'name sku basePrice' }
    ]);

    res.json({
      success: true,
      message: 'Export receipt updated successfully',
      exportReceipt
    });
  } catch (error) {
    console.error('❌ Error updating export receipt:', error);
    next(error);
  }
};
