const mongoose = require('mongoose');
const { Schema } = mongoose;

const AuditLogSchema = new mongoose.Schema({
    category: { 
      type: String, 
      enum: ['BUSINESS', 'SYSTEM'], 
      required: true 
    }, // phân biệt staff log vs super admin log
  
    action: { type: String, required: true }, // e.g. 'CREATE_INVOICE', 'CHANGE_ROLE'
    
    actor: {
      id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      email: String,
      name: String,
      role: String
    },
  
    target: {
      type: {
        type: String,   // e.g. 'Invoice', 'User', 'ExportSlip'
        required: true
      },
      id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
      }
    },
  
    before: mongoose.Schema.Types.Mixed,
    after: mongoose.Schema.Types.Mixed,
  
    reason: String,
    outcome: { type: String, enum: ['SUCCESS','FAILED'], default: 'SUCCESS' },
    error: String,
  
    meta: mongoose.Schema.Types.Mixed, // ip, userAgent, requestId, warehouseId, authMethod...
    
    createdAt: { type: Date, default: Date.now }
  });
  
  module.exports = mongoose.model('AuditLog', AuditLogSchema);
  