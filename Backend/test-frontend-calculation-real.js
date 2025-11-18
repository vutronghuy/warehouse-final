const mongoose = require('mongoose');

// Connect to MongoDB
const dbURI = 'mongodb+srv://vutronghuygrw24092003:HuyiucuaNganxinhgai@warehouse.qf0rlaq.mongodb.net/Warehouses';

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount || 0);
}

// Simulate frontend calculation
function calculateTotalAmount(receipt) {
  if (!receipt.details || !Array.isArray(receipt.details)) {
    return 0;
  }
  
  return receipt.details.reduce((total, detail) => {
    const unitPrice = detail.unitPrice || 0;
    const quantity = detail.quantity || 0;
    return total + (unitPrice * quantity);
  }, 0);
}

async function testFrontendCalculationReal() {
  try {
    // Connect to MongoDB
    await mongoose.connect(dbURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB');

    const ImportReceipt = require('./models/import/ImportReceipt');

    // Get real data from database
    const receipts = await ImportReceipt.find({ deletedAt: null });
    console.log(`📦 Found ${receipts.length} ImportReceipts\n`);

    receipts.forEach((receipt, index) => {
      console.log(`📋 Receipt ${index + 1}: ${receipt.receiptNumber}`);
      
      // Current display (using totalAmount field)
      const currentDisplay = receipt.totalAmount;
      console.log(`   Current display (totalAmount field): ${formatCurrency(currentDisplay)}`);
      
      // New calculation (unitPrice × quantity)
      const newCalculation = calculateTotalAmount(receipt);
      console.log(`   New calculation (unitPrice × quantity): ${formatCurrency(newCalculation)}`);
      
      // Details info
      console.log(`   Details count: ${receipt.details.length}`);
      
      // Sample calculation from first few items
      let sampleTotal = 0;
      console.log(`   Sample items calculation (first 3):`);
      receipt.details.slice(0, 3).forEach((detail, detailIndex) => {
        const itemTotal = detail.unitPrice * detail.quantity;
        sampleTotal += itemTotal;
        console.log(`     ${detail.productName}: $${detail.unitPrice} × ${detail.quantity} = ${formatCurrency(itemTotal)}`);
      });
      console.log(`   Sample total (first 3 items): ${formatCurrency(sampleTotal)}`);
      
      // Check if they match
      if (Math.abs(currentDisplay - newCalculation) < 0.01) {
        console.log(`   ✅ Current and new calculation match!`);
      } else {
        console.log(`   ❌ Calculations differ by: ${formatCurrency(Math.abs(currentDisplay - newCalculation))}`);
      }
      
      console.log(''); // Empty line
    });

    // Test the overall impact
    console.log('🎯 Overall Impact:');
    const totalCurrent = receipts.reduce((sum, receipt) => sum + receipt.totalAmount, 0);
    const totalNew = receipts.reduce((sum, receipt) => sum + calculateTotalAmount(receipt), 0);
    
    console.log(`Total using current method: ${formatCurrency(totalCurrent)}`);
    console.log(`Total using new calculation: ${formatCurrency(totalNew)}`);
    
    if (Math.abs(totalCurrent - totalNew) < 0.01) {
      console.log(`✅ No change in total - calculation is already correct!`);
    } else {
      console.log(`❌ Total would change by: ${formatCurrency(Math.abs(totalCurrent - totalNew))}`);
    }

    console.log('\n📝 Conclusion:');
    if (Math.abs(totalCurrent - totalNew) < 0.01) {
      console.log('✅ The database totalAmount is already correct (unitPrice × quantity)');
      console.log('✅ The frontend change will provide redundancy and ensure accuracy');
      console.log('✅ No visual change expected for users');
    } else {
      console.log('❌ The database totalAmount is incorrect');
      console.log('✅ The frontend change will fix the display');
      console.log('⚠️ Users will see corrected totals');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

testFrontendCalculationReal();
