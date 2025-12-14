# Hướng dẫn Test Ending Inventory

## 📊 Công thức tính Ending Inventory

```
Ending Inventory = max(0, Tổng Import lũy kế đến cuối tháng - Tổng Export lũy kế đến cuối tháng)
```

**Lưu ý quan trọng:**
- Ending Inventory **KHÔNG** phụ thuộc vào Current Quantity hiện tại
- Ending Inventory tính dựa trên **lịch sử import/export** đến cuối tháng được chọn
- Export chỉ tính các phiếu có status = `approved` hoặc `confirmed`

---

## 🧪 Test Case 1: Product hiện tại có 50

### Giả sử:
- **Current Quantity** = 50 (tồn hiện tại)
- Chọn tháng/năm **hiện tại** (tháng 12/2025)

### Cách tính Ending Inventory:

**Bước 1:** Xem lịch sử import/export trong tháng 12/2025:
- Tổng Import trong tháng 12 = ? (ví dụ: 100)
- Tổng Export (approved/confirmed) trong tháng 12 = ? (ví dụ: 50)

**Bước 2:** Tính Ending:
```
Ending Inventory = max(0, 100 - 50) = 50
```

**Kết quả:** Ending Inventory = 50

**Giải thích:**
- Nếu Ending = Current Quantity (50), có nghĩa là:
  - Tổng import đến cuối tháng = 100
  - Tổng export đến cuối tháng = 50
  - Ending = 100 - 50 = 50 ✅

---

## 🧪 Test Case 2: Sau khi Export 30

### Tình huống:
1. **Trước khi export:**
   - Current Quantity = 50
   - Ending Inventory (tháng 12) = 50

2. **Tạo Export Receipt với 30:**
   - Khi tạo export, Current Quantity giảm ngay: 50 - 30 = **20**
   - Export Receipt có status = `created` (chưa approve)

3. **Sau khi Admin Approve Export:**
   - Current Quantity vẫn = **20** (đã trừ từ lúc tạo)
   - Export Receipt có status = `approved`
   - Export này **SẼ ĐƯỢC TÍNH** vào Ending Inventory

### Tính Ending Inventory sau khi export:

**Nếu chọn tháng 12/2025 (tháng hiện tại):**
```
Tổng Import đến cuối tháng 12 = 100
Tổng Export (approved) đến cuối tháng 12 = 50 + 30 = 80
Ending Inventory = max(0, 100 - 80) = 20
```

**Kết quả:**
- Current Quantity = **20** ✅
- Ending Inventory (tháng 12) = **20** ✅
- **Ending = Current Quantity** (vì đây là tháng hiện tại và tất cả giao dịch đã được xử lý)

---

## 🧪 Test Case 3: Chọn tháng quá khứ

### Tình huống:
- Hiện tại: Current Quantity = 20
- Chọn tháng **11/2025** (tháng trước)

### Tính Ending Inventory tháng 11:

**Bước 1:** Xem lịch sử đến cuối tháng 11:
- Tổng Import đến cuối tháng 11 = ? (ví dụ: 80)
- Tổng Export (approved) đến cuối tháng 11 = ? (ví dụ: 30)

**Bước 2:** Tính Ending:
```
Ending Inventory (tháng 11) = max(0, 80 - 30) = 50
```

**Kết quả:**
- Current Quantity = **20** (tồn hiện tại)
- Ending Inventory (tháng 11) = **50** (tồn cuối tháng 11)
- **Ending ≠ Current Quantity** ✅ (đúng, vì có giao dịch sau tháng 11)

---

## ✅ Checklist để Test

### 1. Test với tháng hiện tại:
- [ ] Tạo Import Receipt với quantity = 100
- [ ] Kiểm tra Current Quantity tăng lên
- [ ] Tạo Export Receipt với quantity = 50
- [ ] Approve Export Receipt
- [ ] Chọn tháng/năm hiện tại
- [ ] Kiểm tra Ending Inventory = Current Quantity

### 2. Test với tháng quá khứ:
- [ ] Chọn tháng trước (ví dụ: tháng 11)
- [ ] Kiểm tra Ending Inventory ≠ Current Quantity
- [ ] Ending Inventory phải = Tổng Import - Tổng Export đến cuối tháng đó

### 3. Test với tháng không có giao dịch:
- [ ] Chọn tháng không có import/export nào
- [ ] Kiểm tra Ending Inventory = 0

### 4. Test với nhiều warehouse:
- [ ] Tạo import/export ở warehouse A
- [ ] Chọn warehouse A → Kiểm tra Ending Inventory
- [ ] Chọn warehouse B → Kiểm tra Ending Inventory = 0 hoặc khác

---

## 🔍 Cách Debug

### 1. Xem Console Log (Backend):
Khi gọi API `/api/products/ending-inventory`, xem log:
```
📊 Ending Inventory Calculation (First Product): {
  productId: "...",
  productName: "...",
  totalImport: 100,
  totalExport: 50,
  endingInventory: 50,
  currentQuantity: 20,
  endOfMonth: "2025-12-31T23:59:59.999Z",
  month: 12,
  year: 2025
}
```

### 2. Xem Console Log (Frontend):
Mở Developer Tools (F12) → Console:
```
📊 Fetching ending inventory for: { month: "12", year: "2025" }
✅ Ending inventory response: { success: true, data: { ... } }
📦 Ending inventory map: { "productId1": 50, "productId2": 30, ... }
```

### 3. Kiểm tra Database:
```javascript
// Xem Import Receipts trong tháng
db.importreceipts.find({
  createdAt: { $lte: ISODate("2025-12-31T23:59:59.999Z") },
  deletedAt: null
})

// Xem Export Receipts (approved) trong tháng
db.exportreceipts.find({
  createdAt: { $lte: ISODate("2025-12-31T23:59:59.999Z") },
  status: { $in: ["approved", "confirmed"] },
  deletedAt: null
})
```

---

## ⚠️ Lưu ý quan trọng

1. **Export chỉ tính khi approved/confirmed:**
   - Export với status = `created` → **KHÔNG tính** vào Ending Inventory
   - Export với status = `rejected` → **KHÔNG tính** vào Ending Inventory

2. **Ending Inventory tính lũy kế:**
   - Tính từ đầu đến cuối tháng được chọn
   - Không chỉ tính trong tháng đó, mà tính tất cả đến cuối tháng

3. **Current Quantity vs Ending Inventory:**
   - Current Quantity = tồn hiện tại (real-time)
   - Ending Inventory = tồn cuối kỳ của tháng được chọn
   - Chỉ bằng nhau khi: chọn tháng hiện tại + tất cả giao dịch đã xử lý

---

## 📝 Ví dụ thực tế

### Scenario:
- **Tháng 1:** Import 100, Export 20 → Ending = 80
- **Tháng 2:** Import 50, Export 30 → Ending = 100 (80 + 50 - 30)
- **Tháng 3:** Không import, Export 10 → Ending = 90 (100 - 10)
- **Hiện tại (tháng 12):** Current Quantity = 90

### Test:
- Chọn tháng 1 → Ending = 80 ✅
- Chọn tháng 2 → Ending = 100 ✅
- Chọn tháng 3 → Ending = 90 ✅
- Chọn tháng 12 → Ending = 90 (bằng Current Quantity) ✅

