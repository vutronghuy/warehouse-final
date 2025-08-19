const Product = require('../models/products/product');
const mongoose = require('mongoose');

// Get all products
exports.getAllProducts = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search, status, categoryId } = req.query;
    
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

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get products with pagination and populate references
    const products = await Product.find(filter)
      .populate('categoryId', 'name')
      .populate('primarySupplierId', 'name')
      .sort({ name: 1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Get total count for pagination
    const total = await Product.countDocuments(filter);
    
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
