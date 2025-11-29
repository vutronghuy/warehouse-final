/**
 * Controller để quản lý Inventory
 */

const Inventory = require('../models/warehouse/Inventory');
const Product = require('../models/products/product');
const Warehouse = require('../models/warehouse/Warehouse');
const User = require('../models/User');
const mongoose = require('mongoose');

/**
 * Lấy danh sách inventory với pagination và filters
 * GET /api/inventory
 * Roles: Admin, Super Admin, Manager (chỉ xem warehouse của mình)
 */
exports.getAllInventory = async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      warehouseId, 
      productId,
      minQuantity,
      maxQuantity
    } = req.query;

    const user = await User.findById(req.user.sub).lean();
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    // Xây dựng query với phân quyền
    let query = {};

    // Super Admin: xem tất cả
    if (user.admin?.isSuperAdmin) {
      // Có thể filter theo warehouseId nếu có
      if (warehouseId) {
        query.warehouseId = warehouseId;
      }
    }
    // Admin: chỉ xem warehouse được quản lý
    else if (user.role === 'admin' && user.admin?.managedWarehouses) {
      if (warehouseId) {
        // Kiểm tra warehouseId có trong managedWarehouses không
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
        // Nếu không có warehouseId, chỉ lấy warehouse được quản lý
        query.warehouseId = { $in: user.admin.managedWarehouses };
      }
    }
    // Manager: chỉ xem warehouse của mình
    else if (user.role === 'manager' && user.manager?.warehouseId) {
      query.warehouseId = user.manager.warehouseId;
    }
    // Staff, Accounter: không có quyền xem inventory trực tiếp
    else {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Admin, Super Admin or Manager only.' 
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

    // Filter theo quantity range
    if (minQuantity !== undefined || maxQuantity !== undefined) {
      query.quantity = {};
      if (minQuantity !== undefined) {
        query.quantity.$gte = parseFloat(minQuantity);
      }
      if (maxQuantity !== undefined) {
        query.quantity.$lte = parseFloat(maxQuantity);
      }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const inventories = await Inventory.find(query)
      .populate('productId', 'name sku unit basePrice finalPrice minStockLevel')
      .populate('warehouseId', 'name location')
      .populate('updatedBy', 'admin.fullName manager.fullName staff.fullName accounter.fullName')
      .sort({ lastUpdated: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await Inventory.countDocuments(query);

    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });

    res.json({
      success: true,
      inventories,
      pagination: {
        current: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get all inventory error:', error);
    next(error);
  }
};

/**
 * Lấy inventory theo ID
 * GET /api/inventory/:id
 * Roles: Admin, Super Admin, Manager (chỉ xem warehouse của mình)
 */
exports.getInventoryById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid inventory ID format' 
      });
    }

    const inventory = await Inventory.findById(id)
      .populate('productId', 'name sku unit basePrice finalPrice minStockLevel categoryId')
      .populate('warehouseId', 'name location')
      .populate('updatedBy', 'admin.fullName manager.fullName staff.fullName accounter.fullName')
      .lean();

    if (!inventory) {
      return res.status(404).json({ 
        success: false, 
        message: 'Inventory not found' 
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
        wId => String(wId) === String(inventory.warehouseId._id)
      );
    } else if (user.role === 'manager' && user.manager?.warehouseId) {
      hasAccess = String(user.manager.warehouseId) === String(inventory.warehouseId._id);
    }

    if (!hasAccess) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied to this inventory' 
      });
    }

    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });

    res.json({
      success: true,
      inventory
    });
  } catch (error) {
    console.error('Get inventory by ID error:', error);
    next(error);
  }
};

/**
 * Lấy inventory theo productId và warehouseId
 * GET /api/inventory/product/:productId/warehouse/:warehouseId
 * Roles: Admin, Super Admin, Manager (chỉ xem warehouse của mình)
 */
exports.getInventoryByProductAndWarehouse = async (req, res, next) => {
  try {
    const { productId, warehouseId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId) || !mongoose.Types.ObjectId.isValid(warehouseId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid product ID or warehouse ID format' 
      });
    }

    // Kiểm tra quyền truy cập warehouse
    const user = await User.findById(req.user.sub).lean();
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    let hasAccess = false;

    if (user.admin?.isSuperAdmin) {
      hasAccess = true;
    } else if (user.role === 'admin' && user.admin?.managedWarehouses) {
      hasAccess = user.admin.managedWarehouses.some(
        wId => String(wId) === String(warehouseId)
      );
    } else if (user.role === 'manager' && user.manager?.warehouseId) {
      hasAccess = String(user.manager.warehouseId) === String(warehouseId);
    }

    if (!hasAccess) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied to this warehouse' 
      });
    }

    let inventory = await Inventory.findOne({ productId, warehouseId })
      .populate('productId', 'name sku unit basePrice finalPrice minStockLevel')
      .populate('warehouseId', 'name location')
      .populate('updatedBy', 'admin.fullName manager.fullName staff.fullName accounter.fullName')
      .lean();

    // Nếu không có inventory record, tạo mới từ Product.quantity
    if (!inventory) {
      const product = await Product.findOne({ _id: productId, warehouseId }).lean();
      if (!product) {
        return res.status(404).json({ 
          success: false, 
          message: 'Product not found in this warehouse' 
        });
      }

      inventory = {
        productId: product._id,
        warehouseId: product.warehouseId,
        quantity: product.quantity || 0,
        lastUpdated: product.updatedAt || new Date(),
        updatedBy: product.updatedBy
      };
    }

    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });

    res.json({
      success: true,
      inventory
    });
  } catch (error) {
    console.error('Get inventory by product and warehouse error:', error);
    next(error);
  }
};

/**
 * Điều chỉnh tồn kho (Admin và Super Admin only)
 * PUT /api/inventory/:id
 * Roles: Admin, Super Admin
 */
exports.updateInventory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { quantity, notes } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid inventory ID format' 
      });
    }

    if (quantity === undefined || quantity < 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Quantity is required and must be >= 0' 
      });
    }

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

    const inventory = await Inventory.findById(id)
      .populate('warehouseId', 'name location')
      .lean();

    if (!inventory) {
      return res.status(404).json({ 
        success: false, 
        message: 'Inventory not found' 
      });
    }

    // Kiểm tra quyền truy cập warehouse (nếu không phải Super Admin)
    if (!user.admin?.isSuperAdmin) {
      const hasAccess = user.admin.managedWarehouses.some(
        wId => String(wId) === String(inventory.warehouseId._id)
      );
      if (!hasAccess) {
        return res.status(403).json({ 
          success: false, 
          message: 'Access denied to this warehouse' 
        });
      }
    }

    const quantityBefore = inventory.quantity;
    const quantityAfter = parseFloat(quantity);
    const quantityChange = quantityAfter - quantityBefore;

    // Cập nhật inventory
    const updatedInventory = await Inventory.findByIdAndUpdate(
      id,
      {
        quantity: quantityAfter,
        lastUpdated: new Date(),
        updatedBy: req.user.sub
      },
      { new: true }
    )
      .populate('productId', 'name sku unit')
      .populate('warehouseId', 'name location')
      .lean();

    // Đồng bộ với Product.quantity
    await Product.findByIdAndUpdate(
      inventory.productId,
      { 
        quantity: quantityAfter,
        updatedBy: req.user.sub
      }
    );

    // Tạo InventoryTransaction log (adjustment)
    const InventoryTransaction = require('../models/inventory/InventoryTransaction');
    await InventoryTransaction.create({
      productId: inventory.productId,
      warehouseId: inventory.warehouseId._id,
      transactionType: 'adjustment',
      referenceId: `INV-${id}`,
      quantityChange,
      quantityBefore,
      quantityAfter,
      notes: notes || `Manual adjustment by ${user.admin?.fullName || user.admin?.username}`,
      createdBy: req.user.sub
    });

    res.json({
      success: true,
      message: 'Inventory updated successfully',
      inventory: updatedInventory,
      adjustment: {
        quantityBefore,
        quantityAfter,
        quantityChange
      }
    });
  } catch (error) {
    console.error('Update inventory error:', error);
    next(error);
  }
};

/**
 * Sync inventory từ Product.quantity
 * POST /api/inventory/sync
 * Roles: Admin, Super Admin
 */
exports.syncInventory = async (req, res, next) => {
  try {
    const { warehouseId } = req.query;

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

    // Xây dựng query
    let productQuery = {};
    if (warehouseId) {
      if (!mongoose.Types.ObjectId.isValid(warehouseId)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid warehouse ID format' 
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

      productQuery.warehouseId = warehouseId;
    } else if (!user.admin?.isSuperAdmin) {
      // Admin chỉ sync warehouse được quản lý
      productQuery.warehouseId = { $in: user.admin.managedWarehouses };
    }

    // Lấy tất cả products
    const products = await Product.find(productQuery).select('_id warehouseId quantity updatedAt updatedBy').lean();

    let synced = 0;
    let created = 0;
    let updated = 0;

    for (const product of products) {
      const existingInventory = await Inventory.findOne({
        productId: product._id,
        warehouseId: product.warehouseId
      });

      if (existingInventory) {
        // Update existing
        await Inventory.findByIdAndUpdate(existingInventory._id, {
          quantity: product.quantity || 0,
          lastUpdated: product.updatedAt || new Date(),
          updatedBy: product.updatedBy || req.user.sub
        });
        updated++;
      } else {
        // Create new
        await Inventory.create({
          productId: product._id,
          warehouseId: product.warehouseId,
          quantity: product.quantity || 0,
          lastUpdated: product.updatedAt || new Date(),
          updatedBy: product.updatedBy || req.user.sub
        });
        created++;
      }
      synced++;
    }

    res.json({
      success: true,
      message: `Synced ${synced} inventory records`,
      stats: {
        total: synced,
        created,
        updated
      }
    });
  } catch (error) {
    console.error('Sync inventory error:', error);
    next(error);
  }
};

/**
 * Lấy thống kê inventory
 * GET /api/inventory/stats
 * Roles: Admin, Super Admin, Manager (chỉ xem warehouse của mình)
 */
exports.getInventoryStats = async (req, res, next) => {
  try {
    const { warehouseId } = req.query;

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

    const stats = await Inventory.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          totalQuantity: { $sum: '$quantity' },
          averageQuantity: { $avg: '$quantity' },
          minQuantity: { $min: '$quantity' },
          maxQuantity: { $max: '$quantity' },
          lowStockCount: {
            $sum: {
              $cond: [
                { $lt: ['$quantity', 10] },
                1,
                0
              ]
            }
          },
          outOfStockCount: {
            $sum: {
              $cond: [
                { $lte: ['$quantity', 0] },
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    const result = stats.length > 0 ? stats[0] : {
      totalProducts: 0,
      totalQuantity: 0,
      averageQuantity: 0,
      minQuantity: 0,
      maxQuantity: 0,
      lowStockCount: 0,
      outOfStockCount: 0
    };

    delete result._id;

    res.json({
      success: true,
      stats: result
    });
  } catch (error) {
    console.error('Get inventory stats error:', error);
    next(error);
  }
};

