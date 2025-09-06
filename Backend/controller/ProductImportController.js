// controller/ProductImportController.js
const Product = require("../models/products/product");
const Category = require("../models/products/CategoryNew");
const Supplier = require("../models/products/Supplier");
const User = require("../models/User");
const XLSX = require("xlsx");
const path = require("path");

// filesystem: synchronous helper and promises API
const fsSync = require("fs");
const fs = require("fs").promises;

exports.importProducts = async (req, res) => {
  const uploadedPath = req.file ? req.file.path : null;

  try {
    console.log("🔍 Import request from user:", {
      userId: req.user?.sub,
      role: req.user?.role,
      roleKey: req.user?.roleKey,
      isSuperAdmin: req.user?.isSuperAdmin,
    });

    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "No file uploaded" });
    }

    // Read workbook
    const fileBuffer = await fs.readFile(req.file.path);
    const workbook = XLSX.read(fileBuffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

    if (!data || data.length === 0) {
      // cleanup
      try {
        if (uploadedPath && fsSync.existsSync(uploadedPath))
          await fs.unlink(uploadedPath);
      } catch (e) {
        console.error("cleanup failed", e);
      }
      return res
        .status(400)
        .json({ success: false, message: "Excel file is empty or invalid" });
    }

    // Lookup categories & suppliers (maps)
    const categories = await Category.find({
      status: "active",
      deletedAt: null,
    }).lean();
    const suppliers = await Supplier.find({
      status: "cooperation",
      deletedAt: null,
    }).lean();
    const categoryMap = new Map(
      categories.map((c) => [String(c.name).toLowerCase(), c._id])
    );
    const supplierMap = new Map(
      suppliers.map((s) => [String(s.name).toLowerCase(), s._id])
    );

    // Get user once and determine warehouseId once
    const user = await User.findById(req.user.sub).lean();
    if (!user) {
      try {
        if (uploadedPath && fsSync.existsSync(uploadedPath))
          await fs.unlink(uploadedPath);
      } catch (e) {
        console.error("cleanup failed", e);
      }
      return res
        .status(400)
        .json({ success: false, message: "User not found in database" });
    }

    let warehouseId = null;
    const role = req.user.role;
    if (role === "staff" && user.staff?.warehouseId)
      warehouseId = user.staff.warehouseId;
    else if (role === "manager" && user.manager?.warehouseId)
      warehouseId = user.manager.warehouseId;
    else if (role === "accounter" && user.accounter?.warehouseId)
      warehouseId = user.accounter.warehouseId;
    else if (role === "admin" && user.admin?.managedWarehouses?.length > 0)
      warehouseId = user.admin.managedWarehouses[0];

    if (!warehouseId) {
      try {
        if (uploadedPath && fsSync.existsSync(uploadedPath))
          await fs.unlink(uploadedPath);
      } catch (e) {
        console.error("cleanup failed", e);
      }
      return res
        .status(400)
        .json({
          success: false,
          message: `User with role '${role}' is not assigned to any warehouse`,
        });
    }

    const results = {
      total: data.length,
      successful: 0,
      failed: 0,
      errors: [],
    };
    const validUnits = ["pcs", "kg", "liter", "box", "pack"];

    // Process rows
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNumber = i + 2;

      try {
        if (!row.name || !row.sku) {
          results.errors.push({
            row: rowNumber,
            message: "Name and SKU are required",
          });
          results.failed++;
          continue;
        }

        const skuVal = row.sku.toString().toUpperCase().trim();

        // TÌM product tồn tại cùng sku + warehouseId
        const existingProduct = await Product.findOne({
          sku: skuVal,
          warehouseId,
        }).lean();

        if (existingProduct) {
          // Quy tắc import: nếu trùng SKU trên cùng warehouse -> UPDATE (không tạo mới)
          // Cộng dồn quantity (nếu file cung cấp quantity), và cập nhật một số trường nếu có
          const addQty = Math.max(0, parseInt(row.quantity) || 0); // đảm bảo không âm

          // Chuẩn bị phần $set
          const setFields = {
            updatedAt: new Date(),
          };

          // Nếu có basePrice trong file và là số hợp lệ -> cập nhật
          if (row.basePrice !== undefined && row.basePrice !== "") {
            const bp = parseFloat(row.basePrice);
            if (!isNaN(bp)) setFields.basePrice = bp;
          }

          if (row.minStockLevel !== undefined && row.minStockLevel !== "") {
            const minS = parseInt(row.minStockLevel);
            if (!isNaN(minS)) setFields.minStockLevel = minS;
          }

          if (row.description !== undefined && row.description !== "") {
            setFields.description = String(row.description).trim();
          }

          // Nếu tên mới khác tên hiện có -> cập nhật tên (tuỳ bạn có muốn hay không)
          if (
            row.name &&
            String(row.name).trim() &&
            String(row.name).trim() !== existingProduct.name
          ) {
            setFields.name = String(row.name).trim();
          }

          // Build update object
          const updateOps = {};
          if (addQty > 0) updateOps.$inc = { quantity: addQty };
          if (Object.keys(setFields).length > 0) updateOps.$set = setFields;

          try {
            if (Object.keys(updateOps).length === 0) {
              // Không có gì để cập nhật -> vẫn coi là thành công (không thay đổi)
              results.updated = (results.updated || 0) + 1;
            } else {
              await Product.updateOne({ _id: existingProduct._id }, updateOps);
              results.updated = (results.updated || 0) + 1;
            }
          } catch (updErr) {
            console.error(
              `Update failed for SKU ${skuVal} (row ${rowNumber}):`,
              updErr
            );
            results.errors.push({
              row: rowNumber,
              message: updErr.message || "Update error",
            });
            results.failed++;
          }

          // skip tạo mới
          continue;
        }

        // validate unit
        const unit = row.unit ? row.unit.toLowerCase() : "pcs";
        if (row.unit && !validUnits.includes(unit)) {
          results.errors.push({
            row: rowNumber,
            message: `Invalid unit "${row.unit}". Valid: ${validUnits.join(
              ", "
            )}`,
          });
          results.failed++;
          continue;
        }

        // category lookup
        let categoryId = null;
        if (row.category) {
          categoryId = categoryMap.get(String(row.category).toLowerCase());
          if (!categoryId) {
            results.errors.push({
              row: rowNumber,
              message: `Category "${row.category}" not found`,
            });
            results.failed++;
            continue;
          }
        }

        // supplier lookup
        let primarySupplierId = null;
        if (row.primarySupplier) {
          primarySupplierId = supplierMap.get(
            String(row.primarySupplier).toLowerCase()
          );
          if (!primarySupplierId) {
            results.errors.push({
              row: rowNumber,
              message: `Supplier "${row.primarySupplier}" not found`,
            });
            results.failed++;
            continue;
          }
        }

        // prepare product doc
        const productData = {
          name: String(row.name).trim(),
          sku: skuVal,
          description: row.description ? String(row.description).trim() : "",
          unit,
          basePrice: parseFloat(row.basePrice) || 0,
          minStockLevel: parseInt(row.minStockLevel) || 0,
          quantity: parseInt(row.quantity) || 0,
          warehouseId,
          categoryId,
          primarySupplierId,
          status: "in stock",
          createdBy: req.user.sub,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const product = new Product(productData);
        try {
          await product.save();
          results.successful++;
        } catch (saveErr) {
          if (saveErr && saveErr.code === 11000) {
            results.errors.push({
              row: rowNumber,
              message: `Duplicate SKU "${skuVal}" in this warehouse (DB constraint)`,
            });
          } else {
            results.errors.push({
              row: rowNumber,
              message: saveErr.message || "Save error",
            });
          }
          results.failed++;
        }
      } catch (rowErr) {
        console.error(`Error processing row ${rowNumber}:`, rowErr);
        results.errors.push({
          row: rowNumber,
          message: rowErr.message || "Unknown error",
        });
        results.failed++;
      }
    }

    // cleanup uploaded file
    try {
      if (uploadedPath && fsSync.existsSync(uploadedPath))
        await fs.unlink(uploadedPath);
    } catch (unlinkErr) {
      console.error("Failed to remove uploaded file:", unlinkErr);
    }

    return res.json({
      success: true,
      message: `Import completed. ${results.successful} products imported successfully, ${results.failed} failed.`,
      ...results,
    });
  } catch (error) {
    console.error("Import error:", error && error.stack ? error.stack : error);

    // cleanup on global error
    try {
      if (uploadedPath && fsSync.existsSync(uploadedPath))
        await fs.unlink(uploadedPath);
    } catch (e) {
      console.error("Failed cleanup after error:", e);
    }

    return res
      .status(500)
      .json({
        success: false,
        message: "Failed to import products",
        error: error.message || "Internal server error",
      });
  }
};
// (Optional) keep your template generator function below if present in the same file
exports.generateTemplate = async (req, res) => {
  try {
    const categories = await Category.find({
      status: "active",
      deletedAt: null,
    }).select("name");
    const suppliers = await Supplier.find({
      status: "cooperation",
      deletedAt: null,
    }).select("name");

    const sampleData = [
      {
        name: "Sample Product 1",
        sku: "SP001",
        description: "This is a sample product description",
        unit: "pcs",
        basePrice: 10.5,
        quantity: 100,
        category: categories.length > 0 ? categories[0].name : "Electronics",
        primarySupplier:
          suppliers.length > 0 ? suppliers[0].name : "Sample Supplier",
        minStockLevel: 10,
      },
    ];

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    XLSX.utils.book_append_sheet(workbook, worksheet, "Products");

    const categoriesSheet = XLSX.utils.json_to_sheet(
      categories.map((cat) => ({ name: cat.name }))
    );
    XLSX.utils.book_append_sheet(workbook, categoriesSheet, "Categories");

    const suppliersSheet = XLSX.utils.json_to_sheet(
      suppliers.map((sup) => ({ name: sup.name }))
    );
    XLSX.utils.book_append_sheet(workbook, suppliersSheet, "Suppliers");

    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=product_import_template.xlsx"
    );
    res.setHeader("Content-Length", buffer.length);

    res.send(buffer);
  } catch (error) {
    console.error("Template generation error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate template",
      error: error.message,
    });
  }
};
