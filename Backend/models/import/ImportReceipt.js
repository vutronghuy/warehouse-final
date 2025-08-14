const mongoose = require("mongoose");
const { Schema } = mongoose;

const ImportReceiptSchema = new Schema(
  {
    receiptNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    supplierId: {
      type: Schema.Types.ObjectId,
      ref: "Supplier",
      required: true
    },
    warehouseId: {
      type: Schema.Types.ObjectId,
      ref: "Warehouse",
      required: true
    },

    // Staff tạo phiếu
    createdByStaff: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    // Manager review
    managerReview: {
      reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
      reviewedAt: { type: Date },
      comment:    { type: String, trim: true }
    },

    // Admin nhỏ duyệt (chỉ admin quản lý warehouse này mới có thể duyệt)
    adminApproval: {
      approvedBy: { type: Schema.Types.ObjectId, ref: "User" },
      approvedAt: { type: Date },
      comment:    { type: String, trim: true }
    },

    // Accounter xác nhận (chỉ accounter của warehouse này mới có thể xác nhận)
    accounterConfirmation: {
      confirmedBy: { type: Schema.Types.ObjectId, ref: "User" },
      confirmedAt: { type: Date },
      comment:    { type: String, trim: true }
    },

    status: {
      type: String,
      enum: ["created", "reviewed", "approved", "confirmed", "rejected"],
      default: "created"
    },

    // Chi tiết các mặt hàng nhập
    details: [
      {
        productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
        quantity:  { type: Number, required: true, min: 1 },
        unitPrice: { type: Number, min: 0 }
      }
    ],

    totalAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    notes: {
      type: String,
      trim: true
    },

    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User"
    },
    deletedAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("ImportReceipt", ImportReceiptSchema);
