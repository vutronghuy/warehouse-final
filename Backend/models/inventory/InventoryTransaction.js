const mongoose = require("mongoose");
const { Schema } = mongoose;

const inventoryTransactionSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    warehouseId: {
      type: Schema.Types.ObjectId,
      ref: "Warehouse",
      required: true,
    },
    transactionType: {
      type: String,
      required: true,
      enum: ["import", "export", "adjustment", "reservation", "release"],
    },
    referenceId: { type: String, trim: true },
    quantityChange: { type: Number, required: true },
    quantityBefore: { type: Number, required: true, min: 0 },
    quantityAfter: { type: Number, required: true, min: 0 },
    batchNumber: { type: String, trim: true },
    notes: { type: String, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

module.exports = mongoose.model(
  "InventoryTransaction",
  inventoryTransactionSchema
);
