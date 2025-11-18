// Script để cập nhật user hiện tại thành Super Admin
const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function makeCurrentUserSuperAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/warehouse_db');
    console.log('✅ Connected to MongoDB');

    // Lấy tất cả admin users
    const adminUsers = await User.find({ role: 'admin' }).lean();
    
    console.log('👥 Found admin users:');
    adminUsers.forEach((user, index) => {
      console.log(`${index + 1}. ID: ${user._id}`);
      console.log(`   Username: ${user.admin?.username || 'N/A'}`);
      console.log(`   Email: ${user.admin?.email || 'N/A'}`);
      console.log(`   Full Name: ${user.admin?.fullName || 'N/A'}`);
      console.log(`   Is Super Admin: ${user.admin?.isSuperAdmin || false}`);
      console.log(`   Status: ${user.admin?.status || 'N/A'}`);
      console.log(`   Is Active: ${user.admin?.isActive || false}`);
      console.log('---');
    });

    if (adminUsers.length === 0) {
      console.log('❌ No admin users found. Please create an admin first.');
      return;
    }

    // Cập nhật tất cả admin thành Super Admin
    const updateResult = await User.updateMany(
      { role: 'admin' },
      {
        $set: {
          'admin.isSuperAdmin': true,
          'admin.status': 'active',
          'admin.isActive': true
        }
      }
    );

    console.log(`✅ Updated ${updateResult.modifiedCount} admin users to Super Admin`);

    // Kiểm tra kết quả
    const superAdmins = await User.find({ 
      role: 'admin', 
      'admin.isSuperAdmin': true 
    }).lean();

    console.log('🔍 Super Admins after update:');
    superAdmins.forEach((user, index) => {
      console.log(`${index + 1}. ${user.admin?.username} (${user.admin?.email})`);
    });

    console.log('\n🎉 All admin users are now Super Admins!');
    console.log('You can now test the toggle status API.');

  } catch (error) {
    console.error('❌ Error making users super admin:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the script
makeCurrentUserSuperAdmin();

