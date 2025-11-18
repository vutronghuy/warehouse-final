# Chatbot Integration Guide

## Tổng quan
Chatbot đã được tích hợp thành công vào hệ thống quản lý kho hàng, sử dụng Google Gemini AI để trả lời các câu hỏi về dữ liệu trong hệ thống.

## Tính năng đã triển khai

### 1. Backend API
- **Endpoint**: `POST /chat`
- **Chức năng**: Xử lý câu hỏi từ người dùng và trả về câu trả lời từ AI
- **Tích hợp**: Google Gemini AI thông qua `utils/geminiClient.js`
- **Bảo mật**: Chỉ trả về các trường dữ liệu được phép, không tiết lộ thông tin nhạy cảm

### 2. Frontend Component
- **Component**: `ChatbotWidget.vue`
- **Vị trí**: `frontend/src/components/Chatbot/ChatbotWidget.vue`
- **Giao diện**: 
  - Nút chat floating ở góc phải màn hình
  - Cửa sổ chat với header gradient đẹp mắt
  - Khu vực tin nhắn với scroll tự động
  - Input area với quick suggestions
  - Typing indicator khi AI đang xử lý

### 3. Tích hợp vào các trang
Chatbot đã được tích hợp vào các trang sau:

#### Admin Pages:
- **AdminDashboard.vue**: Trang dashboard chính của admin
- **Admin.vue**: Trang quản lý users của admin

#### Super Admin Pages:
- **Dashboard.vue**: Trang dashboard của super admin
- **SuperAdmin.vue**: Trang quản lý users của super admin

## Cách sử dụng

### 1. Khởi động hệ thống
```bash
# Backend
cd Backend
npm install
npm start

# Frontend  
cd frontend
npm install
npm run dev
```

### 2. Cấu hình môi trường
Đảm bảo file `.env` trong Backend có các biến sau:
```env
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-1.5-flash
MONGO_URI=your_mongodb_connection_string
DB_NAME=your_database_name
```

### 3. Sử dụng chatbot
1. Đăng nhập vào hệ thống với quyền admin hoặc super admin
2. Nhấn vào nút chat ở góc phải màn hình
3. Nhập câu hỏi hoặc chọn từ quick suggestions
4. Chatbot sẽ trả lời dựa trên dữ liệu trong hệ thống

## Quick Suggestions có sẵn
- "Tổng số sản phẩm?"
- "Kho nào có ít hàng nhất?"
- "Xuất kho gần đây?"
- "Thống kê tổng quan"

## Tính năng kỹ thuật

### 1. Bảo mật
- Chỉ trả về các trường dữ liệu được phép: `_id`, `status`, `total`, `items`, `createdAt`, `name`, `title`, `description`
- Không tiết lộ thông tin nhạy cảm như passwords, tokens, etc.
- Xác thực người dùng thông qua JWT token

### 2. Hiệu suất
- Debounced typing indicator
- Auto-scroll đến tin nhắn mới nhất
- Loading states và error handling
- Responsive design cho mobile và desktop

### 3. UX/UI
- Gradient design phù hợp với theme hệ thống
- Smooth animations và transitions
- Intuitive interface với quick actions
- Vietnamese language support

## Troubleshooting

### 1. Chatbot không hoạt động
- Kiểm tra `GEMINI_API_KEY` trong file `.env`
- Đảm bảo backend đang chạy trên port 3003
- Kiểm tra console để xem lỗi cụ thể

### 2. Không có dữ liệu trả về
- Kiểm tra kết nối MongoDB
- Đảm bảo collection `products` có dữ liệu
- Kiểm tra logs trong backend

### 3. Lỗi authentication
- Đảm bảo đã đăng nhập với quyền admin/super admin
- Kiểm tra token trong localStorage/sessionStorage

## Mở rộng trong tương lai

### 1. Thêm collections
Có thể mở rộng chatbot để truy cập thêm collections:
- `customers`
- `suppliers` 
- `warehouses`
- `invoices`

### 2. Cải thiện AI prompts
- Thêm context về business domain
- Cải thiện prompt engineering cho responses chính xác hơn
- Thêm multi-language support

### 3. Advanced features
- Voice input/output
- File upload để phân tích
- Integration với external APIs
- Analytics và reporting

## Kết luận
Chatbot đã được tích hợp thành công và sẵn sàng sử dụng. Hệ thống cung cấp trải nghiệm người dùng tốt với giao diện đẹp mắt và tính năng AI mạnh mẽ để hỗ trợ quản lý kho hàng hiệu quả.






















