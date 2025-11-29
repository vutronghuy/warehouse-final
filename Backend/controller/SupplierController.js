const Supplier = require('../models/products/Supplier');
const mongoose = require('mongoose');

// Get all suppliers
exports.getAllSuppliers = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search, status, businessType } = req.query;

    // Build filter object
    const filter = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { 'contactInfo.email': { $regex: search, $options: 'i' } },
        { 'contactInfo.phone': { $regex: search, $options: 'i' } }
      ];
    }

    if (status) {
      filter.status = status;
    }

    if (businessType) {
      filter['businessInfo.businessType'] = businessType;
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get suppliers with pagination
    const suppliers = await Supplier.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Get total count for pagination
    const total = await Supplier.countDocuments(filter);

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
      suppliers,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalSuppliers: total,
        hasNext: skip + suppliers.length < total,
        hasPrev: parseInt(page) > 1
      },
      timestamp: Date.now() // Add timestamp for debugging
    });
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    next(error);
  }
};

// Get supplier by ID
exports.getSupplierById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid supplier ID format'
      });
    }

    const supplier = await Supplier.findById(id).lean();

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
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
      supplier,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Error fetching supplier:', error);
    next(error);
  }
};

// Create new supplier
exports.createSupplier = async (req, res, next) => {
  try {
    const supplierData = req.body;

    // Check if supplier code already exists
    const existingSupplier = await Supplier.findOne({ code: supplierData.code });
    if (existingSupplier) {
      return res.status(400).json({
        success: false,
        message: 'Supplier code already exists'
      });
    }

    // Add createdBy from authenticated user
    supplierData.createdBy = req.user.sub; // req.user.sub contains the user ID

    // Create new supplier
    const supplier = new Supplier(supplierData);
    await supplier.save();

    res.status(201).json({
      success: true,
      message: 'Supplier created successfully',
      supplier: supplier.toObject()
    });
  } catch (error) {
    console.error('Error creating supplier:', error);

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

// Update supplier
exports.updateSupplier = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid supplier ID format'
      });
    }

    // Check if supplier exists
    const existingSupplier = await Supplier.findById(id);
    if (!existingSupplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    // Check if code is being changed and if new code already exists
    if (updateData.code && updateData.code !== existingSupplier.code) {
      const codeExists = await Supplier.findOne({
        code: updateData.code,
        _id: { $ne: id }
      });
      if (codeExists) {
        return res.status(400).json({
          success: false,
          message: 'Supplier code already exists'
        });
      }
    }

    // Add updatedBy from authenticated user
    updateData.updatedBy = req.user.sub;
    updateData.updatedAt = new Date();

    // Update supplier
    const supplier = await Supplier.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).lean();

    res.json({
      success: true,
      message: 'Supplier updated successfully',
      supplier
    });
  } catch (error) {
    console.error('Error updating supplier:', error);

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

// Delete supplier (hard delete)
// Soft delete supplier
exports.deleteSupplier = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { hardDelete } = req.query; // Optional: hardDelete=true for permanent deletion (super admin only)

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid supplier ID format'
      });
    }

    // Find supplier first to check if it exists (include deleted ones for hard delete check)
    const supplier = await Supplier.findOne({ _id: id });
    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    // Check if already soft deleted
    if (supplier.deletedAt && !hardDelete) {
      return res.status(400).json({
        success: false,
        message: 'Supplier is already deleted'
      });
    }

    let deletedSupplier;
    let message;

    if (hardDelete === 'true' && req.user?.isSuperAdmin) {
      // Hard delete - only for super admin
      deletedSupplier = await Supplier.findByIdAndDelete(id);
      message = 'Supplier permanently deleted from database';
      console.log(`✅ Supplier permanently deleted: ${deletedSupplier.name} (ID: ${deletedSupplier._id})`);
    } else {
      // Soft delete - set deletedAt timestamp
      deletedSupplier = await Supplier.findByIdAndUpdate(
        id,
        { 
          deletedAt: new Date(),
          updatedBy: req.user?.sub || req.user?.id
        },
        { new: true }
      );
      message = 'Supplier deleted successfully (soft delete)';
      console.log(`✅ Supplier soft deleted: ${deletedSupplier.name} (ID: ${deletedSupplier._id})`);
    }

    if (!deletedSupplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found or already deleted'
      });
    }

    res.json({
      success: true,
      message: message,
      deletedSupplier: {
        id: deletedSupplier._id,
        name: deletedSupplier.name,
        code: deletedSupplier.code,
        deletedAt: deletedSupplier.deletedAt || null
      }
    });
  } catch (error) {
    console.error('Error deleting supplier:', error);
    next(error);
  }
};

// Restore soft-deleted supplier
exports.restoreSupplier = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid supplier ID format'
      });
    }

    // Find supplier including deleted ones
    const supplier = await Supplier.findOne({ _id: id, deletedAt: { $ne: null } });
    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Deleted supplier not found'
      });
    }

    // Restore by setting deletedAt to null
    const restoredSupplier = await Supplier.findByIdAndUpdate(
      id,
      { 
        deletedAt: null,
        updatedBy: req.user?.sub || req.user?.id
      },
      { new: true }
    );

    console.log(`✅ Supplier restored: ${restoredSupplier.name} (ID: ${restoredSupplier._id})`);

    res.json({
      success: true,
      message: 'Supplier restored successfully',
      supplier: {
        id: restoredSupplier._id,
        name: restoredSupplier.name,
        code: restoredSupplier.code
      }
    });
  } catch (error) {
    console.error('Error restoring supplier:', error);
    next(error);
  }
};
