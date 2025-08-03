const mongoose = require("mongoose");
const { Schema } = mongoose;

const importReceiptSchema = new Schema(
  {
    receiptNumber: { type: String, required: true, unique: true, trim: true },
    supplierId: {
      type: Schema.Types.ObjectId,
      ref: "Supplier",
      required: true,
    },
    warehouseId: {
      type: Schema.Types.ObjectId,
      ref: "Warehouse",
      required: true,
    },
    totalAmount: { type: Number, default: 0, min: 0 },
    notes: { type: String, trim: true },
    status: {
      type: String,
      default: "pending",
      enum: ["pending", "completed", "cancelled"],
    },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ImportReceipt", importReceiptSchema);
