const mongoose = require("mongoose");
const { Schema } = mongoose;

const importDetailSchema = new Schema(
  {
    receiptId: {
      type: Schema.Types.ObjectId,
      ref: "ImportReceipt",
      required: true,
    },
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    batchNumber: { type: String, trim: true },
    expiryDate: { type: Date },
    notes: { type: String, trim: true },
  },
  { timestamps: false }
);

importDetailSchema.virtual("totalPrice").get(function () {
  return this.quantity * this.unitPrice;
});

module.exports = mongoose.model("ImportDetail", importDetailSchema);
