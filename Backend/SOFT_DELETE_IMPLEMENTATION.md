# Soft Delete Implementation - Product & Supplier

## ✅ Đã hoàn thành

Đã chuyển từ **hard delete** sang **soft delete** cho Product và Supplier models.

---

## 📋 Thay đổi chi tiết

### 1. **Models - Query Middleware**

#### Product Model (`Backend/models/products/product.js`)
- ✅ Đã có field `deletedAt` (đã có sẵn)
- ✅ Thêm query middleware để tự động filter deleted records
- ✅ Chỉ filter khi `deletedAt` không được set rõ ràng trong query

```javascript
// Query middleware to exclude soft-deleted records by default
productSchema.pre(/^find/, function (next) {
  if (this.getQuery().deletedAt === undefined) {
    this.where({ deletedAt: null });
  }
  next();
});
```

#### Supplier Model (`Backend/models/products/Supplier.js`)
- ✅ Đã có field `deletedAt` (đã có sẵn)
- ✅ Thêm query middleware tương tự Product

---

### 2. **Controllers - Delete Functions**

#### ProductController (`Backend/controller/ProductController.js`)

**`deleteProduct` - Soft Delete:**
- ✅ Chuyển từ `findByIdAndDelete` sang `findByIdAndUpdate` với `deletedAt: new Date()`
- ✅ Hỗ trợ hard delete với query param `?hardDelete=true` (chỉ Super Admin)
- ✅ Check nếu đã bị delete thì báo lỗi
- ✅ Ghi log `updatedBy` khi delete

**`restoreProduct` - Restore:**
- ✅ Function mới để restore soft-deleted products
- ✅ Set `deletedAt: null` để restore
- ✅ Chỉ restore products đã bị soft delete

#### SupplierController (`Backend/controller/SupplierController.js`)

**`deleteSupplier` - Soft Delete:**
- ✅ Tương tự ProductController
- ✅ Chuyển từ hard delete sang soft delete
- ✅ Hỗ trợ hard delete với `?hardDelete=true`

**`restoreSupplier` - Restore:**
- ✅ Function mới để restore soft-deleted suppliers

---

### 3. **Routes**

#### ProductRoute (`Backend/router/ProductRoute.js`)
- ✅ Cập nhật comment cho DELETE route
- ✅ Thêm route: `POST /api/products/:id/restore` (Super Admin only)

#### SupplierRoute (`Backend/router/SupplierRoute.js`)
- ✅ Cập nhật comment cho DELETE route
- ✅ Thêm route: `POST /api/suppliers/:id/restore` (Super Admin only)

---

## 🔧 Cách sử dụng

### Soft Delete Product
```bash
DELETE /api/products/:id
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Product deleted successfully (soft delete)",
  "deletedProduct": {
    "id": "...",
    "name": "Product Name",
    "sku": "SKU123",
    "deletedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### Hard Delete Product (Super Admin only)
```bash
DELETE /api/products/:id?hardDelete=true
Authorization: Bearer <super-admin-token>
```

### Restore Product
```bash
POST /api/products/:id/restore
Authorization: Bearer <super-admin-token>
```

**Response:**
```json
{
  "success": true,
  "message": "Product restored successfully",
  "product": {
    "id": "...",
    "name": "Product Name",
    "sku": "SKU123"
  }
}
```

### Soft Delete Supplier
```bash
DELETE /api/suppliers/:id
Authorization: Bearer <token>
```

### Restore Supplier
```bash
POST /api/suppliers/:id/restore
Authorization: Bearer <super-admin-token>
```

---

## 🎯 Lợi ích

1. **Data Preservation**: Dữ liệu không bị mất vĩnh viễn, có thể restore
2. **Audit Trail**: Giữ lại lịch sử xóa với timestamp `deletedAt`
3. **Automatic Filtering**: Tất cả queries tự động exclude deleted records
4. **Backward Compatible**: Existing queries vẫn hoạt động bình thường
5. **Flexible**: Có thể query deleted records khi cần (set `deletedAt` trong query)

---

## ⚠️ Lưu ý

1. **Query Middleware**: 
   - Tự động filter deleted records cho tất cả `find*` queries
   - Nếu query đã set `deletedAt` rõ ràng, middleware sẽ không override
   - Để query deleted records: `Product.find({ deletedAt: { $ne: null } })`

2. **Hard Delete**:
   - Chỉ Super Admin mới có quyền hard delete
   - Phải dùng query param `?hardDelete=true`
   - Hard delete sẽ xóa vĩnh viễn, không thể restore

3. **Restore**:
   - Chỉ Super Admin mới có quyền restore
   - Chỉ restore được records đã bị soft delete
   - Restore sẽ set `deletedAt: null`

4. **Existing Data**:
   - Records hiện tại có `deletedAt: null` sẽ không bị ảnh hưởng
   - Queries hiện tại vẫn hoạt động bình thường

---

## 🔍 Testing

### Test Cases

1. **Soft Delete Product**
   - ✅ Delete product → `deletedAt` được set
   - ✅ Query products → deleted product không xuất hiện
   - ✅ Try delete again → báo lỗi "already deleted"

2. **Restore Product**
   - ✅ Restore deleted product → `deletedAt` = null
   - ✅ Query products → restored product xuất hiện lại

3. **Hard Delete Product (Super Admin)**
   - ✅ Hard delete → product bị xóa vĩnh viễn
   - ✅ Query products → không tìm thấy
   - ✅ Try restore → báo lỗi "not found"

4. **Query Deleted Records**
   - ✅ Query với `deletedAt: { $ne: null }` → tìm thấy deleted records

5. **Supplier** - Tương tự Product

---

## 📊 Impact

- ✅ **No Breaking Changes**: Existing code vẫn hoạt động
- ✅ **Backward Compatible**: Queries hiện tại tự động filter deleted records
- ✅ **Data Safety**: Không mất dữ liệu khi delete nhầm
- ✅ **Audit Trail**: Có thể track khi nào record bị delete

---

## 🚀 Next Steps (Optional)

1. **List Deleted Records Endpoint**: Thêm endpoint để list deleted products/suppliers
2. **Bulk Restore**: Thêm function để restore nhiều records cùng lúc
3. **Auto Cleanup**: Có thể thêm job để hard delete records đã soft delete quá lâu (ví dụ > 1 năm)
4. **Deleted Records Dashboard**: UI để quản lý deleted records

---

**Tất cả thay đổi đã được test và không có lỗi syntax.**

