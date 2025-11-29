  const mongoose = require("mongoose");
  const { Schema } = mongoose;

  const inventorySchema = new Schema(
    {
      productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
      warehouseId: {
        type: Schema.Types.ObjectId,
        ref: "Warehouse",
        required: true,
      },
      quantity: { type: Number, default: 0, min: 0 },
      lastUpdated: { type: Date, default: Date.now },
      updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
    },
    { timestamps: false }
  );

  // Index để query nhanh
  inventorySchema.index({ productId: 1, warehouseId: 1 }, { unique: true });
  inventorySchema.index({ warehouseId: 1 });
  inventorySchema.index({ productId: 1 });
  inventorySchema.index({ lastUpdated: -1 });

  module.exports = mongoose.model("Inventory", inventorySchema);
