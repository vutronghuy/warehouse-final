const mongoose = require('mongoose');
require('dotenv').config();

async function testImportFlow() {
  try {
    console.log('🔍 Testing import flow...');
    
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/warehouse');
    
    const Product = require('./models/products/product');
    const ImportReceipt = require('./models/import/ImportReceipt');
    const User = require('./models/User');
    const Category = require('./models/products/CategoryNew');
    
    // Check if we have required data
    const users = await User.find({ role: 'staff' }).lean();
    console.log('Staff users:', users.length);
    
    const categories = await Category.find({ status: 'active' }).lean();
    console.log('Active categories:', categories.length);
    
    const products = await Product.find({}).lean();
    console.log('Products:', products.length);
    
    const receipts = await ImportReceipt.find({}).lean();
    console.log('Import receipts:', receipts.length);
    
    if (receipts.length > 0) {
      console.log('Latest receipt:', receipts[receipts.length - 1]);
    }
    
    // Create a test user first (needed for category creation)
    let testUserId = null;
    if (users.length === 0) {
      console.log('Creating test staff user...');
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash('password123', 10);

      const testUser = new User({
        username: 'teststaff',
        email: 'test@staff.com',
        password: hashedPassword,
        role: 'staff',
        staff: {
          fullName: 'Test Staff',
          warehouseId: new mongoose.Types.ObjectId() // Dummy warehouse ID
        }
      });
      await testUser.save();
      testUserId = testUser._id;
      console.log('✅ Created test staff user');
    } else {
      testUserId = users[0]._id;
    }

    // Create a test category if none exists
    if (categories.length === 0) {
      console.log('Creating test category...');
      const testCategory = new Category({
        name: 'Test Category',
        code: 'TEST001',
        description: 'Test category for import',
        status: 'active',
        createdBy: testUserId
      });
      await testCategory.save();
      console.log('✅ Created test category');
    }
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testImportFlow();
