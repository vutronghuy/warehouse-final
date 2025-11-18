const mongoose = require("mongoose");
const { Schema } = mongoose;

const exportDetailSchema = new Schema(
  {
    receiptId: {
      type: Schema.Types.ObjectId,
      ref: "ExportReceipt",
      required: true,
    },
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    notes: { type: String, trim: true },
  },
  { timestamps: false }
);

exportDetailSchema.virtual("totalPrice").get(function () {
  return this.quantity * this.unitPrice;
});

module.exports = mongoose.model("ExportDetail", exportDetailSchema);
