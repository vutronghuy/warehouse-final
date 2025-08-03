const mongoose = require("mongoose");
const { Schema } = mongoose;

const reservationSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    warehouseId: {
      type: Schema.Types.ObjectId,
      ref: "Warehouse",
      required: true,
    },
    quantity: { type: Number, required: true, min: 1 },
    reservedFor: { type: String, required: true, trim: true },
    orderReference: { type: String, trim: true },
    reservedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },
    status: {
      type: String,
      default: "active",
      enum: ["active", "fulfilled", "expired", "cancelled"],
    },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Reservation", reservationSchema);
