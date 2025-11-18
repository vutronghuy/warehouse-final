# Email Notification Guide - Thông báo vô hiệu hóa tài khoản

## ✅ Tính năng đã được thêm

### 1. **Email khi vô hiệu hóa tài khoản (Deactivation)**
- **Subject**: "Tài khoản đã bị vô hiệu hóa - HinWarehouse"
- **Nội dung**: Thông báo chi tiết về việc tài khoản bị vô hiệu hóa
- **Gửi đến**: Email của user bị vô hiệu hóa

### 2. **Email khi kích hoạt lại tài khoản (Reactivation)**
- **Subject**: "Tài khoản đã được kích hoạt lại - HinWarehouse"
- **Nội dung**: Thông báo tích cực về việc tài khoản được kích hoạt
- **Gửi đến**: Email của user được kích hoạt

## 🔧 Cấu hình Email

### Environment Variables cần thiết:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=your-email@gmail.com
```

### Test Email Configuration:
```bash
cd Backend
node test-email.js
```

### Test Email Notification:
```bash
cd Backend
node test-email-notification.js
```

## 📧 Email Templates

### 1. **Deactivation Email Template**
```html
⚠️ Tài khoản đã bị vô hiệu hóa
- Thông báo quan trọng
- Quyền truy cập đã bị thu hồi
- Liên hệ để được hỗ trợ
- Thông tin thời gian và người thực hiện
```

### 2. **Reactivation Email Template**
```html
✅ Tài khoản đã được kích hoạt
- Thông báo tích cực
- Quyền truy cập đã được khôi phục
- Hướng dẫn đăng nhập
- Thông tin thời gian và người thực hiện
```

## 🚀 Cách sử dụng

### 1. **Vô hiệu hóa tài khoản**
1. Super Admin đăng nhập
2. Vào trang Super Admin
3. Click nút "Vô hiệu hóa" bên cạnh user
4. Xác nhận hành động
5. **Hệ thống tự động gửi email thông báo**

### 2. **Kích hoạt lại tài khoản**
1. Super Admin đăng nhập
2. Vào trang Super Admin
3. Click nút "Kích hoạt" bên cạnh user
4. Xác nhận hành động
5. **Hệ thống tự động gửi email thông báo**

## 🔍 Logs và Debug

### Backend Logs:
```
✅ Email notification sent to user: user@example.com
✅ Reactivation email sent to user: user@example.com
❌ Failed to send email notification: [error details]
⚠️ No email found for user: [user_id]
```

### Email Status:
- **Success**: Email được gửi thành công
- **Warning**: User không có email
- **Error**: Lỗi gửi email (không ảnh hưởng đến chức năng chính)

## 🛠️ Troubleshooting

### 1. **Email không được gửi**
- Kiểm tra SMTP configuration
- Test email connection: `node test-email.js`
- Kiểm tra logs backend

### 2. **User không có email**
- Logs sẽ hiển thị: `⚠️ No email found for user: [user_id]`
- Cập nhật email cho user trong database

### 3. **Email bị spam**
- Kiểm tra SPF, DKIM records
- Sử dụng email service provider uy tín
- Tránh spam keywords trong subject/content

## 📋 Test Cases

### 1. **Test Deactivation Email**
```bash
# 1. Tạo Super Admin
node create-super-admin.js

# 2. Login với Super Admin
# 3. Vô hiệu hóa một user
# 4. Kiểm tra email của user đó
```

### 2. **Test Reactivation Email**
```bash
# 1. Kích hoạt lại user đã bị vô hiệu hóa
# 2. Kiểm tra email của user đó
```

### 3. **Test Email Configuration**
```bash
# Test SMTP connection
node test-email.js

# Test email templates
node test-email-notification.js
```

## 🔒 Security Notes

### 1. **Email Content**
- Không chứa thông tin nhạy cảm
- Chỉ thông báo trạng thái tài khoản
- Hướng dẫn liên hệ Super Admin

### 2. **Error Handling**
- Email lỗi không ảnh hưởng chức năng chính
- Logs chi tiết để debug
- Graceful degradation

### 3. **Rate Limiting**
- Không có rate limiting cho email
- Có thể thêm nếu cần thiết

## 📊 Monitoring

### 1. **Email Metrics**
- Số lượng email gửi thành công
- Số lượng email lỗi
- Thời gian gửi email

### 2. **User Engagement**
- User có mở email không
- User có click link không (nếu có)
- Feedback từ user

## 🎯 Future Enhancements

### 1. **Email Templates**
- Thêm nhiều template khác
- Customizable templates
- Multi-language support

### 2. **Email Analytics**
- Track email open rates
- Track click rates
- User engagement metrics

### 3. **Advanced Features**
- Email scheduling
- Bulk email notifications
- Email preferences

