const mongoose = require('mongoose');
const { Schema } = mongoose;

const warehouseSchema = new Schema({
  name:      { type: String, required: true, unique: true, trim: true },
  location:  { type: String, required: true, trim: true },
  managerId: { type: Schema.Types.ObjectId, ref: 'User' },
  staffIds:  [{ type: Schema.Types.ObjectId, ref: 'User' }],
  adminId:   { type: Schema.Types.ObjectId, ref: 'User' },
  accounterId: { type: Schema.Types.ObjectId, ref: 'User' }, // Thêm accounter cho warehouse
  status:    { type: String, default: 'active', enum: ['active','inactive'] },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  deletedAt: { type: Date, default: null }
}, { timestamps: true });

module.exports = mongoose.model('Warehouse', warehouseSchema);
