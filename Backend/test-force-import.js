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
    
    // Simulate import data (like what would come from Excel)
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
    
    // Simulate the import process - force create receipt
    console.log('🔧 Simulating import process...');
    
    const importedProducts = [];
    const results = {
      total: simulatedData.length,
      successful: 0,
      failed: 0,
      updated: 0
    };
    
    // Simulate that all products are duplicates (no new products created)
    // This is the scenario where user imports same file again
    simulatedData.forEach((row, index) => {
      // Simulate duplicate/update scenario
      results.updated++;
      
      const dummyProduct = {
        productId: new mongoose.Types.ObjectId(), // Fake product ID
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
          isDuplicate: true
        }
      };
      importedProducts.push(dummyProduct);
    });
    
    console.log(`📊 Simulation results:`, {
      total: results.total,
      successful: results.successful,
      updated: results.updated,
      failed: results.failed,
      importedProductsLength: importedProducts.length
    });
    
    // Force create ImportReceipt (like the updated logic)
    if (true) { // Always create receipt
      try {
        console.log(`🔍 FORCE Creating ImportReceipt for ${importedProducts.length} products`);
        
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
        
        console.log(`🔍 Creating ImportReceipt with:`, {
          receiptNumber,
          totalAmount,
          productsCount: importedProducts.length
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
          notes: `Auto-generated from Excel import. ${results.successful || 0} new products created, ${results.updated || 0} products updated. Total processed: ${importedProducts.length} items. Products: ${importedProducts.map(p => `${p.productName} (${p.productSku}): ${p.quantity} units${p.excelRowData?.isUpdate ? ' [Updated]' : p.excelRowData?.isDuplicate ? ' [Duplicate]' : ' [New]'}${p.excelRowData?.supplier ? ` - Supplier: ${p.excelRowData.supplier}` : ''}`).join(', ')}.`,
          status: "created",
          importMetadata: {
            fileName: 'test-duplicate-import.xlsx',
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
        
        console.log(`✅ SUCCESS! Created ImportReceipt ${receiptNumber} with ID: ${importReceipt._id}`);
        console.log(`📋 Receipt details:`, {
          receiptNumber: importReceipt.receiptNumber,
          totalAmount: importReceipt.totalAmount,
          itemsCount: importReceipt.details.length,
          notes: importReceipt.notes.substring(0, 100) + '...'
        });
        
      } catch (receiptError) {
        console.error("❌ Failed to create ImportReceipt:", receiptError);
        console.error("❌ Receipt error stack:", receiptError.stack);
      }
    }
    
    // Check final count
    const finalCount = await ImportReceipt.countDocuments();
    console.log(`📊 Final ImportReceipts count: ${finalCount}`);
    
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
