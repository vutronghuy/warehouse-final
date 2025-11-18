// Test email notification for user deactivation/activation
require('dotenv').config();
const nodemailer = require('nodemailer');

async function testEmailNotification() {
  console.log('🧪 Testing email notification...');
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

    // Test deactivation email
    const deactivationEmail = {
      from: `"HinWarehouse System" <${process.env.EMAIL_FROM || process.env.SMTP_USER}>`,
      to: process.env.SMTP_USER, // Send to self for testing
      subject: 'TEST: Tài khoản đã bị vô hiệu hóa - HinWarehouse',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #dc2626; margin: 0; font-size: 24px;">⚠️ Tài khoản đã bị vô hiệu hóa</h1>
              <p style="color: #666; margin: 5px 0 0 0;">HinWarehouse System</p>
            </div>

            <h2 style="color: #333; margin-bottom: 20px;">Thông báo quan trọng</h2>

            <p style="color: #555; line-height: 1.6; margin-bottom: 20px;">
              Xin chào <strong>Test User</strong>,
            </p>

            <p style="color: #555; line-height: 1.6; margin-bottom: 20px;">
              Tài khoản của bạn đã bị vô hiệu hóa bởi Super Admin. Từ thời điểm này, bạn sẽ không thể đăng nhập vào hệ thống.
            </p>

            <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h3 style="color: #dc2626; margin: 0 0 10px 0;">🚫 Quyền truy cập đã bị thu hồi</h3>
              <ul style="color: #7f1d1d; margin: 0; padding-left: 20px;">
                <li>Không thể đăng nhập vào hệ thống</li>
                <li>Tất cả phiên đăng nhập hiện tại đã bị đăng xuất</li>
                <li>Không thể truy cập các chức năng của hệ thống</li>
              </ul>
            </div>

            <div style="background-color: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h3 style="color: #0369a1; margin: 0 0 10px 0;">📞 Liên hệ để được hỗ trợ</h3>
              <p style="color: #0c4a6e; margin: 0;">
                Nếu bạn cho rằng đây là sự nhầm lẫn hoặc cần được hỗ trợ, vui lòng liên hệ với Super Admin để được giải quyết.
              </p>
            </div>

            <div style="background-color: #f8f9fa; border-radius: 8px; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; color: #6c757d; font-size: 14px;">
                <strong>📅 Thời gian:</strong> ${new Date().toLocaleString('vi-VN')}<br>
                <strong>👤 Thực hiện bởi:</strong> Super Admin<br>
                <strong>🔒 Lý do:</strong> Tài khoản đã bị vô hiệu hóa
              </p>
            </div>

            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

            <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
              Email này được gửi tự động từ hệ thống HinWarehouse.<br>
              Vui lòng không trả lời email này.
            </p>
          </div>
        </div>
      `
    };

    const result1 = await transporter.sendMail(deactivationEmail);
    console.log('✅ Deactivation test email sent!');
    console.log('Message ID:', result1.messageId);

    // Test reactivation email
    const reactivationEmail = {
      from: `"HinWarehouse System" <${process.env.EMAIL_FROM || process.env.SMTP_USER}>`,
      to: process.env.SMTP_USER, // Send to self for testing
      subject: 'TEST: Tài khoản đã được kích hoạt lại - HinWarehouse',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #16a34a; margin: 0; font-size: 24px;">✅ Tài khoản đã được kích hoạt</h1>
              <p style="color: #666; margin: 5px 0 0 0;">HinWarehouse System</p>
            </div>

            <h2 style="color: #333; margin-bottom: 20px;">Thông báo tích cực</h2>

            <p style="color: #555; line-height: 1.6; margin-bottom: 20px;">
              Xin chào <strong>Test User</strong>,
            </p>

            <p style="color: #555; line-height: 1.6; margin-bottom: 20px;">
              Tài khoản của bạn đã được kích hoạt lại bởi Super Admin. Bạn có thể đăng nhập vào hệ thống bình thường.
            </p>

            <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h3 style="color: #16a34a; margin: 0 0 10px 0;">🎉 Quyền truy cập đã được khôi phục</h3>
              <ul style="color: #166534; margin: 0; padding-left: 20px;">
                <li>Có thể đăng nhập vào hệ thống</li>
                <li>Truy cập đầy đủ các chức năng theo quyền hạn</li>
                <li>Hoạt động bình thường như trước đây</li>
              </ul>
            </div>

            <div style="background-color: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h3 style="color: #0369a1; margin: 0 0 10px 0;">🔐 Hướng dẫn đăng nhập</h3>
              <p style="color: #0c4a6e; margin: 0;">
                Bạn có thể đăng nhập bằng thông tin tài khoản hiện tại. Nếu gặp vấn đề, vui lòng liên hệ với Super Admin.
              </p>
            </div>

            <div style="background-color: #f8f9fa; border-radius: 8px; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; color: #6c757d; font-size: 14px;">
                <strong>📅 Thời gian:</strong> ${new Date().toLocaleString('vi-VN')}<br>
                <strong>👤 Thực hiện bởi:</strong> Super Admin<br>
                <strong>✅ Trạng thái:</strong> Tài khoản đã được kích hoạt
              </p>
            </div>

            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

            <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
              Email này được gửi tự động từ hệ thống HinWarehouse.<br>
              Vui lòng không trả lời email này.
            </p>
          </div>
        </div>
      `
    };

    const result2 = await transporter.sendMail(reactivationEmail);
    console.log('✅ Reactivation test email sent!');
    console.log('Message ID:', result2.messageId);
    
    console.log('\n🎉 Email notification test completed successfully!');
    console.log('Check your email inbox for the test emails.');
    
  } catch (error) {
    console.error('❌ Email test failed:', error.message);
    console.error('Full error:', error);
  }
}

// Run the test
testEmailNotification();
