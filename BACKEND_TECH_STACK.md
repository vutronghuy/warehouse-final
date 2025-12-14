# 🛠️ Backend Technology Stack

## 📋 Tổng quan

Backend của project **Warehouse Management System** được xây dựng bằng **Node.js** với kiến trúc **RESTful API** và **WebSocket**.

---

## 🔧 Core Technologies

### **Runtime & Framework**
- **Node.js** - JavaScript runtime
- **Express.js v5.1.0** - Web framework cho RESTful API
- **HTTP Server** - Native Node.js HTTP server

### **Database**
- **MongoDB v6.20.0** - NoSQL database (driver)
- **Mongoose v8.16.5** - ODM (Object Data Modeling) cho MongoDB
- **Database**: MongoDB Atlas (cloud) hoặc local MongoDB

---

## 🔐 Authentication & Security

- **JSON Web Token (JWT)** - `jsonwebtoken v9.0.2`
  - Xác thực người dùng
  - Token-based authentication
  - Refresh token trong cookie

- **Bcrypt** - `bcrypt v6.0.0` & `bcryptjs v3.0.2`
  - Mã hóa mật khẩu
  - Hash password trước khi lưu database

- **Cookie Parser** - `cookie-parser v1.4.7`
  - Xử lý cookies cho refresh token

---

## 🌐 Networking & Communication

### **Real-time Communication**
- **Socket.IO v4.8.1** - WebSocket library
  - Real-time notifications
  - Live updates cho dashboard
  - Chat functionality
  - Force logout khi user bị deactivate

### **HTTP Client**
- **Axios v1.12.2** - HTTP client
  - Gọi external APIs
  - Inter-service communication

### **CORS**
- **CORS v2.8.5** - Cross-Origin Resource Sharing
  - Cho phép frontend (localhost:3000) gọi API
  - Credentials support

---

## 📄 File Processing

- **Multer v2.0.2** - File upload middleware
  - Upload Excel files
  - Import products từ Excel

- **XLSX v0.18.5** - Excel file processing
  - Đọc/ghi Excel files (.xlsx)
  - Parse Excel data cho import products

- **PDFKit v0.17.2** - PDF generation
  - Tạo PDF invoices
  - Export reports dạng PDF

---

## 🤖 AI & Machine Learning

- **Google Generative AI** - `@google/generative-ai v0.24.1`
- **Google GenAI SDK** - `@google/genai v1.24.0`
  - Chatbot integration
  - AI-powered warehouse assistant
  - Model: Gemini 1.5 Pro (default)

---

## 📧 Email & Notifications

- **Nodemailer v7.0.5** - Email service
  - Gửi email notifications
  - Password reset emails
  - System notifications

---

## ⚙️ Configuration & Environment

- **dotenv v17.2.1** - Environment variables
  - Quản lý config qua `.env` file
  - Secrets management

---

## 🏗️ Architecture Patterns

### **MVC Pattern**
- **Models**: `Backend/models/` - Mongoose schemas
- **Views**: Không có (API-only backend)
- **Controllers**: `Backend/controller/` - Business logic
- **Routes**: `Backend/router/` - API endpoints

### **Middleware**
- **Authentication Middleware** - `middlewares/auth.js`, `authenticate.js`
- **Error Handler** - `middlewares/errorHandler.js`
- **Rate Limiter** - `middlewares/rateLimiter.js` (in-memory Map)
- **Request Validation** - Custom validators

### **Services**
- **Socket Service** - `services/socketService.js`
- **Audit Service** - `services/auditService.js`
- **Inventory Transaction Service** - `services/inventoryTransactionService.js`
- **Logger Service** - `services/logger.js`

---

## 📦 Key Features

### **1. Authentication & Authorization**
- JWT-based authentication
- Role-based access control (RBAC)
- Roles: Super Admin, Admin, Manager, Staff, Accounter
- Multi-warehouse management

### **2. Product Management**
- CRUD operations
- Excel import/export
- Batch management
- Inventory tracking
- Ending inventory calculation

### **3. Warehouse Operations**
- Import receipts
- Export receipts
- Invoice management
- Stock adjustments
- Inventory transactions

### **4. Real-time Features**
- Live dashboard updates
- Real-time notifications
- Socket.IO events
- Force logout

### **5. Reporting & Analytics**
- Financial reports
- Cash flow analysis
- Inventory reports
- Revenue tracking
- Month-over-month comparisons

### **6. AI Chatbot**
- Gemini AI integration
- Warehouse assistant
- Financial queries
- Data analysis

---

## 🔄 Data Flow

```
Client (Frontend)
    ↓ HTTP/WebSocket
Express Server
    ↓
Middleware (Auth, Validation, Rate Limit)
    ↓
Controllers (Business Logic)
    ↓
Services (Socket, Audit, etc.)
    ↓
Models (Mongoose)
    ↓
MongoDB Database
```

---

## 📁 Project Structure

```
Backend/
├── app.js                 # Main entry point
├── package.json           # Dependencies
├── controller/            # Business logic
│   ├── authController.js
│   ├── ProductController.js
│   ├── ExportReceiptController.js
│   └── ...
├── router/                # API routes
│   ├── authRoute.js
│   ├── ProductRoute.js
│   └── ...
├── models/                # Mongoose schemas
│   ├── User.js
│   ├── products/
│   ├── import/
│   └── ...
├── middlewares/          # Express middlewares
│   ├── auth.js
│   ├── rateLimiter.js
│   └── errorHandler.js
├── services/             # Business services
│   ├── socketService.js
│   └── auditService.js
├── utils/                # Utility functions
│   ├── geminiClient.js
│   └── validateEnv.js
└── uploads/              # File uploads
```

---

## 🚀 Scripts

```json
{
  "start": "node app.js",           // Production
  "dev": "nodemon app.js",          // Development với auto-reload
  "autodiscover": "node chatbot/mcp-autodiscover.js"  // AI chatbot setup
}
```

---

## 🔌 API Endpoints Structure

### **Authentication**
- `POST /api/auth/login` - Đăng nhập
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/logout` - Đăng xuất

### **Products**
- `GET /api/products` - Lấy danh sách products
- `POST /api/products` - Tạo product mới
- `GET /api/products/ending-inventory` - Tính ending inventory
- `POST /api/products/import` - Import từ Excel

### **Warehouse Operations**
- `GET /api/import-receipts` - Lấy import receipts
- `POST /api/export-receipts` - Tạo export receipt
- `GET /api/invoices` - Lấy invoices

### **Reports**
- `GET /api/reports/cash-flow` - Cash flow report
- `GET /api/reports/inventory-value` - Inventory value

### **Chat**
- `POST /api/chat` - Chat với AI assistant

---

## 🛡️ Security Features

1. **JWT Authentication** - Token-based auth
2. **Password Hashing** - Bcrypt với salt rounds
3. **CORS Protection** - Chỉ cho phép frontend origin
4. **Rate Limiting** - In-memory rate limiter (đã bị remove theo yêu cầu)
5. **Input Validation** - Validate request data
6. **Error Handling** - Centralized error handling
7. **Audit Logging** - Track user actions

---

## 📊 Database Collections

- `users` - User accounts
- `products` - Product catalog
- `importreceipts` - Import transactions
- `exportreceipts` - Export transactions
- `invoices` - Invoice records
- `warehouses` - Warehouse information
- `suppliers` - Supplier data
- `customers` - Customer data
- `categories` - Product categories
- `auditlogs` - Audit trail
- `targets` - Sales targets

---

## 🔮 Technologies NOT Used

- ❌ **Redis** - Không sử dụng (rate limiter dùng in-memory Map)
- ❌ **Session Store** - Không dùng session, chỉ dùng JWT
- ❌ **GraphQL** - Chỉ dùng REST API
- ❌ **gRPC** - Chỉ dùng HTTP/WebSocket
- ❌ **Message Queue** - Không có (RabbitMQ, Kafka, etc.)

---

## 📝 Environment Variables

Các biến môi trường cần thiết (trong `.env`):
- `DB_URI` hoặc `MONGO_URI` - MongoDB connection string
- `PORT` - Server port (default: 3003)
- `JWT_SECRET` - Secret key cho JWT
- `JWT_REFRESH_SECRET` - Secret key cho refresh token
- `GEMINI_API_KEY` - Google Gemini API key
- `GEMINI_MODEL` - Model name (default: gemini-1.5-pro)
- Email config (nếu dùng Nodemailer)

---

## 🎯 Summary

**Backend Stack:**
- **Runtime**: Node.js
- **Framework**: Express.js v5
- **Database**: MongoDB + Mongoose
- **Real-time**: Socket.IO
- **Auth**: JWT + Bcrypt
- **AI**: Google Gemini
- **File Processing**: Multer + XLSX + PDFKit
- **Email**: Nodemailer

**Architecture**: RESTful API + WebSocket với MVC pattern

**Deployment**: Có thể deploy lên:
- Heroku
- AWS EC2/Lambda
- Google Cloud Run
- Azure App Service
- DigitalOcean
- VPS tự quản lý


