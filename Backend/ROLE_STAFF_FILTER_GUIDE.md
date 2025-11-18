# Role-Based Staff Filter Guide - Hướng dẫn filter staff theo role

## ✅ Tính năng đã được cập nhật

### **Role-Based Staff Filtering**
- **Chức năng**: Khi chọn role, dropdown staff sẽ chỉ hiển thị các tài khoản thuộc role đó
- **Tự động reset**: Khi thay đổi role, staff selection sẽ được reset về "All Staff"
- **Counter**: Hiển thị số lượng staff trong role đã chọn

## 🔧 Cách hoạt động

### **1. Khi chưa chọn role**
- Dropdown staff hiển thị tất cả staff trong hệ thống
- Label: "All Staff"

### **2. Khi chọn role cụ thể**
- Dropdown staff chỉ hiển thị staff thuộc role đó
- Label: "All [role]s" (ví dụ: "All staffs")
- Counter: "(X staffs)" hiển thị số lượng

### **3. Khi thay đổi role**
- Staff selection tự động reset về "All [new_role]s"
- Dropdown staff cập nhật theo role mới

### **4. Khi không có staff trong role**
- Hiển thị "No [role]s found" (disabled)
- Vẫn có option "All [role]s" để filter

## 📊 Giao diện

### **Role Filter**
```html
<select v-model="filters.role" @change="onRoleChange">
  <option value="">All Roles</option>
  <option value="staff">Staff</option>
  <option value="manager">Manager</option>
  <option value="accounter">Accounter</option>
  <option value="admin">Admin</option>
</select>
```

### **Staff Filter (Dynamic)**
```html
<select v-model="filters.staffId" @change="applyFilters">
  <option value="">
    {{ filters.role ? `All ${filters.role}s` : 'All Staff' }}
  </option>
  <option v-if="filteredStaffList.length === 0" disabled>
    No {{ filters.role }}s found
  </option>
  <option v-for="staff in filteredStaffList" :key="staff._id" :value="staff._id">
    {{ staff.name }} ({{ staff.role }})
  </option>
</select>
```

### **Label với Counter**
```html
<label>
  Staff
  <span v-if="filters.role" class="text-xs text-gray-500">
    ({{ filteredStaffList.length }} {{ filters.role }}s)
  </span>
</label>
```

## 🔍 Logic Implementation

### **1. Computed Property**
```javascript
computed: {
  filteredStaffList() {
    if (!this.filters.role) {
      return this.staffList;
    }
    return this.staffList.filter(staff => staff.role === this.filters.role);
  }
}
```

### **2. Watcher**
```javascript
watch: {
  'filters.role'(newRole, oldRole) {
    if (newRole !== oldRole) {
      this.filters.staffId = ''; // Reset staff selection
    }
  }
}
```

### **3. Role Change Handler**
```javascript
onRoleChange() {
  this.filters.staffId = ''; // Reset staff selection
  this.applyFilters();
}
```

## 🚀 Cách sử dụng

### **1. Filter theo role**
1. Chọn role từ dropdown "Role"
2. Dropdown "Staff" sẽ tự động cập nhật
3. Chọn staff cụ thể (optional)
4. Click "Apply" hoặc để tự động filter

### **2. Reset filters**
1. Click "Clear Filters" để reset tất cả
2. Hoặc chọn "All Roles" để xem tất cả staff

### **3. Xem kết quả**
1. Table sẽ hiển thị logs theo filter đã chọn
2. Pagination sẽ cập nhật theo kết quả
3. Có thể xem chi tiết từng log

## 📋 Test Cases

### **Test 1: Role Filter**
```bash
# Test với role staff
GET /api/audit/logs?role=staff

# Test với role manager  
GET /api/audit/logs?role=manager

# Test với role accounter
GET /api/audit/logs?role=accounter

# Test với role admin
GET /api/audit/logs?role=admin
```

### **Test 2: Combined Filters**
```bash
# Test với role và staff cụ thể
GET /api/audit/logs?role=staff&staffId=USER_ID

# Test với role và action
GET /api/audit/logs?role=staff&action=CREATE_INVOICE

# Test với tất cả filters
GET /api/audit/logs?role=staff&staffId=USER_ID&action=CREATE_INVOICE&dateRange=2024-01-01
```

### **Test 3: Frontend Behavior**
1. **Chọn role "staff"** → Staff dropdown chỉ hiển thị staff
2. **Chọn role "manager"** → Staff dropdown chỉ hiển thị managers
3. **Chọn "All Roles"** → Staff dropdown hiển thị tất cả
4. **Thay đổi role** → Staff selection tự động reset

## 🔧 API Endpoints

### **GET /api/users**
**Query Parameters:**
- `role`: Filter theo role (all, staff, manager, accounter, admin)
- `status`: Filter theo status (all, active, inactive)

**Response:**
```json
{
  "users": [
    {
      "_id": "user_id",
      "role": "staff",
      "staff": {
        "fullName": "Staff Name",
        "username": "staff_username",
        "email": "staff@example.com"
      }
    }
  ]
}
```

### **GET /api/audit/logs**
**Query Parameters:**
- `role`: Filter theo role của actor
- `staffId`: Filter theo staff ID cụ thể
- `action`: Filter theo action
- `dateRange`: Filter theo ngày

**Response:**
```json
{
  "success": true,
  "auditLogs": [
    {
      "_id": "log_id",
      "action": "CREATE_INVOICE",
      "actor": {
        "id": "user_id",
        "name": "Staff Name",
        "email": "staff@example.com",
        "role": "staff"
      },
      "target": {
        "type": "Invoice",
        "id": "invoice_id"
      },
      "outcome": "SUCCESS",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "pages": 5,
    "total": 100,
    "limit": 20
  }
}
```

## 🧪 Test Script

### **Run Test**
```bash
cd Backend
node test-role-staff-filter.js
```

### **Expected Output**
```
✅ Connected to MongoDB
✅ Login successful
✅ Users fetched successfully
📊 Users by role:
- staff: 5 users
- manager: 3 users
- accounter: 2 users
- admin: 1 users
✅ staff filter successful
✅ manager filter successful
✅ Combined filter successful
🎉 Role-based staff filtering test completed!
```

## 🎯 Benefits

### **1. User Experience**
- **Intuitive**: Staff dropdown tự động cập nhật theo role
- **Efficient**: Không cần scroll qua nhiều staff không liên quan
- **Clear**: Counter hiển thị số lượng staff trong role

### **2. Performance**
- **Faster**: Chỉ load staff cần thiết
- **Responsive**: Real-time filtering
- **Optimized**: Computed properties cache kết quả

### **3. Data Integrity**
- **Consistent**: Role và staff luôn khớp nhau
- **Validated**: Không thể chọn staff không thuộc role
- **Synchronized**: Tự động reset khi thay đổi role

## 🛠️ Troubleshooting

### **1. Staff dropdown trống**
- Kiểm tra API `/api/users?role=all&status=all`
- Kiểm tra data structure trong response
- Kiểm tra computed property `filteredStaffList`

### **2. Role filter không hoạt động**
- Kiểm tra watcher `'filters.role'`
- Kiểm tra method `onRoleChange()`
- Kiểm tra API parameters

### **3. Staff selection không reset**
- Kiểm tra watcher implementation
- Kiểm tra `onRoleChange()` method
- Kiểm tra `filters.staffId` reset logic

## 📝 Notes

### **Data Structure**
```javascript
// Expected staff list structure
staffList: [
  {
    _id: "user_id",
    name: "User Name",
    role: "staff"
  }
]

// Filtered staff list
filteredStaffList: [
  // Only staff with matching role
]
```

### **Vue.js Features Used**
- **Computed Properties**: Reactive filtering
- **Watchers**: Auto-reset on role change
- **Event Handlers**: Manual role change handling
- **Conditional Rendering**: Dynamic options

Tính năng Role-Based Staff Filtering đã hoàn thành và sẵn sàng sử dụng! 🎉🔍


























