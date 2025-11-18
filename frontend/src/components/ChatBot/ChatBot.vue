<template>
  <div class="chatbot-container">
    <!-- Floating Chat Icon -->
    <div class="chatbot-icon" :class="{ 'chatbot-icon--active': isOpen }" @click="toggleChat">
      <svg v-if="!isOpen" width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path
          d="M20 2H4C2.9 2 2 2.9 2 4V16C2 17.1 2.9 18 4 18H6L10 22L14 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2ZM20 16H13.17L12 17.17L10.83 16H4V4H20V16Z"
          fill="currentColor"
        />
        <path d="M7 9H17V11H7V9ZM7 12H15V14H7V12Z" fill="currentColor" />
      </svg>
      <svg v-else width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path
          d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z"
          fill="currentColor"
        />
      </svg>
    </div>

    <!-- Chat Modal -->
    <div v-if="isOpen" class="chatbot-modal">
      <div class="chatbot-header">
        <div class="chatbot-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path
              d="M20 2H4C2.9 2 2 2.9 2 4V16C2 17.1 2.9 18 4 18H6L10 22L14 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2ZM20 16H13.17L12 17.17L10.83 16H4V4H20V16Z"
              fill="currentColor"
            />
          </svg>
          <span>AI Assistant</span>
        </div>
        <button class="chatbot-close" aria-label="Close chat" @click="toggleChat">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path
              d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z"
              fill="currentColor"
            />
          </svg>
        </button>
      </div>

      <div ref="messagesContainer" class="chatbot-messages">
        <div v-if="messages.length === 0" class="chatbot-welcome">
          <div class="welcome-icon">🤖</div>
          <h3>Hello! I'm AI Assistant</h3>
          <p>I can help you with:</p>
          <ul>
            <li>📦 Product information in the warehouse</li>
            <li>📊 Reports and statistics</li>
            <li>📋 Order management</li>
            <li>💰 Financial information</li>
          </ul>
          <p>Ask a question to get started!</p>
        </div>

        <div
          v-for="(message, index) in messages"
          :key="index"
          class="chatbot-message"
          :class="{
            'chatbot-message--user': message.type === 'user',
            'chatbot-message--bot': message.type === 'bot',
          }"
        >
          <div class="message-avatar">
            <span v-if="message.type === 'user'">👤</span>
            <span v-else>🤖</span>
          </div>
          <div class="message-content">
            <div class="message-text">{{ formatMessage(message.content) }}</div>
            <div class="message-time">{{ formatTime(message.timestamp) }}</div>
          </div>
        </div>

        <div v-if="isLoading" class="chatbot-message chatbot-message--bot">
          <div class="message-avatar">🤖</div>
          <div class="message-content">
            <div class="typing-indicator" aria-hidden="true">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>
      </div>

      <div class="chatbot-input">
        <div class="input-container">
          <input
            v-model="currentMessage"
            class="message-input"
            placeholder="Type your question..."
            :disabled="isLoading"
            aria-label="Message input"
            @keypress.enter="sendMessage"
          />
          <button
            class="send-button"
            :disabled="!currentMessage.trim() || isLoading"
            aria-label="Send message"
            @click="sendMessage"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M2.01 21L23 12L2.01 3L2 10L17 12L2 14L2.01 21Z" fill="currentColor" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, nextTick, onMounted } from 'vue';
import axios from 'axios';

export default {
  name: 'ChatBot',
  setup() {
    const isOpen = ref(false);
    const messages = ref([]);
    const currentMessage = ref('');
    const isLoading = ref(false);
    const messagesContainer = ref(null);
    const allowedCollections = ref([]);
    const lastCollection = ref('products');

    const detectCollection = (text) => {
      try {
        const msg = String(text || '').toLowerCase();
        // Try exact token match or simple patterns like "collection:invoices" or "#invoices"
        for (const col of allowedCollections.value) {
          const c = String(col).toLowerCase();
          if (
            msg.includes(` ${c} `) ||
            msg.startsWith(`${c} `) ||
            msg.endsWith(` ${c}`) ||
            msg.includes(`#${c}`) ||
            msg.includes(`collection:${c}`) ||
            msg.includes(`collection=${c}`)
          ) {
            return col;
          }
        }
      } catch (e) {
        console.debug('detectCollection error:', e);
      }
      return null;
    };

    const toggleChat = () => {
      isOpen.value = !isOpen.value;
      if (isOpen.value) {
        nextTick(() => {
          scrollToBottom();
        });
      }
    };

    const scrollToBottom = () => {
      if (messagesContainer.value) {
        messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
      }
    };

    const formatMessage = (content) => {
      return String(content || '');
    };

    const formatTime = (timestamp) => {
      return new Date(timestamp).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
    };

    const sendMessage = async () => {
      if (!currentMessage.value.trim() || isLoading.value) return;

      const userMessage = {
        type: 'user',
        content: currentMessage.value.trim(),
        timestamp: new Date(),
      };

      messages.value.push(userMessage);
      const messageToSend = currentMessage.value.trim();
      currentMessage.value = '';
      isLoading.value = true;

      // Scroll to bottom after adding user message
      await nextTick();
      scrollToBottom();

      try {
        const payload = { question: messageToSend };
        const chosenCollection = detectCollection(messageToSend);

        if (chosenCollection) {
          payload.collection = chosenCollection;
          lastCollection.value = chosenCollection;
        }

        const response = await axios.post('http://localhost:3003/chat', payload, { timeout: 30000 });

        const botMessage = {
          type: 'bot',
          content: response.data.answer || "Sorry, I can't answer that right now.",
          timestamp: new Date(),
        };

        messages.value.push(botMessage);
      } catch (error) {
        console.error('Chat error:', error);
        const errorMessage = {
          type: 'bot',
          content: 'Sorry, there was an error connecting to the server. Please try again later.',
          timestamp: new Date(),
        };
        messages.value.push(errorMessage);
      } finally {
        isLoading.value = false;
        await nextTick();
        scrollToBottom();
      }
    };

    onMounted(async () => {
      // Load allowed collections from backend config
      try {
        const res = await axios.get('http://localhost:3003/admin/config', { timeout: 10000 });
        const cfg = res.data?.config || {};
        const cols = cfg?.connections?.default?.collections || [];
        const excluded = cfg?.options?.excludedCollections || [];
        // filter out excluded from allowed list
        const filtered = cols.filter((c) => !excluded.includes(c));
        allowedCollections.value = filtered;
        if (filtered.length && !filtered.includes(lastCollection.value)) {
          lastCollection.value = filtered[0];
        }
      } catch (e) {
        // If load fails, keep default 'products'
        console.warn('Failed to load allowed collections, fallback to default', e?.message || e);
      }
    });

    return {
      isOpen,
      messages,
      currentMessage,
      isLoading,
      messagesContainer,
      allowedCollections,
      lastCollection,
      detectCollection,
      toggleChat,
      sendMessage,
      formatMessage,
      formatTime,
    };
  },
};
</script>

<style scoped>
.chatbot-container {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1000;
}

.chatbot-icon {
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4);
  transition: all 0.3s ease;
  color: white;
}

.chatbot-icon:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 25px rgba(102, 126, 234, 0.6);
}

.chatbot-icon--active {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  box-shadow: 0 4px 20px rgba(240, 147, 251, 0.4);
}

.chatbot-modal {
  position: absolute;
  bottom: 80px;
  right: 0;
  width: 400px;
  height: 600px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.chatbot-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 16px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chatbot-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 16px;
}

.chatbot-close {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.chatbot-close:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.chatbot-messages {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  background: #f8f9fa;
}

.chatbot-welcome {
  text-align: center;
  padding: 20px;
  color: #666;
}

.welcome-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.chatbot-welcome h3 {
  margin: 0 0 12px 0;
  color: #333;
  font-size: 18px;
}

.chatbot-welcome p {
  margin: 8px 0;
  font-size: 14px;
}

.chatbot-welcome ul {
  text-align: left;
  margin: 16px 0;
  padding-left: 20px;
}

.chatbot-welcome li {
  margin: 8px 0;
  font-size: 14px;
}

.chatbot-message {
  display: flex;
  margin-bottom: 16px;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.chatbot-message--user {
  flex-direction: row-reverse;
}

.message-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
  margin: 0 12px;
}

.chatbot-message--user .message-avatar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.chatbot-message--bot .message-avatar {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.message-content {
  max-width: 70%;
  background: white;
  padding: 12px 16px;
  border-radius: 18px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.chatbot-message--user .message-content {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.message-text {
  font-size: 14px;
  line-height: 1.4;
  word-wrap: break-word;
  white-space: pre-line;
}

.message-time {
  font-size: 11px;
  opacity: 0.7;
  margin-top: 4px;
}

.typing-indicator {
  display: flex;
  gap: 4px;
  padding: 8px 0;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ccc;
  animation: typing 1.4s infinite ease-in-out;
}

.typing-indicator span:nth-child(1) {
  animation-delay: -0.32s;
}

.typing-indicator span:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes typing {
  0%,
  80%,
  100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}

.chatbot-input {
  padding: 20px;
  background: white;
  border-top: 1px solid #eee;
}

.input-container {
  display: flex;
  gap: 12px;
  align-items: center;
}

.message-input {
  flex: 1;
  padding: 12px 16px;
  border: 1px solid #ddd;
  border-radius: 24px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
}

.message-input:focus {
  border-color: #667eea;
}

.message-input:disabled {
  background: #f5f5f5;
  cursor: not-allowed;
}

.send-button {
  width: 44px;
  height: 44px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 50%;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.send-button:hover:not(:disabled) {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.send-button:disabled {
  background: #ccc;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* Responsive */
@media (max-width: 480px) {
  .chatbot-modal {
    width: calc(100vw - 40px);
    right: -10px;
  }

  .chatbot-icon {
    width: 50px;
    height: 50px;
  }
}
</style>
