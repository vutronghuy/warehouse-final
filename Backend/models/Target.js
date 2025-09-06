// models/Target.js
const mongoose = require('mongoose');

const targetSchema = new mongoose.Schema({
  warehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  year: { type: Number, required: true },
  month: { type: Number, required: true }, // 1-12
  amount: { type: Number, required: true, default: 0 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  deletedAt: { type: Date, default: null },
}, { timestamps: true });

// Compound unique index (warehouse + year + month) ignoring soft-deleted docs
targetSchema.index({ warehouse: 1, year: 1, month: 1 }, { unique: true, partialFilterExpression: { deletedAt: null } });

module.exports = mongoose.model('Target', targetSchema);
