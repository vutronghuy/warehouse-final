const mongoose = require('mongoose');
require('dotenv').config();

async function createTestReceipt() {
  try {
    console.log('🔍 Creating test ImportReceipt...');
    
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/warehouse');
    
    const ImportReceipt = require('./models/import/ImportReceipt');
    const User = require('./models/User');
    
    // Create a test receipt
    const testReceipt = new ImportReceipt({
      receiptNumber: 'IMP20250109001',
      warehouseId: new mongoose.Types.ObjectId(),
      createdByStaff: new mongoose.Types.ObjectId(),
      details: [
        {
          productId: new mongoose.Types.ObjectId(),
          quantity: 10,
          unitPrice: 95.50, // $95.50 USD
          productName: 'Laptop Dell Inspiron',
          productSku: 'LAPTOP001',
          totalPrice: 955.00 // $955.00 USD
        },
        {
          productId: new mongoose.Types.ObjectId(),
          quantity: 5,
          unitPrice: 25.75, // $25.75 USD
          productName: 'Chuột không dây Logitech',
          productSku: 'MOUSE001',
          totalPrice: 128.75 // $128.75 USD
        }
      ],
      totalAmount: 1083.75, // $1,083.75 USD
      notes: 'Auto-generated from Excel import. 1 new products created, 1 products updated. Total processed: 2 items. Products: Laptop Dell Inspiron (LAPTOP001): 10 units [New], Chuột không dây Logitech (MOUSE001): 5 units [Updated].',
      status: 'created',
      importMetadata: {
        fileName: 'test-products.xlsx',
        importDate: new Date(),
        totalRows: 3,
        successfulRows: 1,
        failedRows: 1,
        updatedRows: 1,
        newProductsCreated: 1,
        existingProductsUpdated: 1,
        importedBy: new mongoose.Types.ObjectId()
      }
    });
    
    await testReceipt.save();
    console.log('✅ Created test ImportReceipt:', testReceipt._id);
    
    // Check total receipts
    const totalReceipts = await ImportReceipt.countDocuments();
    console.log('📊 Total ImportReceipts in database:', totalReceipts);
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

createTestReceipt();
