# Quick Fix cho lỗi 403 - Super Admin

## Cách 1: Tạo Super Admin mới

```bash
cd Backend
node create-super-admin.js
```

Sau đó login với:
- Username: `superadmin`
- Password: `superadmin123`

## Cách 2: Cập nhật user hiện tại thành Super Admin

```bash
cd Backend
node make-current-user-superadmin.js
```

Script này sẽ:
1. Tìm tất cả admin users
2. Cập nhật họ thành Super Admin
3. Hiển thị danh sách Super Admin

## Cách 3: Sửa thủ công trong MongoDB

### 1. Connect to MongoDB:
```bash
mongosh
use warehouse_db
```

### 2. Tìm user hiện tại:
```javascript
db.users.find({role: "admin"})
```

### 3. Cập nhật user thành Super Admin:
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

### 4. Kiểm tra kết quả:
```javascript
db.users.findOne({_id: ObjectId("YOUR_USER_ID")})
```

## Cách 4: Test API Debug

### 1. Kiểm tra quyền user hiện tại:
```bash
curl -X GET http://localhost:3001/api/users/me/permissions \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 2. Nếu response có `isSuperAdmin: false`:
- Chạy script tạo Super Admin
- Hoặc cập nhật user hiện tại

### 3. Nếu response có `isSuperAdmin: true`:
- Vấn đề có thể ở middleware
- Kiểm tra logs backend

## Test sau khi sửa

### 1. Login lại với Super Admin
### 2. Test debug endpoint:
```bash
GET /api/users/me/permissions
```

**Expected Response:**
```json
{
  "permissions": {
    "canToggleStatus": true,
    "canManageUsers": true,
    "canAccessSuperAdmin": true
  }
}
```

### 3. Test toggle status:
```bash
PUT /api/users/{userId}/toggle-status
Body: {"status": "inactive"}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "User status updated to inactive successfully."
}
```

## Troubleshooting

### Nếu vẫn lỗi 403:

1. **Kiểm tra token**: Đảm bảo token hợp lệ
2. **Kiểm tra database**: Đảm bảo user có `isSuperAdmin: true`
3. **Kiểm tra logs**: Xem logs backend để debug
4. **Restart backend**: Có thể cần restart server

### Logs backend sẽ hiển thị:
```
🔍 Checking admin for user: {user_id}
👤 User found: { isSuperAdmin: true }
✅ User is super admin - access granted
```

### Nếu logs hiển thị `isSuperAdmin: false`:
- Chạy script tạo Super Admin
- Hoặc cập nhật user hiện tại

