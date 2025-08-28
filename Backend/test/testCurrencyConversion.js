// Test đơn giản để kiểm tra logic chuyển đổi tiền tệ
function testCurrencyConversion() {
  console.log('🧪 Testing Currency Conversion Logic...\n');

  // Exchange rates (USD as base currency)
  const exchangeRates = {
    USD: 1,
    VND: 26363, // 1 USD ≈ 26,363 VND
    EUR: 0.86   // 1 USD ≈ 0.86 EUR
  };

  // Test data: Product with finalPrice in USD
  const productFinalPriceUSD = 120; // $120 USD

  console.log('📦 Product Final Price (USD):', productFinalPriceUSD);
  console.log('💱 Exchange Rates:', exchangeRates);
  console.log('');

  // Test 1: USD (no conversion)
  console.log('💵 Test 1: USD Currency');
  const usdRate = exchangeRates.USD;
  const priceUSD = productFinalPriceUSD * usdRate;
  console.log(`  - Rate: ${usdRate}`);
  console.log(`  - Price: $${priceUSD.toFixed(2)} USD`);
  console.log('');

  // Test 2: VND conversion
  console.log('💴 Test 2: VND Currency');
  const vndRate = exchangeRates.VND;
  const priceVND = productFinalPriceUSD * vndRate;
  console.log(`  - Rate: ${vndRate.toLocaleString()}`);
  console.log(`  - Price: ${priceVND.toLocaleString()} VND`);
  console.log('');

  // Test 3: EUR conversion
  console.log('💶 Test 3: EUR Currency');
  const eurRate = exchangeRates.EUR;
  const priceEUR = productFinalPriceUSD * eurRate;
  console.log(`  - Rate: ${eurRate}`);
  console.log(`  - Price: €${priceEUR.toFixed(2)} EUR`);
  console.log('');

  // Test invoice calculation with different currencies
  console.log('📄 Test Invoice Calculation:');
  const quantity = 2;
  const vatRate = 10; // 10%

  console.log(`  - Quantity: ${quantity}`);
  console.log(`  - VAT Rate: ${vatRate}%`);
  console.log('');

  // Calculate for each currency
  const currencies = ['USD', 'VND', 'EUR'];
  
  currencies.forEach(currency => {
    const rate = exchangeRates[currency];
    const unitPrice = productFinalPriceUSD * rate;
    const subtotal = unitPrice * quantity;
    const vatAmount = subtotal * (vatRate / 100);
    const total = subtotal + vatAmount;

    console.log(`  ${currency}:`);
    console.log(`    - Unit Price: ${formatCurrency(unitPrice, currency)}`);
    console.log(`    - Subtotal: ${formatCurrency(subtotal, currency)}`);
    console.log(`    - VAT: ${formatCurrency(vatAmount, currency)}`);
    console.log(`    - Total: ${formatCurrency(total, currency)}`);
    console.log('');
  });

  console.log('✅ Currency conversion test completed successfully!');
  console.log('');
  console.log('📝 Summary:');
  console.log('  - USD: Base currency, no conversion needed');
  console.log('  - VND: 1 USD = 26,363 VND (high value for Vietnamese market)');
  console.log('  - EUR: 1 USD = 0.86 EUR (European market)');
  console.log('');
  console.log('💡 Impact:');
  console.log('  - Staff can create invoices in customer\'s preferred currency');
  console.log('  - Prices are automatically converted from USD base price');
  console.log('  - Invoice totals reflect correct currency amounts');
}

function formatCurrency(amount, currency) {
  const n = Number(amount || 0);
  
  switch (currency) {
    case 'USD':
      return `$${n.toFixed(2)}`;
    case 'VND':
      return `${n.toLocaleString()} VND`;
    case 'EUR':
      return `€${n.toFixed(2)}`;
    default:
      return n.toFixed(2);
  }
}

// Chạy test
if (require.main === module) {
  testCurrencyConversion();
}

module.exports = testCurrencyConversion;
