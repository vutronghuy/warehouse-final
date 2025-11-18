const mongoose = require('mongoose');

// Connect to MongoDB
const dbURI = 'mongodb+srv://vutronghuygrw24092003:HuyiucuaNganxinhgai@warehouse.qf0rlaq.mongodb.net/Warehouses';

async function testCreateInvoices() {
  try {
    // Connect to MongoDB
    await mongoose.connect(dbURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB');

    const Invoice = require('./models/Invoice');
    const Customer = require('./models/Customer');
    const User = require('./models/User');
    const Warehouse = require('./models/warehouse/Warehouse');

    // Get first customer
    const customer = await Customer.findOne();
    if (!customer) {
      console.log('❌ No customer found');
      return;
    }
    console.log(`📦 Using customer: ${customer.name}`);

    // Get first user (staff)
    const staff = await User.findOne();
    if (!staff) {
      console.log('❌ No staff found');
      return;
    }
    console.log(`👤 Using staff: ${staff.name || staff.username}`);

    // Get first warehouse
    const warehouse = await Warehouse.findOne();
    if (!warehouse) {
      console.log('❌ No warehouse found');
      return;
    }
    console.log(`🏢 Using warehouse: ${warehouse.name}`);

    // Create test invoices for different months
    const testInvoices = [
      {
        invoiceNumber: 'INV-TEST-001',
        customerId: customer._id,
        customerName: customer.name,
        createdByStaff: staff._id,
        warehouseId: warehouse._id,
        exportReceiptId: new mongoose.Types.ObjectId(), // Dummy export receipt ID
        dueDate: new Date(2024, 8, 30),
        details: [
          {
            productId: new mongoose.Types.ObjectId(),
            productName: 'iPhone 11 64GB',
            unitPrice: 800, // $800 USD unit price (this will be our "basePrice")
            quantity: 2,
            totalPrice: 1600
          },
          {
            productId: new mongoose.Types.ObjectId(),
            productName: 'iPhone 11 128GB',
            unitPrice: 900, // $900 USD unit price (this will be our "basePrice")
            quantity: 1,
            totalPrice: 900
          }
        ],
        subtotal: 2500,
        totalAmount: 2500,
        finalAmount: 2500 * 26401, // Convert to VND
        status: 'paid',
        createdAt: new Date(2024, 8, 15), // September 2024
        updatedAt: new Date(2024, 8, 15)
      },
      {
        invoiceNumber: 'INV-TEST-002',
        customerId: customer._id,
        customerName: customer.name,
        createdByStaff: staff._id,
        warehouseId: warehouse._id,
        exportReceiptId: new mongoose.Types.ObjectId(), // Dummy export receipt ID
        dueDate: new Date(2024, 9, 25),
        details: [
          {
            productId: new mongoose.Types.ObjectId(),
            productName: 'MacBook Pro 16-inch',
            unitPrice: 2500, // $2500 USD unit price (this will be our "basePrice")
            quantity: 1,
            totalPrice: 2500
          }
        ],
        subtotal: 2500,
        totalAmount: 2500,
        finalAmount: 2500 * 26401, // Convert to VND
        status: 'paid',
        createdAt: new Date(2024, 9, 10), // October 2024
        updatedAt: new Date(2024, 9, 10)
      },
      {
        invoiceNumber: 'INV-TEST-003',
        customerId: customer._id,
        customerName: customer.name,
        createdByStaff: staff._id,
        warehouseId: warehouse._id,
        exportReceiptId: new mongoose.Types.ObjectId(), // Dummy export receipt ID
        dueDate: new Date(2025, 1, 5),
        details: [
          {
            productId: new mongoose.Types.ObjectId(),
            productName: 'Dell XPS 13',
            unitPrice: 1200, // $1200 USD unit price (this will be our "basePrice")
            quantity: 3,
            totalPrice: 3600
          }
        ],
        subtotal: 3600,
        totalAmount: 3600,
        finalAmount: 3600 * 26401, // Convert to VND
        status: 'paid',
        createdAt: new Date(2025, 0, 20), // January 2025
        updatedAt: new Date(2025, 0, 20)
      }
    ];

    // Insert test invoices
    console.log('\n➕ Creating test invoices...');
    const insertedInvoices = await Invoice.insertMany(testInvoices);
    console.log(`✅ Created ${insertedInvoices.length} test invoices`);

    // Calculate expected basePrice costs
    let expectedBasePriceCost = 0;
    testInvoices.forEach((invoice, index) => {
      let invoiceBasePriceCost = 0;
      invoice.details.forEach(item => {
        const cost = item.unitPrice * item.quantity;
        invoiceBasePriceCost += cost;
      });
      expectedBasePriceCost += invoiceBasePriceCost;
      console.log(`   ${invoice.invoiceNumber}: BasePrice cost = $${invoiceBasePriceCost}`);
    });

    console.log(`📊 Total expected basePrice cost: $${expectedBasePriceCost}`);
    console.log(`💰 Total expected basePrice cost VND: ${(expectedBasePriceCost * 26401).toLocaleString()}`);

    // Test the aggregation
    console.log('\n🧪 Testing basePrice aggregation...');
    const result = await Invoice.aggregate([
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
          totalBasePriceUSD: {
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

    if (result.length > 0) {
      const actualCost = result[0].totalBasePriceUSD;
      console.log(`📊 Actual aggregation result: $${actualCost}`);
      
      if (Math.abs(actualCost - expectedBasePriceCost) < 0.01) {
        console.log('✅ Aggregation calculation is correct!');
      } else {
        console.log('❌ Aggregation calculation is wrong');
        console.log(`   Expected: $${expectedBasePriceCost}`);
        console.log(`   Got: $${actualCost}`);
      }
    }

    // Test monthly aggregation
    console.log('\n🧪 Testing monthly aggregation...');
    const monthlyResult = await Invoice.aggregate([
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
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          totalBasePriceUSD: {
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

    console.log('📊 Monthly basePrice costs:');
    monthlyResult.forEach(item => {
      console.log(`   ${item._id.year}/${item._id.month}: $${item.totalBasePriceUSD}`);
    });

    console.log('\n✅ Test invoices created successfully!');
    console.log('🔍 Now you can test the time series API to see line chart cost data');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

testCreateInvoices();
