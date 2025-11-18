const mongoose = require('mongoose');

// Connect to MongoDB
const dbURI = 'mongodb+srv://vutronghuygrw24092003:HuyiucuaNganxinhgai@warehouse.qf0rlaq.mongodb.net/Warehouses';

async function debugTimeSeries() {
  try {
    // Connect to MongoDB
    await mongoose.connect(dbURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB');

    const Invoice = require('./models/Invoice');

    // Test the exact aggregation used in getCashFlowTimeSeries
    console.log('🧪 Testing getCashFlowTimeSeries aggregation...\n');

    // Test for 2024 monthly data
    const year = 2024;
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(parseInt(year) + 1, 0, 1);
    const groupBy = {
      year: { $year: '$createdAt' },
      month: { $month: '$createdAt' }
    };

    console.log(`📅 Date range: ${startDate} to ${endDate}`);

    // Test revenue aggregation
    console.log('\n📊 Testing revenue aggregation...');
    const revenueData = await Invoice.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lt: endDate },
          deletedAt: null,
          status: { $in: ['paid', 'completed'] }
        }
      },
      {
        $group: {
          _id: groupBy,
          totalRevenue: { $sum: { $ifNull: ['$finalAmount', 0] } }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    console.log('Revenue data:', revenueData);

    // Test cost aggregation
    console.log('\n💰 Testing cost aggregation...');
    const costData = await Invoice.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lt: endDate },
          deletedAt: null
        }
      },
      {
        $unwind: '$details'
      },
      {
        $group: {
          _id: groupBy,
          totalCostUSD: { 
            $sum: { 
              $multiply: [
                { $ifNull: ['$details.unitPrice', 0] },
                { $ifNull: ['$details.quantity', 0] }
              ]
            }
          }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    console.log('Cost data:', costData);

    // Test what invoices exist
    console.log('\n📋 Checking existing invoices...');
    const invoices = await Invoice.find({ 
      deletedAt: null,
      createdAt: { $gte: startDate, $lt: endDate }
    });

    console.log(`Found ${invoices.length} invoices in ${year}`);
    invoices.forEach(invoice => {
      console.log(`  ${invoice.invoiceNumber}: ${invoice.createdAt}, Status: ${invoice.status}, Details: ${invoice.details.length}`);
    });

    // Test 2025 data
    console.log('\n🧪 Testing 2025 data...');
    const year2025 = 2025;
    const startDate2025 = new Date(year2025, 0, 1);
    const endDate2025 = new Date(parseInt(year2025) + 1, 0, 1);

    const costData2025 = await Invoice.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate2025, $lt: endDate2025 },
          deletedAt: null
        }
      },
      {
        $unwind: '$details'
      },
      {
        $group: {
          _id: groupBy,
          totalCostUSD: { 
            $sum: { 
              $multiply: [
                { $ifNull: ['$details.unitPrice', 0] },
                { $ifNull: ['$details.quantity', 0] }
              ]
            }
          }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    console.log('2025 Cost data:', costData2025);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

debugTimeSeries();
