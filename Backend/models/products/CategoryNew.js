const mongoose = require('mongoose');
const { Schema } = mongoose;

const categorySchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  description: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    default: 'active',
    enum: ['active', 'inactive']
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
categorySchema.index({ code: 1 });
categorySchema.index({ status: 1 });

// Virtual for products count - Disabled until Product model is available
// categorySchema.virtual('productsCount', {
//   ref: 'Product',
//   localField: '_id',
//   foreignField: 'categoryId',
//   count: true
// });

// Static methods
categorySchema.statics.getActiveCategories = function() {
  return this.find({ status: 'active', deletedAt: null })
    .sort({ name: 1 });
};

module.exports = mongoose.model("Category", categorySchema);
