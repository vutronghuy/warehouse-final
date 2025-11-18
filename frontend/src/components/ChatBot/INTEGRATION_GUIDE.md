# 🚀 Hướng dẫn tích hợp ChatBot nhanh

## ⚡ Tích hợp trong 3 bước

### Bước 1: Import Component
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

### Bước 2: Thêm vào Template
```vue
<template>
  <div>
    <!-- Nội dung trang của bạn -->
    
    <!-- ChatBot Component -->
    <ChatBot />
  </div>
</template>
```

### Bước 3: Xong! 🎉
ChatBot sẽ tự động hiển thị icon floating ở góc phải màn hình.

## 📋 Checklist tích hợp

- [ ] Backend server đang chạy (port 3001)
- [ ] GEMINI_API_KEY đã cấu hình trong .env
- [ ] Import ChatBot component
- [ ] Thêm ChatBot vào components
- [ ] Thêm `<ChatBot />` vào template
- [ ] Test giao diện và chức năng

## 🔧 Cấu hình Backend

### File .env
```env
GEMINI_API_KEY=your_api_key_here
GEMINI_MODEL=gemini-1.5-flash
PORT=3001
```

### Khởi động server
```bash
cd Backend
node app.js
```

## 🎨 Tùy chỉnh giao diện

### Thay đổi vị trí icon
```css
.chatbot-container {
  bottom: 20px;  /* Khoảng cách từ dưới */
  right: 20px;   /* Khoảng cách từ phải */
}
```

### Thay đổi màu sắc
```css
.chatbot-icon {
  background: linear-gradient(135deg, #your-color-1, #your-color-2);
}
```

### Thay đổi kích thước modal
```css
.chatbot-modal {
  width: 400px;  /* Chiều rộng */
  height: 600px; /* Chiều cao */
}
```

## 🐛 Troubleshooting

### ChatBot không hiển thị
```bash
# Kiểm tra import
import { ChatBot } from '@/components'

# Kiểm tra components
components: {
  ChatBot
}

# Kiểm tra template
<ChatBot />
```

### Không gửi được tin nhắn
```bash
# Kiểm tra backend
curl -X POST http://localhost:3003/chat \
  -H "Content-Type: application/json" \
  -d '{"question":"test"}'

# Kiểm tra API key
echo $GEMINI_API_KEY
```

### Lỗi CORS
```javascript
// Backend app.js
const corsOptions = {
  origin: 'http://localhost:3000', // Frontend URL
  credentials: true
};
```

## 📱 Responsive

ChatBot tự động responsive:
- **Desktop**: Modal 400px, icon 60px
- **Mobile**: Modal full width, icon 50px
- **Tablet**: Tự động scale

## 🔒 Bảo mật

- Chỉ expose dữ liệu an toàn cho AI
- Sanitize collection names
- Blacklist collections nhạy cảm
- API key được bảo vệ trong .env

## 📞 Hỗ trợ

Nếu gặp vấn đề:
1. Kiểm tra console browser
2. Kiểm tra network tab
3. Kiểm tra backend logs
4. Xem file README.md chi tiết

## 🎯 Ví dụ hoàn chỉnh

```vue
<template>
  <div class="my-page">
    <h1>Trang của tôi</h1>
    <p>Nội dung trang...</p>
    
    <!-- ChatBot -->
    <ChatBot />
  </div>
</template>

<script>
import { ChatBot } from '@/components'

export default {
  name: 'MyPage',
  components: {
    ChatBot
  }
}
</script>
```

**Xong! ChatBot đã sẵn sàng sử dụng! 🎉**
