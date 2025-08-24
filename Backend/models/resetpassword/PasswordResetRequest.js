// models/PasswordResetRequest.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const PasswordResetRequestSchema = new Schema({
  userId:     { type: Schema.Types.ObjectId, ref: 'User', required: true },
  roleKey:    { type: String, enum: ['admin','manager','staff','accounter'], required: true },
  email:      { type: String, required: true },
  otpHash:    { type: String, required: true }, // hashed OTP
  used:       { type: Boolean, default: false },
  expiresAt:  { type: Date, required: true },
  createdAt:  { type: Date, default: Date.now }
});

PasswordResetRequestSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // optional TTL cleanup

module.exports = mongoose.model('PasswordResetRequest', PasswordResetRequestSchema);
