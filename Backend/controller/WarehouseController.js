const Warehouse = require('../models/warehouse/Warehouse');
const User = require('../models/User');
const mongoose = require('mongoose');

// create warehouse
exports.createWarehouse = async (req, res, next) => {
  try {
    const { name, location } = req.body;

    // 1. Lấy super-admin từ DB
    const superAdmin = await User.findOne({ 'admin.isSuperAdmin': true }).select('_id').lean();
    if (!superAdmin) {
      return res.status(500).json({ message: 'Super-admin chưa được khởi tạo.' });
    }
    const createdBy = superAdmin._id;

    // 2. Validate input
    if (!name || !location) {
      return res.status(400).json({ message: 'Thiếu name hoặc location.' });
    }

    // 3. Tạo warehouse, ép status luôn là 'active'
    const warehouse = new Warehouse({
      name,
      location,
      createdBy,
      managerId: null,
      staffIds: []
    });

    // 4. Lưu và trả về
    const saved = await warehouse.save();
    return res.status(201).json({ message: 'Warehouse created by super-admin.', data: saved });

  } catch (err) {
    // 5. Xử lý lỗi
    if (err.code === 11000) {
      return res.status(409).json({ message: 'Warehouse name already exists.', detail: err.keyValue });
    }
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: 'Validation failed.', errors: err.errors });
    }
    next(err);
  }
};

exports.getWarehouseById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid warehouse id' });
    }

    const warehouse = await Warehouse.findOne({ _id: id, deletedAt: null })
      .populate('managerId', 'username fullName email')
      .populate('staffIds', 'username fullName email');

    if (!warehouse) {
      return res.status(404).json({ success: false, message: 'Warehouse not found' });
    }

    return res.json({ success: true, warehouse });
  } catch (err) {
    console.error('getWarehouseById error', err);
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

exports.getAllWarehouses = async (req, res, next) => {
  try {
    // Lấy tất cả warehouses chưa soft-deleted
    const warehouses = await Warehouse.find({ deletedAt: null })
      .populate('managerId', 'username fullName email')
      .populate('staffIds', 'username fullName email')
      .lean();

    return res.json({
      success: true,
      warehouses
    });
  } catch (err) {
    console.error('getAllWarehouses error', err);
    // Chuyển xuống middleware xử lý lỗi chung
    next(err);
  }
};
exports.updateWarehouse = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid warehouse id' });
    }

    // Prevent updating deleted warehouses (unless you want to allow)
    const existing = await Warehouse.findById(id);
    if (!existing || existing.deletedAt) {
      return res.status(404).json({ success: false, message: 'Warehouse not found or already deleted' });
    }

    // If name is being changed, ensure uniqueness
    if (updates.name && updates.name !== existing.name) {
      const dup = await Warehouse.findOne({ name: updates.name.trim(), _id: { $ne: id } });
      if (dup) {
        return res.status(409).json({ success: false, message: 'Warehouse name already in use' });
      }
      updates.name = updates.name.trim();
    }

    // Validate managerId / staffIds if provided
    if (updates.managerId && !mongoose.Types.ObjectId.isValid(updates.managerId)) {
      return res.status(400).json({ success: false, message: 'Invalid managerId' });
    }
    if (updates.staffIds) {
      if (!Array.isArray(updates.staffIds)) {
        return res.status(400).json({ success: false, message: 'staffIds must be an array of user ids' });
      }
      const invalid = updates.staffIds.some((sid) => !mongoose.Types.ObjectId.isValid(sid));
      if (invalid) {
        return res.status(400).json({ success: false, message: 'One or more staffIds are invalid' });
      }
    }

    // Set updatedBy if auth middleware provides req.userId
    if (req.userId) updates.updatedBy = req.userId;

    // Apply updates
    const updated = await Warehouse.findByIdAndUpdate(id, { $set: updates }, { new: true })
      .populate('managerId', 'username fullName email')
      .populate('staffIds', 'username fullName email');

    return res.json({ success: true, warehouse: updated });
  } catch (err) {
    console.error('updateWarehouse error', err);
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

exports.deleteWarehouse = async (req, res) => {
  try {
    const { id } = req.params;
    const { force = 'false' } = req.query;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid warehouse id' });
    }

    const existing = await Warehouse.findById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Warehouse not found' });
    }

    if (force === 'true') {
      // Hard delete
      await Warehouse.deleteOne({ _id: id });
      return res.json({ success: true, message: 'Warehouse permanently deleted' });
    }

    // Soft delete
    const updates = { deletedAt: new Date(), status: 'inactive' };
    if (req.userId) updates.updatedBy = req.userId;

    const deleted = await Warehouse.findByIdAndUpdate(id, { $set: updates }, { new: true });

    return res.json({ success: true, message: 'Warehouse soft-deleted', warehouse: deleted });
  } catch (err) {
    console.error('deleteWarehouse error', err);
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};
