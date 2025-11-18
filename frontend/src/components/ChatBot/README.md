# ChatBot Component

## Tổng quan
ChatBot component cung cấp giao diện chat AI tích hợp với Google Gemini API, cho phép người dùng tương tác với AI để tìm hiểu thông tin về hệ thống quản lý kho.

## Tính năng
- 🤖 **AI Assistant**: Tích hợp Google Gemini API
- 💬 **Real-time Chat**: Giao diện chat trực quan và thân thiện
- 📱 **Responsive**: Tương thích với mobile và desktop
- 🎨 **Modern UI**: Thiết kế hiện đại với gradient và animations
- 🔒 **Secure**: Chỉ expose dữ liệu an toàn cho AI

## Cách sử dụng

### 1. Import Component
```vue
<script>
import { ChatBot } from '@/components'

export default {
  components: {
    ChatBot
  }
}
</script>
```

### 2. Thêm vào Template
```vue
<template>
  <div>
    <!-- Your page content -->
    
    <!-- ChatBot Component -->
    <ChatBot />
  </div>
</template>
```

## Cấu hình Backend

### 1. API Endpoint
ChatBot gọi API endpoint: `POST http://localhost:3003/chat`

### 2. Request Format
```json
{
  "question": "Có bao nhiêu sản phẩm trong kho?",
  "collection": "products",
  "limit": 3
}
```

### 3. Response Format
```json
{
  "answer": "Dựa trên dữ liệu, có X sản phẩm...",
  "usedDocs": ["doc_id_1", "doc_id_2"],
  "raw": { ... }
}
```

## Cấu hình Environment

### Backend (.env)
```env
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-1.5-flash
PORT=3003
```

## Tính năng UI

### 1. Floating Icon
- Icon chat floating ở góc phải màn hình
- Animation hover và click
- Thay đổi màu sắc khi active

### 2. Chat Modal
- Modal popup với thiết kế hiện đại
- Header với title và nút đóng
- Messages area với scroll auto
- Input area với nút send

### 3. Message Types
- **User Messages**: Màu xanh, align phải
- **Bot Messages**: Màu trắng, align trái
- **Typing Indicator**: Animation loading khi bot đang trả lời

### 4. Welcome Screen
- Hiển thị khi chưa có tin nhắn
- Giới thiệu các tính năng AI có thể hỗ trợ
- Gợi ý câu hỏi mẫu

## Styling

### CSS Variables
```css
:root {
  --chatbot-primary: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  --chatbot-secondary: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  --chatbot-shadow: 0 4px 20px rgba(102, 126, 234, 0.4);
}
```

### Responsive Design
- Desktop: Modal 400px width
- Mobile: Modal full width với margin
- Icon size tự động điều chỉnh

## Tích hợp vào các trang

### Đã tích hợp:
- ✅ Staff Dashboard (`/modules/User/staffs/staff.vue`)
- ✅ Manager Dashboard (`/modules/User/managers/manager.vue`)
- ✅ Accounter Dashboard (`/modules/User/accounters/AccounterDashboardSimple.vue`)

### Cách tích hợp vào trang mới:
1. Import ChatBot component
2. Thêm vào components
3. Thêm `<ChatBot />` vào template

## Troubleshooting

### 1. ChatBot không hiển thị
- Kiểm tra import component
- Kiểm tra backend server đang chạy
- Kiểm tra console errors

### 2. Không gửi được tin nhắn
- Kiểm tra API endpoint
- Kiểm tra GEMINI_API_KEY
- Kiểm tra network connection

### 3. UI không đẹp
- Kiểm tra CSS conflicts
- Kiểm tra z-index
- Kiểm tra responsive breakpoints

## Dependencies
- Vue 3
- Axios
- Google Generative AI API

## Browser Support
- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+
