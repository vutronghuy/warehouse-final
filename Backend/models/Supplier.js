// const mongoose = require("mongoose");
// const { Schema } = mongoose;

// const supplierSchema = new Schema(
//   {
//     name: { type: String, required: true, unique: true, trim: true },
//     phone: { type: String, trim: true },
//     email: {
//       type: String,
//       unique: true,
//       sparse: true,
//       lowercase: true,
//       trim: true,
//     },
//     address: { type: String, trim: true },
//     contactPerson: { type: String, trim: true },
//     status: { type: String, default: "active", enum: ["active", "inactive"] },
//     createdBy: { type: Schema.Types.ObjectId, ref: "User", required: false },
//     updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
//     deletedAt: { type: Date, default: null },
//   },
//   { timestamps: true }
// );

// module.exports = mongoose.model("Supplier", supplierSchema);
