# Hướng dẫn test API toggle user status

## 1. Khởi động backend
```bash
cd Backend
npm start
```

## 2. Test API với Postman hoặc curl

### Test với Postman:
1. **Method**: PUT
2. **URL**: `http://localhost:3001/api/users/{userId}/toggle-status`
3. **Headers**: 
   - `Authorization: Bearer {your-super-admin-token}`
   - `Content-Type: application/json`
4. **Body** (JSON):
   ```json
   {
     "status": "inactive"
   }
   ```

### Test với curl:
```bash
# Toggle user to inactive
curl -X PUT http://localhost:3001/api/users/68a2ed17886712f75f5e1d45/toggle-status \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "inactive"}'

# Toggle user to active
curl -X PUT http://localhost:3001/api/users/68a2ed17886712f75f5e1d45/toggle-status \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "active"}'
```

## 3. Expected Responses

### Success Response (200):
```json
{
  "success": true,
  "message": "User status updated to inactive successfully.",
  "user": {
    "id": "68a2ed17886712f75f5e1d45",
    "role": "staff",
    "status": "inactive",
    "username": "testuser",
    "fullName": "Test User"
  }
}
```

### Error Responses:

#### 400 - Invalid status:
```json
{
  "message": "Status must be 'active' or 'inactive'."
}
```

#### 403 - Not super admin:
```json
{
  "message": "Forbidden: Only super admin can toggle user status."
}
```

#### 400 - Cannot deactivate self:
```json
{
  "message": "Cannot deactivate your own account."
}
```

#### 400 - Already same status:
```json
{
  "message": "User is already inactive."
}
```

## 4. Test Frontend

1. Mở SuperAdmin.vue trong browser
2. Click vào nút toggle status (icon cam/xanh)
3. Xác nhận action
4. Kiểm tra toast notification
5. Kiểm tra status trong table đã thay đổi

## 5. Test Force Logout

1. Đăng nhập với user bị deactivate
2. Super admin deactivate user đó
3. User sẽ nhận được socket event và bị force logout
4. Kiểm tra toast notification hiển thị
5. Kiểm tra redirect về login page

## 6. Debug Tips

### Check logs:
```bash
# Backend logs
tail -f Backend/logs/app.log

# Console logs
# Mở Developer Tools trong browser để xem console logs
```

### Common Issues:
1. **404 Error**: Đảm bảo backend đang chạy và route đã được thêm
2. **403 Error**: Đảm bảo user đang đăng nhập là super admin
3. **Socket not working**: Kiểm tra Socket.IO connection trong browser console
4. **Toast not showing**: Kiểm tra Vue Toastification đã được cài đặt và cấu hình

## 7. Database Check

Kiểm tra trong MongoDB:
```javascript
// Tìm user
db.users.findOne({_id: ObjectId("68a2ed17886712f75f5e1d45")})

// Kiểm tra status
db.users.findOne({_id: ObjectId("68a2ed17886712f75f5e1d45")}, {staff: 1})
```

