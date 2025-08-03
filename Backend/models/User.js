const mongoose = require("mongoose");

// === Admin Schema ===
const AdminSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    fullName: { type: String, required: true },
    email: { type: String },
    role: { type: String, default: "admin" },
    isActive: { type: Boolean, default: true },
    mustChangePassword: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// === Manager Schema ===
const ManagerSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    fullName: { type: String, required: true },
    email: { type: String },
    warehouseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Warehouse",
      required: true,
    },
    role: { type: String, default: "manager" },
    isActive: { type: Boolean, default: true },
    mustChangePassword: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// === Staff Schema ===
const StaffSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    fullName: { type: String, required: true },
    email: { type: String },
    warehouseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Warehouse",
      required: true,
    },
    role: { type: String, default: "staff" },
    isActive: { type: Boolean, default: true },
    mustChangePassword: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// === Accounter Schema ===
const AccounterSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    fullName: { type: String, required: true },
    email: { type: String },
    role: { type: String, default: "accounter" },
    isActive: { type: Boolean, default: true },
    mustChangePassword: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const UserSchema = new mongoose.Schema(
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

// === Export model ===
const User = mongoose.model("Users", UserSchema);
module.exports = User;
