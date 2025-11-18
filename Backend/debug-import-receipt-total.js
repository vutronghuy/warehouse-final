const mongoose = require('mongoose');

// Connect to MongoDB
const dbURI = 'mongodb+srv://vutronghuygrw24092003:HuyiucuaNganxinhgai@warehouse.qf0rlaq.mongodb.net/Warehouses';

async function debugImportReceiptTotal() {
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

    receipts.forEach((receipt, index) => {
      console.log(`\n📋 ImportReceipt ${index + 1}: ${receipt.receiptNumber}`);
      console.log(`   Current totalAmount: $${receipt.totalAmount}`);
      console.log(`   Details count: ${receipt.details.length}`);
      
      let calculatedTotal = 0;
      let calculatedFromTotalPrice = 0;
      
      receipt.details.forEach((detail, detailIndex) => {
        const itemTotal = (detail.unitPrice || 0) * (detail.quantity || 0);
        const itemTotalPrice = detail.totalPrice || 0;
        
        calculatedTotal += itemTotal;
        calculatedFromTotalPrice += itemTotalPrice;
        
        if (detailIndex < 3) { // Show first 3 items
          console.log(`     Item ${detailIndex + 1}: ${detail.productName || 'N/A'}`);
          console.log(`       Unit Price: $${detail.unitPrice || 0}`);
          console.log(`       Quantity: ${detail.quantity || 0}`);
          console.log(`       Calculated: $${itemTotal}`);
          console.log(`       TotalPrice field: $${itemTotalPrice}`);
        }
      });
      
      console.log(`   Calculated total (unitPrice × quantity): $${calculatedTotal}`);
      console.log(`   Sum of totalPrice fields: $${calculatedFromTotalPrice}`);
      
      // Check which calculation matches current totalAmount
      if (Math.abs(receipt.totalAmount - calculatedTotal) < 0.01) {
        console.log(`   ✅ Current totalAmount matches unitPrice × quantity`);
      } else if (Math.abs(receipt.totalAmount - calculatedFromTotalPrice) < 0.01) {
        console.log(`   ✅ Current totalAmount matches sum of totalPrice fields`);
      } else {
        console.log(`   ❌ Current totalAmount doesn't match any calculation`);
        console.log(`      Difference from calculated: $${Math.abs(receipt.totalAmount - calculatedTotal)}`);
        console.log(`      Difference from totalPrice: $${Math.abs(receipt.totalAmount - calculatedFromTotalPrice)}`);
      }
    });

    // Test what the aggregation we use in reports returns
    console.log('\n🧪 Testing aggregation used in reports...');
    const aggregationResult = await ImportReceipt.aggregate([
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
          totalFromUnitPrice: { 
            $sum: { 
              $multiply: [
                { $ifNull: ['$details.unitPrice', 0] },
                { $ifNull: ['$details.quantity', 0] }
              ]
            }
          },
          totalFromTotalPrice: {
            $sum: { $ifNull: ['$details.totalPrice', 0] }
          }
        }
      }
    ]);

    if (aggregationResult.length > 0) {
      const result = aggregationResult[0];
      console.log(`📊 Aggregation results:`);
      console.log(`   Total from unitPrice × quantity: $${result.totalFromUnitPrice}`);
      console.log(`   Total from totalPrice fields: $${result.totalFromTotalPrice}`);
      
      const USD_TO_VND_RATE = 26401;
      console.log(`   In VND (unitPrice × quantity): ${(result.totalFromUnitPrice * USD_TO_VND_RATE).toLocaleString()}`);
      console.log(`   In VND (totalPrice): ${(result.totalFromTotalPrice * USD_TO_VND_RATE).toLocaleString()}`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

debugImportReceiptTotal();
