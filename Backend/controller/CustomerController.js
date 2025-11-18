const Customer = require("../models/Customer");
const mongoose = require("mongoose");

// Get all customers
exports.getAllCustomers = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search, status } = req.query;

    // Build filter object
    const filter = { deletedAt: null };

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { address: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    if (status) {
      filter.status = status;
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get customers with pagination
    const customers = await Customer.find(filter)
      .populate("createdBy", "username")
      .populate("updatedBy", "username")
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
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching customers:", error);
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
        message: "Invalid customer ID",
      });
    }

    const customer = await Customer.findOne({ _id: id, deletedAt: null })
      .populate("createdBy", "username")
      .populate("updatedBy", "username")
      .lean();

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    res.json({
      success: true,
      customer,
    });
  } catch (error) {
    console.error("Error fetching customer:", error);
    next(error);
  }
};

// Create new customer
exports.createCustomer = async (req, res, next) => {
  try {
    const { name, phone, address, email, status, notes } = req.body;

    // Validate required fields
    if (!name || !phone || !address) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: name, phone, address"
      });
    }

    // Validate status enum
    if (status && !['active', 'inactive'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be 'active' or 'inactive'"
      });
    }

    // Validate email format if provided
    if (email && email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        return res.status(400).json({
          success: false,
          message: "Invalid email format"
        });
      }
    }

    // Sanitize and normalize data
    const customerData = {
      name: name.trim(),
      phone: phone.trim(),
      address: address.trim(),
      status: status || 'active',
      createdBy: req.user.sub
    };

    // Add optional fields with sanitization
    if (email && email.trim()) {
      customerData.email = email.trim().toLowerCase();
    }
    if (notes && notes.trim()) {
      customerData.notes = notes.trim();
    }

    // Check if phone already exists
    const existingPhone = await Customer.findOne({
      phone: customerData.phone,
      deletedAt: null,
    });
    if (existingPhone) {
      return res.status(400).json({
        success: false,
        message: "Phone number already exists",
      });
    }

    // Create new customer
    const customer = new Customer(customerData);
    await customer.save();

    res.status(201).json({
      success: true,
      message: "Customer created successfully",
      customer: customer.toObject(),
    });
  } catch (error) {
    console.error("Error creating customer:", error);

    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors,
      });
    }

    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `${field} already exists`,
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
        message: "Invalid customer ID",
      });
    }

    // Check if customer exists
    const existingCustomer = await Customer.findOne({
      _id: id,
      deletedAt: null,
    });
    if (!existingCustomer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    // Check if phone already exists (excluding current customer)
    if (updateData.phone && updateData.phone !== existingCustomer.phone) {
      const phoneExists = await Customer.findOne({
        phone: updateData.phone,
        _id: { $ne: id },
        deletedAt: null,
      });
      if (phoneExists) {
        return res.status(400).json({
          success: false,
          message: "Phone number already exists",
        });
      }
    }

    // Add updatedBy
    updateData.updatedBy = req.user.sub;

    // Update customer
    const customer = await Customer.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate("createdBy", "username")
      .populate("updatedBy", "username");

    res.json({
      success: true,
      message: "Customer updated successfully",
      customer,
    });
  } catch (error) {
    console.error("Error updating customer:", error);

    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors,
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
        message: "Invalid customer ID",
      });
    }

    const customer = await Customer.findOne({ _id: id, deletedAt: null });
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    // Soft delete
    await customer.softDelete(req.user.sub);

    res.json({
      success: true,
      message: "Customer deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting customer:", error);
    next(error);
  }
};

// Create new customer by staff (simplified version for export receipts)
exports.createCustomerByStaff = async (req, res, next) => {
  try {
    const { name, phone, address } = req.body;

    // Validate required fields
    if (!name || !phone || !address) {
      return res.status(400).json({
        success: false,
        message: "Name, phone, and address are required"
      });
    }

    // Check if phone already exists
    const existingPhone = await Customer.findOne({
      phone: phone.trim(),
      deletedAt: null,
    });
    if (existingPhone) {
      return res.status(400).json({
        success: false,
        message: "Phone number already exists",
        existingCustomer: {
          _id: existingPhone._id,
          name: existingPhone.name,
          phone: existingPhone.phone,
          address: existingPhone.address
        }
      });
    }

    // Create new customer with minimal required fields
    const customerData = {
      name: name.trim(),
      phone: phone.trim(),
      address: address.trim(),
      status: 'active',
      createdBy: req.user.sub
    };

    const customer = new Customer(customerData);
    await customer.save();

    res.status(201).json({
      success: true,
      message: "Customer created successfully",
      customer: {
        _id: customer._id,
        name: customer.name,
        phone: customer.phone,
        address: customer.address,
        status: customer.status
      }
    });
  } catch (error) {
    console.error('❌ Error creating customer by staff:', error);
    next(error);
  }
};

// Get active customers for dropdown
exports.getActiveCustomers = async (req, res, next) => {
  try {
    const customers = await Customer.getActiveCustomers();

    res.json({
      success: true,
      customers,
    });
  } catch (error) {
    console.error("Error fetching active customers:", error);
    next(error);
  }
};

// Get customer statistics
exports.getCustomerStats = async (req, res, next) => {
  try {
    const stats = await Customer.aggregate([
      {
        $match: { deletedAt: null },
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const total = await Customer.countDocuments({ deletedAt: null });

    res.json({
      success: true,
      stats: {
        total,
        byStatus: stats,
      },
    });
  } catch (error) {
    console.error("Error fetching customer stats:", error);
    next(error);
  }
};

exports.getCustomerDashboard = async (req, res, next) => {
  try {
    const { period = "month", year, month, day } = req.query;

    // helper to get ranges
    const now = new Date();
    const y = Number.isFinite(Number(year)) ? parseInt(year, 10) : null;
    const m = Number.isFinite(Number(month)) ? parseInt(month, 10) : null;
    const d = Number.isFinite(Number(day)) ? parseInt(day, 10) : null;

    // build current period start/end and previous period start/end (end is exclusive)
    let currentStart, currentEnd, prevStart, prevEnd;

    if (period === "day") {
      currentStart = new Date(y, m - 1, d, 0, 0, 0, 0);
      currentEnd = new Date(currentStart.getTime() + 24 * 60 * 60 * 1000);
      prevStart = new Date(currentStart.getTime() - 24 * 60 * 60 * 1000);
      prevEnd = currentStart;
    } else if (period === "year") {
      currentStart = new Date(y, 0, 1, 0, 0, 0, 0);
      currentEnd = new Date(y + 1, 0, 1, 0, 0, 0, 0);
      prevStart = new Date(y - 1, 0, 1, 0, 0, 0, 0);
      prevEnd = currentStart;
    } else {
      // month (default)
      currentStart = new Date(y, m - 1, 1, 0, 0, 0, 0);
      // next month
      if (m === 12) {
        currentEnd = new Date(y + 1, 0, 1, 0, 0, 0, 0);
      } else {
        currentEnd = new Date(y, m, 1, 0, 0, 0, 0);
      }
      // previous month
      if (m === 1) {
        prevStart = new Date(y - 1, 11, 1, 0, 0, 0, 0);
      } else {
        prevStart = new Date(y, m - 2, 1, 0, 0, 0, 0);
      }
      prevEnd = currentStart;
    }

    const filterCurrent = {
      deletedAt: null,
      createdAt: { $gte: currentStart, $lt: currentEnd },
    };
    const filterPrev = {
      deletedAt: null,
      createdAt: { $gte: prevStart, $lt: prevEnd },
    };

    // Count in parallel
    const [currentCount, prevCount] = await Promise.all([
      Customer.countDocuments(filterCurrent),
      Customer.countDocuments(filterPrev),
    ]);

    // calc percent change
    let changePercent = 0;
    if (prevCount === 0) {
      changePercent = currentCount === 0 ? 0 : 100;
    } else {
      changePercent = ((currentCount - prevCount) / prevCount) * 100;
    }
    // round to 2 decimals
    changePercent = Math.round(changePercent * 100) / 100;

    res.json({
      success: true,
      total: currentCount,
      previous: prevCount,
      changePercent,
      period: { period, year: y, month: m, day: d },
    });
  } catch (error) {
    console.error("Error fetching customer dashboard:", error);
    next(error);
  }
};
