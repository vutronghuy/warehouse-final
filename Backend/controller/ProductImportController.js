const Product = require('../models/products/product');
const Category = require('../models/products/CategoryNew');
const Supplier = require('../models/products/Supplier');
const User = require('../models/User');
const XLSX = require('xlsx');
const path = require('path');

// Import products from Excel file
exports.importProducts = async (req, res) => {
  try {
    console.log('🔍 Import request from user:', {
      userId: req.user.sub,
      role: req.user.role,
      roleKey: req.user.roleKey,
      isSuperAdmin: req.user.isSuperAdmin
    });

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Read Excel file
    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    if (!data || data.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Excel file is empty or invalid'
      });
    }

    // Get all categories and suppliers for lookup
    const categories = await Category.find({ status: 'active', deletedAt: null });
    const suppliers = await Supplier.find({ status: 'cooperation', deletedAt: null });

    // Create lookup maps
    const categoryMap = new Map();
    categories.forEach(cat => {
      categoryMap.set(cat.name.toLowerCase(), cat._id);
    });

    const supplierMap = new Map();
    suppliers.forEach(sup => {
      supplierMap.set(sup.name.toLowerCase(), sup._id);
    });

    const results = {
      total: data.length,
      successful: 0,
      failed: 0,
      errors: []
    };

    // Process each row
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNumber = i + 2; // Excel row number (starting from 2, accounting for header)

      try {
        // Validate required fields
        if (!row.name || !row.sku) {
          results.errors.push({
            row: rowNumber,
            message: 'Name and SKU are required'
          });
          results.failed++;
          continue;
        }

        // Check if SKU already exists
        const existingProduct = await Product.findOne({ sku: row.sku.toString().toUpperCase().trim() });
        if (existingProduct) {
          results.errors.push({
            row: rowNumber,
            message: `SKU "${row.sku}" already exists`
          });
          results.failed++;
          continue;
        }

        // Validate unit
        const validUnits = ['pcs', 'kg', 'liter', 'box', 'pack'];
        if (row.unit && !validUnits.includes(row.unit.toLowerCase())) {
          results.errors.push({
            row: rowNumber,
            message: `Invalid unit "${row.unit}". Valid units: ${validUnits.join(', ')}`
          });
          results.failed++;
          continue;
        }

        // Find category
        let categoryId = null;
        if (row.category) {
          categoryId = categoryMap.get(row.category.toLowerCase());
          if (!categoryId) {
            results.errors.push({
              row: rowNumber,
              message: `Category "${row.category}" not found`
            });
            results.failed++;
            continue;
          }
        }

        // Find supplier
        let primarySupplierId = null;
        if (row.primarySupplier) {
          primarySupplierId = supplierMap.get(row.primarySupplier.toLowerCase());
          if (!primarySupplierId) {
            results.errors.push({
              row: rowNumber,
              message: `Supplier "${row.primarySupplier}" not found`
            });
            results.failed++;
            continue;
          }
        }

        // Get user's warehouse ID from database
        let warehouseId = null;

        try {
          const user = await User.findById(req.user.sub).lean();
          if (!user) {
            results.errors.push({
              row: rowNumber,
              message: 'User not found in database'
            });
            results.failed++;
            continue;
          }

          // Get warehouse ID based on user role
          if (req.user.role === 'staff' && user.staff?.warehouseId) {
            warehouseId = user.staff.warehouseId;
          } else if (req.user.role === 'manager' && user.manager?.warehouseId) {
            warehouseId = user.manager.warehouseId;
          } else if (req.user.role === 'accounter' && user.accounter?.warehouseId) {
            warehouseId = user.accounter.warehouseId;
          } else if (req.user.role === 'admin' && user.admin?.managedWarehouses && user.admin.managedWarehouses.length > 0) {
            warehouseId = user.admin.managedWarehouses[0]; // Use first managed warehouse
          }

          if (!warehouseId) {
            console.log('❌ No warehouse found for user:', {
              userId: req.user.sub,
              role: req.user.role,
              userDoc: user
            });
            results.errors.push({
              row: rowNumber,
              message: `User with role '${req.user.role}' is not assigned to any warehouse`
            });
            results.failed++;
            continue;
          }

          console.log('✅ Found warehouse for user:', {
            userId: req.user.sub,
            role: req.user.role,
            warehouseId: warehouseId
          });
        } catch (userError) {
          console.error(`Error fetching user data for row ${rowNumber}:`, userError);
          results.errors.push({
            row: rowNumber,
            message: 'Failed to get user warehouse information'
          });
          results.failed++;
          continue;
        }

        // Create product data
        const productData = {
          name: row.name.toString().trim(),
          sku: row.sku.toString().toUpperCase().trim(),
          description: row.description ? row.description.toString().trim() : '',
          unit: row.unit ? row.unit.toLowerCase() : 'pcs',
          basePrice: parseFloat(row.basePrice) || 0,
          minStockLevel: parseInt(row.minStockLevel) || 0,
          quantity: parseInt(row.quantity) || 0, // Initial quantity
          warehouseId: warehouseId, // Assign to user's warehouse
          categoryId: categoryId,
          primarySupplierId: primarySupplierId,
          status: 'in stock', // Default status
          createdBy: req.user.sub, // User ID from JWT token
          createdAt: new Date(),
          updatedAt: new Date()
        };

        // Create product
        const product = new Product(productData);
        await product.save();

        results.successful++;

      } catch (error) {
        console.error(`Error processing row ${rowNumber}:`, error);
        results.errors.push({
          row: rowNumber,
          message: error.message || 'Unknown error occurred'
        });
        results.failed++;
      }
    }

    // Clean up uploaded file
    const fs = require('fs');
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.json({
      success: true,
      message: `Import completed. ${results.successful} products imported successfully, ${results.failed} failed.`,
      ...results
    });

  } catch (error) {
    console.error('Import error:', error);
    
    // Clean up uploaded file on error
    if (req.file && req.file.path) {
      const fs = require('fs');
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
    }

    res.status(500).json({
      success: false,
      message: 'Failed to import products',
      error: error.message
    });
  }
};

// Generate Excel template for import
exports.generateTemplate = async (req, res) => {
  try {
    // Get active categories and suppliers
    const categories = await Category.find({ status: 'active', deletedAt: null }).select('name');
    const suppliers = await Supplier.find({ status: 'cooperation', deletedAt: null }).select('name');

    // Create sample data
    const sampleData = [
      {
        name: 'Sample Product 1',
        sku: 'SP001',
        description: 'This is a sample product description',
        unit: 'pcs',
        basePrice: 10.50,
        quantity: 100,
        category: categories.length > 0 ? categories[0].name : 'Electronics',
        primarySupplier: suppliers.length > 0 ? suppliers[0].name : 'Sample Supplier',
        minStockLevel: 10
      },
      {
        name: 'Sample Product 2',
        sku: 'SP002',
        description: 'Another sample product',
        unit: 'kg',
        basePrice: 25.00,
        quantity: 50,
        category: categories.length > 1 ? categories[1].name : 'Food',
        primarySupplier: suppliers.length > 1 ? suppliers[1].name : 'Another Supplier',
        minStockLevel: 5
      }
    ];

    // Create workbook
    const workbook = XLSX.utils.book_new();
    
    // Create main sheet with sample data
    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Products');

    // Create categories reference sheet
    const categoriesSheet = XLSX.utils.json_to_sheet(
      categories.map(cat => ({ name: cat.name }))
    );
    XLSX.utils.book_append_sheet(workbook, categoriesSheet, 'Categories');

    // Create suppliers reference sheet
    const suppliersSheet = XLSX.utils.json_to_sheet(
      suppliers.map(sup => ({ name: sup.name }))
    );
    XLSX.utils.book_append_sheet(workbook, suppliersSheet, 'Suppliers');

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Set headers for file download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=product_import_template.xlsx');
    res.setHeader('Content-Length', buffer.length);

    res.send(buffer);

  } catch (error) {
    console.error('Template generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate template',
      error: error.message
    });
  }
};
