const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/warehouse')
  .then(async () => {
    console.log('🔗 Connected to MongoDB');
    
    const ImportReceipt = require('./models/import/ImportReceipt');
    
    const receipt = await ImportReceipt.findOne().sort({ createdAt: -1 });
    
    if (!receipt) {
      console.log('❌ No ImportReceipt found');
      process.exit(0);
    }
    
    console.log('📋 Latest ImportReceipt:');
    console.log('Receipt Number:', receipt.receiptNumber);
    console.log('Total Amount:', receipt.totalAmount);
    console.log('Notes:', receipt.notes);
    console.log('\n📦 Details:');
    
    receipt.details.forEach((detail, index) => {
      console.log(`  ${index + 1}. ${detail.productName} (${detail.productSku})`);
      console.log(`     Quantity: ${detail.quantity}, Price: $${detail.unitPrice}`);
      console.log(`     Supplier: ${detail.supplierName || 'N/A'}`);
      console.log(`     Total: $${detail.totalPrice}`);
      console.log('');
    });
    
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
