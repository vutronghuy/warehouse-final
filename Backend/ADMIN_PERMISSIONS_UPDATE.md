# Cập nhật quyền Admin - Không yêu cầu Super Admin

## Thay đổi đã thực hiện:

### 1. **Middleware requireSuperAdmin** (auth.js)
- **Trước**: Chỉ cho phép user có `isSuperAdmin: true`
- **Sau**: Cho phép tất cả user có role `admin`

### 2. **Controller toggleUserStatus** (UserController.js)
- **Trước**: Kiểm tra `requester.admin?.isSuperAdmin`
- **Sau**: Chỉ kiểm tra `requester.admin` (có phải admin không)

### 3. **Debug Endpoint** (checkCurrentUserPermissions)
- **Trước**: `canToggleStatus: role === 'admin' && roleData?.isSuperAdmin`
- **Sau**: `canToggleStatus: role === 'admin'`

## Kết quả:

### ✅ **Tất cả Admin** có thể:
- Toggle user status (active/inactive)
- Quản lý users
- Truy cập SuperAdmin page

### ❌ **Không cần** Super Admin nữa

## Test API:

### 1. Kiểm tra quyền:
```bash
GET http://localhost:3001/api/users/me/permissions
```

**Expected Response:**
```json
{
  "permissions": {
    "canToggleStatus": true,  // true cho tất cả admin
    "canManageUsers": true,
    "canAccessSuperAdmin": true
  }
}
```

### 2. Test Toggle Status:
```bash
PUT http://localhost:3001/api/users/{userId}/toggle-status
Headers: Authorization: Bearer {admin-token}
Body: {"status": "inactive"}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "User status updated to inactive successfully."
}
```

## Lưu ý:

1. **Bảo mật**: Vẫn yêu cầu user phải là admin
2. **Self Protection**: Không thể deactivate chính mình
3. **Audit Trail**: Vẫn ghi lại người thực hiện
4. **Socket Events**: Vẫn emit force-logout khi deactivate

## Rollback (nếu cần):

Nếu muốn quay lại yêu cầu Super Admin:

### 1. Sửa middleware:
```javascript
// Trong auth.js
if (!admin || !admin.admin || !admin.admin.isSuperAdmin) {
  return res.status(403).json({ message: 'Super admin only.' });
}
```

### 2. Sửa controller:
```javascript
// Trong UserController.js
if (!requester || !requester.admin?.isSuperAdmin) {
  return res.status(403).json({ message: "Super admin only." });
}
```

