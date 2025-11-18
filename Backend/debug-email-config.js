// Debug email configuration
require('dotenv').config();

console.log('🔍 Debugging Email Configuration...\n');

// Check environment variables
console.log('📧 Email Configuration:');
console.log('SMTP_HOST:', process.env.SMTP_HOST || 'NOT SET');
console.log('SMTP_PORT:', process.env.SMTP_PORT || 'NOT SET');
console.log('SMTP_USER:', process.env.SMTP_USER || 'NOT SET');
console.log('SMTP_PASS:', process.env.SMTP_PASS ? '***configured***' : 'NOT SET');
console.log('EMAIL_FROM:', process.env.EMAIL_FROM || 'NOT SET');

console.log('\n🔧 Required Configuration:');
console.log('✅ SMTP_HOST: smtp.gmail.com (or your SMTP server)');
console.log('✅ SMTP_PORT: 587 (for Gmail)');
console.log('✅ SMTP_USER: your-email@gmail.com');
console.log('✅ SMTP_PASS: your-app-password (not regular password)');
console.log('✅ EMAIL_FROM: your-email@gmail.com');

console.log('\n📝 To fix email issues:');
console.log('1. Create .env file in Backend folder');
console.log('2. Add the following configuration:');
console.log('');
console.log('SMTP_HOST=smtp.gmail.com');
console.log('SMTP_PORT=587');
console.log('SMTP_USER=your-email@gmail.com');
console.log('SMTP_PASS=your-app-password');
console.log('EMAIL_FROM=your-email@gmail.com');
console.log('');
console.log('3. For Gmail, use App Password (not regular password)');
console.log('4. Enable 2-factor authentication on Gmail');
console.log('5. Generate App Password in Gmail settings');

console.log('\n🧪 Test email configuration:');
console.log('Run: node test-email.js');

// Check if .env file exists
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  console.log('\n✅ .env file exists');
  const envContent = fs.readFileSync(envPath, 'utf8');
  console.log('📄 .env content:');
  console.log(envContent);
} else {
  console.log('\n❌ .env file does not exist');
  console.log('📝 Create .env file with email configuration');
}

