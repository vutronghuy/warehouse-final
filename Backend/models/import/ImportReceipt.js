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
      required: false // Made optional for auto-generated import receipts
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

    status: {
      type: String,
      enum: ["created"],
      default: "created"
    },

    // Chi tiết các mặt hàng nhập
    details: [
      {
        productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
        quantity:  { type: Number, required: true, min: 1 },
        unitPrice: { type: Number, min: 0 },
        // Additional fields from Excel import
        productName: { type: String },
        productSku: { type: String },
        totalPrice: { type: Number, min: 0 },
        // Supplier information from Excel
        supplierId: { type: Schema.Types.ObjectId, ref: "Supplier", required: false },
        supplierName: { type: String }
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

    // Import metadata from Excel
    importMetadata: {
      fileName: { type: String },
      importDate: { type: Date },
      totalRows: { type: Number },
      successfulRows: { type: Number },
      failedRows: { type: Number },
      importedBy: { type: Schema.Types.ObjectId, ref: "User" }
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
