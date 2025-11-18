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

async function testProductCost() {
  try {
    // Connect to MongoDB
    await mongoose.connect(dbURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB');

    // Get Product model
    const Product = require('./models/products/product');

    // Check current products
    const currentProducts = await Product.find({ deletedAt: null });
    console.log(`📦 Current products in database: ${currentProducts.length}`);

    if (currentProducts.length > 0) {
      console.log('📋 Sample products:');
      currentProducts.slice(0, 3).forEach((product, index) => {
        console.log(`  ${index + 1}. ${product.name} - BasePrice: $${product.basePrice} - Quantity: ${product.quantity}`);
      });
    }

    // Test API
    console.log('\n🧪 Testing total-import-cost API...');
    const response = await makeRequest('http://localhost:3003/api/reports/test/total-import-cost');
    
    console.log('✅ API Response:', response);
    console.log('📊 Total Cost USD:', response.totalCostUSD);
    console.log('💰 Total Cost VND:', response.totalCostVND);
    console.log('📦 Total Products:', response.totalProducts);

    // Calculate manually for verification
    let manualTotalUSD = 0;
    currentProducts.forEach(product => {
      const cost = (product.basePrice || 0) * (product.quantity || 0);
      manualTotalUSD += cost;
    });
    
    console.log('\n🔍 Manual calculation:');
    console.log('📊 Manual Total Cost USD:', manualTotalUSD);
    console.log('💰 Manual Total Cost VND:', manualTotalUSD * 26401);
    
    // Check if they match
    const apiTotalUSD = response.totalCostUSD || 0;
    if (Math.abs(apiTotalUSD - manualTotalUSD) < 0.01) {
      console.log('✅ API calculation matches manual calculation!');
    } else {
      console.log('❌ API calculation does not match manual calculation');
      console.log(`   Difference: $${Math.abs(apiTotalUSD - manualTotalUSD)}`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

testProductCost();
