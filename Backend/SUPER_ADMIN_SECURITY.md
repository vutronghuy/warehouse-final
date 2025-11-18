# Super Admin Security Logic

## Quyền truy cập:

### ✅ **Chỉ Super Admin** (isSuperAdmin = true) mới có thể:
- Toggle user status (active/inactive)
- Truy cập SuperAdmin page
- Quản lý users

### ❌ **Admin thường** (isSuperAdmin = false):
- Không thể toggle user status
- Không thể truy cập SuperAdmin page
- Chỉ có quyền admin thông thường

## Logic bảo mật:

### 1. **Middleware requireSuperAdmin**
```javascript
// Chỉ cho phép user có:
// - role === 'admin'
// - admin.isSuperAdmin === true
// - admin.status === 'active'
// - admin.isActive === true
```

### 2. **Controller toggleUserStatus**
```javascript
// Kiểm tra:
// - User phải là super admin
// - Super admin phải còn active
// - Không thể deactivate chính mình
```

### 3. **Special Handling cho Super Admin**
```javascript
// Khi deactivate super admin:
// - Kiểm tra còn super admin khác không
// - Warning nếu là super admin cuối cùng
// - Force logout ngay lập tức
```

## Test Cases:

### ✅ **Super Admin Active**
```json
{
  "role": "admin",
  "admin": {
    "isSuperAdmin": true,
    "status": "active",
    "isActive": true
  }
}
```
**Result**: ✅ Có thể toggle user status

### ❌ **Admin thường**
```json
{
  "role": "admin",
  "admin": {
    "isSuperAdmin": false,
    "status": "active",
    "isActive": true
  }
}
```
**Result**: ❌ 403 Forbidden

### ❌ **Super Admin bị khóa**
```json
{
  "role": "admin",
  "admin": {
    "isSuperAdmin": true,
    "status": "inactive",
    "isActive": false
  }
}
```
**Result**: ❌ 403 Forbidden - "Super admin account has been deactivated"

## API Responses:

### Success (200):
```json
{
  "success": true,
  "message": "User status updated to inactive successfully."
}
```

### Error 403 - Not Super Admin:
```json
{
  "message": "Forbidden: Only super admin can toggle user status."
}
```

### Error 403 - Super Admin Deactivated:
```json
{
  "message": "Your super admin account has been deactivated. Access denied."
}
```

### Error 400 - Self Deactivation:
```json
{
  "message": "Cannot deactivate your own account."
}
```

## Debug Commands:

### 1. Kiểm tra quyền user:
```bash
GET /api/users/me/permissions
```

### 2. Kiểm tra Super Admin trong DB:
```javascript
// MongoDB
db.users.findOne({"admin.isSuperAdmin": true})
```

### 3. Tạo Super Admin:
```bash
cd Backend
node create-super-admin.js
```

## Security Features:

1. **Double Check**: Middleware + Controller đều kiểm tra isSuperAdmin
2. **Status Check**: Kiểm tra super admin có bị khóa không
3. **Self Protection**: Không thể deactivate chính mình
4. **Last Super Admin Warning**: Cảnh báo khi deactivate super admin cuối cùng
5. **Force Logout**: Super admin bị deactivate sẽ bị logout ngay lập tức
6. **Audit Trail**: Ghi lại người thực hiện và thời gian

## Rollback Plan:

Nếu muốn cho phép tất cả admin:

### 1. Sửa middleware:
```javascript
// Thay đổi từ:
if (!admin || !admin.admin || !admin.admin.isSuperAdmin)

// Thành:
if (!admin || !admin.admin)
```

### 2. Sửa controller:
```javascript
// Thay đổi từ:
if (!requester || !requester.admin || !requester.admin.isSuperAdmin)

// Thành:
if (!requester || !requester.admin)
```

