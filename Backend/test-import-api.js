async function testImportAPI() {
  try {
    console.log('Testing Import API...');

    // Test without auth first to see if route exists
    const response = await fetch('http://localhost:3003/api/import/receipts');

    console.log('Status:', response.status);
    const data = await response.text();
    console.log('Response:', data);

    // Also test database directly
    const mongoose = require('mongoose');
    require('dotenv').config();

    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/warehouse');
    const ImportReceipt = require('./models/import/ImportReceipt');

    const receipts = await ImportReceipt.find({}).lean();
    console.log('\n📊 Direct DB check:');
    console.log('Total receipts:', receipts.length);
    if (receipts.length > 0) {
      console.log('Latest receipt:', {
        id: receipts[0]._id,
        receiptNumber: receipts[0].receiptNumber,
        status: receipts[0].status,
        totalAmount: receipts[0].totalAmount
      });
    }

    mongoose.disconnect();

  } catch (error) {
    console.error('Error:', error.message);
  }
}

testImportAPI();
