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
    basePrice: { type: Number, default: 0, min: 0 }, // Giá gốc khi import
    priceMarkupPercent: { type: Number, default: 0, min: 0, max: 1000 }, // % markup giá
    finalPrice: { type: Number, default: 0, min: 0 }, // Giá cuối cùng sau khi tính %
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

// Pre-save middleware to calculate finalPrice
productSchema.pre('save', function(next) {
  // Calculate final price based on base price and markup percentage
  if (this.basePrice !== undefined && this.priceMarkupPercent !== undefined) {
    this.finalPrice = this.basePrice + (this.basePrice * this.priceMarkupPercent / 100);
  }
  next();
});

// Pre-update middleware for findOneAndUpdate, updateOne, updateMany
productSchema.pre(['findOneAndUpdate', 'updateOne', 'updateMany'], function(next) {
  const update = this.getUpdate();

  // Handle different update formats
  const updateData = update.$set || update;

  if (updateData.basePrice !== undefined || updateData.priceMarkupPercent !== undefined) {
    // If we're updating basePrice or markup, we need to recalculate finalPrice
    // For bulk operations, we'll handle this in the controller
    if (updateData.basePrice !== undefined && updateData.priceMarkupPercent !== undefined) {
      updateData.finalPrice = updateData.basePrice + (updateData.basePrice * updateData.priceMarkupPercent / 100);
    }
  }

  next();
});

// Prevent overwrite error by checking if model already exists
module.exports = mongoose.models.Product || mongoose.model("Product", productSchema);
