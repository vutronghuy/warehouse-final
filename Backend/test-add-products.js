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

async function testAddProducts() {
  try {
    // Connect to MongoDB
    await mongoose.connect(dbURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB');

    // Get models
    const Product = require('./models/products/product');
    const Warehouse = require('./models/warehouse/warehouse');
    const Supplier = require('./models/products/Supplier');
    const Category = require('./models/products/CategoryNew');

    // Get first warehouse
    const warehouse = await Warehouse.findOne();
    if (!warehouse) {
      console.log('❌ No warehouse found');
      return;
    }
    console.log(`📦 Using warehouse: ${warehouse.name}`);

    // Get first supplier and category
    const supplier = await Supplier.findOne();
    const category = await Category.findOne();

    if (!supplier || !category) {
      console.log('❌ No supplier or category found');
      return;
    }
    console.log(`📦 Using supplier: ${supplier.name}`);
    console.log(`📦 Using category: ${category.name}`);

    // Test API before adding products
    console.log('\n🧪 Testing API before adding products...');
    let response = await makeRequest('http://localhost:3003/api/reports/test/total-import-cost');
    console.log('📊 Before - Total Cost USD:', response.totalCostUSD);
    console.log('💰 Before - Total Cost VND:', response.totalCostVND);
    console.log('📦 Before - Total Products:', response.totalProducts);

    // Add some test products
    console.log('\n➕ Adding test products...');
    
    const testProducts = [
      {
        name: 'Test Product 1',
        sku: 'TEST001',
        basePrice: 10.50, // $10.50 USD
        quantity: 100,
        warehouseId: warehouse._id,
        primarySupplierId: supplier._id,
        categoryId: category._id,
        description: 'Test product for cost calculation',
        unit: 'pcs',
        minStockLevel: 10,
        status: 'in stock',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Test Product 2',
        sku: 'TEST002',
        basePrice: 25.75, // $25.75 USD
        quantity: 50,
        warehouseId: warehouse._id,
        primarySupplierId: supplier._id,
        categoryId: category._id,
        description: 'Another test product',
        unit: 'pcs',
        minStockLevel: 5,
        status: 'in stock',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    // Insert products
    const insertedProducts = await Product.insertMany(testProducts);
    console.log(`✅ Added ${insertedProducts.length} test products`);

    // Calculate expected cost
    let expectedCostUSD = 0;
    testProducts.forEach(product => {
      const cost = product.basePrice * product.quantity;
      expectedCostUSD += cost;
      console.log(`   ${product.name}: $${product.basePrice} × ${product.quantity} = $${cost}`);
    });
    
    const expectedCostVND = expectedCostUSD * 26401;
    console.log(`📊 Expected Total Cost USD: $${expectedCostUSD}`);
    console.log(`💰 Expected Total Cost VND: ${expectedCostVND.toLocaleString()} VND`);

    // Test API after adding products
    console.log('\n🧪 Testing API after adding products...');
    response = await makeRequest('http://localhost:3003/api/reports/test/total-import-cost');
    console.log('📊 After - Total Cost USD:', response.totalCostUSD);
    console.log('💰 After - Total Cost VND:', response.totalCostVND);
    console.log('📦 After - Total Products:', response.totalProducts);

    // Verify calculation
    if (Math.abs(response.totalCostUSD - expectedCostUSD) < 0.01) {
      console.log('✅ API calculation is correct!');
    } else {
      console.log('❌ API calculation is incorrect');
      console.log(`   Expected: $${expectedCostUSD}`);
      console.log(`   Got: $${response.totalCostUSD}`);
    }

    // Test cash flow API
    console.log('\n🧪 Testing cash flow API...');
    const cashFlowResponse = await makeRequest('http://localhost:3003/api/reports/test/cash-flow?period=all');
    if (cashFlowResponse.success) {
      console.log('📊 Cash Flow - Total Cost:', cashFlowResponse.data.summary.totalCost);
      console.log('📝 Cash Flow - Message:', cashFlowResponse.data.message);
    }

    // Clean up - remove test products
    console.log('\n🧹 Cleaning up test products...');
    await Product.deleteMany({ sku: { $in: ['TEST001', 'TEST002'] } });
    console.log('✅ Test products removed');

    // Verify cleanup
    response = await makeRequest('http://localhost:3003/api/reports/test/total-import-cost');
    console.log('\n📊 After cleanup - Total Cost USD:', response.totalCostUSD);
    console.log('💰 After cleanup - Total Cost VND:', response.totalCostVND);
    console.log('📦 After cleanup - Total Products:', response.totalProducts);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

testAddProducts();
