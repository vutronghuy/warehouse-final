const mongoose = require('mongoose');

// Connect to MongoDB
const dbURI = 'mongodb+srv://vutronghuygrw24092003:HuyiucuaNganxinhgai@warehouse.qf0rlaq.mongodb.net/Warehouses';

async function cleanupInvoices() {
  try {
    // Connect to MongoDB
    await mongoose.connect(dbURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB');

    const Invoice = require('./models/Invoice');

    // Delete test invoices
    const result = await Invoice.deleteMany({ 
      invoiceNumber: { $regex: /^INV-TEST/ } 
    });
    
    console.log(`🗑️ Deleted ${result.deletedCount} test invoices`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

cleanupInvoices();
