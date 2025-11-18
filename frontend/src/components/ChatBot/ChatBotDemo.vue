<template>
  <div class="chatbot-demo">
    <div class="demo-header">
      <h1>🤖 ChatBot Demo</h1>
      <p>Test giao diện và chức năng của AI ChatBot</p>
    </div>

    <div class="demo-content">
      <div class="demo-section">
        <h2>📋 Hướng dẫn sử dụng</h2>
        <div class="demo-steps">
          <div class="step">
            <span class="step-number">1</span>
            <div class="step-content">
              <h3>Khởi động Backend</h3>
              <p>Đảm bảo server backend đang chạy trên port 3003</p>
              <code>cd Backend && node app.js</code>
            </div>
          </div>

          <div class="step">
            <span class="step-number">2</span>
            <div class="step-content">
              <h3>Kiểm tra API</h3>
              <p>ChatBot sẽ gọi API endpoint: <code>POST /chat</code></p>
              <code>http://localhost:3003/chat</code>
            </div>
          </div>

          <div class="step">
            <span class="step-number">3</span>
            <div class="step-content">
              <h3>Sử dụng ChatBot</h3>
              <p>Click vào icon chat ở góc phải để mở giao diện chat</p>
              <p>Đặt câu hỏi về hệ thống quản lý kho</p>
            </div>
          </div>
        </div>
      </div>

      <div class="demo-section">
        <h2>💡 Câu hỏi mẫu</h2>
        <div class="sample-questions">
          <div class="question-card" @click="sendSampleQuestion('Có bao nhiêu sản phẩm trong kho?')">
            <div class="question-icon">📦</div>
            <div class="question-text">
              <h4>Có bao nhiêu sản phẩm trong kho?</h4>
              <p>Tìm hiểu số lượng sản phẩm hiện có</p>
            </div>
          </div>

          <div class="question-card" @click="sendSampleQuestion('Sản phẩm nào bán chạy nhất?')">
            <div class="question-icon">🔥</div>
            <div class="question-text">
              <h4>Sản phẩm nào bán chạy nhất?</h4>
              <p>Xem thống kê sản phẩm bán chạy</p>
            </div>
          </div>

          <div class="question-card" @click="sendSampleQuestion('Tổng doanh thu tháng này là bao nhiêu?')">
            <div class="question-icon">💰</div>
            <div class="question-text">
              <h4>Tổng doanh thu tháng này là bao nhiêu?</h4>
              <p>Kiểm tra doanh thu hiện tại</p>
            </div>
          </div>

          <div class="question-card" @click="sendSampleQuestion('Có bao nhiêu đơn hàng đang chờ xử lý?')">
            <div class="question-icon">📋</div>
            <div class="question-text">
              <h4>Có bao nhiêu đơn hàng đang chờ xử lý?</h4>
              <p>Xem trạng thái đơn hàng</p>
            </div>
          </div>
        </div>
      </div>

      <div class="demo-section">
        <h2>🔧 Cấu hình</h2>
        <div class="config-info">
          <div class="config-item">
            <label>Backend URL:</label>
            <code>http://localhost:3003</code>
          </div>
          <div class="config-item">
            <label>API Endpoint:</label>
            <code>/chat</code>
          </div>
          <div class="config-item">
            <label>Default Collection:</label>
            <code>products</code>
          </div>
          <div class="config-item">
            <label>AI Model:</label>
            <code>gemini-1.5-flash</code>
          </div>
        </div>
      </div>

      <div class="demo-section">
        <h2>📱 Responsive Test</h2>
        <div class="responsive-info">
          <p>ChatBot được thiết kế responsive và sẽ tự động điều chỉnh:</p>
          <ul>
            <li><strong>Desktop:</strong> Modal 400px width, icon 60px</li>
            <li><strong>Mobile:</strong> Modal full width, icon 50px</li>
            <li><strong>Tablet:</strong> Tự động scale phù hợp</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- ChatBot Component -->
    <ChatBot ref="chatbotRef" />
  </div>
</template>

<script>
import { ChatBot } from '@/components'

export default {
  name: 'ChatBotDemo',
  components: {
    ChatBot
  },
  methods: {
    sendSampleQuestion(question) {
      // Trigger chatbot to open and send question
      if (this.$refs.chatbotRef) {
        // This would require exposing methods from ChatBot component
        console.log('Sample question:', question)
        // For now, just show the question
        alert(`Sample question: "${question}"\n\nClick vào icon chat để gửi câu hỏi này!`)
      }
    }
  }
}
</script>

<style scoped>
.chatbot-demo {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.demo-header {
  text-align: center;
  color: white;
  margin-bottom: 40px;
}

.demo-header h1 {
  font-size: 2.5rem;
  margin-bottom: 10px;
  font-weight: 700;
}

.demo-header p {
  font-size: 1.2rem;
  opacity: 0.9;
}

.demo-content {
  max-width: 1200px;
  margin: 0 auto;
}

.demo-section {
  background: white;
  border-radius: 16px;
  padding: 30px;
  margin-bottom: 30px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.demo-section h2 {
  color: #333;
  margin-bottom: 20px;
  font-size: 1.5rem;
  font-weight: 600;
}

.demo-steps {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.step {
  display: flex;
  align-items: flex-start;
  gap: 20px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 12px;
  border-left: 4px solid #667eea;
}

.step-number {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  flex-shrink: 0;
}

.step-content h3 {
  margin: 0 0 8px 0;
  color: #333;
  font-size: 1.1rem;
}

.step-content p {
  margin: 0 0 8px 0;
  color: #666;
  line-height: 1.5;
}

.step-content code {
  background: #e9ecef;
  padding: 4px 8px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
  color: #495057;
}

.sample-questions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.question-card {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.question-card:hover {
  background: #e9ecef;
  border-color: #667eea;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
}

.question-icon {
  font-size: 2rem;
  flex-shrink: 0;
}

.question-text h4 {
  margin: 0 0 5px 0;
  color: #333;
  font-size: 1rem;
}

.question-text p {
  margin: 0;
  color: #666;
  font-size: 0.9rem;
}

.config-info {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 15px;
}

.config-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
}

.config-item label {
  font-weight: 600;
  color: #333;
}

.config-item code {
  background: #e9ecef;
  padding: 4px 8px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  color: #495057;
}

.responsive-info {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 12px;
}

.responsive-info p {
  margin-bottom: 15px;
  color: #666;
  line-height: 1.5;
}

.responsive-info ul {
  margin: 0;
  padding-left: 20px;
}

.responsive-info li {
  margin-bottom: 8px;
  color: #666;
  line-height: 1.5;
}

.responsive-info strong {
  color: #333;
}

/* Responsive */
@media (max-width: 768px) {
  .chatbot-demo {
    padding: 10px;
  }

  .demo-header h1 {
    font-size: 2rem;
  }

  .demo-section {
    padding: 20px;
  }

  .step {
    flex-direction: column;
    text-align: center;
  }

  .sample-questions {
    grid-template-columns: 1fr;
  }

  .config-info {
    grid-template-columns: 1fr;
  }

  .config-item {
    flex-direction: column;
    gap: 8px;
    text-align: center;
  }
}
</style>
