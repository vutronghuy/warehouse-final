# 🔌 Services & Integrations

## 📋 Tổng quan

Project sử dụng các **Services** (internal) và **Integrations** (external) để xử lý business logic và tích hợp với các hệ thống bên ngoài.

---

## 🏗️ Internal Services

### **1. Socket Service** (`Backend/services/socketService.js`)

**Mục đích:** Quản lý real-time communication qua WebSocket (Socket.IO)

**Chức năng:**
- ✅ Emit events đến tất cả clients
- ✅ Emit events đến specific room (role-based)
- ✅ Emit events đến specific client
- ✅ Notification system cho các events:
  - Invoice created/deleted/approved/rejected
  - Export created/approved/rejected
  - Low stock warnings
  - Chart data updates

**Events được emit:**
```javascript
// Invoice Events
- invoice-created → accounters
- invoice-deleted → accounters
- invoice-approved → staff, managers, admins, accounters
- invoice-rejected → staff, managers, admins, accounters

// Export Events
- export-created → managers, admins
- export-approved → staff, managers, admins
- export-rejected → staff, managers, admins

// System Events
- low-stock → admin_super
- chart-data-updated → accounters, admins, managers, admin_super
- force-logout → specific user
```

**Usage:**
```javascript
const socketService = require('./services/socketService');

// Notify invoice created
socketService.notifyInvoiceCreated(invoiceData);

// Notify export approved
socketService.notifyExportApproved(exportData);

// Emit custom event
socketService.emitToRoom('accounters', 'custom-event', data);
```

---

### **2. Audit Service** (`Backend/services/auditService.js`)

**Mục đích:** Ghi lại tất cả các hành động của users (audit trail)

**Chức năng:**
- ✅ Log staff actions (BUSINESS category)
- ✅ Track before/after states
- ✅ Record actor, target, outcome
- ✅ Query audit logs với filters
- ✅ Get audit statistics

**Actions được log:**
```javascript
- IMPORT_PRODUCT_EXCEL
- CREATE_EXPORT_SLIP
- UPDATE_EXPORT_SLIP
- DELETE_EXPORT_SLIP
- CREATE_INVOICE
- UPDATE_INVOICE
- DELETE_INVOICE
```

**Usage:**
```javascript
const AuditService = require('./services/auditService');

// Log import product
await AuditService.logImportProductExcel(actor, importData, 'SUCCESS');

// Log create invoice
await AuditService.logCreateInvoice(actor, invoiceData, 'SUCCESS');

// Get audit logs
const { logs, pagination } = await AuditService.getStaffAuditLogs({
  page: 1,
  limit: 20,
  action: 'CREATE_INVOICE',
  startDate: '2025-01-01',
  endDate: '2025-12-31'
});
```

**Data Structure:**
```javascript
{
  category: 'BUSINESS',
  action: 'CREATE_INVOICE',
  actor: {
    id: 'userId',
    email: 'user@example.com',
    name: 'User Name',
    role: 'staff'
  },
  target: {
    type: 'Invoice',
    id: 'invoiceId'
  },
  before: { ... },
  after: { ... },
  reason: 'Create new invoice',
  outcome: 'SUCCESS',
  error: null,
  meta: { ip, userAgent, warehouseId }
}
```

---

### **3. Inventory Transaction Service** (`Backend/services/inventoryTransactionService.js`)

**Mục đích:** Tự động tạo transaction logs khi có thay đổi tồn kho

**Chức năng:**
- ✅ Log import transactions
- ✅ Log export transactions
- ✅ Log reservations (khi export được tạo)
- ✅ Log releases (khi export bị reject)
- ✅ Log manual adjustments

**Transaction Types:**
```javascript
- import: Tăng tồn kho
- export: Giảm tồn kho
- reservation: Giữ hàng (khi tạo export)
- release: Trả hàng (khi reject export)
- adjustment: Điều chỉnh thủ công
```

**Usage:**
```javascript
const {
  logImportTransaction,
  logExportTransaction,
  logExportReservation,
  logExportRelease,
  logAdjustment
} = require('./services/inventoryTransactionService');

// Log import
await logImportTransaction(importReceipt, userId);

// Log export
await logExportTransaction(exportReceipt, userId);

// Log adjustment
await logAdjustment(productId, warehouseId, oldQty, newQty, userId, 'Manual adjustment');
```

**Data Structure:**
```javascript
{
  productId: ObjectId,
  warehouseId: ObjectId,
  transactionType: 'import' | 'export' | 'reservation' | 'release' | 'adjustment',
  quantityChange: Number, // + hoặc -
  quantityBefore: Number,
  quantityAfter: Number,
  referenceId: String, // ID của ImportReceipt, ExportReceipt, etc.
  batchNumber: String,
  notes: String,
  createdBy: ObjectId
}
```

---

### **4. Logger Service** (`Backend/services/logger.js`)

**Mục đích:** Centralized logging với different log levels

**Chức năng:**
- ✅ Error logging
- ✅ Warning logging
- ✅ Info logging
- ✅ Debug logging
- ✅ HTTP request logging

**Log Levels:**
```javascript
ERROR (0) - Chỉ log errors
WARN (1) - Log warnings và errors
INFO (2) - Log info, warnings, errors (default production)
DEBUG (3) - Log tất cả (default development)
```

**Usage:**
```javascript
const logger = require('./services/logger');

logger.error('Something went wrong', { error: err });
logger.warn('Low stock warning', { productId, quantity });
logger.info('User logged in', { userId });
logger.debug('Debug info', { data });
logger.http(req, res, responseTime);
```

**Configuration:**
```env
LOG_LEVEL=INFO  # ERROR, WARN, INFO, DEBUG
NODE_ENV=production  # production = INFO, development = DEBUG
```

---

## 🌐 External Integrations

### **1. Google Gemini AI** (`Backend/utils/geminiClient.js`)

**Mục đích:** AI-powered chatbot cho warehouse assistant

**Chức năng:**
- ✅ Phân tích dữ liệu MongoDB
- ✅ Trả lời câu hỏi về warehouse
- ✅ Financial analysis
- ✅ Revenue comparison
- ✅ Data insights

**Configuration:**
```env
GEMINI_API_KEY=your_api_key
GEMINI_MODEL=gemini-1.5-pro  # Default model
```

**Usage:**
```javascript
const { generateFromGemini } = require('./utils/geminiClient');

const response = await generateFromGemini(prompt, options);
// Returns: { raw: {...}, text: "AI response" }
```

**Features:**
- Natural language processing
- Data analysis từ MongoDB collections
- Financial calculations (revenue, profit, margin)
- Multi-language support (Vietnamese, English)

**API Endpoint:**
```
POST /api/chat
Body: { question: "Tổng doanh thu trong kho là bao nhiêu?" }
```

**Collections được query:**
- products
- invoices
- customers
- suppliers
- warehouses
- categories
- importreceipts
- exportreceipts
- targets
- auditlogs

---

### **2. Email Service (Nodemailer)** (`Backend/controller/authController.js`)

**Mục đích:** Gửi email notifications và OTP

**Chức năng:**
- ✅ Gửi OTP cho password reset
- ✅ Gửi thông báo thay đổi role
- ✅ Gửi thông báo deactivate account
- ✅ HTML email templates

**Configuration:**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
EMAIL_FROM=HinWarehouse System <your_email@gmail.com>
```

**Usage:**
```javascript
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT || 587),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

await transporter.sendMail({
  from: `"HinWarehouse System" <${process.env.EMAIL_FROM}>`,
  to: userEmail,
  subject: 'Subject',
  html: '<html>...</html>'
});
```

**Email Templates:**
1. **Password Reset OTP:**
   - OTP code trong box
   - Expiry time (15 minutes)
   - Security warning

2. **Role Change Notification:**
   - Old role → New role
   - Default password info
   - Login instructions

3. **Account Deactivation:**
   - Deactivation notice
   - Contact information
   - Reactivation instructions

**Development Mode:**
- Nếu SMTP không được config → Log OTP ra console
- Không gửi email thực tế
- Useful cho development/testing

---

### **3. MongoDB Database** (`Backend/app.js`)

**Mục đích:** Primary database cho toàn bộ application

**Connection:**
```javascript
const mongoose = require('mongoose');
const dbURI = process.env.DB_URI || process.env.MONGO_URI;

await mongoose.connect(dbURI, {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000
});
```

**Features:**
- ✅ Automatic reconnection với retry logic
- ✅ Connection pooling
- ✅ Error handling
- ✅ Connection events (error, disconnected, reconnected)

**Collections:**
- users
- products
- warehouses
- suppliers
- customers
- categories
- importreceipts
- exportreceipts
- invoices
- targets
- auditlogs
- inventorytransactions

---

### **4. Socket.IO** (`Backend/app.js`)

**Mục đích:** Real-time bidirectional communication

**Configuration:**
```javascript
const { Server } = require('socket.io');
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: 'http://localhost:3000',
    credentials: true
  }
});
```

**Features:**
- ✅ Real-time notifications
- ✅ Role-based rooms (staff, managers, admins, accounters, admin_super)
- ✅ User-specific rooms (`user-${userId}`)
- ✅ Chart data updates
- ✅ Force logout

**Client Connection:**
```javascript
// Frontend
import io from 'socket.io-client';
const socket = io('http://localhost:3003', {
  withCredentials: true
});

socket.on('invoice-created', (data) => {
  // Handle notification
});
```

---

## 📊 Service Architecture

```
┌─────────────────────────────────────────────────┐
│                  Client (Frontend)                │
└──────────────────┬────────────────────────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
   HTTP/REST              WebSocket
        │                     │
        ▼                     ▼
┌─────────────────────────────────────────────────┐
│              Express Server (Backend)            │
│                                                  │
│  ┌──────────────────────────────────────────┐   │
│  │         Controllers                      │   │
│  │  - authController                        │   │
│  │  - ProductController                     │   │
│  │  - InvoiceController                     │   │
│  └──────────────┬───────────────────────────┘   │
│                 │                                 │
│  ┌──────────────▼───────────────────────────┐   │
│  │         Services                         │   │
│  │  - socketService                         │   │
│  │  - auditService                         │   │
│  │  - inventoryTransactionService           │   │
│  │  - logger                                │   │
│  └──────────────┬───────────────────────────┘   │
│                 │                                 │
│  ┌──────────────▼───────────────────────────┐   │
│  │         Integrations                      │   │
│  │  - MongoDB (Mongoose)                    │   │
│  │  - Google Gemini AI                      │   │
│  │  - Nodemailer (SMTP)                     │   │
│  │  - Socket.IO                             │   │
│  └───────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

---

## 🔧 Service Dependencies

### **Internal Services Dependencies:**
```
socketService
  └── Socket.IO (external)

auditService
  └── AuditLog Model (MongoDB)

inventoryTransactionService
  ├── InventoryTransaction Model (MongoDB)
  ├── Inventory Model (MongoDB)
  └── Product Model (MongoDB)

logger
  └── Console (native)
```

### **External Integrations Dependencies:**
```
Google Gemini AI
  └── @google/generative-ai
  └── GEMINI_API_KEY

Email Service
  └── nodemailer
  └── SMTP credentials

MongoDB
  └── mongoose
  └── DB_URI

Socket.IO
  └── socket.io
  └── HTTP Server
```

---

## 📝 Environment Variables

```env
# Database
DB_URI=mongodb://...
MONGO_URI=mongodb://...

# AI
GEMINI_API_KEY=your_key
GEMINI_MODEL=gemini-1.5-pro

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
EMAIL_FROM=HinWarehouse System <your_email@gmail.com>

# Logging
LOG_LEVEL=INFO
NODE_ENV=production

# Server
PORT=3003
```

---

## 🎯 Service Usage Examples

### **1. Real-time Notification:**
```javascript
// Controller
const socketService = require('../services/socketService');

exports.createInvoice = async (req, res) => {
  const invoice = await Invoice.create(data);
  
  // Notify accounters
  socketService.notifyInvoiceCreated(invoice);
  
  res.json({ success: true, data: invoice });
};
```

### **2. Audit Logging:**
```javascript
// Controller
const AuditService = require('../services/auditService');

exports.createExport = async (req, res) => {
  const exportReceipt = await ExportReceipt.create(data);
  
  // Log action
  await AuditService.logCreateExportSlip(
    { id: req.user.sub, email: req.user.email, name: req.user.name },
    exportReceipt,
    'SUCCESS'
  );
  
  res.json({ success: true, data: exportReceipt });
};
```

### **3. Inventory Transaction:**
```javascript
// Controller
const { logExportTransaction } = require('../services/inventoryTransactionService');

exports.approveExport = async (req, res) => {
  const exportReceipt = await ExportReceipt.findByIdAndUpdate(id, { status: 'approved' });
  
  // Log transaction
  await logExportTransaction(exportReceipt, req.user.sub);
  
  res.json({ success: true });
};
```

---

## ✅ Summary

**Internal Services:**
- ✅ Socket Service - Real-time communication
- ✅ Audit Service - Action logging
- ✅ Inventory Transaction Service - Stock tracking
- ✅ Logger Service - Centralized logging

**External Integrations:**
- ✅ Google Gemini AI - Chatbot & data analysis
- ✅ Nodemailer - Email notifications
- ✅ MongoDB - Primary database
- ✅ Socket.IO - WebSocket communication

**Total:** 4 Internal Services + 4 External Integrations


