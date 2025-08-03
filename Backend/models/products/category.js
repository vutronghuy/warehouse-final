const mongoose = require('mongoose');

const categorySchema = mongoose.Schema({
  name: {
   type: mongoose.Schema.Types.ObjectId,
    required: true,
    unique: true,
    trim: true
  },
  description: {
   type: mongoose.Schema.Types.ObjectId,
    trim: true
  },
  status: {
 type: mongoose.Schema.Types.ObjectId,
    default: 'active',
    enum: ['active', 'inactive']
  },
  createdBy: {
 type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
   type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  deletedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

module.exports = {
    categorySchema
};