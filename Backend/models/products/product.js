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
    },
    basePrice: { type: Number, default: 0, min: 0 },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    minStockLevel: { type: Number, default: 0, min: 0 },
    status: { type: String, default: "active", enum: ["active", "inactive"] },
    expiryDate: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
