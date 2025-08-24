const Category = require('../models/products/CategoryNew');
const mongoose = require('mongoose');

// Get all categories
exports.getAllCategories = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search, status } = req.query;
    
    // Build filter object
    const filter = {};
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status) {
      filter.status = status;
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get categories with pagination
    const categories = await Category.find(filter)
      .sort({ name: 1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Get total count for pagination
    const total = await Category.countDocuments(filter);
    
    // Set cache-busting headers to prevent 304 Not Modified
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'ETag': '', // Remove ETag
      'Last-Modified': new Date().toUTCString() // Always fresh timestamp
    });

    res.json({
      success: true,
      categories,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalCategories: total,
        hasNext: skip + categories.length < total,
        hasPrev: parseInt(page) > 1
      },
      timestamp: Date.now() // Add timestamp for debugging
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    next(error);
  }
};

// Get category by ID
exports.getCategoryById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category ID format'
      });
    }

    const category = await Category.findById(id)
      .lean();

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Set cache-busting headers
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });

    res.json({
      success: true,
      category,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Error fetching category:', error);
    next(error);
  }
};

// Create new category
exports.createCategory = async (req, res, next) => {
  try {
    const categoryData = req.body;

    // Check if category name already exists
    const existingName = await Category.findOne({
      name: categoryData.name
    });
    if (existingName) {
      return res.status(400).json({
        success: false,
        message: 'Category name already exists'
      });
    }

    // Check if category code already exists
    const existingCode = await Category.findOne({
      code: categoryData.code
    });
    if (existingCode) {
      return res.status(400).json({
        success: false,
        message: 'Category code already exists'
      });
    }

    // Add createdBy from authenticated user
    categoryData.createdBy = req.user.sub;

    // Create new category
    const category = new Category(categoryData);
    await category.save();

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      category: category.toObject()
    });
  } catch (error) {
    console.error('Error creating category:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
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

// Update category
exports.updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category ID format'
      });
    }

    // Check if category exists
    const existingCategory = await Category.findById(id);
    if (!existingCategory) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Check if name is being changed and if new name already exists
    if (updateData.name && updateData.name !== existingCategory.name) {
      const nameExists = await Category.findOne({
        name: updateData.name,
        _id: { $ne: id }
      });
      if (nameExists) {
        return res.status(400).json({
          success: false,
          message: 'Category name already exists'
        });
      }
    }

    // Check if code is being changed and if new code already exists
    if (updateData.code && updateData.code !== existingCategory.code) {
      const codeExists = await Category.findOne({
        code: updateData.code,
        _id: { $ne: id }
      });
      if (codeExists) {
        return res.status(400).json({
          success: false,
          message: 'Category code already exists'
        });
      }
    }

    // Add updatedBy from authenticated user
    updateData.updatedBy = req.user.sub;
    updateData.updatedAt = new Date();

    // Update category
    const category = await Category.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).lean();

    res.json({
      success: true,
      message: 'Category updated successfully',
      category
    });
  } catch (error) {
    console.error('Error updating category:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
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

// Delete category (hard delete)
exports.deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category ID format'
      });
    }

    // Find category first to check if it exists
    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Check if category has any products
    const Product = require('../models/products/product');
    const hasProducts = await Product.findOne({ categoryId: id });
    if (hasProducts) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete category with associated products. Please move or delete products first.'
      });
    }

    // Hard delete - permanently remove from database
    const deletedCategory = await Category.findByIdAndDelete(id);

    if (!deletedCategory) {
      return res.status(404).json({
        success: false,
        message: 'Category not found or already deleted'
      });
    }

    console.log(`✅ Category permanently deleted: ${deletedCategory.name} (ID: ${deletedCategory._id})`);

    res.json({
      success: true,
      message: 'Category permanently deleted from database',
      deletedCategory: {
        id: deletedCategory._id,
        name: deletedCategory.name
      }
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    next(error);
  }
};

// Get category statistics
exports.getCategoryStats = async (req, res, next) => {
  try {
    const stats = await Category.aggregate([
      { $match: { deletedAt: null } },
      {
        $group: {
          _id: null,
          totalCategories: { $sum: 1 },
          activeCategories: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
          },
          inactiveCategories: {
            $sum: { $cond: [{ $eq: ['$status', 'inactive'] }, 1, 0] }
          }
        }
      }
    ]);

    const result = stats[0] || {
      totalCategories: 0,
      activeCategories: 0,
      inactiveCategories: 0
    };

    res.json({
      success: true,
      stats: result
    });
  } catch (error) {
    console.error('Error fetching category stats:', error);
    next(error);
  }
};

// Get active categories for dropdown
exports.getActiveCategories = async (req, res, next) => {
  try {
    const categories = await Category.getActiveCategories();
    
    res.json({
      success: true,
      categories
    });
  } catch (error) {
    console.error('Error fetching active categories:', error);
    next(error);
  }
};
