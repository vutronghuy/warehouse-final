# 🚫 Limitations của Project Warehouse Management System

## 📋 Tổng quan

Tài liệu này mô tả các hạn chế, giới hạn và vấn đề hiện tại của hệ thống quản lý kho (Warehouse Management System).

---

## 🔴 **1. Hạn chế về Chuyển đổi Tiền tệ (Currency Conversion)**

### **Vấn đề:**
- ❌ **KHÔNG có conversion USD → VND** khi tính tổng doanh thu (Revenue)
- Revenue được cộng trực tiếp từ các invoice có currency khác nhau (USD, VND, EUR) mà không convert về cùng một đơn vị
- Cost đã được convert từ USD → VND, nhưng Revenue thì không → Dẫn đến tính Profit sai

### **Ảnh hưởng:**
- Tính toán doanh thu, lợi nhuận không chính xác khi có invoice đa tiền tệ
- Các báo cáo tài chính có thể bị sai số lớn
- So sánh revenue giữa các khoảng thời gian không chính xác

### **Các API bị ảnh hưởng:**
- `getTotalRevenue` (InvoiceController.js)
- `buildFinanceSummary` (chatController.js)
- `getCashFlow` (ReportController.js)
- `getCashFlowTimeSeries` (ReportController.js)

### **Giải pháp đề xuất:**
- Cần thêm logic convert tất cả revenue về VND trước khi tính tổng
- Cần config exchange rates (USD_TO_VND_RATE, EUR_TO_VND_RATE) trong environment variables

---

## 🔴 **2. Hạn chế về Rate Limiting**

### **Vấn đề:**
- Rate limiter sử dụng **in-memory Map** → Không phù hợp cho production multi-instance
- Rate limit data sẽ bị mất khi server restart
- Không thể share rate limit data giữa nhiều server instances

### **Ảnh hưởng:**
- Không scale được khi deploy nhiều instances
- Rate limiting không hoạt động đúng trong môi trường load-balanced
- Có thể bị bypass rate limit bằng cách restart server

### **Giải pháp đề xuất:**
- Nên sử dụng Redis để lưu trữ rate limit data
- Hoặc sử dụng database để persist rate limit information

---

## 🔴 **3. Hạn chế về Database**

### **Vấn đề:**
- Chỉ sử dụng **MongoDB** (NoSQL) → Không có transaction ACID đầy đủ
- Không có backup/restore strategy được document
- Không có database migration strategy
- Connection pooling được config nhưng không có monitoring

### **Ảnh hưởng:**
- Khó đảm bảo data consistency trong các operations phức tạp
- Rủi ro mất dữ liệu nếu không có backup
- Khó rollback khi có lỗi

### **Giải pháp đề xuất:**
- Implement database backup strategy
- Sử dụng MongoDB transactions cho các operations quan trọng
- Implement migration scripts

---

## 🔴 **4. Hạn chế về Scalability**

### **Vấn đề:**
- Socket.IO không có adapter cho multi-instance (không dùng Redis adapter)
- Rate limiter in-memory không scale
- Không có caching layer (Redis/Memcached)
- Không có message queue cho async processing

### **Ảnh hưởng:**
- Khó scale horizontal (thêm nhiều server instances)
- Real-time notifications có thể không hoạt động đúng trong multi-instance setup
- Performance có thể giảm khi có nhiều users đồng thời

### **Giải pháp đề xuất:**
- Implement Redis adapter cho Socket.IO
- Thêm caching layer cho các queries thường dùng
- Implement message queue cho các tasks nặng (email, reports)

---

## 🔴 **5. Hạn chế về Security**

### **Vấn đề:**
- CORS chỉ config cho `localhost:3000` → Không linh hoạt cho production
- Không có input sanitization cho tất cả endpoints
- Không có API versioning strategy rõ ràng
- JWT secret có thể không đủ mạnh nếu không config đúng

### **Ảnh hưởng:**
- CORS issues khi deploy production với domain khác
- Rủi ro security vulnerabilities
- Khó maintain backward compatibility

### **Giải pháp đề xuất:**
- Config CORS động dựa trên environment
- Implement input validation middleware
- Implement API versioning strategy
- Enforce strong JWT secrets

---

## 🔴 **6. Hạn chế về Error Handling**

### **Vấn đề:**
- Error messages có thể expose internal details
- Không có centralized error tracking (Sentry, etc.)
- Error logging không được structure tốt
- Không có retry mechanism cho external API calls

### **Ảnh hưởng:**
- Khó debug production issues
- Security risk nếu error messages leak sensitive info
- External API failures có thể crash application

### **Giải pháp đề xuất:**
- Implement error tracking service (Sentry)
- Sanitize error messages trước khi trả về client
- Implement retry logic với exponential backoff

---

## 🔴 **7. Hạn chế về Testing**

### **Vấn đề:**
- Không có unit tests
- Không có integration tests
- Không có test coverage reports
- Chỉ có một số test files trong `Backend/test/` nhưng không có test framework setup

### **Ảnh hưởng:**
- Khó đảm bảo code quality
- Rủi ro regression khi refactor
- Khó maintain code trong dài hạn

### **Giải pháp đề xuất:**
- Setup test framework (Jest, Mocha)
- Implement unit tests cho services và utilities
- Implement integration tests cho API endpoints
- Setup CI/CD với test automation

---

## 🔴 **8. Hạn chế về Performance**

### **Vấn đề:**
- Không có database indexing strategy được document
- Không có query optimization
- Không có pagination cho một số endpoints
- File upload không có size limit validation rõ ràng

### **Ảnh hưởng:**
- Queries có thể chậm với large datasets
- Memory issues khi load large files
- Poor user experience với slow responses

### **Giải pháp đề xuất:**
- Implement database indexes cho các queries thường dùng
- Add pagination cho tất cả list endpoints
- Implement file size limits và validation
- Add query performance monitoring

---

## 🔴 **9. Hạn chế về Monitoring & Logging**

### **Vấn đề:**
- Logger service chỉ log ra console → Không persist logs
- Không có application performance monitoring (APM)
- Không có health check endpoints
- Không có metrics collection

### **Ảnh hưởng:**
- Khó debug production issues
- Không biết được performance bottlenecks
- Khó monitor system health

### **Giải pháp đề xuất:**
- Implement log rotation và file logging
- Add health check endpoints (`/health`, `/ready`)
- Implement APM (New Relic, Datadog)
- Add metrics collection (Prometheus)

---

## 🔴 **10. Hạn chế về Documentation**

### **Vấn đề:**
- API documentation không đầy đủ
- Không có API documentation tool (Swagger/OpenAPI)
- Code comments không đầy đủ
- Không có deployment guide

### **Ảnh hưởng:**
- Khó onboard developers mới
- Khó integrate với external systems
- Khó maintain code

### **Giải pháp đề xuất:**
- Implement Swagger/OpenAPI documentation
- Add comprehensive code comments
- Create deployment guide
- Document API endpoints với examples

---

## 🔴 **11. Hạn chế về Email Service**

### **Vấn đề:**
- Email service (Nodemailer) không có retry mechanism
- Không có email queue
- Email templates không được version control tốt
- Development mode chỉ log OTP ra console → Không test được email flow

### **Ảnh hưởng:**
- Email có thể bị mất nếu SMTP server fail
- Khó test email functionality trong development
- Email sending có thể block request nếu SMTP chậm

### **Giải pháp đề xuất:**
- Implement email queue với retry logic
- Use async email sending
- Implement email template versioning
- Add email testing tools (Mailtrap, etc.)

---

## 🔴 **12. Hạn chế về File Upload**

### **Vấn đề:**
- File uploads lưu trực tiếp vào `Backend/uploads/` → Không scale
- Không có file validation đầy đủ (file type, size)
- Không có file cleanup mechanism
- Không có CDN integration

### **Ảnh hưởng:**
- Server disk space có thể đầy
- Security risk nếu upload malicious files
- Slow file serving nếu không có CDN

### **Giải pháp đề xuất:**
- Move file storage to cloud storage (S3, Cloudinary)
- Implement file validation và virus scanning
- Implement file cleanup job
- Add CDN for file serving

---

## 🔴 **13. Hạn chế về AI Chatbot**

### **Vấn đề:**
- Google Gemini API không có rate limiting
- Không có caching cho AI responses
- Không có fallback mechanism nếu API fail
- AI responses không được validate

### **Ảnh hưởng:**
- High API costs nếu có nhiều requests
- Slow responses nếu không cache
- Application có thể crash nếu Gemini API down
- AI có thể trả về incorrect data

### **Giải pháp đề xuất:**
- Implement rate limiting cho AI API calls
- Cache common AI responses
- Add fallback responses
- Validate AI responses trước khi trả về user

---

## 🔴 **14. Hạn chế về Real-time Features**

### **Vấn đề:**
- Socket.IO không có reconnection strategy được config
- Không có message queuing cho offline users
- Không có presence tracking (who's online)
- Socket connections không được limit

### **Ảnh hưởng:**
- Users có thể mất notifications nếu connection drop
- Offline users không nhận được notifications
- Không biết được users nào đang online
- Server có thể bị overload với too many connections

### **Giải pháp đề xuất:**
- Implement reconnection logic với exponential backoff
- Add message queue cho offline users
- Implement presence tracking
- Add connection limits và throttling

---

## 🔴 **15. Hạn chế về Data Validation**

### **Vấn đề:**
- Không có schema validation cho tất cả API endpoints
- Validation logic scattered trong controllers
- Không có validation library (Joi, Yup, etc.)
- Database schema validation chỉ ở Mongoose level

### **Ảnh hưởng:**
- Inconsistent validation logic
- Khó maintain validation rules
- Security risk nếu validation không đầy đủ

### **Giải pháp đề xuất:**
- Implement validation middleware với Joi/Yup
- Centralize validation logic
- Add request/response validation
- Document validation rules

---

## 📊 **Tóm tắt Limitations theo Mức độ Ưu tiên**

### **🔴 Critical (Cần fix ngay):**
1. Currency conversion bug (Revenue calculation)
2. Rate limiter không scale
3. CORS configuration không linh hoạt
4. Error handling không đầy đủ

### **🟠 High Priority (Nên fix sớm):**
5. Database backup strategy
6. Socket.IO multi-instance support
7. File upload storage
8. Testing infrastructure

### **🟡 Medium Priority (Có thể fix sau):**
9. Monitoring & logging
10. API documentation
11. Email service improvements
12. AI chatbot optimizations

### **🟢 Low Priority (Nice to have):**
13. Performance optimizations
14. Documentation improvements
15. Code quality improvements

---

## 📝 **Lưu ý**

- Các limitations này được xác định dựa trên codebase hiện tại
- Một số limitations có thể đã được giải quyết nhưng chưa được document
- Nên ưu tiên fix các critical issues trước khi deploy production
- Nên implement monitoring để identify thêm limitations trong production

---

**Cập nhật lần cuối:** 2025-01-27

