const mongoose = require("mongoose");
const { Schema } = mongoose;
const applyUserMethods = require("./userMethods");

// --- Admin subdoc ---
const AdminSchema = new Schema(
  {
    username: { type: String, required: true },
    password: {
      type: String,
      required: function() {
        // Password chỉ required khi tạo mới, không cho phép update qua edit
        return this.isNew;
      }
    },
    fullName: { type: String, required: true },
    email: { type: String },
    role: { type: String, default: "admin" },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    isActive: { type: Boolean, default: true },
    isSuperAdmin: { type: Boolean, default: false },
    resetToken: { type: String, select: false },
    resetTokenExpires: { type: Date },
    resetRequestId: { type: Schema.Types.ObjectId, ref: "PasswordResetRequest" },
    lastPasswordChangeAt: { type: Date },
    resetCount: { type: Number, default: 0 },
    lastResetAt: { type: Date },

    // admin quản lý nhiều kho (mảng ObjectId)
    managedWarehouses: [{ type: Schema.Types.ObjectId, ref: "Warehouse" }],

    // admin quản lý tất cả manager/staff/accounter thuộc các kho trên
    managedManagers: [{ type: Schema.Types.ObjectId, ref: "User" }], // user docs where role='manager'
    managedStaff: [{ type: Schema.Types.ObjectId, ref: "User" }],    // user docs where role='staff'
    managedAccounters: [{ type: Schema.Types.ObjectId, ref: "User" }], // user docs where role='accounter'

    // Audit fields
    deactivatedBy: { type: Schema.Types.ObjectId, ref: "User" },
    deactivatedAt: { type: Date },
    deactivationReason: { type: String },
    reactivatedBy: { type: Schema.Types.ObjectId, ref: "User" },
    reactivatedAt: { type: Date },
  },
  { _id: false }
);

// ensure only one super-admin if used
AdminSchema.index(
  { isSuperAdmin: 1 },
  { unique: true, partialFilterExpression: { isSuperAdmin: true } }
);

// --- Manager subdoc ---
const ManagerSchema = new Schema(
  {
    username: { type: String, required: true },
    password: {
      type: String,
      required: function() {
        return this.isNew;
      }
    },
    fullName: { type: String, required: true },
    email: { type: String },
    warehouseId: { type: Schema.Types.ObjectId, ref: "Warehouse", required: true },
    role: { type: String, default: "manager" },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    isActive: { type: Boolean, default: true },
    resetToken: { type: String, select: false },
    resetTokenExpires: { type: Date },
    resetRequestId: { type: Schema.Types.ObjectId, ref: "PasswordResetRequest" },
    lastPasswordChangeAt: { type: Date },
    resetCount: { type: Number, default: 0 },
    lastResetAt: { type: Date },

    // danh sách staff (User._id) do manager quản lý
    staffIds: [{ type: Schema.Types.ObjectId, ref: "User" }],

    // Audit
    deactivatedBy: { type: Schema.Types.ObjectId, ref: "User" },
    deactivatedAt: { type: Date },
    deactivationReason: { type: String },
    reactivatedBy: { type: Schema.Types.ObjectId, ref: "User" },
    reactivatedAt: { type: Date },
  },
  { _id: false }
);

// --- Staff subdoc ---
const StaffSchema = new Schema(
  {
    username: { type: String, required: true },
    password: {
      type: String,
      required: function() {
        return this.isNew;
      }
    },
    fullName: { type: String, required: true },
    email: { type: String },
    warehouseId: { type: Schema.Types.ObjectId, ref: "Warehouse", required: true },

    // staff biết manager của mình (tham chiếu tới User._id có role='manager')
    managerId: { type: Schema.Types.ObjectId, ref: "User" },

    role: { type: String, default: "staff" },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    isActive: { type: Boolean, default: true },
    resetToken: { type: String, select: false },
    resetTokenExpires: { type: Date },
    resetRequestId: { type: Schema.Types.ObjectId, ref: "PasswordResetRequest" },
    lastPasswordChangeAt: { type: Date },
    resetCount: { type: Number, default: 0 },
    lastResetAt: { type: Date },

    // Audit
    deactivatedBy: { type: Schema.Types.ObjectId, ref: "User" },
    deactivatedAt: { type: Date },
    deactivationReason: { type: String },
    reactivatedBy: { type: Schema.Types.ObjectId, ref: "User" },
    reactivatedAt: { type: Date },
  },
  { _id: false }
);

// --- Accounter subdoc ---
const AccounterSchema = new Schema(
  {
    username: { type: String, required: true },
    password: {
      type: String,
      required: function() {
        return this.isNew;
      }
    },
    fullName: { type: String, required: true },
    email: { type: String },
    warehouseId: { type: Schema.Types.ObjectId, ref: "Warehouse", required: true }, // Thêm warehouseId
    role: { type: String, default: "accounter" },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    isActive: { type: Boolean, default: true },
    resetToken: { type: String, select: false },
    resetTokenExpires: { type: Date },
    resetRequestId: { type: Schema.Types.ObjectId, ref: "PasswordResetRequest" },
    lastPasswordChangeAt: { type: Date },
    resetCount: { type: Number, default: 0 },
    lastResetAt: { type: Date },
    deactivatedBy: { type: Schema.Types.ObjectId, ref: "User" },
    deactivatedAt: { type: Date },
    deactivationReason: { type: String },
    reactivatedBy: { type: Schema.Types.ObjectId, ref: "User" },
    reactivatedAt: { type: Date },
  },
  { _id: false }
);

const UserSchema = new Schema(
  {
    role: {
      type: String,
      enum: ["admin", "manager", "staff", "accounter"],
      required: true,
    },
    admin: { type: AdminSchema },
    manager: { type: ManagerSchema },
    staff: { type: StaffSchema },
    accounter: { type: AccounterSchema },
  },
  { timestamps: true }
);


applyUserMethods(UserSchema);

module.exports = mongoose.model("User", UserSchema);
