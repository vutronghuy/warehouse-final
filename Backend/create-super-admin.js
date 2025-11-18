// Script để tạo super admin
const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function createSuperAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/warehouse_db');
    console.log('✅ Connected to MongoDB');

    // Check if super admin already exists
    const existingSuperAdmin = await User.findOne({ 'admin.isSuperAdmin': true });
    if (existingSuperAdmin) {
      console.log('⚠️ Super admin already exists:', {
        id: existingSuperAdmin._id,
        username: existingSuperAdmin.admin.username,
        email: existingSuperAdmin.admin.email,
        isSuperAdmin: existingSuperAdmin.admin.isSuperAdmin
      });
      return;
    }

    // Create super admin
    const superAdmin = new User({
      role: 'admin',
      admin: {
        username: 'superadmin',
        password: 'superadmin123', // Change this in production
        fullName: 'Super Administrator',
        email: 'superadmin@warehouse.com',
        role: 'admin',
        status: 'active',
        isActive: true,
        isSuperAdmin: true
      }
    });

    await superAdmin.save();
    console.log('✅ Super admin created successfully:', {
      id: superAdmin._id,
      username: superAdmin.admin.username,
      email: superAdmin.admin.email,
      isSuperAdmin: superAdmin.admin.isSuperAdmin
    });

    console.log('🔑 Login credentials:');
    console.log('   Username: superadmin');
    console.log('   Password: superadmin123');
    console.log('   Email: superadmin@warehouse.com');

  } catch (error) {
    console.error('❌ Error creating super admin:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the script
createSuperAdmin();

