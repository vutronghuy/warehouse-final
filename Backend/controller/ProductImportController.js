const XLSX = require("xlsx");
const fs = require("fs").promises;
const fsSync = require("fs");
const Product = require("../models/products/product");
const Category = require("../models/products/CategoryNew");
const Supplier = require("../models/products/Supplier");
const User = require("../models/User");
const ImportReceipt = require("../models/import/ImportReceipt");
const mongoose = require("mongoose");
const AuditService = require("../services/auditService");

// --- Counter model for atomic receipt sequence (keeps in this file for convenience) ---
let ImportCounter;
try {
  ImportCounter = mongoose.model("ImportCounter");
} catch (e) {
  const counterSchema = new mongoose.Schema({
    key: { type: String, required: true, unique: true },
    seq: { type: Number, default: 0 },
  });
  ImportCounter = mongoose.model("ImportCounter", counterSchema);
}

// Helper function to generate receipt number (atomic)
const generateImportReceiptNumber = async () => {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "");
  const prefix = `IMP${dateStr}`;

  // Atomic increment to avoid race conditions
  const counter = await ImportCounter.findOneAndUpdate(
    { key: prefix },
    { $inc: { seq: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  const sequence = counter.seq || 1;
  return `${prefix}${String(sequence).padStart(4, "0")}`;
};

exports.importProducts = async (req, res) => {
  const uploadedPath = req.file ? req.file.path : null;

  // Prices will be stored in USD as entered in Excel
  console.log("💰 Import prices will be stored in USD");

  try {
    console.log("🔍 Import request from user:", {
      userId: req.user?.sub,
      role: req.user?.role,
      roleKey: req.user?.roleKey,
      isSuperAdmin: req.user?.isSuperAdmin,
    });

    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    const fileBuffer = await fs.readFile(uploadedPath);
    const workbook = XLSX.read(fileBuffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

    if (!data || data.length === 0) {
      // cleanup
      try {
        if (uploadedPath && fsSync.existsSync(uploadedPath)) await fs.unlink(uploadedPath);
      } catch (e) {
        console.error("cleanup failed", e);
      }
      return res.status(400).json({ success: false, message: "Excel file is empty or invalid" });
    }

    console.log(`📊 Processing ${data.length} rows from Excel`);

    // Get user and warehouse info
    const user = await User.findById(req.user.sub).lean();
    if (!user) {
      try {
        if (uploadedPath && fsSync.existsSync(uploadedPath)) await fs.unlink(uploadedPath);
      } catch (e) {
        console.error("cleanup failed", e);
      }
      return res.status(400).json({ success: false, message: "User not found in database" });
    }

    const role = req.user.roleKey;
    let warehouseId = null;

    if (role === "staff" && user.staff?.warehouseId) warehouseId = user.staff.warehouseId;
    else if (role === "accounter" && user.accounter?.warehouseId) warehouseId = user.accounter.warehouseId;
    else if (role === "admin" && user.admin?.managedWarehouses?.length > 0)
      warehouseId = user.admin.managedWarehouses[0];

    if (!warehouseId) {
      try {
        if (uploadedPath && fsSync.existsSync(uploadedPath)) await fs.unlink(uploadedPath);
      } catch (e) {
        console.error("cleanup failed", e);
      }
      return res.status(400).json({
        success: false,
        message: "No warehouse assigned to user",
      });
    }

    console.log(`🏢 Using warehouse: ${warehouseId}`);

    // Initialize results
    const results = {
      total: data.length,
      successful: 0,
      failed: 0,
      updated: 0,
      errors: [],
    };

    const importedProducts = [];

    // Process each row
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

        const skuVal = String(row.sku).toUpperCase().trim();
        const batchValue = row.productBatch ? String(row.productBatch).trim() : '';
        
        // Determine the actual SKU to use: if batch exists, use SKU-Batch format
        // This allows multiple products with same base SKU but different batches
        const actualSku = batchValue ? `${skuVal}-${batchValue}` : skuVal;

        // Check if product exists with this SKU (including batch suffix)
        // This allows multiple products with same base SKU but different batches
        const existingProduct = await Product.findOne({
          sku: actualSku,
          warehouseId,
        }).lean();

        // Resolve categoryId for this row (try find by name, else create or fallback)
        let categoryIdForRow = null;
        const categoryNameRaw = row.category ? String(row.category).trim() : "";
        if (categoryNameRaw) {
          const foundCat = await Category.findOne({
            name: { $regex: new RegExp(`^${categoryNameRaw}$`, "i") },
            status: "active",
            deletedAt: null,
          }).lean();

          if (foundCat) {
            categoryIdForRow = foundCat._id;
            // console.log(`Found category: ${foundCat.name}`);
          } else {
            // Attempt to create category automatically (if you don't want auto-create, change this behavior)
            try {
              const newCat = new Category({
                name: categoryNameRaw,
                status: "active",
                createdBy: req.user.sub,
                createdAt: new Date(),
              });
              await newCat.save();
              categoryIdForRow = newCat._id;
              console.log(`🆕 Created category from Excel: ${categoryNameRaw} (${categoryIdForRow})`);
            } catch (catErr) {
              console.warn(`⚠️ Could not create category "${categoryNameRaw}":`, catErr.message);
              categoryIdForRow = null;
            }
          }
        } else {
          // If no category provided, try to find or create 'Uncategorized' fallback
          const unc = await Category.findOne({
            name: { $regex: /^uncategorized$/i },
            status: "active",
            deletedAt: null,
          }).lean();
          if (unc) categoryIdForRow = unc._id;
          else {
            try {
              const newUnc = new Category({
                name: "Uncategorized",
                status: "active",
                createdBy: req.user.sub,
                createdAt: new Date(),
              });
              await newUnc.save();
              categoryIdForRow = newUnc._id;
              console.log(`🆕 Created fallback category "Uncategorized" (${categoryIdForRow})`);
            } catch (uncErr) {
              console.warn('⚠️ Could not create fallback "Uncategorized":', uncErr.message);
              categoryIdForRow = null;
            }
          }
        }

        if (existingProduct) {
          // Product with same SKU-Batch exists, update it
          const addQty = Math.max(0, parseInt(row.quantity) || 0);
          const setFields = { updatedAt: new Date() };

          if (row.basePrice !== undefined && row.basePrice !== "") {
            const bp = parseFloat(row.basePrice);
            if (!isNaN(bp)) setFields.basePrice = bp;
          }

          // If categoryId resolved from Excel, set it on update
          if (categoryIdForRow) {
            setFields.categoryId = categoryIdForRow;
          }

          // Ensure batch is set
          if (batchValue) {
            setFields.productBatch = batchValue;
          }

          const updateOps = {};
          if (addQty > 0) updateOps.$inc = { quantity: addQty };
          if (Object.keys(setFields).length > 0) updateOps.$set = setFields;

          if (Object.keys(updateOps).length > 0) {
            await Product.updateOne({ _id: existingProduct._id }, updateOps);
          }

          results.updated = (results.updated || 0) + 1;

          // Find supplier from Excel data for import receipt
          let supplierIdForImport = null;
          if (row.primarySupplier || row.supplier) {
            const supplierName = row.primarySupplier || row.supplier;
            console.log(`🔍 Looking for supplier for import receipt: ${supplierName}`);

            const supplier = await Supplier.findOne({
              name: { $regex: new RegExp(supplierName, "i") },
              status: "cooperation",
              deletedAt: null,
            }).lean();

            if (supplier) {
              supplierIdForImport = supplier._id;
              console.log(`✅ Found supplier for import receipt: ${supplier.name} (${supplier._id})`);
            } else {
              console.log(`⚠️ Supplier not found for import receipt: ${supplierName}`);
            }
          }

          // Always track product for import receipt (even if product exists)
          // This ensures every import creates a receipt entry
          const importedProduct = {
            productId: existingProduct._id,
            productName: row.name || existingProduct.name || "Unknown Product",
            productSku: actualSku, // Use actualSku
            quantity: parseInt(row.quantity) || 0,
            unitPrice: parseFloat(row.basePrice) || existingProduct.basePrice || 0,
            supplierId: supplierIdForImport,
            categoryId: categoryIdForRow || existingProduct.categoryId,
            excelRowData: {
              name: row.name,
              sku: skuVal, // Keep original SKU in excelRowData
              quantity: row.quantity,
              basePrice: row.basePrice,
              description: row.description,
              category: row.category,
              supplier: row.primarySupplier || row.supplier,
              isUpdate: true,
            },
          };

          importedProducts.push(importedProduct);
          console.log(`✅ Tracked EXISTING product for import receipt: ${row.name} (${actualSku})`);
        } else {
          // Create new product
          const primarySupplierId = null;
          let resolvedPrimarySupplierId = null;

          // Find supplier from Excel data
          if (row.primarySupplier || row.supplier) {
            const supplierName = row.primarySupplier || row.supplier;
            console.log(`🔍 Looking for supplier: ${supplierName}`);

            const supplier = await Supplier.findOne({
              name: { $regex: new RegExp(supplierName, "i") },
              status: "cooperation",
              deletedAt: null,
            }).lean();

            if (supplier) {
              resolvedPrimarySupplierId = supplier._id;
              console.log(`✅ Found supplier: ${supplier.name} (${supplier._id})`);
            } else {
              console.log(`⚠️ Supplier not found: ${supplierName}`);
            }
          }

          const productData = {
            name: String(row.name).trim(),
            sku: actualSku, // Use actualSku (SKU-Batch format if batch exists)
            description: row.description || "",
            unit: row.unit || "pcs",
            basePrice: parseFloat(row.basePrice) || 0,
            minStockLevel: parseInt(row.minStockLevel) || 0,
            quantity: parseInt(row.quantity) || 0,
            warehouseId,
            categoryId: categoryIdForRow, // <-- ensure categoryId present
            primarySupplierId: resolvedPrimarySupplierId,
            status: "in stock",
            createdBy: req.user.sub,
            createdAt: new Date(),
            updatedAt: new Date(),
            productBatch: batchValue || "",
          };
          
          if (productData.productBatch) {
            console.log(`📦 Creating product ${actualSku} with batch: "${productData.productBatch}"`);
          }

          // If categoryId still null and schema requires it, we should throw or mark as failed.
          // But we attempted to create fallback 'Uncategorized' above; if still null, mark row failed.
          if (!productData.categoryId) {
            results.errors.push({
              row: rowNumber,
              message: "Category could not be resolved or created; product not created",
            });
            results.failed++;
            console.warn(`Skipping creation for SKU ${skuVal} due to missing categoryId`);
            continue;
          }

          const product = new Product(productData);
          await product.save();
          results.successful++;

          // Track new product for receipt
          const importedProduct = {
            productId: product._id,
            productName: row.name || "Unknown Product",
            productSku: actualSku, // Use actualSku
            quantity: parseInt(row.quantity) || 0,
            unitPrice: parseFloat(row.basePrice) || 0,
            supplierId: resolvedPrimarySupplierId,
            categoryId: productData.categoryId,
            excelRowData: {
              name: row.name,
              sku: skuVal, // Keep original SKU in excelRowData
              quantity: row.quantity,
              basePrice: row.basePrice,
              description: row.description,
              category: row.category,
              supplier: row.primarySupplier || row.supplier,
            },
          };

          importedProducts.push(importedProduct);
          console.log(`✅ Tracked NEW product: ${row.name} (${skuVal})`);
        }
      } catch (rowErr) {
        console.error(`Error processing row ${rowNumber}:`, rowErr);
        results.errors.push({
          row: rowNumber,
          message: rowErr.message || "Unknown error",
        });
        results.failed++;
      }
    } // end for rows

    console.log("📊 Import Summary (before receipt):", {
      total: results.total,
      successful: results.successful,
      updated: results.updated,
      failed: results.failed,
      importedProductsCount: importedProducts.length,
    });

    // ===== ALWAYS CREATE IMPORT RECEIPT (if we have items with qty > 0) =====
    console.log("🚀 FORCE Creating ImportReceipt...");
    let importReceiptId = null;

    try {
      // If no products tracked but Excel had rows, create dummy entries from Excel data
      if (importedProducts.length === 0 && data && data.length > 0) {
        console.log(`🔧 Creating receipt entries from ${data.length} Excel rows`);

        for (let index = 0; index < data.length; index++) {
          const row = data[index];
          if (row.name && row.sku) {
            // Resolve supplier for dummy
            let supplierIdForDummy = null;
            if (row.primarySupplier || row.supplier) {
              const supplierName = row.primarySupplier || row.supplier;
              const supplier = await Supplier.findOne({
                name: { $regex: new RegExp(supplierName, "i") },
                status: "cooperation",
                deletedAt: null,
              }).lean();

              if (supplier) {
                supplierIdForDummy = supplier._id;
              }
            }

            // Resolve categoryId for dummy (reuse logic above lightly)
            let categoryIdForDummy = null;
            const categoryNameRaw = row.category ? String(row.category).trim() : "";
            if (categoryNameRaw) {
              const foundCat = await Category.findOne({
                name: { $regex: new RegExp(`^${categoryNameRaw}$`, "i") },
                status: "active",
                deletedAt: null,
              }).lean();
              if (foundCat) categoryIdForDummy = foundCat._id;
            } else {
              const unc = await Category.findOne({
                name: { $regex: /^uncategorized$/i },
                status: "active",
                deletedAt: null,
              }).lean();
              if (unc) categoryIdForDummy = unc._id;
            }

            const dummyProduct = {
              productId: new mongoose.Types.ObjectId(),
              productName: row.name || `Product ${index + 1}`,
              productSku: String(row.sku).toUpperCase().trim(),
              quantity: parseInt(row.quantity) || 0,
              unitPrice: parseFloat(row.basePrice) || 0,
              supplierId: supplierIdForDummy,
              categoryId: categoryIdForDummy,
              excelRowData: {
                name: row.name,
                sku: row.sku,
                quantity: row.quantity,
                basePrice: row.basePrice,
                description: row.description,
                category: row.category,
                supplier: row.primarySupplier || row.supplier,
                isDuplicate: true,
              },
            };
            importedProducts.push(dummyProduct);
          }
        }

        console.log(`✅ Created ${importedProducts.length} receipt entries (dummy)`);
      }

      // Filter items with quantity > 0 for totalAmount & details
      const validItems = importedProducts.filter((it) => (parseInt(it.quantity) || 0) > 0);

      if (validItems.length > 0) {
        const receiptNumber = await generateImportReceiptNumber();
        const totalAmount = validItems.reduce((sum, item) => {
          return sum + (parseInt(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0);
        }, 0);

        console.log("🔍 Creating ImportReceipt:", {
          receiptNumber,
          totalAmount,
          itemsCount: validItems.length,
        });

        const importReceiptData = {
          receiptNumber,
          warehouseId,
          createdByStaff: req.user.sub,
          details: validItems.map((item) => ({
            productId: item.productId,
            quantity: parseInt(item.quantity) || 0,
            unitPrice: parseFloat(item.unitPrice) || 0,
            productName: item.productName,
            productSku: item.productSku,
            totalPrice: (parseInt(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0),
            supplierId: item.supplierId,
            supplierName: item.excelRowData?.supplier || "Unknown Supplier",
            categoryId: item.categoryId || null,
          })),
          totalAmount,
          notes: `Auto-generated from Excel import. ${results.successful || 0} new products created, ${results.updated || 0} products updated. Total processed: ${importedProducts.length} items.`,
          status: "created",
          importMetadata: {
            fileName: req.file ? req.file.originalname : "unknown.xlsx",
            importDate: new Date(),
            totalRows: results.total,
            successfulRows: results.successful,
            failedRows: results.failed,
            updatedRows: results.updated || 0,
            newProductsCreated: results.successful || 0,
            existingProductsUpdated: results.updated || 0,
            importedBy: req.user.sub,
          },
        };

        const importReceipt = new ImportReceipt(importReceiptData);
        await importReceipt.save();
        importReceiptId = importReceipt._id;

        console.log(`✅ SUCCESS! Created ImportReceipt ${receiptNumber} with ID: ${importReceiptId}`);
      } else {
        console.log("⚠️ No valid items (quantity > 0) to create receipt for");
      }
    } catch (receiptError) {
      console.error("❌ Failed to create ImportReceipt:", receiptError);
      console.error("❌ Receipt error stack:", receiptError.stack);
    }

    // Cleanup uploaded file
    try {
      if (uploadedPath && fsSync.existsSync(uploadedPath)) await fs.unlink(uploadedPath);
    } catch (unlinkErr) {
      console.error("Failed to remove uploaded file:", unlinkErr);
    }

    console.log("🎉 Import completed successfully!", {
      importReceiptId,
      ...results,
    });

    // Log audit trail
    try {
      const user = await User.findById(req.user.sub);
      if (user) {
        await AuditService.logImportProductExcel(
                 {
                   id: user._id,
                   email: user.staff?.email || user.manager?.email || user.admin?.email || user.accounter?.email || 'No email',
                   name: user.staff?.fullName || user.manager?.fullName || user.admin?.fullName || user.accounter?.fullName || 'Unknown',
                   role: user.role
                 },
          {
            _id: importReceiptId,
            fileName: req.file?.originalname || 'Unknown',
            importedProducts: results.importedProducts || [],
            successCount: results.successful,
            errorCount: results.failed
          },
          'SUCCESS',
          null,
          {
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            warehouseId: user.staff?.warehouseId || user.manager?.warehouseId || user.admin?.managedWarehouses?.[0]
          }
        );
      }
    } catch (auditError) {
      console.error('Failed to log audit trail:', auditError);
    }

    return res.json({
      success: true,
      message: `Import completed. ${results.successful} new products, ${results.updated} updated, ${results.failed} failed.`,
      importReceiptId,
      ...results,
    });
  } catch (error) {
    console.error("Import error:", error && error.stack ? error.stack : error);

    // Log audit trail for failed import
    try {
      const user = await User.findById(req.user.sub);
      if (user) {
        await AuditService.logImportProductExcel(
                 {
                   id: user._id,
                   email: user.staff?.email || user.manager?.email || user.admin?.email || user.accounter?.email || 'No email',
                   name: user.staff?.fullName || user.manager?.fullName || user.admin?.fullName || user.accounter?.fullName || 'Unknown',
                   role: user.role
                 },
          {
            _id: null,
            fileName: req.file?.originalname || 'Unknown',
            importedProducts: [],
            successCount: 0,
            errorCount: 0
          },
          'FAILED',
          error.message || 'Import failed',
          {
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            warehouseId: user.staff?.warehouseId || user.manager?.warehouseId || user.admin?.managedWarehouses?.[0]
          }
        );
      }
    } catch (auditError) {
      console.error('Failed to log audit trail for error:', auditError);
    }

    // Cleanup on global error
    try {
      if (uploadedPath && fsSync.existsSync(uploadedPath)) await fs.unlink(uploadedPath);
    } catch (e) {
      console.error("Failed cleanup after error:", e);
    }

    return res.status(500).json({
      success: false,
      message: "Failed to import products",
      error: error.message || "Internal server error",
    });
  }
};

// Generate Excel template
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
        basePrice: 10.5, // USD price
        quantity: 100,
        category: categories.length > 0 ? categories[0].name : "Electronics",
        primarySupplier: suppliers.length > 0 ? suppliers[0].name : "Sample Supplier",
      },
      {
        name: "Sample Product 2",
        sku: "SP002",
        description: "Another sample product",
        unit: "box",
        basePrice: 25.75,
        quantity: 50,
        category: categories.length > 0 ? categories[0].name : "Office Supplies",
        primarySupplier: suppliers.length > 0 ? suppliers[0].name : "Sample Supplier",
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Products");

    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", "attachment; filename=product_import_template.xlsx");
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
