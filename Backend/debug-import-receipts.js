const mongoose = require('mongoose');

// Connect to MongoDB
const dbURI = 'mongodb+srv://vutronghuygrw24092003:HuyiucuaNganxinhgai@warehouse.qf0rlaq.mongodb.net/Warehouses';

async function debugImportReceipts() {
  try {
    // Connect to MongoDB
    await mongoose.connect(dbURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB');

    const ImportReceipt = require('./models/import/ImportReceipt');

    // Get all ImportReceipts
    const receipts = await ImportReceipt.find({ deletedAt: null });
    console.log(`📦 Found ${receipts.length} ImportReceipts`);

    let totalFromTotalAmount = 0;
    let totalFromDetails = 0;

    receipts.forEach((receipt, index) => {
      console.log(`\n📋 ImportReceipt ${index + 1}: ${receipt.receiptNumber}`);
      console.log(`   Total Amount: $${receipt.totalAmount}`);
      console.log(`   Details count: ${receipt.details.length}`);
      
      totalFromTotalAmount += receipt.totalAmount || 0;

      let receiptDetailTotal = 0;
      receipt.details.forEach((detail, detailIndex) => {
        const itemTotal = (detail.unitPrice || 0) * (detail.quantity || 0);
        receiptDetailTotal += itemTotal;
        
        if (detailIndex < 3) { // Show first 3 items
          console.log(`     Item ${detailIndex + 1}: ${detail.productName || 'N/A'}`);
          console.log(`       Unit Price: $${detail.unitPrice || 0}`);
          console.log(`       Quantity: ${detail.quantity || 0}`);
          console.log(`       Total: $${itemTotal}`);
        }
      });
      
      console.log(`   Details Total: $${receiptDetailTotal}`);
      totalFromDetails += receiptDetailTotal;
    });

    console.log(`\n📊 SUMMARY:`);
    console.log(`Total from totalAmount field: $${totalFromTotalAmount}`);
    console.log(`Total from details calculation: $${totalFromDetails}`);
    console.log(`Difference: $${Math.abs(totalFromTotalAmount - totalFromDetails)}`);

    // Convert to VND
    const USD_TO_VND_RATE = 26401;
    console.log(`\n💰 VND Conversion (rate: ${USD_TO_VND_RATE}):`);
    console.log(`From totalAmount: ${(totalFromTotalAmount * USD_TO_VND_RATE).toLocaleString()} VND`);
    console.log(`From details: ${(totalFromDetails * USD_TO_VND_RATE).toLocaleString()} VND`);

    // Test the aggregation query used in API
    console.log(`\n🧪 Testing API aggregation query:`);
    const apiResult = await ImportReceipt.aggregate([
      {
        $match: {
          deletedAt: null
        }
      },
      {
        $unwind: '$details'
      },
      {
        $group: {
          _id: null,
          totalCostUSD: { 
            $sum: { 
              $multiply: [
                { $ifNull: ['$details.unitPrice', 0] },
                { $ifNull: ['$details.quantity', 0] }
              ]
            }
          },
          totalReceipts: { $addToSet: '$_id' }
        }
      },
      {
        $addFields: {
          totalReceipts: { $size: '$totalReceipts' }
        }
      }
    ]);

    if (apiResult.length > 0) {
      console.log(`API Result - Total Cost USD: $${apiResult[0].totalCostUSD}`);
      console.log(`API Result - Total Receipts: ${apiResult[0].totalReceipts}`);
      console.log(`API Result - Total Cost VND: ${(apiResult[0].totalCostUSD * USD_TO_VND_RATE).toLocaleString()} VND`);
    } else {
      console.log(`API Result: No data returned`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

debugImportReceipts();
