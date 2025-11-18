const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/warehouse')
  .then(async () => {
    console.log('🔗 Connected to MongoDB');
    
    const Product = require('./models/products/product');
    const ImportReceipt = require('./models/import/ImportReceipt');
    const Supplier = require('./models/Supplier');
    
    // Check current state
    console.log('\n📊 === CURRENT DATABASE STATE ===');
    
    const productCount = await Product.countDocuments();
    console.log(`Products in database: ${productCount}`);
    
    const receiptCount = await ImportReceipt.countDocuments();
    console.log(`ImportReceipts in database: ${receiptCount}`);
    
    const supplierCount = await Supplier.countDocuments();
    console.log(`Suppliers in database: ${supplierCount}`);
    
    // Show recent receipts
    const recentReceipts = await ImportReceipt.find().sort({ createdAt: -1 }).limit(5);
    console.log(`\n📋 Recent ImportReceipts:`);
    recentReceipts.forEach((receipt, index) => {
      console.log(`${index + 1}. ${receipt.receiptNumber} - ${receipt.details.length} items - $${receipt.totalAmount} - ${receipt.createdAt}`);
    });
    
    // Show some products
    const someProducts = await Product.find().limit(5);
    console.log(`\n📦 Sample Products:`);
    someProducts.forEach((product, index) => {
      console.log(`${index + 1}. ${product.name} (${product.sku}) - Qty: ${product.quantity} - Price: $${product.basePrice}`);
    });
    
    // Simulate import process with real data
    console.log('\n🧪 === SIMULATING REAL IMPORT ===');
    
    // Use real product data for simulation
    const simulatedData = [
      {
        name: someProducts[0]?.name || 'Test Product 1',
        sku: someProducts[0]?.sku || 'TEST001',
        quantity: 10,
        basePrice: 25.50,
        description: 'Test product description',
        category: 'Electronics',
        primarySupplier: 'ABC Company'
      },
      {
        name: someProducts[1]?.name || 'Test Product 2',
        sku: someProducts[1]?.sku || 'TEST002',
        quantity: 5,
        basePrice: 15.75,
        description: 'Another test product',
        category: 'Accessories',
        primarySupplier: 'XYZ Supplier'
      }
    ];
    
    console.log('📋 Simulated Excel data:');
    simulatedData.forEach((row, index) => {
      console.log(`${index + 1}. ${row.name} (${row.sku}) - Qty: ${row.quantity} - Price: $${row.basePrice} - Supplier: ${row.primarySupplier}`);
    });
    
    // Test the import logic step by step
    console.log('\n🔍 === TESTING IMPORT LOGIC ===');
    
    const importedProducts = [];
    const results = {
      total: simulatedData.length,
      successful: 0,
      failed: 0,
      updated: 0,
      errors: []
    };
    
    // Process each row like the real import
    for (let i = 0; i < simulatedData.length; i++) {
      const row = simulatedData[i];
      const rowNumber = i + 2;
      
      console.log(`\n🔄 Processing row ${rowNumber}: ${row.name} (${row.sku})`);
      
      try {
        if (!row.name || !row.sku) {
          console.log(`❌ Missing name or SKU`);
          results.errors.push({
            row: rowNumber,
            message: "Name and SKU are required",
          });
          results.failed++;
          continue;
        }

        const skuVal = row.sku.toString().toUpperCase().trim();
        console.log(`🔍 Looking for existing product with SKU: ${skuVal}`);

        // Check if product exists (using real warehouse - assume first warehouse)
        const existingProduct = await Product.findOne({
          sku: skuVal
        }).lean();

        if (existingProduct) {
          console.log(`✅ Found existing product: ${existingProduct.name} (ID: ${existingProduct._id})`);
          
          // Simulate update logic
          const addQty = Math.max(0, parseInt(row.quantity) || 0);
          const setFields = { updatedAt: new Date() };

          if (row.basePrice !== undefined && row.basePrice !== "") {
            const bp = parseFloat(row.basePrice);
            if (!isNaN(bp)) setFields.basePrice = bp;
          }

          const updateOps = {};
          if (addQty > 0) updateOps.$inc = { quantity: addQty };
          if (Object.keys(setFields).length > 0) updateOps.$set = setFields;

          console.log(`🔧 Update operations:`, updateOps);
          
          if (Object.keys(updateOps).length > 0) {
            console.log(`✅ Would update product`);
          } else {
            console.log(`⚠️ No updates needed`);
          }
          
          results.updated = (results.updated || 0) + 1;

          // Track updated product for receipt (this should ALWAYS happen)
          const importedProduct = {
            productId: existingProduct._id,
            productName: row.name || existingProduct.name || 'Unknown Product',
            productSku: skuVal,
            quantity: parseInt(row.quantity) || 0,
            unitPrice: parseFloat(row.basePrice) || existingProduct.basePrice || 0,
            supplierId: null, // Simplified for debug
            excelRowData: {
              name: row.name,
              sku: skuVal,
              quantity: row.quantity,
              basePrice: row.basePrice,
              description: row.description,
              category: row.category,
              supplier: row.primarySupplier || row.supplier,
              isUpdate: true
            }
          };

          importedProducts.push(importedProduct);
          console.log(`✅ Tracked UPDATED product for receipt`);

        } else {
          console.log(`⚠️ Product not found - would create new product`);
          
          // Simulate new product creation
          results.successful++;

          const importedProduct = {
            productId: new mongoose.Types.ObjectId(),
            productName: row.name || 'Unknown Product',
            productSku: skuVal,
            quantity: parseInt(row.quantity) || 0,
            unitPrice: parseFloat(row.basePrice) || 0,
            supplierId: null,
            excelRowData: {
              name: row.name,
              sku: skuVal,
              quantity: row.quantity,
              basePrice: row.basePrice,
              description: row.description,
              category: row.category,
              supplier: row.primarySupplier || row.supplier
            }
          };

          importedProducts.push(importedProduct);
          console.log(`✅ Tracked NEW product for receipt`);
        }

      } catch (rowErr) {
        console.error(`❌ Error processing row ${rowNumber}:`, rowErr);
        results.errors.push({
          row: rowNumber,
          message: rowErr.message || "Unknown error",
        });
        results.failed++;
      }
    }

    console.log(`\n📊 Processing Results:`, {
      total: results.total,
      successful: results.successful,
      updated: results.updated,
      failed: results.failed,
      importedProductsCount: importedProducts.length
    });

    // Test receipt creation logic
    console.log(`\n🚀 === TESTING RECEIPT CREATION ===`);
    
    if (importedProducts.length === 0 && simulatedData && simulatedData.length > 0) {
      console.log(`🔧 FALLBACK: Would create basic receipt entries from ${simulatedData.length} Excel rows`);
      
      for (let index = 0; index < simulatedData.length; index++) {
        const row = simulatedData[index];
        if (row.name && row.sku) {
          const basicProduct = {
            productId: new mongoose.Types.ObjectId(),
            productName: row.name || `Product ${index + 1}`,
            productSku: String(row.sku).toUpperCase().trim(),
            quantity: parseInt(row.quantity) || 0,
            unitPrice: parseFloat(row.basePrice) || 0,
            supplierId: null,
            excelRowData: {
              name: row.name,
              sku: row.sku,
              quantity: row.quantity,
              basePrice: row.basePrice,
              description: row.description,
              category: row.category,
              supplier: row.primarySupplier || row.supplier,
              isBasicEntry: true
            }
          };
          importedProducts.push(basicProduct);
        }
      }
      
      console.log(`✅ Created ${importedProducts.length} basic receipt entries`);
    }

    if (importedProducts.length > 0) {
      console.log(`✅ Would create ImportReceipt with ${importedProducts.length} items`);
      
      const totalAmount = importedProducts.reduce((sum, item) => {
        return sum + (item.quantity * item.unitPrice);
      }, 0);
      
      console.log(`💰 Total amount: $${totalAmount}`);
      console.log(`📋 Items:`);
      importedProducts.forEach((item, index) => {
        const tag = item.excelRowData?.isUpdate ? '[Updated]' : item.excelRowData?.isBasicEntry ? '[Basic Entry]' : '[New]';
        console.log(`  ${index + 1}. ${item.productName} (${item.productSku}): ${item.quantity} units ${tag} - Supplier: ${item.excelRowData?.supplier || 'N/A'}`);
      });
    } else {
      console.log(`❌ No products to create receipt for`);
    }
    
    console.log(`\n🎯 === CONCLUSION ===`);
    if (importedProducts.length > 0) {
      console.log(`✅ Import would succeed and create receipt`);
    } else {
      console.log(`❌ Import would fail to create receipt`);
      console.log(`🔍 Debug: Check why no products were tracked`);
    }
    
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
