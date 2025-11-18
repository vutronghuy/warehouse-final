# Audit Feature Guide - Hướng dẫn sử dụng tính năng Audit

## ✅ Tính năng đã được thêm

### **Trang Audit Logs trong Super Admin**
- **URL**: `/Superadmin/audit`
- **Quyền truy cập**: Chỉ Super Admin
- **Chức năng**: Xem tất cả audit logs của staff trong hệ thống

## 🔧 Tính năng chính

### **1. Filter theo Role**
- **Staff**: Chỉ hiển thị logs của staff
- **Manager**: Chỉ hiển thị logs của manager
- **Accounter**: Chỉ hiển thị logs của accounter
- **Admin**: Chỉ hiển thị logs của admin

### **2. Filter theo Staff cụ thể**
- Dropdown hiển thị tất cả staff trong hệ thống
- Cho phép chọn staff cụ thể để xem logs

### **3. Filter theo Action**
- **CREATE_INVOICE**: Tạo hóa đơn
- **UPDATE_INVOICE**: Cập nhật hóa đơn
- **DELETE_INVOICE**: Xóa hóa đơn
- **CREATE_EXPORT_SLIP**: Tạo phiếu xuất
- **UPDATE_EXPORT_SLIP**: Cập nhật phiếu xuất
- **DELETE_EXPORT_SLIP**: Xóa phiếu xuất
- **IMPORT_PRODUCT_EXCEL**: Import sản phẩm
- **UPDATE_PRODUCT**: Cập nhật sản phẩm
- **CHANGE_ROLE**: Thay đổi role

### **4. Filter theo ngày**
- Chọn ngày cụ thể để xem logs

### **5. Xem chi tiết log**
- Click "Xem chi tiết" để xem thông tin đầy đủ
- Hiển thị thông tin trước/sau khi thay đổi
- Hiển thị lý do và lỗi (nếu có)

## 📊 Giao diện

### **Header**
- Tiêu đề: "Audit Logs"
- Mô tả: "Theo dõi hoạt động của staff trong hệ thống"
- Nút Refresh để tải lại dữ liệu

### **Filters**
- **Role Filter**: Dropdown chọn role
- **Staff Filter**: Dropdown chọn staff cụ thể
- **Action Filter**: Dropdown chọn action
- **Date Filter**: Input chọn ngày
- **Clear Filters**: Nút xóa tất cả filter

### **Table**
- **Thời gian**: Ngày giờ thực hiện
- **Staff**: Tên và email của staff
- **Action**: Hành động thực hiện
- **Target**: Đối tượng bị tác động
- **Kết quả**: Thành công/Thất bại
- **Chi tiết**: Nút xem chi tiết

### **Pagination**
- Hiển thị số trang hiện tại
- Nút Previous/Next
- Thông tin tổng số logs

## 🔍 Chi tiết Log

### **Thông tin cơ bản**
- **Staff**: Tên và email
- **Action**: Hành động thực hiện
- **Target**: Loại và ID đối tượng
- **Kết quả**: Thành công/Thất bại
- **Lý do**: Lý do thực hiện (nếu có)
- **Lỗi**: Thông báo lỗi (nếu có)
- **Thời gian**: Ngày giờ thực hiện

### **Thay đổi dữ liệu**
- **Trước**: Trạng thái trước khi thay đổi
- **Sau**: Trạng thái sau khi thay đổi
- Hiển thị dưới dạng JSON format

## 🚀 Cách sử dụng

### **1. Truy cập trang Audit**
1. Login với Super Admin
2. Vào sidebar → "Audit Logs"
3. Trang audit sẽ hiển thị tất cả logs

### **2. Filter logs**
1. Chọn role từ dropdown "Role"
2. Chọn staff từ dropdown "Staff"
3. Chọn action từ dropdown "Action"
4. Chọn ngày từ input "Ngày"
5. Click "Apply" hoặc để tự động filter

### **3. Xem chi tiết**
1. Click "Xem chi tiết" ở log muốn xem
2. Modal sẽ hiển thị thông tin đầy đủ
3. Click "X" để đóng modal

### **4. Pagination**
1. Sử dụng nút Previous/Next để chuyển trang
2. Thông tin pagination hiển thị ở cuối bảng

## 🔧 API Endpoints

### **GET /api/audit/logs**
**Query Parameters:**
- `page`: Số trang (default: 1)
- `limit`: Số logs per page (default: 20)
- `role`: Filter theo role
- `staffId`: Filter theo staff ID
- `action`: Filter theo action
- `dateRange`: Filter theo ngày

**Response:**
```json
{
  "success": true,
  "auditLogs": [...],
  "pagination": {
    "page": 1,
    "pages": 5,
    "total": 100,
    "limit": 20
  }
}
```

### **GET /api/audit/stats**
**Query Parameters:**
- `startDate`: Ngày bắt đầu
- `endDate`: Ngày kết thúc

**Response:**
```json
{
  "success": true,
  "stats": [
    {
      "_id": "CREATE_INVOICE",
      "count": 50,
      "successCount": 45,
      "failedCount": 5
    }
  ]
}
```

## 🧪 Test API

### **Test cơ bản**
```bash
cd Backend
node test-audit-api.js
```

### **Test với curl**
```bash
# Get audit logs
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:3001/api/audit/logs?role=staff&page=1&limit=10"

# Get audit stats
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:3001/api/audit/stats"
```

## 📋 Audit Log Types

### **Business Actions (Category: BUSINESS)**
- **CREATE_INVOICE**: Tạo hóa đơn mới
- **UPDATE_INVOICE**: Cập nhật hóa đơn
- **DELETE_INVOICE**: Xóa hóa đơn
- **CREATE_EXPORT_SLIP**: Tạo phiếu xuất
- **UPDATE_EXPORT_SLIP**: Cập nhật phiếu xuất
- **DELETE_EXPORT_SLIP**: Xóa phiếu xuất
- **IMPORT_PRODUCT_EXCEL**: Import sản phẩm từ Excel
- **UPDATE_PRODUCT**: Cập nhật thông tin sản phẩm
- **CHANGE_ROLE**: Thay đổi role của user

### **System Actions (Category: SYSTEM)**
- **LOGIN**: Đăng nhập hệ thống
- **LOGOUT**: Đăng xuất hệ thống
- **PASSWORD_CHANGE**: Thay đổi mật khẩu
- **ACCOUNT_DEACTIVATED**: Vô hiệu hóa tài khoản
- **ACCOUNT_ACTIVATED**: Kích hoạt tài khoản

## 🔒 Security

### **Access Control**
- Chỉ Super Admin có thể truy cập
- Middleware `requireSuperAdmin` được áp dụng
- Token authentication required

### **Data Privacy**
- Không hiển thị thông tin nhạy cảm
- Mật khẩu không được log
- Chỉ hiển thị thông tin cần thiết

## 📊 Performance

### **Pagination**
- Mặc định 20 logs per page
- Có thể điều chỉnh limit
- Total pages được tính tự động

### **Filtering**
- Filter được áp dụng ở database level
- Index trên các trường thường filter
- Query optimization cho performance

## 🎯 Future Enhancements

### **1. Advanced Filtering**
- Filter theo date range
- Filter theo warehouse
- Filter theo outcome (success/failed)

### **2. Export Features**
- Export logs to Excel
- Export logs to PDF
- Scheduled reports

### **3. Analytics**
- Charts và graphs
- Trend analysis
- Performance metrics

### **4. Real-time Updates**
- WebSocket notifications
- Live audit log streaming
- Real-time filtering

## 🛠️ Troubleshooting

### **1. Không hiển thị logs**
- Kiểm tra quyền Super Admin
- Kiểm tra token authentication
- Kiểm tra database connection

### **2. Filter không hoạt động**
- Kiểm tra API parameters
- Kiểm tra database query
- Kiểm tra frontend filter logic

### **3. Performance chậm**
- Kiểm tra database indexes
- Giảm limit per page
- Optimize query

## 📝 Notes

### **Database Schema**
```javascript
{
  category: 'BUSINESS' | 'SYSTEM',
  action: String,
  actor: {
    id: ObjectId,
    email: String,
    name: String,
    role: String
  },
  target: {
    type: String,
    id: ObjectId
  },
  before: Mixed,
  after: Mixed,
  reason: String,
  outcome: 'SUCCESS' | 'FAILED',
  error: String,
  meta: Mixed,
  createdAt: Date
}
```

### **Indexes**
- `{ category: 1, createdAt: -1 }`
- `{ 'actor.id': 1, createdAt: -1 }`
- `{ 'actor.role': 1, createdAt: -1 }`
- `{ action: 1, createdAt: -1 }`

Tính năng Audit Logs đã được hoàn thành và sẵn sàng sử dụng! 🎉


























