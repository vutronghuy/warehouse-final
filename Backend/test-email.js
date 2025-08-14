// Test email configuration
require('dotenv').config();
const nodemailer = require('nodemailer');

async function testEmail() {
  console.log('Testing email configuration...');
  console.log('SMTP_USER:', process.env.SMTP_USER);
  console.log('SMTP_PASS:', process.env.SMTP_PASS ? '***configured***' : 'NOT SET');
  
  try {
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

    // Test connection
    await transporter.verify();
    console.log('✅ SMTP connection successful!');

    // Send test email
    const testOTP = '123456';
    const mailOptions = {
      from: `"HinWarehouse System" <${process.env.EMAIL_FROM || process.env.SMTP_USER}>`,
      to: process.env.SMTP_USER, // Send to self for testing
      subject: 'Test Email - HinWarehouse OTP',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>🧪 Test Email</h2>
          <p>This is a test email to verify email configuration.</p>
          <div style="background-color: #f8f9fa; border: 2px dashed #4b3636; border-radius: 8px; padding: 20px; text-align: center;">
            <span style="font-size: 32px; font-weight: bold; color: #4b3636;">${testOTP}</span>
          </div>
          <p>If you receive this email, the configuration is working correctly!</p>
        </div>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Test email sent successfully!');
    console.log('Message ID:', result.messageId);
    
  } catch (error) {
    console.error('❌ Email test failed:', error.message);
    
    if (error.code === 'EAUTH') {
      console.log('\n🔧 Authentication failed. Please check:');
      console.log('1. Gmail account has 2-Step Verification enabled');
      console.log('2. App Password is correctly generated and copied');
      console.log('3. SMTP_PASS in .env file is the 16-character app password');
    }
  }
}

testEmail();
