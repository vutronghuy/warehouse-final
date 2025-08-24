const mongoose = require("mongoose");
const { Schema } = mongoose;

// Chi tiết sản phẩm trong phiếu xuất
const ExportItemSchema = new Schema({
  exportId: { 
    type: Schema.Types.ObjectId, 
    ref: "Export", 
    required: true 
  },
  productId: { 
    type: Schema.Types.ObjectId, 
    ref: "Product", 
    required: true 
  },
  quantity: { 
    type: Number, 
    required: true, 
    min: 1 
  },
  unitPrice: { 
    type: Number, 
    required: true, 
    min: 0 
  },
  totalPrice: { 
    type: Number, 
    required: true, 
    min: 0 
  },
  // Thông tin sản phẩm tại thời điểm xuất (snapshot)
  productSnapshot: {
    name: String,
    sku: String,
    unit: String,
    description: String
  }
}, { timestamps: true });

module.exports = mongoose.model("ExportItem", ExportItemSchema);
