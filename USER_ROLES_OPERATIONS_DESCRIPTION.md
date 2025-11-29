# MÔ TẢ CÁC THAO TÁC THEO VAI TRÒ NGƯỜI DÙNG

## 1. SUPER ADMIN

### Dashboard
- **View Inventory Levels by Warehouse**: Xem mức tồn kho theo từng kho (biểu đồ)
- **View Inbound vs Outbound Trends**: Xem xu hướng nhập - xuất theo thời gian (có filter theo năm/tháng/ngày)
- **View Revenue by Warehouse**: Xem doanh thu theo từng kho (có filter kho và khoảng thời gian)
- **View Total Revenue**: Xem tổng doanh thu với filter thời gian
- **View Statistics**: Xem các thống kê tổng quan hệ thống

### Quản lý Users
- **Search user**: Tìm kiếm user theo username, email
- **Filter user**: Lọc user theo role (admin/manager/staff/accounter), theo status (active/inactive)
- **View user list**: Xem danh sách tất cả users trong hệ thống
- **Create user**: Tạo user mới (admin/manager/staff/accounter)
- **Edit user**: Chỉnh sửa thông tin user (username, fullName, email)
- **Disable user**: Vô hiệu hóa tài khoản user (chuyển status sang inactive)
- **Enable user**: Kích hoạt lại tài khoản user (chuyển status sang active)
- **Change user role**: Thay đổi vai trò của user (có lịch sử thay đổi)
- **View role change history**: Xem lịch sử thay đổi vai trò của user
- **View user details**: Xem chi tiết thông tin user

### Quản lý Products
- **View product list**: Xem danh sách tất cả sản phẩm
- **Search product**: Tìm kiếm sản phẩm theo tên, SKU, mô tả
- **Filter product**: Lọc sản phẩm theo status (in stock/out of stock), theo category, theo warehouse
- **Create product**: Tạo sản phẩm mới (tên, SKU, mô tả, đơn vị, giá, category, supplier, min stock level)
- **Edit product**: Chỉnh sửa thông tin sản phẩm
- **Delete product**: Xóa sản phẩm
- **View product details**: Xem chi tiết sản phẩm (tồn kho, lịch sử nhập/xuất)
- **Manage min stock level**: Quản lý mức tồn kho tối thiểu cho từng sản phẩm
- **Upload product image**: Upload ảnh sản phẩm (Cloudinary)

### Quản lý Warehouses
- **View warehouse list**: Xem danh sách tất cả kho
- **Search warehouse**: Tìm kiếm kho theo tên, địa điểm
- **Create warehouse**: Tạo kho mới (tên, địa điểm, manager, staff, admin, accounter)
- **Edit warehouse**: Chỉnh sửa thông tin kho
- **Delete warehouse**: Xóa kho (soft delete)
- **View warehouse details**: Xem chi tiết kho (số lượng sản phẩm, nhân viên)
- **Assign users to warehouse**: Gán manager, staff, admin, accounter vào kho

### Quản lý Suppliers
- **View supplier list**: Xem danh sách nhà cung cấp
- **Search supplier**: Tìm kiếm nhà cung cấp theo tên, email, phone
- **Create supplier**: Tạo nhà cung cấp mới (tên, email, phone, địa chỉ)
- **Edit supplier**: Chỉnh sửa thông tin nhà cung cấp
- **Delete supplier**: Xóa nhà cung cấp
- **View supplier details**: Xem chi tiết nhà cung cấp (sản phẩm liên kết)

### Quản lý Customers
- **View customer list**: Xem danh sách khách hàng
- **Search customer**: Tìm kiếm khách hàng theo tên, email, phone
- **Create customer**: Tạo khách hàng mới (tên, email, phone, địa chỉ)
- **Edit customer**: Chỉnh sửa thông tin khách hàng
- **Delete customer**: Xóa khách hàng
- **View customer details**: Xem chi tiết khách hàng (lịch sử mua hàng)

### Quản lý Categories
- **View category list**: Xem danh sách danh mục
- **Search category**: Tìm kiếm danh mục theo tên
- **Create category**: Tạo danh mục mới (tên, mô tả)
- **Edit category**: Chỉnh sửa thông tin danh mục
- **Delete category**: Xóa danh mục
- **View category details**: Xem chi tiết danh mục (số lượng sản phẩm)

### Quản lý Targets
- **View target list**: Xem danh sách mục tiêu bán hàng
- **Create target**: Tạo mục tiêu mới (warehouse, năm, tháng, số tiền)
- **Edit target**: Chỉnh sửa mục tiêu
- **Delete target**: Xóa mục tiêu
- **View target progress**: Xem tiến độ hoàn thành mục tiêu

### Audit Logs
- **View audit logs**: Xem tất cả nhật ký hoạt động trong hệ thống
- **Filter by role**: Lọc logs theo vai trò (staff/manager/accounter/admin)
- **Filter by user**: Lọc logs theo user cụ thể
- **Filter by action**: Lọc logs theo hành động (CREATE_INVOICE, UPDATE_INVOICE, DELETE_INVOICE, CREATE_EXPORT_SLIP, UPDATE_EXPORT_SLIP, DELETE_EXPORT_SLIP, IMPORT_PRODUCT_EXCEL, UPDATE_PRODUCT, CHANGE_ROLE)
- **Filter by date**: Lọc logs theo ngày
- **View log details**: Xem chi tiết log (thông tin trước/sau thay đổi, lý do, lỗi)
- **Clear filters**: Xóa tất cả bộ lọc

### Chatbot AI
- **Open chatbot**: Mở cửa sổ chatbot
- **Ask questions**: Đặt câu hỏi về dữ liệu hệ thống
- **View quick suggestions**: Xem các câu hỏi gợi ý nhanh
- **View chat history**: Xem lịch sử chat

---

## 2. ADMIN

### Dashboard
- **View Customers**: Xem số lượng khách hàng (có filter theo ngày/tháng/năm)
- **View Orders**: Xem số lượng đơn hàng (có filter theo ngày/tháng/năm)
- **View Revenue**: Xem doanh thu (có filter theo ngày/tháng/năm)
- **View Top Products**: Xem top sản phẩm bán chạy
- **View Statistics**: Xem các thống kê của các kho được quản lý

### Quản lý Products
- **View product list**: Xem danh sách sản phẩm trong các kho được quản lý
- **Search product**: Tìm kiếm sản phẩm theo tên, SKU
- **Filter product**: Lọc sản phẩm theo status, category, warehouse
- **Create product**: Tạo sản phẩm mới trong kho được quản lý
- **Edit product**: Chỉnh sửa thông tin sản phẩm
- **Delete product**: Xóa sản phẩm
- **View product details**: Xem chi tiết sản phẩm
- **Upload product image**: Upload ảnh sản phẩm

### Export Approval (Phê duyệt xuất kho)
- **View export receipts**: Xem danh sách phiếu xuất kho đã được manager duyệt (status = reviewed)
- **Filter by status**: Lọc phiếu xuất theo trạng thái (reviewed/approved/rejected)
- **Search export receipt**: Tìm kiếm phiếu xuất theo số phiếu, tên khách hàng
- **View export receipt details**: Xem chi tiết phiếu xuất (sản phẩm, số lượng, giá)
- **Approve export receipt**: Phê duyệt phiếu xuất kho (chuyển status sang approved, tự động trừ tồn kho)
- **Reject export receipt**: Từ chối phiếu xuất kho (chuyển status sang rejected, có thể thêm comment)
- **Add approval comment**: Thêm ghi chú khi phê duyệt/từ chối

### Quản lý Users (trong kho được quản lý)
- **View user list**: Xem danh sách users trong các kho được quản lý
- **Search user**: Tìm kiếm user
- **Filter user**: Lọc user theo role, status
- **View user details**: Xem chi tiết user

### Chatbot AI
- **Open chatbot**: Mở cửa sổ chatbot
- **Ask questions**: Đặt câu hỏi về dữ liệu
- **View quick suggestions**: Xem các câu hỏi gợi ý

---

## 3. MANAGER

### Dashboard
- **View Total Users**: Xem tổng số users trong kho
- **View Pending Exports**: Xem số lượng phiếu xuất đang chờ duyệt
- **View Total Products**: Xem tổng số sản phẩm trong kho
- **View Warehouse Statistics**: Xem các thống kê của kho được quản lý

### Export Review (Duyệt phiếu xuất)
- **View export receipts**: Xem danh sách phiếu xuất kho do staff tạo (status = created)
- **Filter by status**: Lọc phiếu xuất theo trạng thái (created/reviewed/approved/rejected)
- **Search export receipt**: Tìm kiếm phiếu xuất theo số phiếu, tên khách hàng
- **View export receipt details**: Xem chi tiết phiếu xuất (sản phẩm, số lượng, giá, thông tin khách hàng)
- **Review export receipt**: Duyệt phiếu xuất (chuyển status sang reviewed, gửi lên admin phê duyệt)
- **Reject export receipt**: Từ chối phiếu xuất (chuyển status sang rejected, có thể thêm comment)
- **Add review comment**: Thêm ghi chú khi duyệt/từ chối

### Quản lý Users (trong kho)
- **View user list**: Xem danh sách users trong kho được quản lý
- **Search user**: Tìm kiếm user trong kho
- **Filter user**: Lọc user theo role, status
- **View user details**: Xem chi tiết user

---

## 4. STAFF

### Dashboard
- **View notifications**: Xem thông báo (phiếu xuất đã được admin phê duyệt)
- **View unread count**: Xem số lượng thông báo chưa đọc
- **Mark notification as read**: Đánh dấu thông báo đã đọc
- **Delete notification**: Xóa thông báo

### Quản lý Products
- **View product list**: Xem danh sách sản phẩm trong kho
- **Search product**: Tìm kiếm sản phẩm theo tên, SKU
- **Filter product**: Lọc sản phẩm theo status, category
- **View product details**: Xem chi tiết sản phẩm (tồn kho, giá, nhà cung cấp)

### Import Products (Nhập sản phẩm)
- **View import receipt list**: Xem danh sách phiếu nhập kho
- **Search import receipt**: Tìm kiếm phiếu nhập theo số phiếu
- **Filter by status**: Lọc phiếu nhập theo trạng thái (pending/approved/rejected)
- **Create import receipt**: Tạo phiếu nhập kho mới
- **Add products to import**: Thêm sản phẩm vào phiếu nhập (sản phẩm, số lượng, đơn giá)
- **Edit import receipt**: Chỉnh sửa phiếu nhập (chỉ khi status = pending)
- **Delete import receipt**: Xóa phiếu nhập (chỉ khi status = pending)
- **View import receipt details**: Xem chi tiết phiếu nhập
- **Submit import receipt**: Gửi phiếu nhập lên admin phê duyệt

### Import Products from Excel
- **Download template**: Tải template Excel để import sản phẩm
- **Upload Excel file**: Upload file Excel (drag & drop hoặc chọn file)
- **View import progress**: Xem tiến độ import
- **View import results**: Xem kết quả import (số lượng thành công/thất bại)
- **View import errors**: Xem chi tiết lỗi import (nếu có)
- **Retry import**: Import lại file (nếu có lỗi)

### Export Products (Xuất sản phẩm)
- **View export receipt list**: Xem danh sách phiếu xuất kho
- **Search export receipt**: Tìm kiếm phiếu xuất theo số phiếu, tên khách hàng
- **Filter by status**: Lọc phiếu xuất theo trạng thái (created/reviewed/approved/rejected)
- **Create export receipt**: Tạo phiếu xuất kho mới
- **Select customer**: Chọn khách hàng (có thể tạo mới)
- **Add products to export**: Thêm sản phẩm vào phiếu xuất (sản phẩm, số lượng, đơn giá)
- **Edit export receipt**: Chỉnh sửa phiếu xuất (chỉ khi status = created)
- **Delete export receipt**: Xóa phiếu xuất (chỉ khi status = created)
- **View export receipt details**: Xem chi tiết phiếu xuất
- **Submit export receipt**: Gửi phiếu xuất lên manager duyệt

### Invoice Management (Quản lý hóa đơn)
- **View invoice list**: Xem danh sách hóa đơn đã tạo
- **Search invoice**: Tìm kiếm hóa đơn theo số hóa đơn, tên khách hàng
- **Filter by status**: Lọc hóa đơn theo trạng thái (pending/approved/paid/rejected)
- **Create invoice from export**: Tạo hóa đơn từ phiếu xuất đã được phê duyệt
- **Create invoice manually**: Tạo hóa đơn thủ công
- **Edit invoice**: Chỉnh sửa hóa đơn (chỉ khi status = pending)
- **Delete invoice**: Xóa hóa đơn (chỉ khi status = pending)
- **View invoice details**: Xem chi tiết hóa đơn
- **Set payment condition**: Thiết lập điều kiện thanh toán (cash/net15/net30/net45/net60)
- **Set currency**: Thiết lập loại tiền tệ (VND/USD/EUR)
- **Set VAT rate**: Thiết lập thuế VAT
- **Add invoice note**: Thêm ghi chú cho hóa đơn
- **Submit invoice**: Gửi hóa đơn lên accounter duyệt

### Audit Logs (Nhật ký hoạt động)
- **View own audit logs**: Xem nhật ký hoạt động của chính mình
- **Filter by action**: Lọc logs theo hành động
- **Filter by date**: Lọc logs theo ngày
- **View log details**: Xem chi tiết log (thông tin trước/sau thay đổi)

---

## 5. ACCOUNTER

### Dashboard
- **View Revenue Statistics**: Xem thống kê doanh thu (có filter theo ngày/tháng/năm, theo kho)
- **View Cash Flow**: Xem dòng tiền (inbound vs outbound)
- **View Top Products**: Xem top sản phẩm bán chạy
- **View Sales Trends**: Xem xu hướng bán hàng (biểu đồ)
- **View Total Revenue**: Xem tổng doanh thu
- **View Total Expenses**: Xem tổng chi phí
- **View Net Profit**: Xem lợi nhuận ròng

### Invoice Review (Duyệt hóa đơn)
- **View pending invoices**: Xem danh sách hóa đơn chờ duyệt (status = pending)
- **View approved invoices**: Xem danh sách hóa đơn đã duyệt (status = approved)
- **View rejected invoices**: Xem danh sách hóa đơn đã từ chối (status = rejected)
- **Search invoice**: Tìm kiếm hóa đơn theo số hóa đơn, tên khách hàng
- **Filter by status**: Lọc hóa đơn theo trạng thái
- **View invoice details**: Xem chi tiết hóa đơn (sản phẩm, số lượng, giá, VAT, tổng tiền, điều kiện thanh toán, ngày đáo hạn)
- **Approve invoice**: Duyệt hóa đơn (chuyển status sang approved)
- **Reject invoice**: Từ chối hóa đơn (chuyển status sang rejected, có thể thêm comment)
- **Mark invoice as paid**: Đánh dấu hóa đơn đã thanh toán (chuyển status sang paid)
- **Add review comment**: Thêm ghi chú khi duyệt/từ chối
- **View invoice history**: Xem lịch sử thay đổi hóa đơn

### Notifications
- **View notifications**: Xem thông báo (hóa đơn mới từ staff)
- **View unread count**: Xem số lượng thông báo chưa đọc
- **Mark notification as read**: Đánh dấu thông báo đã đọc
- **Delete notification**: Xóa thông báo
- **View pending invoice count**: Xem số lượng hóa đơn chờ duyệt

---

## LƯU Ý CHUNG

### Quyền truy cập dữ liệu
- **Super Admin**: Truy cập tất cả dữ liệu trong hệ thống
- **Admin**: Chỉ truy cập dữ liệu của các kho được quản lý
- **Manager**: Chỉ truy cập dữ liệu của kho được quản lý
- **Staff**: Chỉ truy cập dữ liệu của kho thuộc về
- **Accounter**: Chỉ truy cập dữ liệu của kho thuộc về

### Quy trình phê duyệt
- **Import Receipt**: Staff tạo → Admin phê duyệt → Tự động cập nhật tồn kho
- **Export Receipt**: Staff tạo → Manager duyệt → Admin phê duyệt → Tự động trừ tồn kho
- **Invoice**: Staff tạo → Accounter duyệt → Đánh dấu đã thanh toán

### Thông báo real-time
- Tất cả các vai trò đều nhận được thông báo real-time qua Socket.IO khi có sự kiện liên quan đến mình

