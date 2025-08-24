const mongoose = require('mongoose');
const { Schema } = mongoose;

const warehouseSchema = new Schema({
  name:      { type: String, required: true, unique: true, trim: true },
  location:  { type: String, required: true, trim: true },
  managerId: { type: Schema.Types.ObjectId, ref: 'User' },
  staffIds:  [{ type: Schema.Types.ObjectId, ref: 'User' }],
  adminId:   { type: Schema.Types.ObjectId, ref: 'User' },
  accounterId: { type: Schema.Types.ObjectId, ref: 'User' },
  status:    { type: String, default: 'active', enum: ['active','inactive'] },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  deletedAt: { type: Date, default: null }
}, { timestamps: true });

// Static method to sync warehouse staff from User collection
warehouseSchema.statics.syncStaffFromUsers = async function() {
  try {
    const User = require('../User');
    const warehouses = await this.find({ deletedAt: null });

    console.log(`🔄 Syncing staff for ${warehouses.length} warehouses...`);

    for (const warehouse of warehouses) {
      // Find manager
      const manager = await User.findOne({
        'manager.warehouseId': warehouse._id,
        'manager.status': 'active'
      }).select('_id');

      // Find admin (check managedWarehouses array)
      const admin = await User.findOne({
        role: 'admin',
        'admin.managedWarehouses': { $in: [warehouse._id] },
        'admin.status': 'active'
      }).select('_id');

      // Find accounter
      const accounter = await User.findOne({
        'accounter.warehouseId': warehouse._id,
        'accounter.status': 'active'
      }).select('_id');

      // Find staff members
      const staffMembers = await User.find({
        'staff.warehouseId': warehouse._id,
        'staff.status': 'active'
      }).select('_id');

      // Update warehouse with actual user IDs
      await this.findByIdAndUpdate(warehouse._id, {
        managerId: manager ? manager._id : null,
        adminId: admin ? admin._id : null,
        accounterId: accounter ? accounter._id : null,
        staffIds: staffMembers.map(s => s._id)
      });

      console.log(`✅ Synced warehouse ${warehouse.name}: Manager=${!!manager}, Admin=${!!admin}, Accounter=${!!accounter}, Staff=${staffMembers.length}`);
    }

    console.log('🎉 All warehouses synced!');
  } catch (error) {
    console.error('❌ Error syncing warehouse staff:', error);
  }
};

module.exports = mongoose.model('Warehouse', warehouseSchema);
