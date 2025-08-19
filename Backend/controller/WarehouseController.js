const Warehouse = require('../models/warehouse/Warehouse');
const User = require('../models/User');
const mongoose = require('mongoose');

// Helper function to find staff by warehouse
const findStaffByWarehouse = async (warehouseId) => {
  try {
    console.log('🔍 Finding staff for warehouse:', warehouseId);

    // Debug: Show all users in database
    const allUsers = await User.find({}).select('role manager.warehouseId staff.warehouseId accounter.warehouseId admin.managedWarehouses').lean();
    console.log('📋 All users in database:');
    allUsers.forEach(user => {
      console.log(`  - ${user._id} (${user.role}):`, {
        managerWarehouse: user.manager?.warehouseId,
        staffWarehouse: user.staff?.warehouseId,
        accounterWarehouse: user.accounter?.warehouseId,
        adminWarehouses: user.admin?.managedWarehouses
      });
    });

    // Try both string and ObjectId formats for warehouse matching
    const warehouseObjectId = mongoose.Types.ObjectId.isValid(warehouseId)
      ? new mongoose.Types.ObjectId(warehouseId)
      : warehouseId;

    // Find manager - try both ObjectId and string
    let manager = await User.findOne({
      'manager.warehouseId': warehouseObjectId,
      'manager.status': 'active'
    }).select('manager.fullName manager.email manager.username').lean();

    if (!manager) {
      // Fallback: try with string warehouseId
      manager = await User.findOne({
        'manager.warehouseId': warehouseId,
        'manager.status': 'active'
      }).select('manager.fullName manager.email manager.username').lean();
    }
    console.log('👨‍💼 Manager found:', manager ? manager.manager.fullName : 'None');

    // Find admin (from managedWarehouses array) - try both formats
    console.log('🔍 Looking for admin with managedWarehouses containing:', warehouseId);

    let admin = await User.findOne({
      role: 'admin',
      'admin.managedWarehouses': warehouseObjectId,
      'admin.status': 'active'
    }).select('admin.fullName admin.email admin.username').lean();

    if (!admin) {
      console.log('🔍 Trying string format for admin search...');
      admin = await User.findOne({
        role: 'admin',
        'admin.managedWarehouses': warehouseId,
        'admin.status': 'active'
      }).select('admin.fullName admin.email admin.username').lean();
    }

    if (!admin) {
      console.log('🔍 Trying $in operator for admin search...');
      admin = await User.findOne({
        role: 'admin',
        'admin.managedWarehouses': { $in: [warehouseObjectId, warehouseId] },
        'admin.status': 'active'
      }).select('admin.fullName admin.email admin.username').lean();
    }

    console.log('👨‍💻 Admin found:', admin ? admin.admin.fullName : 'None');
    if (admin) {
      console.log('👨‍💻 Admin managedWarehouses:', admin.admin?.managedWarehouses);
    }

    // Find accounter - try both formats
    let accounter = await User.findOne({
      'accounter.warehouseId': warehouseObjectId,
      'accounter.status': 'active'
    }).select('accounter.fullName accounter.email accounter.username').lean();

    if (!accounter) {
      accounter = await User.findOne({
        'accounter.warehouseId': warehouseId,
        'accounter.status': 'active'
      }).select('accounter.fullName accounter.email accounter.username').lean();
    }
    console.log('📊 Accounter found:', accounter ? accounter.accounter.fullName : 'None');

    // Find staff members - try both formats
    let staffMembers = await User.find({
      'staff.warehouseId': warehouseObjectId,
      'staff.status': 'active'
    }).select('staff.fullName staff.email staff.username').lean();

    if (staffMembers.length === 0) {
      staffMembers = await User.find({
        'staff.warehouseId': warehouseId,
        'staff.status': 'active'
      }).select('staff.fullName staff.email staff.username').lean();
    }
    console.log('👥 Staff members found:', staffMembers.length);

    return {
      manager: manager ? {
        _id: manager._id,
        fullName: manager.manager.fullName,
        email: manager.manager.email,
        username: manager.manager.username
      } : null,
      admin: admin ? {
        _id: admin._id,
        fullName: admin.admin.fullName,
        email: admin.admin.email,
        username: admin.admin.username
      } : null,
      accounter: accounter ? {
        _id: accounter._id,
        fullName: accounter.accounter.fullName,
        email: accounter.accounter.email,
        username: accounter.accounter.username
      } : null,
      staffMembers: staffMembers.map(staff => ({
        _id: staff._id,
        fullName: staff.staff.fullName,
        email: staff.staff.email,
        username: staff.staff.username
      }))
    };
  } catch (error) {
    console.error('Error finding staff by warehouse:', error);
    return {
      manager: null,
      admin: null,
      accounter: null,
      staffMembers: []
    };
  }
};

// Get all warehouses
exports.getAllWarehouses = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search, status } = req.query;

    // Build filter object
    const filter = { deletedAt: null };

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } }
      ];
    }

    if (status) {
      filter.status = status;
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get warehouses with pagination
    const warehouses = await Warehouse.find(filter)
      .sort({ name: 1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Add staff information for each warehouse
    const warehousesWithStaff = await Promise.all(
      warehouses.map(async (warehouse) => {
        const staff = await findStaffByWarehouse(warehouse._id);
        return {
          ...warehouse,
          managerId: staff.manager,
          adminId: staff.admin,
          accounterId: staff.accounter,
          staffIds: staff.staffMembers
        };
      })
    );

    // Get total count for pagination
    const total = await Warehouse.countDocuments(filter);

    // Set no-cache headers to prevent 304 Not Modified
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });

    res.json({
      success: true,
      warehouses: warehousesWithStaff,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalWarehouses: total,
        hasNext: skip + warehousesWithStaff.length < total,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Error fetching warehouses:', error);
    next(error);
  }
};

// Create new warehouse
exports.createWarehouse = async (req, res, next) => {
  try {
    const { name, location } = req.body;

    // Validate required fields
    if (!name || !location) {
      return res.status(400).json({
        success: false,
        message: 'Name and location are required'
      });
    }

    // Check if warehouse name already exists
    const existingName = await Warehouse.findOne({
      name: name.trim(),
      deletedAt: null
    });
    if (existingName) {
      return res.status(400).json({
        success: false,
        message: 'Warehouse name already exists'
      });
    }

    // Create warehouse with all fields (null for staff fields)
    const warehouseData = {
      name: name.trim(),
      location: location.trim(),
      managerId: null,
      adminId: null,
      accounterId: null,
      staffIds: [],
      createdBy: req.user.sub,
      status: 'active', // Default status
      deletedAt: null
    };

    const warehouse = new Warehouse(warehouseData);
    await warehouse.save();

    res.status(201).json({
      success: true,
      message: 'Warehouse created successfully',
      warehouse: warehouse.toObject()
    });
  } catch (error) {
    console.error('Error creating warehouse:', error);

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

exports.getWarehouseById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid warehouse ID format'
      });
    }

    const warehouse = await Warehouse.findOne({ _id: id, deletedAt: null })
      .lean();

    if (!warehouse) {
      return res.status(404).json({
        success: false,
        message: 'Warehouse not found'
      });
    }

    // Add staff information
    const staff = await findStaffByWarehouse(warehouse._id);
    const warehouseWithStaff = {
      ...warehouse,
      managerId: staff.manager,
      adminId: staff.admin,
      accounterId: staff.accounter,
      staffIds: staff.staffMembers
    };

    // Set no-cache headers to prevent 304 Not Modified
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });

    res.json({
      success: true,
      warehouse: warehouseWithStaff
    });
  } catch (error) {
    console.error('Error fetching warehouse:', error);
    next(error);
  }
};

// Update warehouse
exports.updateWarehouse = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, location, status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid warehouse ID format'
      });
    }

    // Check if warehouse exists
    const existingWarehouse = await Warehouse.findOne({ _id: id, deletedAt: null });
    if (!existingWarehouse) {
      return res.status(404).json({
        success: false,
        message: 'Warehouse not found'
      });
    }

    // Prepare update data - only allow name, location, status
    const updateData = {};

    if (name !== undefined) {
      updateData.name = name.trim();
      // Check if name is being changed and if new name already exists
      if (updateData.name !== existingWarehouse.name) {
        const nameExists = await Warehouse.findOne({
          name: updateData.name,
          _id: { $ne: id },
          deletedAt: null
        });
        if (nameExists) {
          return res.status(400).json({
            success: false,
            message: 'Warehouse name already exists'
          });
        }
      }
    }

    if (location !== undefined) {
      updateData.location = location.trim();
    }

    if (status !== undefined) {
      updateData.status = status;
    }

    // Add updatedBy from authenticated user
    updateData.updatedBy = req.user.sub;
    updateData.updatedAt = new Date();

    // Update warehouse
    const warehouse = await Warehouse.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).lean();

    // Add staff information
    const staff = await findStaffByWarehouse(warehouse._id);
    const warehouseWithStaff = {
      ...warehouse,
      managerId: staff.manager,
      adminId: staff.admin,
      accounterId: staff.accounter,
      staffIds: staff.staffMembers
    };

    res.json({
      success: true,
      message: 'Warehouse updated successfully',
      warehouse: warehouseWithStaff
    });
  } catch (error) {
    console.error('Error updating warehouse:', error);

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
// Delete warehouse (hard delete)
exports.deleteWarehouse = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { force } = req.query; // ?force=true for hard delete
    console.log('🗑️ Delete warehouse request for ID:', id, 'Force:', force);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log('❌ Invalid warehouse ID format');
      return res.status(400).json({
        success: false,
        message: 'Invalid warehouse ID format'
      });
    }

    // For hard delete, find any warehouse (even soft deleted)
    // For soft delete, only find non-deleted warehouses
    const warehouse = force === 'true'
      ? await Warehouse.findById(id)
      : await Warehouse.findOne({ _id: id, deletedAt: null });

    console.log('📦 Warehouse found:', warehouse ? 'Yes' : 'No');

    if (!warehouse) {
      console.log('❌ Warehouse not found');
      return res.status(404).json({
        success: false,
        message: 'Warehouse not found'
      });
    }

    if (force === 'true') {
      console.log('🔄 Performing HARD delete (permanent)...');
      // Hard delete - completely remove from database
      const deleteResult = await Warehouse.findByIdAndDelete(id);
      console.log('✅ Warehouse permanently deleted:', deleteResult ? 'Success' : 'Failed');

      res.json({
        success: true,
        message: 'Warehouse permanently deleted'
      });
    } else {
      console.log('🔄 Performing SOFT delete...');
      // Soft delete - mark as deleted
      const updateResult = await Warehouse.findByIdAndUpdate(id, {
        deletedAt: new Date(),
        status: 'inactive'
      }, { new: true });

      console.log('✅ Warehouse soft deleted:', updateResult.deletedAt);

      res.json({
        success: true,
        message: 'Warehouse deleted successfully'
      });
    }
  } catch (error) {
    console.error('❌ Error deleting warehouse:', error);
    next(error);
  }
};

// Get warehouse statistics
exports.getWarehouseStats = async (req, res, next) => {
  try {
    const stats = await Warehouse.aggregate([
      { $match: { deletedAt: null } },
      {
        $group: {
          _id: null,
          totalWarehouses: { $sum: 1 },
          activeWarehouses: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
          },
          inactiveWarehouses: {
            $sum: { $cond: [{ $eq: ['$status', 'inactive'] }, 1, 0] }
          },
          totalStaff: { $sum: { $size: '$staffIds' } }
        }
      }
    ]);

    const result = stats[0] || {
      totalWarehouses: 0,
      activeWarehouses: 0,
      inactiveWarehouses: 0,
      totalStaff: 0
    };

    res.json({
      success: true,
      stats: result
    });
  } catch (error) {
    console.error('Error fetching warehouse stats:', error);
    next(error);
  }
};

// Get active warehouses for dropdown
exports.getActiveWarehouses = async (req, res, next) => {
  try {
    const warehouses = await Warehouse.find({
      status: 'active',
      deletedAt: null
    })
    .select('name location')
    .sort({ name: 1 });

    res.json({
      success: true,
      warehouses
    });
  } catch (error) {
    console.error('Error fetching active warehouses:', error);
    next(error);
  }
};

// Refresh warehouse staff data (called after user updates)
exports.refreshWarehouseStaff = async (warehouseId) => {
  try {
    if (!warehouseId || !mongoose.Types.ObjectId.isValid(warehouseId)) {
      return null;
    }

    const warehouse = await Warehouse.findOne({
      _id: warehouseId,
      deletedAt: null
    }).lean();

    if (!warehouse) {
      return null;
    }

    // Get updated staff information
    const staff = await findStaffByWarehouse(warehouseId);

    return {
      ...warehouse,
      managerId: staff.manager,
      adminId: staff.admin,
      accounterId: staff.accounter,
      staffIds: staff.staffMembers
    };
  } catch (error) {
    console.error('Error refreshing warehouse staff:', error);
    return null;
  }
};

// API endpoint to force refresh warehouse data
exports.forceRefreshWarehouse = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid warehouse ID format'
      });
    }

    const refreshedWarehouse = await exports.refreshWarehouseStaff(id);

    if (!refreshedWarehouse) {
      return res.status(404).json({
        success: false,
        message: 'Warehouse not found'
      });
    }

    res.json({
      success: true,
      warehouse: refreshedWarehouse,
      message: 'Warehouse data refreshed successfully'
    });
  } catch (error) {
    console.error('Error force refreshing warehouse:', error);
    next(error);
  }
};

// Debug endpoint to see all user data for a warehouse
exports.debugWarehouseStaff = async (req, res, next) => {
  try {
    const { id } = req.params;

    console.log('🐛 Debug warehouse staff for:', id);

    // Get all users and their warehouse assignments
    const allUsers = await User.find({}).lean();

    const debugInfo = {
      warehouseId: id,
      allUsers: allUsers.map(user => ({
        _id: user._id,
        role: user.role,
        manager: user.manager,
        staff: user.staff,
        accounter: user.accounter,
        admin: user.admin
      })),
      staffForThisWarehouse: await findStaffByWarehouse(id)
    };

    res.json({
      success: true,
      debug: debugInfo
    });
  } catch (error) {
    console.error('Error debugging warehouse staff:', error);
    next(error);
  }
};

// Sync all warehouses with actual user data
exports.syncAllWarehouses = async (req, res, next) => {
  try {
    console.log('🔄 Starting warehouse sync...');

    await Warehouse.syncStaffFromUsers();

    res.json({
      success: true,
      message: 'All warehouses synced successfully'
    });
  } catch (error) {
    console.error('Error syncing warehouses:', error);
    next(error);
  }
};
