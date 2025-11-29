const mongoose = require("mongoose");
const { Schema } = mongoose;

const supplierSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
  
    },
    
    // Contact Information
    contactInfo: {
      email: {
        type: String,
        trim: true,
        lowercase: true,
      },
      phone: {
        type: String,
        trim: true,
      },
      address: {
        street: String,
        city: String,
        state: String,
        country: String,
        zipCode: String,
      },
      website: String,
    },
    
    // Business Information
    businessInfo: {
      taxId: String,
      businessLicense: String,
      businessType: {
        type: String,
        enum: ["manufacturer", "distributor", "retailer", "wholesaler"],
      },
      establishedYear: Number,
    },
    
    // Contact Person
    contactPerson: {
      name: String,
      title: String,
      email: String,
      phone: String,
    },
    
    // Business Terms
    paymentTerms: {
      type: String,
      enum: ["cash", "net15", "net30", "net45", "net60"],
      default: "net30",
    },
    creditLimit: {
      type: Number,
      default: 0,
      min: 0,
    },
    currency: {
      type: String,
      default: "VND",
    },
    
    // Performance Metrics - Rating removed
    
    // Status
    status: {
      type: String,
      enum: ["cooperation", "stop cooperation"],
      default: "cooperation",
    },
    
    // Notes
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
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { 
    timestamps: true,
  }
);

// Indexes - code index is automatically created by unique: true


// Virtual for products count
supplierSchema.virtual('productsCount', {
  ref: 'ProductSupplier',
  localField: '_id',
  foreignField: 'supplierId',
  count: true
});

// Methods - Rating methods removed

// Query middleware to exclude soft-deleted records by default
supplierSchema.pre(/^find/, function (next) {
  // Only exclude deleted records if deletedAt is not explicitly queried
  if (this.getQuery().deletedAt === undefined) {
    this.where({ deletedAt: null });
  }
  next();
});

// Static methods
supplierSchema.statics.getActiveSuppliers = function() {
  return this.find({ status: 'cooperation', deletedAt: null })
    .sort({ name: 1 });
};

// getTopRatedSuppliers method removed since rating is no longer available

module.exports = mongoose.model("Supplier", supplierSchema);
