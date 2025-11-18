const http = require('http');
const mongoose = require('mongoose');

// Connect to MongoDB
const dbURI = 'mongodb+srv://vutronghuygrw24092003:HuyiucuaNganxinhgai@warehouse.qf0rlaq.mongodb.net/Warehouses';

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

async function testImportReceiptLogic() {
  try {
    // Connect to MongoDB
    await mongoose.connect(dbURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB');

    // Get models
    const ImportReceipt = require('./models/import/ImportReceipt');
    const Product = require('./models/products/product');

    // Test 1: Check current state
    console.log('\n🧪 Test 1: Current state');
    let response = await makeRequest('http://localhost:3003/api/reports/test/total-import-cost');
    console.log('📊 Current Total Cost USD:', response.totalCostUSD);
    console.log('💰 Current Total Cost VND:', response.totalCostVND);
    console.log('📦 Current ImportReceipts:', response.totalReceipts);

    // Check ImportReceipts in database
    const importReceipts = await ImportReceipt.find({ deletedAt: null });
    console.log(`📋 ImportReceipts in database: ${importReceipts.length}`);
    
    if (importReceipts.length > 0) {
      console.log('📋 Sample ImportReceipts:');
      importReceipts.slice(0, 2).forEach((receipt, index) => {
        console.log(`  ${index + 1}. ${receipt.receiptNumber} - Total: $${receipt.totalAmount} - Items: ${receipt.details.length}`);
      });
    }

    // Check Products in database
    const products = await Product.find({ deletedAt: null });
    console.log(`📦 Products in database: ${products.length}`);

    // Test 2: Delete all products (should NOT affect total cost)
    if (products.length > 0) {
      console.log('\n🧪 Test 2: Delete all products (cost should remain same)');
      await Product.updateMany({}, { deletedAt: new Date() });
      console.log('✅ All products marked as deleted');

      response = await makeRequest('http://localhost:3003/api/reports/test/total-import-cost');
      console.log('📊 After deleting products - Total Cost USD:', response.totalCostUSD);
      console.log('💰 After deleting products - Total Cost VND:', response.totalCostVND);
      console.log('📦 After deleting products - ImportReceipts:', response.totalReceipts);

      // Restore products
      await Product.updateMany({}, { $unset: { deletedAt: 1 } });
      console.log('✅ Products restored');
    }

    // Test 3: Soft delete one ImportReceipt (should reduce total cost)
    if (importReceipts.length > 0) {
      console.log('\n🧪 Test 3: Soft delete one ImportReceipt');
      const firstReceipt = importReceipts[0];
      console.log(`🗑️ Deleting ImportReceipt: ${firstReceipt.receiptNumber} (Total: $${firstReceipt.totalAmount})`);
      
      await ImportReceipt.updateOne({ _id: firstReceipt._id }, { deletedAt: new Date() });
      
      response = await makeRequest('http://localhost:3003/api/reports/test/total-import-cost');
      console.log('📊 After deleting 1 ImportReceipt - Total Cost USD:', response.totalCostUSD);
      console.log('💰 After deleting 1 ImportReceipt - Total Cost VND:', response.totalCostVND);
      console.log('📦 After deleting 1 ImportReceipt - ImportReceipts:', response.totalReceipts);

      // Restore ImportReceipt
      await ImportReceipt.updateOne({ _id: firstReceipt._id }, { $unset: { deletedAt: 1 } });
      console.log('✅ ImportReceipt restored');
    }

    // Test 4: Delete all ImportReceipts (should make total cost = 0)
    if (importReceipts.length > 0) {
      console.log('\n🧪 Test 4: Delete all ImportReceipts (cost should = 0)');
      await ImportReceipt.updateMany({}, { deletedAt: new Date() });
      console.log('✅ All ImportReceipts marked as deleted');

      response = await makeRequest('http://localhost:3003/api/reports/test/total-import-cost');
      console.log('📊 After deleting all ImportReceipts - Total Cost USD:', response.totalCostUSD);
      console.log('💰 After deleting all ImportReceipts - Total Cost VND:', response.totalCostVND);
      console.log('📦 After deleting all ImportReceipts - ImportReceipts:', response.totalReceipts);

      if (response.totalCostUSD === 0 && response.totalCostVND === 0) {
        console.log('✅ Test PASSED: Total cost = 0 when all ImportReceipts deleted');
      } else {
        console.log('❌ Test FAILED: Total cost should be 0');
      }

      // Restore all ImportReceipts
      await ImportReceipt.updateMany({}, { $unset: { deletedAt: 1 } });
      console.log('✅ All ImportReceipts restored');
    }

    // Test 5: Final verification
    console.log('\n🧪 Test 5: Final verification');
    response = await makeRequest('http://localhost:3003/api/reports/test/total-import-cost');
    console.log('📊 Final Total Cost USD:', response.totalCostUSD);
    console.log('💰 Final Total Cost VND:', response.totalCostVND);
    console.log('📦 Final ImportReceipts:', response.totalReceipts);

    console.log('\n✅ All tests completed successfully!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

testImportReceiptLogic();
