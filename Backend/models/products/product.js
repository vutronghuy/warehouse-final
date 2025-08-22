const mongoose = require("mongoose");
const { Schema } = mongoose;

const productSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    sku: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    description: { type: String, trim: true },
    unit: {
      type: String,
      enum: ["pcs", "kg", "liter", "box", "pack"],
      required: true,
      trim: true
    },
    basePrice: { type: Number, default: 0, min: 0 },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },

    // Primary supplier (main supplier for this product)
    primarySupplierId: {
      type: Schema.Types.ObjectId,
      ref: "Supplier",
      required: true,
    },



    minStockLevel: { type: Number, default: 0, min: 0 },
    quantity: { type: Number, default: 0, min: 0 }, // Current stock quantity
    warehouseId: {
      type: Schema.Types.ObjectId,
      ref: "Warehouse",
      required: true
    }, // Product belongs to specific warehouse
    status: {
      type: String,
      default: "in stock",
      enum: [ "in stock", "out of stock"]
    },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Prevent overwrite error by checking if model already exists
module.exports = mongoose.models.Product || mongoose.model("Product", productSchema);
