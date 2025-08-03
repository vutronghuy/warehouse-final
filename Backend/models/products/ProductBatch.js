const mongoose = require("mongoose");
const { Schema } = mongoose;

const productBatchSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    warehouseId: {
      type: Schema.Types.ObjectId,
      ref: "Warehouse",
      required: true,
    },
    batchNumber: { type: String, required: true, unique: true, trim: true },
    quantity: { type: Number, required: true, min: 0 },
    expiryDate: { type: Date },
    receivedDate: { type: Date, default: Date.now },
    importDetailId: { type: Schema.Types.ObjectId, ref: "ImportDetail" },
    status: {
      type: String,
      default: "active",
      enum: ["active", "expired", "recalled"],
    },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ProductBatch", productBatchSchema);
