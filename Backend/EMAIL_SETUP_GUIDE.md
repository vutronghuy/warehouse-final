# Email Setup Guide - Hướng dẫn cấu hình email

## 🚨 Vấn đề hiện tại
Email không được gửi vì chưa có file `.env` với cấu hình SMTP.

## 📝 Bước 1: Tạo file .env

Tạo file `.env` trong thư mục `Backend` với nội dung:

```env
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/warehouse_db

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d

# Email Configuration (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=your-email@gmail.com

# Server Configuration
PORT=3001
NODE_ENV=development
```

## 🔧 Bước 2: Cấu hình Gmail (nếu sử dụng Gmail)

### 1. Bật 2-Factor Authentication
- Vào Gmail Settings → Security
- Bật 2-Step Verification

### 2. Tạo App Password
- Vào Gmail Settings → Security → 2-Step Verification
- Scroll xuống "App passwords"
- Tạo app password mới cho "Mail"
- Sử dụng app password này làm `SMTP_PASS`

### 3. Cấu hình .env
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-character-app-password
EMAIL_FROM=your-email@gmail.com
```

## 🔧 Bước 3: Cấu hình Email khác

### Outlook/Hotmail
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
EMAIL_FROM=your-email@outlook.com
```

### Yahoo
```env
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
SMTP_USER=your-email@yahoo.com
SMTP_PASS=your-app-password
EMAIL_FROM=your-email@yahoo.com
```

### Custom SMTP
```env
SMTP_HOST=your-smtp-server.com
SMTP_PORT=587
SMTP_USER=your-email@domain.com
SMTP_PASS=your-password
EMAIL_FROM=your-email@domain.com
```

## 🧪 Bước 4: Test cấu hình

### 1. Debug cấu hình hiện tại
```bash
cd Backend
node debug-email-config.js
```

### 2. Test email đơn giản
```bash
cd Backend
node test-email-simple.js
```

### 3. Test email notification
```bash
cd Backend
node test-email-notification.js
```

## 🔍 Bước 5: Kiểm tra logs

### Backend logs sẽ hiển thị:
```
✅ Email notification sent to user: user@example.com
✅ Reactivation email sent to user: user@example.com
❌ Failed to send email notification: [error details]
⚠️ No email found for user: [user_id]
```

### Common errors và cách sửa:

#### 1. **EAUTH Error**
```
Error: Invalid login: 535-5.7.8 Username and Password not accepted
```
**Solution**: Sử dụng App Password thay vì password thường

#### 2. **ECONNECTION Error**
```
Error: connect ECONNREFUSED
```
**Solution**: Kiểm tra SMTP_HOST và SMTP_PORT

#### 3. **ENOTFOUND Error**
```
Error: getaddrinfo ENOTFOUND smtp.gmail.com
```
**Solution**: Kiểm tra internet connection

## 🚀 Bước 6: Test tính năng

### 1. Tạo Super Admin
```bash
cd Backend
node create-super-admin.js
```

### 2. Login với Super Admin
- Username: `superadmin`
- Password: `superadmin123`

### 3. Test toggle user status
- Vào trang Super Admin
- Click nút toggle status
- Kiểm tra email của user

## 📧 Email Templates

### Deactivation Email
- **Subject**: "Tài khoản đã bị vô hiệu hóa - HinWarehouse"
- **Content**: Thông báo tài khoản bị vô hiệu hóa
- **Recipient**: Email của user bị vô hiệu hóa

### Reactivation Email
- **Subject**: "Tài khoản đã được kích hoạt lại - HinWarehouse"
- **Content**: Thông báo tài khoản được kích hoạt
- **Recipient**: Email của user được kích hoạt

## 🔒 Security Notes

### 1. **App Password**
- Sử dụng App Password thay vì password thường
- Không chia sẻ App Password
- Tạo App Password mới nếu bị lộ

### 2. **Environment Variables**
- Không commit file `.env` vào git
- Sử dụng `.env.example` cho team
- Rotate credentials định kỳ

### 3. **Rate Limiting**
- Gmail: 500 emails/day (free)
- Gmail: 2000 emails/day (paid)
- Có thể cần upgrade plan

## 🛠️ Troubleshooting

### 1. **Email không được gửi**
```bash
# Check configuration
node debug-email-config.js

# Test connection
node test-email-simple.js
```

### 2. **Authentication failed**
- Kiểm tra App Password
- Bật 2-Factor Authentication
- Kiểm tra SMTP_USER

### 3. **Connection timeout**
- Kiểm tra internet
- Kiểm tra firewall
- Thử SMTP server khác

## 📊 Monitoring

### 1. **Email Metrics**
- Số lượng email gửi thành công
- Số lượng email lỗi
- Thời gian gửi email

### 2. **User Feedback**
- User có nhận email không
- Email có bị spam không
- User có phản hồi không

## 🎯 Next Steps

### 1. **Production Setup**
- Sử dụng email service provider (SendGrid, Mailgun)
- Cấu hình SPF, DKIM records
- Setup email monitoring

### 2. **Advanced Features**
- Email templates customization
- Multi-language support
- Email analytics

### 3. **Security Enhancements**
- Email encryption
- Rate limiting
- Audit logging


























