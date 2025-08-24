const mongoose = require("mongoose");
const { Schema } = mongoose;

const stockAdjustmentSchema = new Schema(
  {
    adjustmentNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    warehouseId: {
      type: Schema.Types.ObjectId,
      ref: "Warehouse",
      required: true,
    },
    oldQuantity: { type: Number, required: true, min: 0 },
    newQuantity: { type: Number, required: true, min: 0 },
    reason: { type: String, required: true, trim: true },
    notes: { type: String, trim: true },
    status: {
      type: String,
      default: "pending",
      enum: ["pending", "approved", "rejected"],
    },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    approvedBy: { type: Schema.Types.ObjectId, ref: "User" },
    approvedAt: { type: Date },
  },
  { timestamps: true }
);

stockAdjustmentSchema.virtual("adjustmentQuantity").get(function () {
  return this.newQuantity - this.oldQuantity;
});

module.exports = mongoose.model("StockAdjustment", stockAdjustmentSchema);
