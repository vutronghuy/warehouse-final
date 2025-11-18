const mongoose = require('mongoose');

// Connect to MongoDB
const dbURI = 'mongodb+srv://vutronghuygrw24092003:HuyiucuaNganxinhgai@warehouse.qf0rlaq.mongodb.net/Warehouses';

async function debugCashFlow() {
  try {
    // Connect to MongoDB
    await mongoose.connect(dbURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB');

    const ImportReceipt = require('./models/import/ImportReceipt');
    const Invoice = require('./models/Invoice');

    console.log('🧪 Testing Cash Flow calculation manually...');

    // Test revenue calculation
    console.log('\n📊 REVENUE CALCULATION:');
    const revenueResult = await Invoice.aggregate([
      {
        $match: {
          deletedAt: null,
          status: { $in: ['paid', 'completed'] }
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: { $ifNull: ['$finalAmount', 0] } }
        }
      }
    ]);

    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;
    console.log(`Total Revenue: ${totalRevenue.toLocaleString()} VND`);

    // Test cost calculation
    console.log('\n💰 COST CALCULATION:');
    const costResult = await ImportReceipt.aggregate([
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
          }
        }
      }
    ]);

    const USD_TO_VND_RATE = 26401;
    const totalCostUSD = costResult.length > 0 ? costResult[0].totalCostUSD : 0;
    const totalCostVND = totalCostUSD * USD_TO_VND_RATE;

    console.log(`Total Cost USD: $${totalCostUSD.toLocaleString()}`);
    console.log(`Total Cost VND: ${totalCostVND.toLocaleString()} VND`);
    console.log(`USD to VND rate: ${USD_TO_VND_RATE}`);

    // Calculate profit
    const totalProfit = totalRevenue - totalCostVND;
    console.log(`\n📈 PROFIT CALCULATION:`);
    console.log(`Total Profit: ${totalProfit.toLocaleString()} VND`);

    // Test what the actual getCashFlow function would return
    console.log('\n🔍 SIMULATING getCashFlow API RESPONSE:');
    const apiResponse = {
      success: true,
      data: {
        summary: {
          totalRevenue: totalRevenue,
          totalCost: totalCostVND, // This should be in VND
          totalProfit: totalProfit
        },
        period: 'all',
        message: 'Total cash flow for all time - cost from ImportReceipt details (basePrice when imported)'
      }
    };

    console.log('API Response:', JSON.stringify(apiResponse, null, 2));

    // Check if there's any issue with the numbers
    console.log('\n🔍 NUMBER ANALYSIS:');
    console.log(`Revenue type: ${typeof totalRevenue}, value: ${totalRevenue}`);
    console.log(`Cost USD type: ${typeof totalCostUSD}, value: ${totalCostUSD}`);
    console.log(`Cost VND type: ${typeof totalCostVND}, value: ${totalCostVND}`);
    console.log(`Profit type: ${typeof totalProfit}, value: ${totalProfit}`);

    // Check for any NaN or Infinity values
    if (isNaN(totalRevenue)) console.log('⚠️ totalRevenue is NaN');
    if (isNaN(totalCostUSD)) console.log('⚠️ totalCostUSD is NaN');
    if (isNaN(totalCostVND)) console.log('⚠️ totalCostVND is NaN');
    if (isNaN(totalProfit)) console.log('⚠️ totalProfit is NaN');

    if (!isFinite(totalRevenue)) console.log('⚠️ totalRevenue is not finite');
    if (!isFinite(totalCostUSD)) console.log('⚠️ totalCostUSD is not finite');
    if (!isFinite(totalCostVND)) console.log('⚠️ totalCostVND is not finite');
    if (!isFinite(totalProfit)) console.log('⚠️ totalProfit is not finite');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

debugCashFlow();
