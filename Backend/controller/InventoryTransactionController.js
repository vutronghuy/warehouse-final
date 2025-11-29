/**
 * Controller để quản lý InventoryTransaction (Audit Trail)
 */

const InventoryTransaction = require('../models/inventory/InventoryTransaction');
const User = require('../models/User');
const mongoose = require('mongoose');

/**
 * Lấy danh sách inventory transactions với pagination và filters
 * GET /api/inventory/transactions
 * Roles: Admin, Super Admin, Manager (chỉ xem warehouse của mình), Staff (chỉ xem của mình)
 */
exports.getAllTransactions = async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      warehouseId, 
      productId,
      transactionType,
      createdBy,
      startDate,
      endDate
    } = req.query;

    const user = await User.findById(req.user.sub).lean();
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    // Xây dựng query với phân quyền
    let query = {};

    // Super Admin: xem tất cả
    if (user.admin?.isSuperAdmin) {
      if (warehouseId) {
        query.warehouseId = warehouseId;
      }
    }
    // Admin: chỉ xem warehouse được quản lý
    else if (user.role === 'admin' && user.admin?.managedWarehouses) {
      if (warehouseId) {
        const hasAccess = user.admin.managedWarehouses.some(
          id => String(id) === String(warehouseId)
        );
        if (!hasAccess) {
          return res.status(403).json({ 
            success: false, 
            message: 'Access denied to this warehouse' 
          });
        }
        query.warehouseId = warehouseId;
      } else {
        query.warehouseId = { $in: user.admin.managedWarehouses };
      }
    }
    // Manager: chỉ xem warehouse của mình
    else if (user.role === 'manager' && user.manager?.warehouseId) {
      query.warehouseId = user.manager.warehouseId;
    }
    // Staff: chỉ xem transactions do mình tạo
    else if (user.role === 'staff') {
      query.createdBy = req.user.sub;
      if (warehouseId && user.staff?.warehouseId) {
        if (String(user.staff.warehouseId) !== String(warehouseId)) {
          return res.status(403).json({ 
            success: false, 
            message: 'Access denied to this warehouse' 
          });
        }
        query.warehouseId = warehouseId;
      } else if (user.staff?.warehouseId) {
        query.warehouseId = user.staff.warehouseId;
      }
    }
    // Accounter: chỉ xem warehouse của mình
    else if (user.role === 'accounter' && user.accounter?.warehouseId) {
      query.warehouseId = user.accounter.warehouseId;
    }
    else {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied' 
      });
    }

    // Filter theo productId
    if (productId) {
      if (!mongoose.Types.ObjectId.isValid(productId)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid product ID format' 
        });
      }
      query.productId = productId;
    }

    // Filter theo transactionType
    if (transactionType) {
      const validTypes = ['import', 'export', 'adjustment', 'reservation', 'release'];
      if (!validTypes.includes(transactionType)) {
        return res.status(400).json({ 
          success: false, 
          message: `Invalid transaction type. Must be one of: ${validTypes.join(', ')}` 
        });
      }
      query.transactionType = transactionType;
    }

    // Filter theo createdBy (chỉ Admin và Super Admin)
    if (createdBy && (user.admin?.isSuperAdmin || user.role === 'admin')) {
      if (!mongoose.Types.ObjectId.isValid(createdBy)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid user ID format' 
        });
      }
      query.createdBy = createdBy;
    }

    // Filter theo date range
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const transactions = await InventoryTransaction.find(query)
      .populate('productId', 'name sku unit')
      .populate('warehouseId', 'name location')
      .populate('createdBy', 'admin.fullName manager.fullName staff.fullName accounter.fullName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await InventoryTransaction.countDocuments(query);

    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });

    res.json({
      success: true,
      transactions,
      pagination: {
        current: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get all transactions error:', error);
    next(error);
  }
};

/**
 * Lấy transaction theo ID
 * GET /api/inventory/transactions/:id
 * Roles: Admin, Super Admin, Manager, Staff (chỉ xem của mình)
 */
exports.getTransactionById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid transaction ID format' 
      });
    }

    const transaction = await InventoryTransaction.findById(id)
      .populate('productId', 'name sku unit basePrice finalPrice')
      .populate('warehouseId', 'name location')
      .populate('createdBy', 'admin.fullName manager.fullName staff.fullName accounter.fullName')
      .lean();

    if (!transaction) {
      return res.status(404).json({ 
        success: false, 
        message: 'Transaction not found' 
      });
    }

    // Kiểm tra quyền truy cập
    const user = await User.findById(req.user.sub).lean();
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    let hasAccess = false;

    if (user.admin?.isSuperAdmin) {
      hasAccess = true;
    } else if (user.role === 'admin' && user.admin?.managedWarehouses) {
      hasAccess = user.admin.managedWarehouses.some(
        wId => String(wId) === String(transaction.warehouseId._id)
      );
    } else if (user.role === 'manager' && user.manager?.warehouseId) {
      hasAccess = String(user.manager.warehouseId) === String(transaction.warehouseId._id);
    } else if (user.role === 'staff') {
      hasAccess = String(transaction.createdBy._id) === String(req.user.sub);
    } else if (user.role === 'accounter' && user.accounter?.warehouseId) {
      hasAccess = String(user.accounter.warehouseId) === String(transaction.warehouseId._id);
    }

    if (!hasAccess) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied to this transaction' 
      });
    }

    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });

    res.json({
      success: true,
      transaction
    });
  } catch (error) {
    console.error('Get transaction by ID error:', error);
    next(error);
  }
};

/**
 * Tạo manual transaction (Admin và Super Admin only)
 * POST /api/inventory/transactions
 * Roles: Admin, Super Admin
 */
exports.createTransaction = async (req, res, next) => {
  try {
    const {
      productId,
      warehouseId,
      transactionType,
      quantityChange,
      quantityBefore,
      batchNumber,
      notes,
      referenceId
    } = req.body;

    // Kiểm tra quyền (chỉ Admin và Super Admin)
    const user = await User.findById(req.user.sub).lean();
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    if (!user.admin?.isSuperAdmin && user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Admin or Super Admin only.' 
      });
    }

    // Validation
    if (!productId || !warehouseId || !transactionType || quantityChange === undefined) {
      return res.status(400).json({ 
        success: false, 
        message: 'productId, warehouseId, transactionType and quantityChange are required' 
      });
    }

    if (!mongoose.Types.ObjectId.isValid(productId) || !mongoose.Types.ObjectId.isValid(warehouseId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid product ID or warehouse ID format' 
      });
    }

    const validTypes = ['import', 'export', 'adjustment', 'reservation', 'release'];
    if (!validTypes.includes(transactionType)) {
      return res.status(400).json({ 
        success: false, 
        message: `Invalid transaction type. Must be one of: ${validTypes.join(', ')}` 
      });
    }

    // Kiểm tra quyền truy cập warehouse (nếu không phải Super Admin)
    if (!user.admin?.isSuperAdmin) {
      const hasAccess = user.admin.managedWarehouses.some(
        wId => String(wId) === String(warehouseId)
      );
      if (!hasAccess) {
        return res.status(403).json({ 
          success: false, 
          message: 'Access denied to this warehouse' 
        });
      }
    }

    // Tính quantityAfter
    const qtyBefore = quantityBefore !== undefined ? parseFloat(quantityBefore) : 0;
    const qtyChange = parseFloat(quantityChange);
    const qtyAfter = qtyBefore + qtyChange;

    if (qtyAfter < 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Quantity after transaction cannot be negative' 
      });
    }

    // Tạo transaction
    const transaction = await InventoryTransaction.create({
      productId,
      warehouseId,
      transactionType,
      referenceId: referenceId || `MANUAL-${Date.now()}`,
      quantityChange: qtyChange,
      quantityBefore: qtyBefore,
      quantityAfter: qtyAfter,
      batchNumber: batchNumber?.trim() || '',
      notes: notes?.trim() || '',
      createdBy: req.user.sub
    });

    await transaction.populate([
      { path: 'productId', select: 'name sku unit' },
      { path: 'warehouseId', select: 'name location' },
      { path: 'createdBy', select: 'admin.fullName manager.fullName staff.fullName accounter.fullName' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Transaction created successfully',
      transaction
    });
  } catch (error) {
    console.error('Create transaction error:', error);
    next(error);
  }
};

/**
 * Lấy thống kê transactions
 * GET /api/inventory/transactions/stats
 * Roles: Admin, Super Admin, Manager (chỉ xem warehouse của mình)
 */
exports.getTransactionStats = async (req, res, next) => {
  try {
    const { warehouseId, startDate, endDate } = req.query;

    // Kiểm tra quyền
    const user = await User.findById(req.user.sub).lean();
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    let query = {};

    if (user.admin?.isSuperAdmin) {
      if (warehouseId) {
        query.warehouseId = warehouseId;
      }
    } else if (user.role === 'admin' && user.admin?.managedWarehouses) {
      if (warehouseId) {
        const hasAccess = user.admin.managedWarehouses.some(
          id => String(id) === String(warehouseId)
        );
        if (!hasAccess) {
          return res.status(403).json({ 
            success: false, 
            message: 'Access denied to this warehouse' 
          });
        }
        query.warehouseId = warehouseId;
      } else {
        query.warehouseId = { $in: user.admin.managedWarehouses };
      }
    } else if (user.role === 'manager' && user.manager?.warehouseId) {
      query.warehouseId = user.manager.warehouseId;
    } else {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Admin, Super Admin or Manager only.' 
      });
    }

    // Filter theo date range
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }

    const stats = await InventoryTransaction.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$transactionType',
          count: { $sum: 1 },
          totalQuantityChange: { $sum: '$quantityChange' },
          avgQuantityChange: { $avg: '$quantityChange' }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    const totalStats = await InventoryTransaction.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalTransactions: { $sum: 1 },
          totalQuantityChange: { $sum: '$quantityChange' }
        }
      }
    ]);

    res.json({
      success: true,
      stats: {
        byType: stats,
        total: totalStats.length > 0 ? totalStats[0] : {
          totalTransactions: 0,
          totalQuantityChange: 0
        }
      }
    });
  } catch (error) {
    console.error('Get transaction stats error:', error);
    next(error);
  }
};

