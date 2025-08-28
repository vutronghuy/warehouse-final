const mongoose = require('mongoose');
const { Schema } = mongoose;

const customerSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  status: {
    type: String,
    default: 'active',
    enum: ['active', 'inactive']
  },
  notes: {
    type: String,
    trim: true
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  deletedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Indexes
customerSchema.index({ phone: 1 });
customerSchema.index({ name: 1 });
customerSchema.index({ status: 1 });
customerSchema.index({ deletedAt: 1 });

// Static methods
customerSchema.statics.getActiveCustomers = function() {
  return this.find({ status: 'active', deletedAt: null })
    .sort({ name: 1 });
};

// Instance methods
customerSchema.methods.softDelete = function(userId) {
  this.deletedAt = new Date();
  this.updatedBy = userId;
  return this.save();
};

customerSchema.methods.restore = function(userId) {
  this.deletedAt = null;
  this.updatedBy = userId;
  return this.save();
};

module.exports = mongoose.model("Customer", customerSchema);
