const Product = require('../models/products/product');
const User = require('../models/User');
const mongoose = require('mongoose');
const InventoryTransaction = require('../models/inventory/InventoryTransaction');
const ImportReceipt = require('../models/import/ImportReceipt');
const ExportReceipt = require('../models/export/ExportReceipt');
const ProductImportController = require('./ProductImportController');

// Get all products
exports.getAllProducts = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search, status, categoryId, warehouseId, all } = req.query;

    // Build filter object
    const filter = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (status) {
      filter.status = status;
    }

    if (categoryId) {
      filter.categoryId = categoryId;
    }

    if (warehouseId) {
      filter.warehouseId = warehouseId;
    }

    // For non-super admin users, filter by their warehouse
    if (req.user && !req.user.isSuperAdmin) {
      try {
        const user = await User.findById(req.user.sub).lean();
        if (user) {
          let userWarehouseIds = [];

          // Get warehouse ID based on user role
          if (req.user.role === 'staff' && user.staff?.warehouseId) {
            userWarehouseIds = [user.staff.warehouseId];
          } else if (req.user.role === 'manager' && user.manager?.warehouseId) {
            userWarehouseIds = [user.manager.warehouseId];
          } else if (req.user.role === 'accounter' && user.accounter?.warehouseId) {
            userWarehouseIds = [user.accounter.warehouseId];
          } else if (req.user.role === 'admin' && user.admin?.managedWarehouses && user.admin.managedWarehouses.length > 0) {
            userWarehouseIds = user.admin.managedWarehouses;
          }

          if (userWarehouseIds.length > 0) {
            if (userWarehouseIds.length === 1) {
              filter.warehouseId = userWarehouseIds[0];
            } else {
              filter.warehouseId = { $in: userWarehouseIds };
            }
          }
        }
      } catch (userError) {
        console.error('Error fetching user warehouse info:', userError);
      }
    }

    let products;
    let total;

    if (all === 'true') {
      // Get all products without pagination
      products = await Product.find(filter)
        .populate('categoryId', 'name')
        .populate('primarySupplierId', 'name')
        .populate('warehouseId', 'name location')
        .sort({ name: 1 })
        .lean();

      total = products.length;

      // Set cache-busting headers to prevent 304 Not Modified
      res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'ETag': '',
        'Last-Modified': new Date().toUTCString()
      });

      res.json({
        success: true,
        products,
        total: total,
        timestamp: Date.now() // Add timestamp for debugging
      });
    } else {
      // Use pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);

      products = await Product.find(filter)
        .populate('categoryId', 'name')
        .populate('primarySupplierId', 'name')
        .populate('warehouseId', 'name location')
        .sort({ name: 1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean();

      total = await Product.countDocuments(filter);

      // Set cache-busting headers to prevent 304 Not Modified
      res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'ETag': '',
        'Last-Modified': new Date().toUTCString()
      });

      res.json({
        success: true,
        products,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalProducts: total,
          hasNext: skip + products.length < total,
          hasPrev: parseInt(page) > 1
        },
        timestamp: Date.now() // Add timestamp for debugging
      });
    }
  } catch (error) {
    console.error('Error fetching products:', error);
    next(error);
  }
};

/**
 * Tính tồn cuối kỳ (Ending Inventory) cho từng sản phẩm theo tháng/năm được chọn.
 * Dựa trực tiếp vào phiếu nhập/xuất của đúng kỳ được chọn:
 *   Ending = Max(0, Tổng nhập lũy kế đến cuối tháng - Tổng xuất lũy kế đến cuối tháng)
 * Nghĩa là tồn đầu kỳ tháng X = tồn cuối kỳ tháng X-1 (tự động do cộng lũy kế).
 * Nếu không có giao dịch trước đó, tồn đầu kỳ = 0.
 */
exports.getEndingInventoryByMonth = async (req, res, next) => {
  try {
    const { month, year, warehouseId } = req.query;

    const monthNum = parseInt(month, 10);
    const yearNum = parseInt(year, 10);

    if (!monthNum || !yearNum || monthNum < 1 || monthNum > 12 || yearNum < 1900) {
      return res.status(400).json({
        success: false,
        message: 'month (1-12) và year hợp lệ là bắt buộc'
      });
    }

    // Mốc thời gian cuối tháng được chọn (dùng để tính lũy kế)
    const endOfMonth = new Date(yearNum, monthNum, 0, 23, 59, 59, 999);

    // Xây filter giống getAll để giữ nguyên phân quyền/warehouse filter
    const filter = {};
    let warehouseFilterForAggregation = {};

    if (warehouseId) {
      filter.warehouseId = warehouseId;
      warehouseFilterForAggregation.warehouseId = new mongoose.Types.ObjectId(String(warehouseId));
    }

    if (req.user && !req.user.isSuperAdmin) {
      try {
        const user = await User.findById(req.user.sub).lean();
        if (user) {
          let userWarehouseIds = [];

          if (req.user.role === 'staff' && user.staff?.warehouseId) {
            userWarehouseIds = [user.staff.warehouseId];
          } else if (req.user.role === 'manager' && user.manager?.warehouseId) {
            userWarehouseIds = [user.manager.warehouseId];
          } else if (req.user.role === 'accounter' && user.accounter?.warehouseId) {
            userWarehouseIds = [user.accounter.warehouseId];
          } else if (req.user.role === 'admin' && user.admin?.managedWarehouses?.length > 0) {
            userWarehouseIds = user.admin.managedWarehouses;
          }

          if (userWarehouseIds.length > 0) {
            filter.warehouseId = userWarehouseIds.length === 1 ? userWarehouseIds[0] : { $in: userWarehouseIds };
            // Apply same warehouse filter to aggregation
            warehouseFilterForAggregation.warehouseId = userWarehouseIds.length === 1 
              ? new mongoose.Types.ObjectId(String(userWarehouseIds[0]))
              : { $in: userWarehouseIds.map(id => new mongoose.Types.ObjectId(String(id))) };
          }
        }
      } catch (userError) {
        console.error('Error fetching user warehouse info:', userError);
      }
    }

    const products = await Product.find(filter)
      .select('_id name sku unit quantity warehouseId categoryId')
      .populate('categoryId', 'name')
      .populate('warehouseId', 'name location')
      .lean();

    if (!products.length) {
      return res.json({
        success: true,
        data: { month: monthNum, year: yearNum, items: [] }
      });
    }

    const productIds = products.map((p) => p._id);

    // Tổng nhập lũy kế đến cuối tháng (ImportReceipt details)
    const importAgg = await ImportReceipt.aggregate([
      {
        $match: {
          deletedAt: null,
          createdAt: { $lte: endOfMonth },
          ...warehouseFilterForAggregation
        }
      },
      { $unwind: '$details' },
      {
        $match: {
          'details.productId': { $in: productIds }
        }
      },
      {
        $group: {
          _id: '$details.productId',
          totalImport: { $sum: { $ifNull: ['$details.quantity', 0] } }
        }
      }
    ]);

    // Tổng xuất lũy kế đến cuối tháng (ExportReceipt details) – chỉ tính phiếu đã duyệt/đã xác nhận
    const exportAgg = await ExportReceipt.aggregate([
      {
        $match: {
          deletedAt: null,
          createdAt: { $lte: endOfMonth },
          status: { $in: ['approved', 'confirmed'] },
          ...warehouseFilterForAggregation
        }
      },
      { $unwind: '$details' },
      {
        $match: {
          'details.productId': { $in: productIds }
        }
      },
      {
        $group: {
          _id: '$details.productId',
          totalExport: { $sum: { $ifNull: ['$details.quantity', 0] } }
        }
      }
    ]);

    const importMap = new Map(importAgg.map((i) => [String(i._id), i.totalImport]));
    const exportMap = new Map(exportAgg.map((e) => [String(e._id), e.totalExport]));

    const items = products.map((p, index) => {
      const totalImport = importMap.get(String(p._id)) || 0;
      const totalExport = exportMap.get(String(p._id)) || 0;
      const endingInventory = Math.max(0, totalImport - totalExport);

      // Debug log for first product only
      if (index === 0) {
        console.log('📊 Ending Inventory Calculation (First Product):', {
          productId: String(p._id),
          productName: p.name,
          totalImport,
          totalExport,
          endingInventory,
          currentQuantity: p.quantity || 0,
          endOfMonth: endOfMonth.toISOString(),
          month: monthNum,
          year: yearNum
        });
      }

      return {
        productId: String(p._id), // Ensure productId is string for frontend lookup
        name: p.name,
        sku: p.sku,
        unit: p.unit,
        categoryId: p.categoryId,
        warehouseId: p.warehouseId,
        currentQuantity: p.quantity || 0,
        endingInventory
      };
    });

    res.json({
      success: true,
      data: {
        month: monthNum,
        year: yearNum,
        items
      }
    });
  } catch (error) {
    console.error('Error calculating ending inventory:', error);
    next(error);
  }
};

// Get product by ID
exports.getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID'
      });
    }

    const product = await Product.findById(id)
      .populate('categoryId', 'name')
      .populate('primarySupplierId', 'name')
      .lean();

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      product
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    next(error);
  }
};

// Create new product
exports.createProduct = async (req, res, next) => {
  try {
    const {
      name,
      sku,
      description,
      unit,
      basePrice,
      minStockLevel,
      expiryDate,
      categoryId,
      primarySupplierId
    } = req.body;

    // Validate required fields
    if (!name || !sku || !unit || !categoryId || !primarySupplierId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: name, sku, unit, categoryId, primarySupplierId'
      });
    }

    // Check if SKU already exists
    const existingProduct = await Product.findOne({
      sku: sku.toUpperCase()
    });
    
    if (existingProduct) {
      return res.status(400).json({
        success: false,
        message: 'SKU already exists'
      });
    }

    // Create product data
    const productData = {
      name: name.trim(),
      sku: sku.toUpperCase().trim(),
      description: description?.trim() || '',
      unit: unit.trim(),
      basePrice: parseFloat(basePrice) || 0,
      minStockLevel: parseInt(minStockLevel) || 0,
      categoryId,
      primarySupplierId,
      status: 'in stock',
      createdBy: req.user.sub, // Add user ID from JWT token
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Add expiry date if provided
    if (expiryDate) {
      productData.expiryDate = new Date(expiryDate);
    }

    // Create product
    const product = new Product(productData);
    await product.save();

    // Populate references for response
    await product.populate([
      { path: 'categoryId', select: 'name' },
      { path: 'primarySupplierId', select: 'name' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product
    });
  } catch (error) {
    console.error('Error creating product:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed: ' + errors.join(', ')
      });
    }
    
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `${field} already exists`
      });
    }
    
    next(error);
  }
};

// Update product
exports.updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID'
      });
    }

    // Check if product exists
    const existingProduct = await Product.findById(id);
    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // If SKU is being updated, check for duplicates
    if (updateData.sku && updateData.sku !== existingProduct.sku) {
      const duplicateSku = await Product.findOne({
        sku: updateData.sku.toUpperCase(),
        _id: { $ne: id }
      });

      if (duplicateSku) {
        return res.status(400).json({
          success: false,
          message: 'SKU already exists'
        });
      }
    }

    // Prepare update data
    const allowedFields = [
      'name', 'sku', 'description', 'unit', 'basePrice', 
      'minStockLevel', 'expiryDate', 'categoryId', 'primarySupplierId', 'status'
    ];
    
    const filteredUpdateData = {};
    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        if (field === 'sku') {
          filteredUpdateData[field] = updateData[field].toUpperCase().trim();
        } else if (field === 'name' || field === 'description' || field === 'unit') {
          filteredUpdateData[field] = updateData[field].trim();
        } else if (field === 'basePrice') {
          filteredUpdateData[field] = parseFloat(updateData[field]) || 0;
        } else if (field === 'minStockLevel') {
          filteredUpdateData[field] = parseInt(updateData[field]) || 0;
        } else if (field === 'expiryDate') {
          filteredUpdateData[field] = updateData[field] ? new Date(updateData[field]) : null;
        } else {
          filteredUpdateData[field] = updateData[field];
        }
      }
    });

    filteredUpdateData.updatedAt = new Date();
    filteredUpdateData.updatedBy = req.user.sub; // Add user ID from JWT token

    // Update product
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      filteredUpdateData,
      { new: true, runValidators: true }
    ).populate([
      { path: 'categoryId', select: 'name' },
      { path: 'primarySupplierId', select: 'name' }
    ]);

    res.json({
      success: true,
      message: 'Product updated successfully',
      product: updatedProduct
    });
  } catch (error) {
    console.error('Error updating product:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed: ' + errors.join(', ')
      });
    }
    
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `${field} already exists`
      });
    }
    
    next(error);
  }
};

// Delete product (hard delete)
// Soft delete product
exports.deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { hardDelete } = req.query; // Optional: hardDelete=true for permanent deletion (super admin only)

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID'
      });
    }

    // Find product first to check if it exists (include deleted ones for hard delete check)
    const product = await Product.findOne({ _id: id });
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check if already soft deleted
    if (product.deletedAt && !hardDelete) {
      return res.status(400).json({
        success: false,
        message: 'Product is already deleted'
      });
    }

    let deletedProduct;
    let message;

    if (hardDelete === 'true' && req.user?.isSuperAdmin) {
      // Hard delete - only for super admin
      deletedProduct = await Product.findByIdAndDelete(id);
      message = 'Product permanently deleted from database';
      console.log(`✅ Product permanently deleted: ${deletedProduct.name} (SKU: ${deletedProduct.sku})`);
    } else {
      // Soft delete - set deletedAt timestamp
      deletedProduct = await Product.findByIdAndUpdate(
        id,
        { 
          deletedAt: new Date(),
          updatedBy: req.user?.sub || req.user?.id
        },
        { new: true }
      );
      message = 'Product deleted successfully (soft delete)';
      console.log(`✅ Product soft deleted: ${deletedProduct.name} (SKU: ${deletedProduct.sku})`);
    }

    if (!deletedProduct) {
      return res.status(404).json({
        success: false,
        message: 'Product not found or already deleted'
      });
    }

    res.json({
      success: true,
      message: message,
      deletedProduct: {
        id: deletedProduct._id,
        name: deletedProduct.name,
        sku: deletedProduct.sku,
        deletedAt: deletedProduct.deletedAt || null
      }
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    next(error);
  }
};

// Restore soft-deleted product
exports.restoreProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID'
      });
    }

    // Find product including deleted ones
    const product = await Product.findOne({ _id: id, deletedAt: { $ne: null } });
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Deleted product not found'
      });
    }

    // Restore by setting deletedAt to null
    const restoredProduct = await Product.findByIdAndUpdate(
      id,
      { 
        deletedAt: null,
        updatedBy: req.user?.sub || req.user?.id
      },
      { new: true }
    );

    console.log(`✅ Product restored: ${restoredProduct.name} (SKU: ${restoredProduct.sku})`);

    res.json({
      success: true,
      message: 'Product restored successfully',
      product: {
        id: restoredProduct._id,
        name: restoredProduct.name,
        sku: restoredProduct.sku
      }
    });
  } catch (error) {
    console.error('Error restoring product:', error);
    next(error);
  }
};

// Get products by category
exports.getProductsByCategory = async (req, res, next) => {
  try {
    const { categoryId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category ID'
      });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const products = await Product.find({
      categoryId,
      status: 'in stock'
    })
      .populate('categoryId', 'name')
      .populate('primarySupplierId', 'name')
      .sort({ name: 1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await Product.countDocuments({
      categoryId,
      status: 'in stock'
    });

    res.json({
      success: true,
      products,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalProducts: total,
        hasNext: skip + products.length < total,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Error fetching products by category:', error);
    next(error);
  }
};

// Search products
exports.searchProducts = async (req, res, next) => {
  try {
    const { q, limit = 10 } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters long'
      });
    }

    const searchRegex = new RegExp(q.trim(), 'i');

    const products = await Product.find({
      $or: [
        { name: searchRegex },
        { sku: searchRegex },
        { description: searchRegex }
      ],
      status: 'in stock'
    })
      .populate('categoryId', 'name')
      .populate('primarySupplierId', 'name')
      .sort({ name: 1 })
      .limit(parseInt(limit))
      .lean();

    res.json({
      success: true,
      products,
      count: products.length
    });
  } catch (error) {
    console.error('Error searching products:', error);
    next(error);
  }
};

// Get active products for dropdown
exports.getActiveProducts = async (req, res, next) => {
  try {
    const products = await Product.find({
      status: 'in stock'
    })
      .select('_id name sku unit basePrice quantity minStockLevel')
      .sort({ name: 1 })
      .lean();

    res.json({
      success: true,
      products,
      count: products.length
    });
  } catch (error) {
    console.error('Error fetching active products:', error);
    next(error);
  }
};

// Get product statistics
exports.getProductStats = async (req, res, next) => {
  try {
    const stats = await Product.aggregate([
      { $match: {} }, // Match all products since we're using hard delete
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          inStockProducts: {
            $sum: { $cond: [{ $eq: ['$status', 'in stock'] }, 1, 0] }
          },
          outOfStockProducts: {
            $sum: { $cond: [{ $eq: ['$status', 'out of stock'] }, 1, 0] }
          },
          totalValue: { $sum: '$basePrice' },
          averagePrice: { $avg: '$basePrice' }
        }
      }
    ]);

    const result = stats[0] || {
      totalProducts: 0,
      inStockProducts: 0,
      outOfStockProducts: 0,
      totalValue: 0,
      averagePrice: 0
    };

    res.json({
      success: true,
      stats: result
    });
  } catch (error) {
    console.error('Error fetching product stats:', error);
    next(error);
  }
};

// Update min stock level
exports.updateMinStock = async (req, res, next) => {
  try {
    console.log('🔄 UPDATE MIN STOCK CALLED!');
    console.log('🔍 Raw request body:', JSON.stringify(req.body, null, 2));
    console.log('🔍 User:', req.user);

    const { productId, minStockLevel } = req.body;

    console.log('🔍 Extracted values:', {
      productId,
      minStockLevel,
      productIdType: typeof productId,
      minStockLevelType: typeof minStockLevel,
      isProductIdValid: mongoose.Types.ObjectId.isValid(productId),
      isMinStockNumber: !isNaN(minStockLevel)
    });

    if (!productId || minStockLevel === undefined || minStockLevel === null) {
      console.log('❌ Validation failed:', {
        hasProductId: !!productId,
        hasMinStockLevel: minStockLevel !== undefined && minStockLevel !== null,
        minStockLevelValue: minStockLevel
      });
      return res.status(400).json({
        success: false,
        message: 'Product ID and min stock level are required'
      });
    }

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      console.log('❌ Invalid ObjectId:', productId);
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format'
      });
    }

    // Validate min stock level is a number
    const minStock = parseInt(minStockLevel);
    if (isNaN(minStock) || minStock < 0) {
      console.log('❌ Invalid min stock level:', minStockLevel);
      return res.status(400).json({
        success: false,
        message: 'Min stock level must be a valid non-negative number'
      });
    }

    console.log('🔍 Attempting to update product:', productId, 'with min stock:', minStock);

    const product = await Product.findByIdAndUpdate(
      productId,
      {
        minStockLevel: minStock,
        updatedBy: req.user.sub,
        updatedAt: new Date()
      },
      { new: true }
    ).populate('categoryId', 'name')
     .populate('primarySupplierId', 'name')
     .populate('warehouseId', 'name location');

    if (!product) {
      console.log('❌ Product not found:', productId);
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    console.log('✅ Min stock updated successfully:', {
      productId: product._id,
      productName: product.name,
      oldMinStock: 'unknown',
      newMinStock: product.minStockLevel
    });

    res.json({
      success: true,
      message: 'Min stock level updated successfully',
      product
    });
  } catch (error) {
    console.error('❌ Error updating min stock level:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error while updating min stock level'
    });
  }
};

// Bulk update min stock level
exports.bulkUpdateMinStock = async (req, res, next) => {
  try {
    console.log('🔄 BULK UPDATE MIN STOCK CALLED!');
    console.log('🔍 Raw request body:', JSON.stringify(req.body, null, 2));
    console.log('🔍 User:', req.user);

    const { productIds, minStockLevel } = req.body;

    // Validation
    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      console.log('❌ Invalid productIds:', productIds);
      return res.status(400).json({
        success: false,
        message: 'Product IDs array is required and must not be empty'
      });
    }

    if (minStockLevel === undefined || minStockLevel === null) {
      console.log('❌ Missing minStockLevel:', minStockLevel);
      return res.status(400).json({
        success: false,
        message: 'Min stock level is required'
      });
    }

    const minStockValue = parseInt(minStockLevel);
    if (isNaN(minStockValue) || minStockValue < 0) {
      console.log('❌ Invalid minStockLevel value:', minStockLevel);
      return res.status(400).json({
        success: false,
        message: 'Min stock level must be a non-negative number'
      });
    }

    console.log('✅ Validation passed. Updating products:', {
      productIds,
      minStockLevel: minStockValue,
      count: productIds.length
    });

    // Update multiple products
    const updateResult = await Product.updateMany(
      { _id: { $in: productIds } },
      {
        $set: {
          minStockLevel: minStockValue,
          updatedAt: new Date()
        }
      }
    );

    console.log('✅ Bulk update result:', updateResult);

    if (updateResult.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'No products found with the provided IDs'
      });
    }

    // Get updated products for response
    const updatedProducts = await Product.find({ _id: { $in: productIds } })
      .populate('categoryId', 'name')
      .populate('primarySupplierId', 'name')
      .populate('warehouseId', 'name location');

    console.log('✅ Bulk min stock update successful:', {
      requested: productIds.length,
      matched: updateResult.matchedCount,
      modified: updateResult.modifiedCount,
      minStockLevel: minStockValue
    });

    res.json({
      success: true,
      message: `Min stock level updated successfully for ${updateResult.modifiedCount} product${updateResult.modifiedCount > 1 ? 's' : ''}`,
      updatedCount: updateResult.modifiedCount,
      products: updatedProducts
    });
  } catch (error) {
    console.error('❌ Error bulk updating min stock level:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format in the provided list'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error while bulk updating min stock level'
    });
  }
};

// Bulk update product status
exports.bulkUpdateStatus = async (req, res, next) => {
  try {
    console.log('🚀 BULK UPDATE STATUS CALLED!');
    console.log('🔍 Raw request body:', JSON.stringify(req.body, null, 2));
    console.log('🔍 Request headers:', req.headers);
    console.log('🔍 User:', req.user);
    console.log('🔍 Request method:', req.method);
    console.log('🔍 Request URL:', req.url);

    const { productIds, status } = req.body;

    console.log('🔍 Bulk update request:', {
      userId: req.user.sub,
      role: req.user.role,
      productIds: productIds,
      productIdsType: typeof productIds,
      productIdsIsArray: Array.isArray(productIds),
      status: status,
      isSuperAdmin: req.user.isSuperAdmin
    });

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0 || !status) {
      return res.status(400).json({
        success: false,
        message: 'Product IDs array and status are required'
      });
    }

    // Validate all product IDs are valid ObjectIds
    console.log('🔍 Validating product IDs:', {
      productIds: productIds,
      types: productIds.map(id => ({
        id,
        type: typeof id,
        length: id?.length,
        isString: typeof id === 'string',
        isValidObjectId: mongoose.Types.ObjectId.isValid(id),
        stringValue: String(id),
        jsonStringify: JSON.stringify(id)
      }))
    });

    const invalidIds = productIds.filter(id => {
      const isValid = mongoose.Types.ObjectId.isValid(id);
      if (!isValid) {
        console.log('❌ Invalid ID found:', {
          id,
          type: typeof id,
          length: id?.length,
          isString: typeof id === 'string',
          stringValue: String(id),
          jsonStringify: JSON.stringify(id),
          isValidObjectId: mongoose.Types.ObjectId.isValid(id)
        });
      }
      return !isValid;
    });

    if (invalidIds.length > 0) {
      console.log('❌ Invalid product IDs:', invalidIds);
      return res.status(400).json({
        success: false,
        message: `Invalid product ID: ${invalidIds[0]}`,
        invalidIds: invalidIds
      });
    }

    const validStatuses = ['in stock', 'out of stock'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be "in stock" or "out of stock"'
      });
    }

    // Build filter for products
    const filter = { _id: { $in: productIds } };

    // For non-super admin users, ensure they can only update products in their warehouse
    if (!req.user.isSuperAdmin) {
      try {
        const user = await User.findById(req.user.sub).lean();
        if (user) {
          let userWarehouseIds = [];

          // Get warehouse ID based on user role
          if (req.user.role === 'staff' && user.staff?.warehouseId) {
            userWarehouseIds = [user.staff.warehouseId];
          } else if (req.user.role === 'manager' && user.manager?.warehouseId) {
            userWarehouseIds = [user.manager.warehouseId];
          } else if (req.user.role === 'accounter' && user.accounter?.warehouseId) {
            userWarehouseIds = [user.accounter.warehouseId];
          } else if (req.user.role === 'admin' && user.admin?.managedWarehouses && user.admin.managedWarehouses.length > 0) {
            userWarehouseIds = user.admin.managedWarehouses;
          }

          if (userWarehouseIds.length > 0) {
            if (userWarehouseIds.length === 1) {
              filter.warehouseId = userWarehouseIds[0];
            } else {
              filter.warehouseId = { $in: userWarehouseIds };
            }
            console.log('🏢 Filtering by warehouses:', userWarehouseIds);
          } else {
            return res.status(403).json({
              success: false,
              message: 'User is not assigned to any warehouse'
            });
          }
        } else {
          return res.status(404).json({
            success: false,
            message: 'User not found'
          });
        }
      } catch (userError) {
        console.error('Error fetching user warehouse info:', userError);
        return res.status(500).json({
          success: false,
          message: 'Failed to verify user warehouse access'
        });
      }
    }

    console.log('📋 Final filter:', filter);

    const result = await Product.updateMany(filter, {
      status: status,
      updatedBy: req.user.sub,
      updatedAt: new Date()
    });

    console.log('✅ Update result:', {
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount
    });

    res.json({
      success: true,
      message: `Updated ${result.modifiedCount} products`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('❌ Error bulk updating product status:', error);
    next(error);
  }
};

// Test endpoint for debugging ObjectId validation
exports.testObjectIdValidation = async (req, res) => {
  try {
    const { testIds } = req.body;

    console.log('🧪 Testing ObjectId validation:', testIds);

    const results = testIds.map(id => ({
      id: id,
      type: typeof id,
      length: id?.length,
      isString: typeof id === 'string',
      mongooseValid: mongoose.Types.ObjectId.isValid(id),
      regexValid: /^[0-9a-fA-F]{24}$/.test(id),
      stringValue: String(id),
      jsonStringify: JSON.stringify(id),
      charCodes: typeof id === 'string' ? Array.from(id).map(char => char.charCodeAt(0)) : null
    }));

    res.json({
      success: true,
      results: results
    });
  } catch (error) {
    console.error('❌ Error testing ObjectId validation:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Bulk update product pricing
exports.bulkUpdatePricing = async (req, res, next) => {
  try {
    console.log('🔄 BULK UPDATE PRICING CALLED!');
    console.log('🔍 Raw request body:', JSON.stringify(req.body, null, 2));
    console.log('🔍 User:', req.user);

    const { productIds, priceMarkupPercent } = req.body;

    // Validation
    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      console.log('❌ Invalid productIds:', productIds);
      return res.status(400).json({
        success: false,
        message: 'Product IDs array is required and must not be empty'
      });
    }

    if (priceMarkupPercent === undefined || priceMarkupPercent === null) {
      console.log('❌ Missing priceMarkupPercent:', priceMarkupPercent);
      return res.status(400).json({
        success: false,
        message: 'Price markup percentage is required'
      });
    }

    const markupValue = parseFloat(priceMarkupPercent);
    if (isNaN(markupValue) || markupValue < 0 || markupValue > 1000) {
      console.log('❌ Invalid priceMarkupPercent value:', priceMarkupPercent);
      return res.status(400).json({
        success: false,
        message: 'Price markup percentage must be a number between 0 and 1000'
      });
    }

    console.log('✅ Validation passed. Updating product pricing:', {
      productIds,
      priceMarkupPercent: markupValue,
      count: productIds.length
    });

    // Get products to calculate new final prices
    const products = await Product.find({ _id: { $in: productIds } });

    if (products.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No products found with the provided IDs'
      });
    }

    // Update each product individually to trigger price calculation
    const updatePromises = products.map(async (product) => {
      const newFinalPrice = product.basePrice + (product.basePrice * markupValue / 100);

      return Product.findByIdAndUpdate(
        product._id,
        {
          priceMarkupPercent: markupValue,
          finalPrice: newFinalPrice,
          updatedAt: new Date()
        },
        { new: true }
      );
    });

    const updatedProducts = await Promise.all(updatePromises);

    console.log('✅ Bulk pricing update successful:', {
      requested: productIds.length,
      updated: updatedProducts.length,
      priceMarkupPercent: markupValue
    });

    res.json({
      success: true,
      message: `Price markup updated successfully for ${updatedProducts.length} product${updatedProducts.length > 1 ? 's' : ''}`,
      updatedCount: updatedProducts.length,
      products: updatedProducts
    });
  } catch (error) {
    console.error('❌ Error bulk updating product pricing:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format in the provided list'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error while bulk updating product pricing'
    });
  }
};

// Import functions
exports.importProducts = ProductImportController.importProducts;
exports.generateTemplate = ProductImportController.generateTemplate;
