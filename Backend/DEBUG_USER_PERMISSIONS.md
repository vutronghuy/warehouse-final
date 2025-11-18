# Debug User Permissions - Hướng dẫn sửa lỗi 403

## Bước 1: Kiểm tra user hiện tại

### Test API debug:
```bash
GET http://localhost:3001/api/users/me/permissions
Headers: Authorization: Bearer {your-current-token}
```

### Expected Response nếu là Super Admin:
```json
{
  "success": true,
  "user": {
    "role": "admin",
    "isSuperAdmin": true,
    "status": "active",
    "isActive": true
  },
  "permissions": {
    "canToggleStatus": true,
    "canManageUsers": true,
    "canAccessSuperAdmin": true
  }
}
```

### Expected Response nếu KHÔNG phải Super Admin:
```json
{
  "success": true,
  "user": {
    "role": "admin",
    "isSuperAdmin": false,  // ← Đây là vấn đề
    "status": "active",
    "isActive": true
  },
  "permissions": {
    "canToggleStatus": false,  // ← Không có quyền
    "canManageUsers": false,
    "canAccessSuperAdmin": false
  }
}
```

## Bước 2: Tạo Super Admin

### Chạy script tạo Super Admin:
```bash
cd Backend
node create-super-admin.js
```

### Hoặc tạo thủ công trong MongoDB:
```javascript
// Connect to MongoDB
use warehouse_db

// Tìm user hiện tại
db.users.findOne({_id: ObjectId("YOUR_USER_ID")})

// Cập nhật user thành Super Admin
db.users.updateOne(
  {_id: ObjectId("YOUR_USER_ID")},
  {
    $set: {
      "admin.isSuperAdmin": true,
      "admin.status": "active",
      "admin.isActive": true
    }
  }
)
```

## Bước 3: Login với Super Admin

### Nếu đã có Super Admin:
- Username: `superadmin`
- Password: `superadmin123`
- Email: `superadmin@warehouse.com`

### Nếu muốn cập nhật user hiện tại thành Super Admin:
1. Lấy user ID từ debug endpoint
2. Cập nhật trong database
3. Login lại với user đó

## Bước 4: Test API

### Sau khi login với Super Admin:
```bash
PUT http://localhost:3001/api/users/{userId}/toggle-status
Headers: Authorization: Bearer {super-admin-token}
Body: {"status": "inactive"}
```

### Expected Response:
```json
{
  "success": true,
  "message": "User status updated to inactive successfully."
}
```

## Debug Commands

### 1. Kiểm tra tất cả Super Admin:
```javascript
// MongoDB
db.users.find({"admin.isSuperAdmin": true})
```

### 2. Kiểm tra user cụ thể:
```javascript
// MongoDB
db.users.findOne({_id: ObjectId("USER_ID")})
```

### 3. Tạo Super Admin mới:
```javascript
// MongoDB
db.users.insertOne({
  role: "admin",
  admin: {
    username: "superadmin2",
    password: "$2b$10$...", // hashed password
    fullName: "Super Admin 2",
    email: "superadmin2@warehouse.com",
    role: "admin",
    status: "active",
    isActive: true,
    isSuperAdmin: true
  }
})
```

## Common Issues & Solutions

### Issue 1: User không phải Super Admin
**Solution**: Tạo Super Admin hoặc cập nhật user hiện tại

### Issue 2: Super Admin bị deactivated
**Solution**: Cập nhật status và isActive thành true

### Issue 3: Token không hợp lệ
**Solution**: Login lại để lấy token mới

### Issue 4: Database không có Super Admin
**Solution**: Chạy script tạo Super Admin

## Quick Fix Commands

### 1. Tạo Super Admin nhanh:
```bash
cd Backend
node create-super-admin.js
```

### 2. Cập nhật user hiện tại thành Super Admin:
```javascript
// Thay YOUR_USER_ID bằng ID thực tế
db.users.updateOne(
  {_id: ObjectId("YOUR_USER_ID")},
  {
    $set: {
      "admin.isSuperAdmin": true,
      "admin.status": "active",
      "admin.isActive": true
    }
  }
)
```

### 3. Kiểm tra kết quả:
```bash
GET http://localhost:3001/api/users/me/permissions
```

