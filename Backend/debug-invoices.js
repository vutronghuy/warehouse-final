const mongoose = require('mongoose');

// Connect to MongoDB
const dbURI = 'mongodb+srv://vutronghuygrw24092003:HuyiucuaNganxinhgai@warehouse.qf0rlaq.mongodb.net/Warehouses';

async function debugInvoices() {
  try {
    // Connect to MongoDB
    await mongoose.connect(dbURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB');

    const Invoice = require('./models/Invoice');

    // Get all invoices
    const invoices = await Invoice.find({ deletedAt: null });
    console.log(`📦 Found ${invoices.length} Invoices`);

    if (invoices.length > 0) {
      console.log('\n📋 Sample Invoices:');
      invoices.slice(0, 3).forEach((invoice, index) => {
        console.log(`\n${index + 1}. Invoice: ${invoice.invoiceNumber || 'N/A'}`);
        console.log(`   Created: ${invoice.createdAt}`);
        console.log(`   Final Amount: ${invoice.finalAmount || 0}`);
        console.log(`   Status: ${invoice.status || 'N/A'}`);
        console.log(`   Items count: ${invoice.items ? invoice.items.length : 0}`);
        
        if (invoice.items && invoice.items.length > 0) {
          console.log(`   Sample items:`);
          invoice.items.slice(0, 2).forEach((item, itemIndex) => {
            console.log(`     Item ${itemIndex + 1}:`);
            console.log(`       Product: ${item.productName || item.name || 'N/A'}`);
            console.log(`       BasePrice: $${item.basePrice || 'N/A'}`);
            console.log(`       Quantity: ${item.quantity || 'N/A'}`);
            console.log(`       Price: $${item.price || 'N/A'}`);
            console.log(`       Total: $${item.total || 'N/A'}`);
          });
        } else {
          console.log(`   No items found`);
        }
      });

      // Test aggregation for basePrice calculation
      console.log('\n🧪 Testing basePrice aggregation...');
      
      const basePriceResult = await Invoice.aggregate([
        {
          $match: {
            deletedAt: null
          }
        },
        {
          $unwind: '$items'
        },
        {
          $group: {
            _id: null,
            totalBasePriceUSD: { 
              $sum: { 
                $multiply: [
                  { $ifNull: ['$items.basePrice', 0] },
                  { $ifNull: ['$items.quantity', 0] }
                ]
              }
            },
            totalInvoices: { $addToSet: '$_id' },
            totalItems: { $sum: 1 }
          }
        },
        {
          $addFields: {
            totalInvoices: { $size: '$totalInvoices' }
          }
        }
      ]);

      if (basePriceResult.length > 0) {
        const result = basePriceResult[0];
        console.log(`📊 BasePrice calculation result:`);
        console.log(`   Total BasePrice USD: $${result.totalBasePriceUSD}`);
        console.log(`   Total Invoices: ${result.totalInvoices}`);
        console.log(`   Total Items: ${result.totalItems}`);
        
        const USD_TO_VND_RATE = 26401;
        const totalBasePriceVND = result.totalBasePriceUSD * USD_TO_VND_RATE;
        console.log(`   Total BasePrice VND: ${totalBasePriceVND.toLocaleString()}`);
      } else {
        console.log(`❌ No basePrice data found`);
      }

      // Test by month aggregation
      console.log('\n🧪 Testing monthly basePrice aggregation...');
      
      const monthlyResult = await Invoice.aggregate([
        {
          $match: {
            deletedAt: null,
            createdAt: { $gte: new Date(2024, 0, 1), $lt: new Date(2026, 0, 1) }
          }
        },
        {
          $unwind: '$items'
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            totalBasePriceUSD: { 
              $sum: { 
                $multiply: [
                  { $ifNull: ['$items.basePrice', 0] },
                  { $ifNull: ['$items.quantity', 0] }
                ]
              }
            }
          }
        },
        {
          $sort: { '_id.year': 1, '_id.month': 1 }
        }
      ]);

      if (monthlyResult.length > 0) {
        console.log(`📊 Monthly basePrice results:`);
        monthlyResult.forEach(item => {
          console.log(`   ${item._id.year}/${item._id.month}: $${item.totalBasePriceUSD}`);
        });
      } else {
        console.log(`❌ No monthly basePrice data found`);
      }

    } else {
      console.log('❌ No invoices found in database');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

debugInvoices();
