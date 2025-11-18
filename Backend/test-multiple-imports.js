const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/warehouse')
  .then(async () => {
    console.log('🔗 Connected to MongoDB');
    
    const ImportReceipt = require('./models/import/ImportReceipt');
    
    // Clear existing receipts
    await ImportReceipt.deleteMany({});
    console.log('🗑️ Cleared existing ImportReceipts');
    
    // Simulate import data (same file imported multiple times)
    const simulatedData = [
      {
        name: 'Test Product 1',
        sku: 'TEST001',
        quantity: 10,
        basePrice: 25.50,
        description: 'Test product description',
        category: 'Electronics',
        primarySupplier: 'ABC Company'
      },
      {
        name: 'Test Product 2', 
        sku: 'TEST002',
        quantity: 5,
        basePrice: 15.75,
        description: 'Another test product',
        category: 'Accessories',
        primarySupplier: 'XYZ Supplier'
      }
    ];
    
    // Helper function to create receipt
    const createReceipt = async (importNumber, hasTrackedProducts = false) => {
      console.log(`\n🔄 === IMPORT ${importNumber} ===`);
      
      const importedProducts = [];
      const results = {
        total: simulatedData.length,
        successful: 0,
        failed: 0,
        updated: hasTrackedProducts ? simulatedData.length : 0
      };
      
      // Simulate different scenarios
      if (hasTrackedProducts) {
        // Simulate that products are tracked (first import)
        simulatedData.forEach((row, index) => {
          const trackedProduct = {
            productId: new mongoose.Types.ObjectId(),
            productName: row.name,
            productSku: row.sku,
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
              supplier: row.primarySupplier,
              isUpdate: importNumber > 1
            }
          };
          importedProducts.push(trackedProduct);
        });
        console.log(`✅ Tracked ${importedProducts.length} products`);
      } else {
        console.log(`⚠️ No products tracked (all duplicates scenario)`);
      }
      
      console.log(`📊 Import ${importNumber} results:`, {
        total: results.total,
        successful: results.successful,
        updated: results.updated,
        failed: results.failed,
        importedProductsLength: importedProducts.length
      });
      
      // Test the FORCE create logic
      console.log(`🚀 FORCE Creating ImportReceipt for import ${importNumber}...`);
      let importReceiptId = null;

      try {
        // ALWAYS create receipt if we have Excel data, regardless of importedProducts
        if (simulatedData && simulatedData.length > 0) {
          // If still no products tracked, create basic entries from Excel
          if (importedProducts.length === 0) {
            console.log(`🔧 FALLBACK: Creating basic receipt entries from ${simulatedData.length} Excel rows`);
            
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
            // Generate receipt number
            const generateImportReceiptNumber = async () => {
              const today = new Date();
              const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
              const prefix = `IMP${dateStr}`;
              
              const lastReceipt = await ImportReceipt.findOne({
                receiptNumber: { $regex: `^${prefix}` }
              }).sort({ receiptNumber: -1 });
              
              let sequence = 1;
              if (lastReceipt) {
                const lastNumber = lastReceipt.receiptNumber.slice(-4);
                sequence = parseInt(lastNumber) + 1;
              }
              
              return `${prefix}${String(sequence).padStart(4, '0')}`;
            };
            
            const receiptNumber = await generateImportReceiptNumber();
            
            // Calculate total amount
            const totalAmount = importedProducts.reduce((sum, item) => {
              return sum + (item.quantity * item.unitPrice);
            }, 0);
            
            console.log(`🔍 Creating ImportReceipt ${importNumber}:`, {
              receiptNumber,
              totalAmount,
              itemsCount: importedProducts.length
            });
            
            // Create ImportReceipt
            const importReceiptData = {
              receiptNumber,
              warehouseId: new mongoose.Types.ObjectId(), // Fake warehouse ID
              createdByStaff: new mongoose.Types.ObjectId(), // Fake staff ID
              details: importedProducts.map(item => ({
                productId: item.productId,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                productName: item.productName,
                productSku: item.productSku,
                totalPrice: item.quantity * item.unitPrice,
                supplierId: item.supplierId,
                supplierName: item.excelRowData?.supplier || 'Unknown Supplier'
              })),
              totalAmount,
              notes: `Auto-generated from Excel import ${importNumber}. ${results.successful || 0} new products created, ${results.updated || 0} products updated. Total processed: ${importedProducts.length} items. Products: ${importedProducts.map(p => `${p.productName} (${p.productSku}): ${p.quantity} units${p.excelRowData?.isUpdate ? ' [Updated]' : p.excelRowData?.isDuplicate ? ' [Duplicate]' : p.excelRowData?.isBasicEntry ? ' [Basic Entry]' : ' [New]'}${p.excelRowData?.supplier ? ` - Supplier: ${p.excelRowData.supplier}` : ''}`).join(', ')}.`,
              status: "created",
              importMetadata: {
                fileName: `test-multiple-import-${importNumber}.xlsx`,
                importDate: new Date(),
                totalRows: results.total,
                successfulRows: results.successful,
                failedRows: results.failed,
                updatedRows: results.updated || 0,
                newProductsCreated: results.successful || 0,
                existingProductsUpdated: results.updated || 0,
                importedBy: new mongoose.Types.ObjectId()
              }
            };
            
            const importReceipt = new ImportReceipt(importReceiptData);
            await importReceipt.save();
            importReceiptId = importReceipt._id;
            
            console.log(`✅ SUCCESS! Created ImportReceipt ${receiptNumber} for import ${importNumber}`);
            return receiptNumber;
          } else {
            console.log(`⚠️ No Excel data to create receipt from`);
            return null;
          }
        }
        
      } catch (receiptError) {
        console.error(`❌ Failed to create ImportReceipt for import ${importNumber}:`, receiptError);
        return null;
      }
    };
    
    // Test multiple imports
    console.log('🧪 Testing multiple imports of the same file...');
    
    // Import 1: First time (has tracked products)
    const receipt1 = await createReceipt(1, true);
    
    // Import 2: Second time (has tracked products - updates)
    const receipt2 = await createReceipt(2, true);
    
    // Import 3: Third time (no tracked products - all duplicates)
    const receipt3 = await createReceipt(3, false);
    
    // Import 4: Fourth time (no tracked products - all duplicates)
    const receipt4 = await createReceipt(4, false);
    
    // Check final results
    const finalCount = await ImportReceipt.countDocuments();
    console.log(`\n📊 === FINAL RESULTS ===`);
    console.log(`Total ImportReceipts created: ${finalCount}`);
    
    const allReceipts = await ImportReceipt.find().sort({ createdAt: 1 });
    allReceipts.forEach((receipt, index) => {
      console.log(`${index + 1}. ${receipt.receiptNumber} - ${receipt.details.length} items - $${receipt.totalAmount}`);
    });
    
    if (finalCount === 4) {
      console.log(`🎉 SUCCESS: All 4 imports created receipts!`);
    } else {
      console.log(`❌ FAILED: Expected 4 receipts, got ${finalCount}`);
    }
    
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
