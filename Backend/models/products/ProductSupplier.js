const mongoose = require("mongoose");
const { Schema } = mongoose;

const productSupplierSchema = new Schema(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    supplierId: {
      type: Schema.Types.ObjectId,
      ref: "Supplier",
      required: true,
    },
    
    // Thông tin specific cho supplier này
    supplierProductCode: {
      type: String,
      trim: true,
      // Mã sản phẩm của supplier (có thể khác với SKU)
    },
    supplierProductName: {
      type: String,
      trim: true,
      // Tên sản phẩm theo supplier (có thể khác)
    },
    
    // Thông tin kinh doanh
    leadTime: {
      type: Number,
      default: 0,
      min: 0,
      // Thời gian giao hàng (ngày)
    },
    minOrderQuantity: {
      type: Number,
      default: 1,
      min: 1,
      // Số lượng đặt hàng tối thiểu
    },
    maxOrderQuantity: {
      type: Number,
      min: 1,
      // Số lượng đặt hàng tối đa (nếu có)
    },
    
    // Thông tin giá (tham khảo)
    lastPurchasePrice: {
      type: Number,
      default: 0,
      min: 0,
      // Giá mua gần nhất (để tham khảo)
    },
    averagePrice: {
      type: Number,
      default: 0,
      min: 0,
      // Giá trung bình
    },
    
    // Thông tin chất lượng
    qualityRating: {
      type: Number,
      min: 1,
      max: 5,
      // Đánh giá chất lượng từ 1-5 sao
    },
    deliveryRating: {
      type: Number,
      min: 1,
      max: 5,
      // Đánh giá giao hàng từ 1-5 sao
    },
    
    // Trạng thái
    status: {
      type: String,
      enum: ["active", "inactive", "discontinued"],
      default: "active",
      // active: đang cung cấp
      // inactive: tạm ngưng
      // discontinued: ngưng cung cấp
    },
    
    // Ghi chú
    notes: {
      type: String,
      trim: true,
    },
    
    // Audit fields
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    
    // Thời gian bắt đầu/kết thúc hợp tác
    contractStartDate: Date,
    contractEndDate: Date,
    
    // Thống kê
    totalOrders: {
      type: Number,
      default: 0,
    },
    totalQuantityOrdered: {
      type: Number,
      default: 0,
    },
    lastOrderDate: Date,
  },
  { 
    timestamps: true,
    // Đảm bảo 1 supplier chỉ có 1 record cho 1 product
    indexes: [
      { productId: 1, supplierId: 1, unique: true }
    ]
  }
);

// Compound index để query nhanh
productSupplierSchema.index({ productId: 1, status: 1 });
productSupplierSchema.index({ supplierId: 1, status: 1 });

// Virtual để populate thông tin
productSupplierSchema.virtual('product', {
  ref: 'Product',
  localField: 'productId',
  foreignField: '_id',
  justOne: true
});

productSupplierSchema.virtual('supplier', {
  ref: 'Supplier',
  localField: 'supplierId', 
  foreignField: '_id',
  justOne: true
});

// Methods
productSupplierSchema.methods.updateStats = function(orderQuantity) {
  this.totalOrders += 1;
  this.totalQuantityOrdered += orderQuantity;
  this.lastOrderDate = new Date();
  return this.save();
};

// Static methods
productSupplierSchema.statics.getSuppliersByProduct = function(productId) {
  return this.find({ productId, status: 'active' })
    .populate('supplier', 'name code contactInfo')
    .sort({ qualityRating: -1, deliveryRating: -1 });
};

productSupplierSchema.statics.getProductsBySupplier = function(supplierId) {
  return this.find({ supplierId, status: 'active' })
    .populate('product', 'name sku unit categoryId')
    .sort({ lastOrderDate: -1 });
};

module.exports = mongoose.model("ProductSupplier", productSupplierSchema);
