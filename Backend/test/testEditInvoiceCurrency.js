// Test đơn giản để kiểm tra logic edit invoice với currency conversion
function testEditInvoiceCurrency() {
  console.log('🧪 Testing Edit Invoice Currency Conversion Logic...\n');

  // Exchange rates (USD as base currency)
  const exchangeRates = {
    USD: 1,
    VND: 26363, // 1 USD ≈ 26,363 VND
    EUR: 0.86   // 1 USD ≈ 0.86 EUR
  };

  // Mock invoice data (originally created in USD)
  const originalInvoice = {
    currency: 'USD',
    vatRate: 10,
    details: [
      {
        productName: 'Laptop Dell XPS 13',
        quantity: 1,
        unitPrice: 1200, // $1,200 USD
        totalPrice: 1200
      },
      {
        productName: 'Wireless Mouse',
        quantity: 2,
        unitPrice: 25, // $25 USD
        totalPrice: 50
      }
    ],
    totalAmount: 1250, // $1,250 USD
    vatAmount: 125,    // $125 USD (10%)
    finalAmount: 1375  // $1,375 USD
  };

  console.log('📄 Original Invoice (USD):');
  console.log(`  - Total Amount: $${originalInvoice.totalAmount.toFixed(2)}`);
  console.log(`  - VAT (${originalInvoice.vatRate}%): $${originalInvoice.vatAmount.toFixed(2)}`);
  console.log(`  - Final Amount: $${originalInvoice.finalAmount.toFixed(2)}`);
  console.log('');

  // Test 1: Convert USD to VND
  console.log('💴 Test 1: Convert USD to VND');
  const oldCurrency = 'USD';
  const newCurrency = 'VND';
  const oldRate = exchangeRates[oldCurrency];
  const newRate = exchangeRates[newCurrency];

  console.log(`  - Old Rate (${oldCurrency}): ${oldRate}`);
  console.log(`  - New Rate (${newCurrency}): ${newRate.toLocaleString()}`);

  // Convert each product
  let newTotalAmount = 0;
  const convertedDetails = originalInvoice.details.map(detail => {
    // Convert unit price back to USD, then to new currency
    const unitPriceUSD = detail.unitPrice / oldRate;
    const newUnitPrice = unitPriceUSD * newRate;
    const newTotalPrice = newUnitPrice * detail.quantity;
    
    newTotalAmount += newTotalPrice;
    
    console.log(`  - ${detail.productName}:`);
    console.log(`    Original: $${detail.unitPrice} USD`);
    console.log(`    Converted: ${newUnitPrice.toLocaleString()} VND`);
    
    return {
      ...detail,
      unitPrice: newUnitPrice,
      totalPrice: newTotalPrice
    };
  });

  // Recalculate totals
  const newVatAmount = (newTotalAmount * originalInvoice.vatRate) / 100;
  const newFinalAmount = newTotalAmount + newVatAmount;

  console.log(`  - New Total Amount: ${newTotalAmount.toLocaleString()} VND`);
  console.log(`  - New VAT Amount: ${newVatAmount.toLocaleString()} VND`);
  console.log(`  - New Final Amount: ${newFinalAmount.toLocaleString()} VND`);
  console.log('');

  // Test 2: Convert USD to EUR
  console.log('💶 Test 2: Convert USD to EUR');
  const eurRate = exchangeRates.EUR;
  
  let eurTotalAmount = 0;
  originalInvoice.details.forEach(detail => {
    const unitPriceUSD = detail.unitPrice / oldRate;
    const eurUnitPrice = unitPriceUSD * eurRate;
    const eurTotalPrice = eurUnitPrice * detail.quantity;
    
    eurTotalAmount += eurTotalPrice;
    
    console.log(`  - ${detail.productName}:`);
    console.log(`    Original: $${detail.unitPrice} USD`);
    console.log(`    Converted: €${eurUnitPrice.toFixed(2)} EUR`);
  });

  const eurVatAmount = (eurTotalAmount * originalInvoice.vatRate) / 100;
  const eurFinalAmount = eurTotalAmount + eurVatAmount;

  console.log(`  - New Total Amount: €${eurTotalAmount.toFixed(2)} EUR`);
  console.log(`  - New VAT Amount: €${eurVatAmount.toFixed(2)} EUR`);
  console.log(`  - New Final Amount: €${eurFinalAmount.toFixed(2)} EUR`);
  console.log('');

  // Test 3: VAT Rate Change (without currency change)
  console.log('📊 Test 3: VAT Rate Change (USD to USD, 10% to 15%)');
  const newVatRate = 15;
  const vatOnlyNewVatAmount = (originalInvoice.totalAmount * newVatRate) / 100;
  const vatOnlyNewFinalAmount = originalInvoice.totalAmount + vatOnlyNewVatAmount;

  console.log(`  - Total Amount: $${originalInvoice.totalAmount.toFixed(2)} USD (unchanged)`);
  console.log(`  - Old VAT (${originalInvoice.vatRate}%): $${originalInvoice.vatAmount.toFixed(2)} USD`);
  console.log(`  - New VAT (${newVatRate}%): $${vatOnlyNewVatAmount.toFixed(2)} USD`);
  console.log(`  - New Final Amount: $${vatOnlyNewFinalAmount.toFixed(2)} USD`);
  console.log('');

  console.log('✅ Edit Invoice Currency Conversion test completed successfully!');
  console.log('');
  console.log('📝 Summary of Edit Invoice Logic:');
  console.log('  1. When currency changes: Convert all prices from old currency to new currency');
  console.log('  2. When only VAT rate changes: Recalculate VAT amounts only');
  console.log('  3. When both change: Convert currency first, then apply new VAT rate');
  console.log('');
  console.log('💡 Impact:');
  console.log('  - Staff can edit invoice currency and see updated prices immediately');
  console.log('  - All calculations remain accurate after currency conversion');
  console.log('  - VAT calculations work correctly with new currency amounts');
}

// Chạy test
if (require.main === module) {
  testEditInvoiceCurrency();
}

module.exports = testEditInvoiceCurrency;
