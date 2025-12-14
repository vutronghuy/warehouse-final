# 📋 Problems & Main Operations của Warehouse Management System

## 🎯 **Topic Chính của Project**

**Warehouse Management System (Hệ thống Quản lý Kho)** - Một hệ thống quản lý kho hàng toàn diện với các tính năng:
- Quản lý đa kho (Multi-warehouse)
- Quản lý sản phẩm và tồn kho
- Quy trình nhập/xuất kho với phê duyệt
- Quản lý hóa đơn và tài chính
- Báo cáo và phân tích
- AI Chatbot hỗ trợ

---

## 🔴 **PROBLEMS - Các Vấn đề mà Hệ thống Giải quyết**

### **1. Quản lý Tồn kho Thủ công & Dễ Sai sót**

**Vấn đề:**
- ❌ Quản lý tồn kho bằng Excel/giấy tờ → Dễ nhầm lẫn, sai sót
- ❌ Không có real-time tracking → Không biết tồn kho chính xác tại thời điểm hiện tại
- ❌ Khó kiểm soát số lượng tồn kho khi có nhiều giao dịch đồng thời
- ❌ Không có cảnh báo khi tồn kho thấp (low stock warning)

**Giải pháp của hệ thống:**
- ✅ Real-time inventory tracking với MongoDB
- ✅ Tự động cập nhật tồn kho khi có import/export
- ✅ Low stock warnings qua Socket.IO notifications
- ✅ Ending inventory calculation theo tháng/năm
- ✅ Inventory transaction logs để audit

---

### **2. Thiếu Kiểm soát Quy trình Nhập/Xuất Kho**

**Vấn đề:**
- ❌ Không có workflow phê duyệt → Dễ xuất kho sai, thiếu kiểm soát
- ❌ Không có audit trail → Khó truy vết khi có vấn đề
- ❌ Không có phân quyền rõ ràng → Ai cũng có thể nhập/xuất
- ❌ Không có validation → Có thể xuất quá số lượng tồn kho

**Giải pháp của hệ thống:**
- ✅ **Import Workflow**: Staff tạo → Admin phê duyệt → Tự động cập nhật tồn kho
- ✅ **Export Workflow**: Staff tạo → Manager duyệt → Admin phê duyệt → Tự động trừ tồn kho
- ✅ Role-based access control (RBAC) với 5 roles: Super Admin, Admin, Manager, Staff, Accounter
- ✅ Validation: Không cho phép xuất quá số lượng tồn kho
- ✅ Audit logs cho tất cả operations

---

### **3. Khó Theo dõi Lịch sử Giao dịch**

**Vấn đề:**
- ❌ Không có lịch sử nhập/xuất → Khó truy vết
- ❌ Không biết ai đã thực hiện giao dịch nào
- ❌ Không có timestamp chính xác
- ❌ Khó tìm lại thông tin giao dịch cũ

**Giải pháp của hệ thống:**
- ✅ **InventoryTransaction** model: Log tất cả thay đổi tồn kho
- ✅ **AuditLog** model: Log tất cả user actions
- ✅ Transaction types: import, export, reservation, release, adjustment
- ✅ Timestamp và user tracking cho mọi giao dịch
- ✅ Search và filter audit logs theo user, action, date

---

### **4. Thiếu Báo cáo Tài chính & Thống kê**

**Vấn đề:**
- ❌ Không có báo cáo doanh thu → Khó đánh giá hiệu quả kinh doanh
- ❌ Không có cash flow analysis → Khó quản lý dòng tiền
- ❌ Không có so sánh theo thời gian → Khó đánh giá xu hướng
- ❌ Không có báo cáo theo kho → Khó so sánh hiệu quả giữa các kho

**Giải pháp của hệ thống:**
- ✅ **Revenue Reports**: Tổng doanh thu theo khoảng thời gian, theo kho
- ✅ **Cash Flow Reports**: Inbound vs Outbound, time series analysis
- ✅ **Inventory Reports**: Giá trị tồn kho, ending inventory
- ✅ **Sales Targets**: Đặt mục tiêu và theo dõi tiến độ
- ✅ **Dashboard Analytics**: Charts, trends, top products
- ✅ Month-over-month comparisons

---

### **5. Quản lý Đa Kho Phức tạp**

**Vấn đề:**
- ❌ Khó quản lý nhiều kho cùng lúc
- ❌ Không biết tồn kho của từng kho
- ❌ Khó phân bổ sản phẩm giữa các kho
- ❌ Không có quản lý nhân viên theo kho

**Giải pháp của hệ thống:**
- ✅ **Multi-warehouse Support**: Quản lý nhiều kho trong một hệ thống
- ✅ **Warehouse-specific Inventory**: Tồn kho riêng cho từng kho
- ✅ **Role-based Warehouse Access**: Mỗi user chỉ truy cập kho của mình
- ✅ **Warehouse Assignment**: Gán users (manager, staff, admin, accounter) vào kho
- ✅ **Warehouse Reports**: Báo cáo riêng cho từng kho

---

### **6. Thiếu Workflow Phê duyệt**

**Vấn đề:**
- ❌ Không có quy trình phê duyệt → Dễ có sai sót
- ❌ Không có notification khi có request cần duyệt
- ❌ Khó biết request nào đang chờ duyệt
- ❌ Không có comment/reason khi approve/reject

**Giải pháp của hệ thống:**
- ✅ **Multi-level Approval**: Manager → Admin cho Export, Admin cho Import, Accounter cho Invoice
- ✅ **Real-time Notifications**: Socket.IO notifications khi có request mới
- ✅ **Status Tracking**: created → reviewed → approved/rejected
- ✅ **Comments**: Thêm comment khi approve/reject
- ✅ **Notification Dashboard**: Xem pending requests

---

### **7. Khó Quản lý Đa Người dùng với Phân quyền**

**Vấn đề:**
- ❌ Không có phân quyền → Ai cũng có thể làm mọi thứ
- ❌ Khó quản lý users → Không biết ai có quyền gì
- ❌ Không có role management → Khó thay đổi quyền
- ❌ Không có user activity tracking

**Giải pháp của hệ thống:**
- ✅ **5 Roles với quyền riêng**: Super Admin, Admin, Manager, Staff, Accounter
- ✅ **User Management**: Create, edit, disable/enable users
- ✅ **Role Change History**: Track lịch sử thay đổi role
- ✅ **Warehouse-based Access**: Users chỉ truy cập kho của mình
- ✅ **Audit Logs**: Track tất cả user actions

---

### **8. Thiếu Hỗ trợ Quyết định (Decision Support)**

**Vấn đề:**
- ❌ Khó phân tích dữ liệu → Cần export ra Excel để phân tích
- ❌ Không có AI hỗ trợ → Phải tự tìm hiểu dữ liệu
- ❌ Khó trả lời câu hỏi về warehouse → Phải query database thủ công

**Giải pháp của hệ thống:**
- ✅ **AI Chatbot**: Google Gemini AI integration
- ✅ **Natural Language Queries**: Hỏi bằng tiếng Việt/Anh
- ✅ **Data Analysis**: Phân tích revenue, profit, trends
- ✅ **Quick Insights**: Trả lời nhanh các câu hỏi về warehouse

---

## ⚙️ **MAIN OPERATIONS - Các Thao tác Chính của Hệ thống**

### **1. Product Management (Quản lý Sản phẩm)**

**Operations:**
- ✅ **CRUD Products**: Create, Read, Update, Delete sản phẩm
- ✅ **Product Search**: Tìm kiếm theo tên, SKU, mô tả
- ✅ **Product Filtering**: Lọc theo status, category, warehouse
- ✅ **Product Categories**: Quản lý danh mục sản phẩm
- ✅ **Product Suppliers**: Liên kết sản phẩm với nhà cung cấp
- ✅ **Product Images**: Upload và quản lý ảnh sản phẩm
- ✅ **Excel Import**: Import sản phẩm từ Excel file
- ✅ **Min Stock Level**: Thiết lập mức tồn kho tối thiểu
- ✅ **Product Pricing**: Quản lý giá (basePrice, finalPrice, markup)

**Key Features:**
- Multi-warehouse product management
- Batch management (ProductBatch)
- Price tracking và history
- Low stock warnings

---

### **2. Inventory Management (Quản lý Tồn kho)**

**Operations:**
- ✅ **Real-time Inventory Tracking**: Cập nhật tồn kho real-time
- ✅ **Inventory by Warehouse**: Tồn kho riêng cho từng kho
- ✅ **Inventory Transactions**: Log tất cả thay đổi tồn kho
- ✅ **Stock Adjustments**: Điều chỉnh tồn kho thủ công
- ✅ **Ending Inventory Calculation**: Tính tồn kho cuối kỳ theo tháng/năm
- ✅ **Low Stock Warnings**: Cảnh báo khi tồn kho thấp
- ✅ **Inventory History**: Xem lịch sử thay đổi tồn kho

**Key Features:**
- Automatic inventory updates khi import/export
- Reservation system (giữ hàng khi tạo export)
- Release system (trả hàng khi reject export)
- Transaction types: import, export, reservation, release, adjustment

---

### **3. Import Operations (Quy trình Nhập kho)**

**Operations:**
- ✅ **Create Import Receipt**: Staff tạo phiếu nhập kho
- ✅ **Add Products to Import**: Thêm sản phẩm vào phiếu nhập (số lượng, đơn giá)
- ✅ **Edit Import Receipt**: Chỉnh sửa phiếu nhập (chỉ khi status = pending)
- ✅ **Delete Import Receipt**: Xóa phiếu nhập (chỉ khi status = pending)
- ✅ **Submit Import Receipt**: Gửi lên Admin phê duyệt
- ✅ **Admin Approve Import**: Admin phê duyệt → Tự động cập nhật tồn kho
- ✅ **Admin Reject Import**: Admin từ chối với comment
- ✅ **Import from Excel**: Import sản phẩm từ Excel file

**Workflow:**
```
Staff tạo Import Receipt (status: pending)
    ↓
Staff submit → Admin nhận notification
    ↓
Admin approve → Tự động cập nhật Inventory
    ↓
Tạo InventoryTransaction (type: import)
```

**Key Features:**
- Multi-product import trong một receipt
- Supplier tracking
- Automatic inventory update
- Import history và audit logs

---

### **4. Export Operations (Quy trình Xuất kho)**

**Operations:**
- ✅ **Create Export Receipt**: Staff tạo phiếu xuất kho
- ✅ **Select Customer**: Chọn khách hàng (có thể tạo mới)
- ✅ **Add Products to Export**: Thêm sản phẩm vào phiếu xuất (số lượng, giá)
- ✅ **Edit Export Receipt**: Chỉnh sửa phiếu xuất (chỉ khi status = created)
- ✅ **Delete Export Receipt**: Xóa phiếu xuất (chỉ khi status = created)
- ✅ **Submit Export Receipt**: Gửi lên Manager duyệt
- ✅ **Manager Review**: Manager duyệt → Chuyển lên Admin
- ✅ **Manager Reject**: Manager từ chối với comment
- ✅ **Admin Approve Export**: Admin phê duyệt → Tự động trừ tồn kho
- ✅ **Admin Reject Export**: Admin từ chối → Trả hàng về kho

**Workflow:**
```
Staff tạo Export Receipt (status: created)
    ↓
Staff submit → Manager nhận notification
    ↓
Manager review → Chuyển status: reviewed
    ↓
Admin nhận notification
    ↓
Admin approve → Tự động trừ Inventory
    ↓
Tạo InventoryTransaction (type: export)
```

**Key Features:**
- Multi-level approval (Manager → Admin)
- Reservation system (giữ hàng khi tạo export)
- Customer management
- Automatic inventory deduction
- Export history và audit logs

---

### **5. Invoice Management (Quản lý Hóa đơn)**

**Operations:**
- ✅ **Create Invoice from Export**: Tạo hóa đơn từ phiếu xuất đã approved
- ✅ **Create Invoice Manually**: Tạo hóa đơn thủ công
- ✅ **Edit Invoice**: Chỉnh sửa hóa đơn (chỉ khi status = pending)
- ✅ **Delete Invoice**: Xóa hóa đơn (chỉ khi status = pending)
- ✅ **Set Payment Condition**: cash, net15, net30, net45, net60
- ✅ **Set Currency**: VND, USD, EUR
- ✅ **Set VAT Rate**: Thiết lập thuế VAT
- ✅ **Submit Invoice**: Gửi lên Accounter duyệt
- ✅ **Accounter Approve**: Accounter duyệt hóa đơn
- ✅ **Accounter Reject**: Accounter từ chối với comment
- ✅ **Mark as Paid**: Đánh dấu hóa đơn đã thanh toán
- ✅ **Generate PDF**: Xuất hóa đơn ra PDF

**Workflow:**
```
Staff tạo Invoice từ Export Receipt (status: pending)
    ↓
Staff submit → Accounter nhận notification
    ↓
Accounter approve → Status: approved
    ↓
Mark as paid → Status: paid
```

**Key Features:**
- Multi-currency support (VND, USD, EUR)
- Payment terms tracking
- VAT calculation
- PDF generation
- Invoice history và audit logs

---

### **6. User & Role Management (Quản lý Người dùng & Vai trò)**

**Operations:**
- ✅ **Create User**: Tạo user mới với role (admin/manager/staff/accounter)
- ✅ **Edit User**: Chỉnh sửa thông tin user (username, fullName, email)
- ✅ **Disable/Enable User**: Vô hiệu hóa/kích hoạt tài khoản
- ✅ **Change User Role**: Thay đổi vai trò của user
- ✅ **View Role Change History**: Xem lịch sử thay đổi role
- ✅ **Assign User to Warehouse**: Gán user vào kho
- ✅ **Search Users**: Tìm kiếm user theo username, email
- ✅ **Filter Users**: Lọc theo role, status, warehouse
- ✅ **Password Reset**: Reset mật khẩu qua OTP email

**Roles & Permissions:**
- **Super Admin**: Full access toàn hệ thống
- **Admin**: Quản lý các kho được assign, approve import/export
- **Manager**: Quản lý một kho, review export receipts
- **Staff**: Tạo import/export receipts, invoices trong kho của mình
- **Accounter**: Duyệt invoices, xem báo cáo tài chính

---

### **7. Reporting & Analytics (Báo cáo & Phân tích)**

**Operations:**
- ✅ **Revenue Reports**: Tổng doanh thu theo khoảng thời gian, theo kho
- ✅ **Cash Flow Reports**: Inbound vs Outbound, time series
- ✅ **Inventory Reports**: Giá trị tồn kho, ending inventory
- ✅ **Sales Targets**: Đặt mục tiêu và theo dõi tiến độ
- ✅ **Top Products**: Sản phẩm bán chạy nhất
- ✅ **Customer Statistics**: Thống kê khách hàng
- ✅ **Warehouse Statistics**: Thống kê theo từng kho
- ✅ **Month-over-Month Comparison**: So sánh theo thời gian

**Key Features:**
- Filter theo khoảng thời gian (ngày/tháng/năm)
- Filter theo warehouse
- Charts và visualizations
- Export reports (PDF, Excel)

---

### **8. Real-time Notifications (Thông báo Real-time)**

**Operations:**
- ✅ **Socket.IO Integration**: Real-time communication
- ✅ **Invoice Notifications**: Thông báo khi có invoice mới/approved/rejected
- ✅ **Export Notifications**: Thông báo khi có export mới/approved/rejected
- ✅ **Low Stock Warnings**: Cảnh báo tồn kho thấp
- ✅ **Chart Data Updates**: Cập nhật biểu đồ real-time
- ✅ **Force Logout**: Đăng xuất user khi bị deactivate

**Notification Types:**
- Invoice created → Accounters
- Invoice approved/rejected → Staff, Managers, Admins, Accounters
- Export created → Managers, Admins
- Export approved/rejected → Staff, Managers, Admins
- Low stock → Super Admins
- Chart data updated → Accounters, Admins, Managers, Super Admins

---

### **9. AI Chatbot Assistant (Trợ lý AI)**

**Operations:**
- ✅ **Natural Language Queries**: Hỏi bằng tiếng Việt/Anh
- ✅ **Data Analysis**: Phân tích revenue, profit, trends
- ✅ **Financial Queries**: Câu hỏi về tài chính
- ✅ **Inventory Queries**: Câu hỏi về tồn kho
- ✅ **Quick Suggestions**: Gợi ý câu hỏi nhanh
- ✅ **Chat History**: Lịch sử chat

**Key Features:**
- Google Gemini AI integration
- Query MongoDB collections
- Financial calculations (revenue, profit, margin)
- Multi-language support

---

### **10. Audit & Logging (Kiểm toán & Ghi log)**

**Operations:**
- ✅ **Audit Logs**: Log tất cả user actions
- ✅ **Filter Logs**: Lọc theo user, role, action, date
- ✅ **View Log Details**: Xem chi tiết log (before/after states)
- ✅ **Inventory Transactions**: Log tất cả thay đổi tồn kho
- ✅ **Action Tracking**: Track CREATE, UPDATE, DELETE operations

**Logged Actions:**
- IMPORT_PRODUCT_EXCEL
- CREATE_EXPORT_SLIP
- UPDATE_EXPORT_SLIP
- DELETE_EXPORT_SLIP
- CREATE_INVOICE
- UPDATE_INVOICE
- DELETE_INVOICE
- UPDATE_PRODUCT
- CHANGE_ROLE

---

## 📊 **Tóm tắt Operations theo Module**

| Module | Main Operations | Key Features |
|--------|----------------|-------------|
| **Products** | CRUD, Search, Filter, Excel Import | Multi-warehouse, Categories, Suppliers |
| **Inventory** | Real-time Tracking, Transactions, Adjustments | Ending Inventory, Low Stock Warnings |
| **Import** | Create, Edit, Approve, Reject | Multi-product, Auto Inventory Update |
| **Export** | Create, Review, Approve, Reject | Multi-level Approval, Reservation System |
| **Invoice** | Create, Approve, Mark Paid, PDF Export | Multi-currency, VAT, Payment Terms |
| **Users** | CRUD, Role Management, Warehouse Assignment | 5 Roles, RBAC, Audit Trail |
| **Reports** | Revenue, Cash Flow, Inventory, Targets | Time-based Filtering, Charts |
| **Notifications** | Real-time Alerts, Socket.IO | Role-based, Event-driven |
| **AI Chatbot** | Natural Language Queries, Data Analysis | Gemini AI, Financial Analysis |
| **Audit** | Log All Actions, Filter, View Details | Complete Audit Trail |

---

## 🎯 **Kết luận**

**Hệ thống Warehouse Management giải quyết 8 vấn đề chính:**
1. Quản lý tồn kho thủ công
2. Thiếu kiểm soát quy trình nhập/xuất
3. Khó theo dõi lịch sử giao dịch
4. Thiếu báo cáo tài chính
5. Quản lý đa kho phức tạp
6. Thiếu workflow phê duyệt
7. Khó quản lý đa người dùng
8. Thiếu hỗ trợ quyết định

**Với 10 nhóm Operations chính:**
1. Product Management
2. Inventory Management
3. Import Operations
4. Export Operations
5. Invoice Management
6. User & Role Management
7. Reporting & Analytics
8. Real-time Notifications
9. AI Chatbot Assistant
10. Audit & Logging

---

**Cập nhật lần cuối:** 2025-01-27

