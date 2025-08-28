const Customer = require('../models/Customer');
const mongoose = require('mongoose');

// Get all customers
exports.getAllCustomers = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search, status } = req.query;
    
    // Build filter object
    const filter = { deletedAt: null };
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status) {
      filter.status = status;
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get customers with pagination
    const customers = await Customer.find(filter)
      .populate('createdBy', 'username')
      .populate('updatedBy', 'username')
      .sort({ name: 1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Get total count for pagination
    const total = await Customer.countDocuments(filter);
    
    res.json({
      success: true,
      customers,
      pagination: {
        current: parseInt(page),
        pageSize: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    next(error);
  }
};

// Get customer by ID
exports.getCustomerById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid customer ID'
      });
    }

    const customer = await Customer.findOne({ _id: id, deletedAt: null })
      .populate('createdBy', 'username')
      .populate('updatedBy', 'username')
      .lean();

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    res.json({
      success: true,
      customer
    });
  } catch (error) {
    console.error('Error fetching customer:', error);
    next(error);
  }
};

// Create new customer
exports.createCustomer = async (req, res, next) => {
  try {
    const customerData = req.body;

    // Check if phone already exists
    const existingPhone = await Customer.findOne({
      phone: customerData.phone,
      deletedAt: null
    });
    if (existingPhone) {
      return res.status(400).json({
        success: false,
        message: 'Phone number already exists'
      });
    }

    // Add createdBy from authenticated user
    customerData.createdBy = req.user.sub;

    // Create new customer
    const customer = new Customer(customerData);
    await customer.save();

    res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      customer: customer.toObject()
    });
  } catch (error) {
    console.error('Error creating customer:', error);
    
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

// Update customer
exports.updateCustomer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid customer ID'
      });
    }

    // Check if customer exists
    const existingCustomer = await Customer.findOne({ _id: id, deletedAt: null });
    if (!existingCustomer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Check if phone already exists (excluding current customer)
    if (updateData.phone && updateData.phone !== existingCustomer.phone) {
      const phoneExists = await Customer.findOne({
        phone: updateData.phone,
        _id: { $ne: id },
        deletedAt: null
      });
      if (phoneExists) {
        return res.status(400).json({
          success: false,
          message: 'Phone number already exists'
        });
      }
    }

    // Add updatedBy
    updateData.updatedBy = req.user.sub;

    // Update customer
    const customer = await Customer.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('createdBy', 'username').populate('updatedBy', 'username');

    res.json({
      success: true,
      message: 'Customer updated successfully',
      customer
    });
  } catch (error) {
    console.error('Error updating customer:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }

    next(error);
  }
};

// Soft delete customer
exports.deleteCustomer = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid customer ID'
      });
    }

    const customer = await Customer.findOne({ _id: id, deletedAt: null });
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Soft delete
    await customer.softDelete(req.user.sub);

    res.json({
      success: true,
      message: 'Customer deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting customer:', error);
    next(error);
  }
};

// Get active customers for dropdown
exports.getActiveCustomers = async (req, res, next) => {
  try {
    const customers = await Customer.getActiveCustomers();
    
    res.json({
      success: true,
      customers
    });
  } catch (error) {
    console.error('Error fetching active customers:', error);
    next(error);
  }
};

// Get customer statistics
exports.getCustomerStats = async (req, res, next) => {
  try {
    const stats = await Customer.aggregate([
      {
        $match: { deletedAt: null }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const total = await Customer.countDocuments({ deletedAt: null });

    res.json({
      success: true,
      stats: {
        total,
        byStatus: stats
      }
    });
  } catch (error) {
    console.error('Error fetching customer stats:', error);
    next(error);
  }
};
