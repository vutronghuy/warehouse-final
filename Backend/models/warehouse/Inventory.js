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
      reservedQuantity: { type: Number, default: 0, min: 0 },
      lastUpdated: { type: Date, default: Date.now },
      updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
    },
    { timestamps: false }
  );

  // virtual
  inventorySchema.virtual("availableQuantity").get(function () {
    return this.quantity - this.reservedQuantity;
  });
  inventorySchema.index({ productId: 1, warehouseId: 1 }, { unique: true });

  module.exports = mongoose.model("Inventory", inventorySchema);
