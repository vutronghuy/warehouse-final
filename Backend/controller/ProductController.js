const Product = require('../models/products/product');
const User = require('../models/User');
const mongoose = require('mongoose');
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
exports.deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID'
      });
    }

    // Find product first to check if it exists
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Hard delete - permanently remove from database
    const deletedProduct = await Product.findByIdAndDelete(id);

    if (!deletedProduct) {
      return res.status(404).json({
        success: false,
        message: 'Product not found or already deleted'
      });
    }

    console.log(`✅ Product permanently deleted: ${deletedProduct.name} (SKU: ${deletedProduct.sku})`);

    res.json({
      success: true,
      message: 'Product permanently deleted from database',
      deletedProduct: {
        id: deletedProduct._id,
        name: deletedProduct.name,
        sku: deletedProduct.sku
      }
    });
  } catch (error) {
    console.error('Error deleting product:', error);
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
      .select('_id name sku unit basePrice')
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

// Import functions
exports.importProducts = ProductImportController.importProducts;
exports.generateTemplate = ProductImportController.generateTemplate;
