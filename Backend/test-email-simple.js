// Simple email test with current configuration
require('dotenv').config();
const nodemailer = require('nodemailer');

async function testEmailSimple() {
  console.log('🧪 Testing Email Configuration...\n');
  
  // Display current configuration
  console.log('📧 Current Configuration:');
  console.log('SMTP_HOST:', process.env.SMTP_HOST || 'NOT SET');
  console.log('SMTP_PORT:', process.env.SMTP_PORT || 'NOT SET');
  console.log('SMTP_USER:', process.env.SMTP_USER || 'NOT SET');
  console.log('SMTP_PASS:', process.env.SMTP_PASS ? '***configured***' : 'NOT SET');
  console.log('EMAIL_FROM:', process.env.EMAIL_FROM || 'NOT SET');
  
  // Check if required variables are set
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('\n❌ Email configuration is incomplete!');
    console.log('\n📝 Please create .env file with:');
    console.log('SMTP_HOST=smtp.gmail.com');
    console.log('SMTP_PORT=587');
    console.log('SMTP_USER=your-email@gmail.com');
    console.log('SMTP_PASS=your-app-password');
    console.log('EMAIL_FROM=your-email@gmail.com');
    return;
  }
  
  try {
    console.log('\n🔧 Creating transporter...');
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT || 587),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      },
      tls: {
        rejectUnauthorized: false
      }
    });
    
    console.log('✅ Transporter created successfully');
    
    console.log('\n🔍 Verifying connection...');
    await transporter.verify();
    console.log('✅ SMTP connection verified successfully!');
    
    console.log('\n📧 Sending test email...');
    const testEmail = {
      from: `"HinWarehouse System" <${process.env.EMAIL_FROM || process.env.SMTP_USER}>`,
      to: process.env.SMTP_USER, // Send to self for testing
      subject: 'Test Email - HinWarehouse System',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>🧪 Test Email</h2>
          <p>This is a test email to verify email configuration.</p>
          <p><strong>Time:</strong> ${new Date().toLocaleString('vi-VN')}</p>
          <p><strong>Configuration:</strong></p>
          <ul>
            <li>SMTP_HOST: ${process.env.SMTP_HOST || 'smtp.gmail.com'}</li>
            <li>SMTP_PORT: ${process.env.SMTP_PORT || 587}</li>
            <li>SMTP_USER: ${process.env.SMTP_USER}</li>
            <li>EMAIL_FROM: ${process.env.EMAIL_FROM || process.env.SMTP_USER}</li>
          </ul>
          <p>If you receive this email, the configuration is working correctly!</p>
        </div>
      `
    };
    
    const result = await transporter.sendMail(testEmail);
    console.log('✅ Test email sent successfully!');
    console.log('Message ID:', result.messageId);
    console.log('Response:', result.response);
    
    console.log('\n🎉 Email configuration is working!');
    console.log('You can now use the toggle user status feature.');
    
  } catch (error) {
    console.error('\n❌ Email test failed:');
    console.error('Error:', error.message);
    
    if (error.code === 'EAUTH') {
      console.log('\n🔐 Authentication Error:');
      console.log('- Check your SMTP_USER and SMTP_PASS');
      console.log('- For Gmail, use App Password (not regular password)');
      console.log('- Enable 2-factor authentication on Gmail');
    } else if (error.code === 'ECONNECTION') {
      console.log('\n🌐 Connection Error:');
      console.log('- Check your internet connection');
      console.log('- Check SMTP_HOST and SMTP_PORT');
    } else {
      console.log('\n🔧 General Error:');
      console.log('- Check your email configuration');
      console.log('- Verify SMTP settings');
    }
  }
}

// Run the test
testEmailSimple();


























