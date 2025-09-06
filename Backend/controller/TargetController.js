// controllers/targetController.js
const Target = require('../models/Target');
const mongoose = require('mongoose');

// Create target (will return 409 if already exists). Alternatively you can implement upsert.
exports.createTarget = async (req, res, next) => {
  try {
    const { warehouse, year, month, amount } = req.body;
    if (!warehouse || !year || !month || amount === undefined) {
      return res.status(400).json({ success: false, message: 'warehouse, year, month and amount are required' });
    }

    // validate month/year
    const mm = Number(month);
    const yy = Number(year);
    if (mm < 1 || mm > 12 || yy < 1900) {
      return res.status(400).json({ success: false, message: 'Invalid year or month' });
    }

    // check existed (soft-deleted excluded by index, but double-check)
    const existing = await Target.findOne({ warehouse, year: yy, month: mm, deletedAt: null });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Target already exists for this warehouse/year/month', target: existing });
    }

    const t = new Target({
      warehouse,
      year: yy,
      month: mm,
      amount: Number(amount),
      createdBy: req.user?.sub
    });

    await t.save();
    return res.status(201).json({ success: true, target: t });
  } catch (err) {
    // handle duplicate key (race)
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: 'Target already exists (duplicate)' });
    }
    console.error('createTarget error', err);
    return next(err);
  }
};

// Optional upsert endpoint: set or update (if exists update, else create)
exports.setTarget = async (req, res, next) => {
  try {
    const { warehouse, year, month, amount } = req.body;
    if (!warehouse || !year || !month || amount === undefined) {
      return res.status(400).json({ success: false, message: 'warehouse, year, month and amount are required' });
    }
    const mm = Number(month);
    const yy = Number(year);

    const filter = { warehouse, year: yy, month: mm, deletedAt: null };
    const update = { amount: Number(amount), updatedBy: req.user?.sub };
    const opts = { new: true, upsert: true, setDefaultsOnInsert: true };

    const target = await Target.findOneAndUpdate(filter, update, opts);
    // if upsert created doc, set createdBy if possible
    if (target && !target.createdBy) {
      target.createdBy = req.user?.sub;
      await target.save();
    }

    return res.json({ success: true, target });
  } catch (err) {
    console.error('setTarget error', err);
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: 'Target already exists (duplicate)' });
    }
    return next(err);
  }
};

// Get targets (by warehouse and/or year and/or month)
exports.getTargets = async (req, res, next) => {
  try {
    const { warehouse, year, month } = req.query;
    const filter = { deletedAt: null };

    if (warehouse) filter.warehouse = warehouse;
    if (year !== undefined) filter.year = Number(year);
    if (month !== undefined) filter.month = Number(month);

    const targets = await Target.find(filter).sort({ year: 1, month: 1 }).lean();

    return res.json({ success: true, targets });
  } catch (err) {
    console.error('getTargets error', err);
    return next(err);
  }
};

// Update by id (amount and optionally year/month allowed)
exports.updateTarget = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { amount, year, month } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid target id' });
    }
    const target = await Target.findById(id);
    if (!target || target.deletedAt) {
      return res.status(404).json({ success: false, message: 'Target not found' });
    }

    if (amount !== undefined) target.amount = Number(amount);
    if (year !== undefined) target.year = Number(year);
    if (month !== undefined) target.month = Number(month);
    target.updatedBy = req.user?.sub;

    // If year/month changed, ensure uniqueness (optional)
    // try-catch to handle duplicate key
    try {
      await target.save();
    } catch (err) {
      if (err.code === 11000) {
        return res.status(409).json({ success: false, message: 'Another target exists with same warehouse/year/month' });
      }
      throw err;
    }

    return res.json({ success: true, target });
  } catch (err) {
    console.error('updateTarget error', err);
    return next(err);
  }
};

// Delete target (soft delete)
exports.deleteTarget = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid target id' });
    }

    const target = await Target.findById(id);
    if (!target || target.deletedAt) {
      return res.status(404).json({ success: false, message: 'Target not found' });
    }

    target.deletedAt = new Date();
    target.updatedBy = req.user?.sub;
    await target.save();

    return res.json({ success: true, message: 'Target deleted successfully' });
  } catch (err) {
    console.error('deleteTarget error', err);
    return next(err);
  }
};
