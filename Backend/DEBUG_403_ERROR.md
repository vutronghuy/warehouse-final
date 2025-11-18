# Hướng dẫn debug lỗi 403 Forbidden

## 1. Kiểm tra quyền user hiện tại

### Test API endpoint debug:
```bash
GET http://localhost:3001/api/users/me/permissions
Headers: Authorization: Bearer {your-token}
```

### Response sẽ cho biết:
```json
{
  "success": true,
  "user": {
    "id": "user_id",
    "role": "admin",
    "username": "username",
    "fullName": "Full Name",
    "email": "email@example.com",
    "isSuperAdmin": true/false,
    "status": "active",
    "isActive": true
  },
  "permissions": {
    "canToggleStatus": true/false,
    "canManageUsers": true/false,
    "canAccessSuperAdmin": true/false
  }
}
```

## 2. Tạo Super Admin nếu chưa có

### Chạy script tạo super admin:
```bash
cd Backend
node create-super-admin.js
```

### Hoặc tạo thủ công trong MongoDB:
```javascript
// Connect to MongoDB
use warehouse_db

// Tạo super admin
db.users.insertOne({
  role: "admin",
  admin: {
    username: "superadmin",
    password: "$2b$10$...", // hashed password
    fullName: "Super Administrator",
    email: "superadmin@warehouse.com",
    role: "admin",
    status: "active",
    isActive: true,
    isSuperAdmin: true
  }
})
```

## 3. Kiểm tra logs backend

### Xem logs khi gọi API:
```bash
# Backend sẽ log:
🔍 Checking super admin for user: {user_id}
👤 User found: {
  id: ObjectId("..."),
  role: "admin",
  hasAdmin: true,
  isSuperAdmin: true/false
}
```

### Nếu isSuperAdmin = false:
- User không phải super admin
- Cần đăng nhập với super admin account

## 4. Các bước sửa lỗi

### Bước 1: Kiểm tra user hiện tại
```bash
curl -X GET http://localhost:3001/api/users/me/permissions \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Bước 2: Nếu không phải super admin
1. Tạo super admin: `node create-super-admin.js`
2. Đăng nhập với super admin account
3. Test lại API toggle status

### Bước 3: Nếu vẫn lỗi 403
1. Kiểm tra database có user với `isSuperAdmin: true`
2. Kiểm tra token có đúng user không
3. Kiểm tra middleware requireSuperAdmin

## 5. Test với Super Admin

### Login với super admin:
```bash
POST http://localhost:3001/api/auth/login
{
  "username": "superadmin",
  "password": "superadmin123"
}
```

### Sau khi login, test toggle status:
```bash
PUT http://localhost:3001/api/users/{userId}/toggle-status
Headers: Authorization: Bearer {super-admin-token}
Body: {"status": "inactive"}
```

## 6. Common Issues

### Issue 1: User không phải super admin
**Solution**: Đăng nhập với super admin account

### Issue 2: Token không hợp lệ
**Solution**: Login lại để lấy token mới

### Issue 3: Database không có super admin
**Solution**: Chạy script tạo super admin

### Issue 4: Middleware không hoạt động
**Solution**: Kiểm tra logs backend để debug

## 7. Debug Commands

### Kiểm tra user trong database:
```javascript
// MongoDB
db.users.findOne({"admin.isSuperAdmin": true})

// Hoặc tìm user theo ID
db.users.findOne({_id: ObjectId("USER_ID")})
```

### Kiểm tra token:
```javascript
// Decode JWT token
const jwt = require('jsonwebtoken');
const decoded = jwt.decode(token);
console.log(decoded);
```

