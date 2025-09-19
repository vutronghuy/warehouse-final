# Import Receipts Feature - Testing Guide

## Tổng quan
Chức năng này cho phép staff tạo và xem phiếu nhập kho tự động khi import sản phẩm từ file Excel. Phiếu import không cần qua quy trình duyệt, chỉ cần staff tạo thành công là được.

## Các thay đổi đã thực hiện

### Backend Changes

1. **ProductImportController.js**
   - Thêm function `generateImportReceiptNumber()` để tạo số phiếu nhập
   - Cập nhật `importProducts()` để tự động tạo ImportReceipt khi import thành công
   - Track các sản phẩm đã import thành công để tạo phiếu

2. **ImportController.js**
   - Thêm `getImportReceiptsForStaff()` - API lấy danh sách phiếu import cho staff
   - Thêm `getImportReceiptById()` - API lấy chi tiết phiếu import

3. **ImportRoute.js**
   - Thêm route `/import/receipts` (GET) - Lấy danh sách phiếu import
   - Thêm route `/import/receipts/:id` (GET) - Lấy chi tiết phiếu import

### Frontend Changes

1. **ImportReceiptList.vue**
   - Component hiển thị danh sách phiếu import
   - Có filter theo trạng thái (chỉ "Đã tạo"), pagination
   - Hiển thị thông tin: số phiếu, nhà cung cấp, người tạo, ngày tạo, trạng thái, tổng tiền

2. **ImportReceiptDetail.vue**
   - Component hiển thị chi tiết phiếu import
   - Hiển thị thông tin phiếu và danh sách sản phẩm
   - Có chức năng in phiếu
   - Không có phần lịch sử duyệt (đã bỏ)

3. **staff.vue**
   - Thêm tab "Import Receipts" vào navigation
   - Import và đăng ký component ImportReceiptList

4. **routes.ts**
   - Thêm route `/staff/import-receipts/:id` cho ImportReceiptDetail

## Cách test

### 1. Chuẩn bị
- Đảm bảo có ít nhất 1 supplier active trong database
- Đảm bảo có ít nhất 1 category active trong database
- Login với tài khoản staff

### 2. Test Import Excel tạo phiếu
1. Vào tab "Import Products" trong staff dashboard
2. Upload file Excel với sản phẩm hợp lệ
3. Kiểm tra response có `importReceiptId` không null
4. Kiểm tra database có tạo ImportReceipt mới không

### 3. Test hiển thị danh sách phiếu
1. Vào tab "Import Receipts" trong staff dashboard
2. Kiểm tra danh sách phiếu import hiển thị
3. Test filter theo trạng thái (chỉ có "Đã tạo")
4. Test pagination nếu có nhiều phiếu

### 4. Test chi tiết phiếu
1. Click "Xem" trên một phiếu trong danh sách
2. Kiểm tra hiển thị đầy đủ thông tin phiếu
3. Kiểm tra danh sách sản phẩm trong phiếu
4. Test chức năng "In phiếu"
5. Test nút "Quay lại"
6. **Lưu ý**: Không có phần lịch sử duyệt

## API Endpoints

### GET /import/receipts
**Mô tả**: Lấy danh sách phiếu import cho staff
**Headers**: Authorization Bearer token
**Query params**:
- `page` (optional): Số trang (default: 1)
- `limit` (optional): Số phiếu mỗi trang (default: 10)
- `status` (optional): Filter theo trạng thái (chỉ "created")

**Response**:
```json
{
  "success": true,
  "importReceipts": [...],
  "pagination": {
    "current": 1,
    "limit": 10,
    "total": 25,
    "pages": 3
  }
}
```

### GET /import/receipts/:id
**Mô tả**: Lấy chi tiết phiếu import
**Headers**: Authorization Bearer token
**Response**:
```json
{
  "success": true,
  "importReceipt": {
    "_id": "...",
    "receiptNumber": "IMP20250109001",
    "supplierId": {...},
    "warehouseId": {...},
    "createdByStaff": {...},
    "details": [...],
    "totalAmount": 1000000,
    "status": "created",
    "createdAt": "...",
    "notes": "..."
  }
}
```

## Cấu trúc ImportReceipt

```javascript
{
  receiptNumber: "IMP20250109001", // Auto-generated: IMP + YYYYMMDD + sequence
  supplierId: ObjectId, // Supplier từ sản phẩm đầu tiên hoặc fallback
  warehouseId: ObjectId, // Warehouse của staff
  createdByStaff: ObjectId, // Staff tạo phiếu
  details: [
    {
      productId: ObjectId,
      quantity: Number,
      unitPrice: Number
    }
  ],
  totalAmount: Number, // Tổng tiền tự động tính
  notes: String, // "Auto-generated from Excel import. X products imported."
  status: "created" // Chỉ có trạng thái "created", không cần duyệt
}
```

## Lưu ý khi test

1. **Supplier handling**: Nếu sản phẩm trong Excel không có supplier, hệ thống sẽ tìm supplier active đầu tiên làm fallback
2. **Error handling**: Nếu tạo ImportReceipt thất bại, import sản phẩm vẫn thành công (không fail toàn bộ process)
3. **Permissions**: Chỉ staff có quyền truy cập warehouse của mình mới xem được phiếu import
4. **Receipt number**: Format IMP + YYYYMMDD + 4-digit sequence (reset mỗi ngày)

## Troubleshooting

### Lỗi thường gặp:
1. **"No warehouse access"**: Staff chưa được assign warehouse
2. **"Supplier not found"**: Không có supplier active nào trong database
3. **"Import receipt not found"**: ID không hợp lệ hoặc không có quyền truy cập
4. **Route not found**: Chưa restart frontend sau khi thêm route mới

### Debug tips:
- Check console log trong browser để xem API calls
- Check server log để xem lỗi backend
- Verify token authorization trong Network tab
- Check database để confirm data được tạo đúng
