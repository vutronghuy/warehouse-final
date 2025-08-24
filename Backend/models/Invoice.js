const mongoose = require("mongoose");
const { Schema } = mongoose;

const InvoiceSchema = new Schema(
  {
    // Invoice Number - tự động tạo theo format INV-YYYY-MM-DD-XXXX
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },

    // Liên kết với Export Receipt
    exportReceiptId: {
      type: Schema.Types.ObjectId,
      ref: "ExportReceipt",
      required: true
    },

    // Thông tin khách hàng (copy từ Export Receipt)
    customerName: {
      type: String,
      required: true,
      trim: true
    },
    customerAddress: {
      type: String,
      trim: true
    },
    customerPhone: {
      type: String,
      trim: true
    },

    // Điều kiện thanh toán
    paymentCondition: {
      type: String,
      enum: ["cash", "net15", "net30", "net45", "net60"],
      default: "net30",
      required: true
    },

    // Tiền tệ
    currency: {
      type: String,
      enum: ["VND", "USD", "EUR"],
      default: "VND",
      required: true
    },

    // Ngày phát hành
    issueDate: {
      type: Date,
      required: true,
      default: Date.now
    },

    // Ngày đến hạn thanh toán (tự động tính dựa trên paymentCondition)
    dueDate: {
      type: Date,
      required: true
    },

    // Ghi chú
    note: {
      type: String,
      trim: true
    },

    // Warehouse liên quan
    warehouseId: {
      type: Schema.Types.ObjectId,
      ref: "Warehouse",
      required: true
    },

    // Staff tạo invoice
    createdByStaff: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    // Accounter review và duyệt
    accounterReview: {
      reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
      reviewedAt: { type: Date },
      comment: { type: String, trim: true }
    },

    // Trạng thái invoice
    status: {
      type: String,
      enum: ["draft", "pending_review", "approved", "rejected", "paid"],
      default: "draft"
    },

    // Chi tiết sản phẩm (copy từ Export Receipt)
    details: [
      {
        productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
        productName: { type: String, required: true },
        quantity: { type: Number, required: true, min: 1 },
        unitPrice: { type: Number, required: true, min: 0 },
        totalPrice: { type: Number, required: true, min: 0 }
      }
    ],

    // Tổng tiền
    totalAmount: {
      type: Number,
      required: true,
      min: 0
    },

    // Thuế VAT (%)
    vatRate: {
      type: Number,
      default: 10,
      min: 0,
      max: 100
    },

    // Tiền thuế
    vatAmount: {
      type: Number,
      default: 0,
      min: 0
    },

    // Tổng tiền sau thuế
    finalAmount: {
      type: Number,
      required: true,
      min: 0
    },

    // Audit fields
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
    deletedAt: { type: Date, default: null }
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Pre-save middleware để tự động tính toán dueDate
InvoiceSchema.pre('save', function(next) {
  if (this.isNew || this.isModified('issueDate') || this.isModified('paymentCondition')) {
    const issueDate = new Date(this.issueDate);
    let daysToAdd = 0;
    
    switch (this.paymentCondition) {
      case 'cash':
        daysToAdd = 0;
        break;
      case 'net15':
        daysToAdd = 15;
        break;
      case 'net30':
        daysToAdd = 30;
        break;
      case 'net45':
        daysToAdd = 45;
        break;
      case 'net60':
        daysToAdd = 60;
        break;
      default:
        daysToAdd = 30;
    }
    
    this.dueDate = new Date(issueDate.getTime() + (daysToAdd * 24 * 60 * 60 * 1000));
  }
  
  // Tự động tính toán VAT và final amount
  if (this.isModified('totalAmount') || this.isModified('vatRate')) {
    this.vatAmount = (this.totalAmount * this.vatRate) / 100;
    this.finalAmount = this.totalAmount + this.vatAmount;
  }
  
  next();
});

// Static method để tạo invoice number
InvoiceSchema.statics.generateInvoiceNumber = async function() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  
  const prefix = `INV-${year}-${month}-${day}`;
  
  // Tìm invoice cuối cùng trong ngày
  const lastInvoice = await this.findOne({
    invoiceNumber: { $regex: `^${prefix}` }
  }).sort({ invoiceNumber: -1 });
  
  let sequence = 1;
  if (lastInvoice) {
    const lastSequence = parseInt(lastInvoice.invoiceNumber.split('-').pop());
    sequence = lastSequence + 1;
  }
  
  return `${prefix}-${String(sequence).padStart(4, '0')}`;
};

// Index cho performance
InvoiceSchema.index({ invoiceNumber: 1 });
InvoiceSchema.index({ exportReceiptId: 1 });
InvoiceSchema.index({ warehouseId: 1 });
InvoiceSchema.index({ createdByStaff: 1 });
InvoiceSchema.index({ status: 1 });
InvoiceSchema.index({ issueDate: -1 });
InvoiceSchema.index({ dueDate: 1 });

module.exports = mongoose.model("Invoice", InvoiceSchema);
