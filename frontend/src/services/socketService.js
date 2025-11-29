import { io } from 'socket.io-client';
import { useNotificationStore } from '@/store/modules/notification/slice';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000; // 1 second
    this.fallbackMode = false;
    this.connectionMonitor = null;
  }

  connect() {
    if (this.socket && this.isConnected) {
      console.log('🔌 Socket.IO already connected:', this.socket.id);
      return this.socket;
    }

    // Kiểm tra xem có nên bỏ qua Socket.IO không
    if (import.meta.env.VITE_SOCKET_DISABLED === 'true') {
      console.log('🔧 Socket.IO disabled by environment variable');
      this.enableFallbackMode();
      return null;
    }

    try {
      console.log('🚀 Connecting to Socket.IO server...');
      // Kết nối đến Socket.IO server
      this.socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:3003', {
        transports: ['polling', 'websocket'],
        timeout: 10000,
        forceNew: false,
        autoConnect: true,
        reconnection: true,
        reconnectionDelay: 2000,
        reconnectionAttempts: 5,
        upgrade: true,
        rememberUpgrade: true,
      });

      this.setupEventListeners();
      this.startConnectionMonitor();
      console.log('✅ Socket.IO connection initiated');
      return this.socket;
    } catch (error) {
      console.warn('Socket.IO server not available, using fallback mode:', error.message);
      this.enableFallbackMode();
      return null;
    }
  }

  setupEventListeners() {
    if (!this.socket) return;

    // Kết nối thành công
    this.socket.on('connect', () => {
      if (this.socket) {
        console.log('✅ Socket.IO connected:', this.socket.id);
        console.log('🔌 Socket transport:', this.socket.io.engine.transport.name);
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.fallbackMode = false;
      }
    });

    // Mất kết nối
    this.socket.on('disconnect', (reason) => {
      console.log('❌ Socket.IO disconnected:', reason);
      this.isConnected = false;

      // Xử lý các trường hợp disconnect khác nhau
      if (reason === 'io server disconnect') {
        console.log('🔌 Server initiated disconnect');
        // Server ngắt kết nối, thử kết nối lại sau 5 giây
        setTimeout(() => {
          if (this.socket && !this.isConnected) {
            console.log('🔄 Attempting to reconnect...');
            this.socket.connect();
          }
        }, 5000);
      } else if (reason === 'io client disconnect') {
        console.log('👤 Client initiated disconnect');
        // Client ngắt kết nối, không cần fallback
      } else if (reason === 'transport close' || reason === 'transport error') {
        console.warn('🔄 Transport issue, enabling fallback mode');
        this.enableFallbackMode();
      } else {
        console.warn('🔄 Socket.IO disconnected, enabling fallback mode');
        this.enableFallbackMode();
      }
    });

    // Lỗi kết nối
    this.socket.on('connect_error', (error) => {
      if (this.socket) {
        console.warn('⚠️ Socket.IO connection error:', error.message || error);
        this.isConnected = false;

        // Xử lý các loại lỗi khác nhau
        if (error.message) {
          if (
            error.message.includes('timeout') ||
            error.message.includes('ECONNREFUSED') ||
            error.message.includes('server error') ||
            error.message.includes('Network Error')
          ) {
            console.warn('🔄 Socket.IO server not available, enabling fallback mode');
            this.enableFallbackMode();
          }
        } else {
          // Xử lý lỗi không có message
          console.warn('🔄 Unknown Socket.IO error, enabling fallback mode');
          this.enableFallbackMode();
        }
      }
    });

    // Notification events
    this.socket.on('export-created', (data) => {
      if (this.socket) {
        console.log('Received export-created notification:', data);
        this.handleExportCreated(data);
      }
    });

    this.socket.on('export-approved', (data) => {
      if (this.socket) {
        console.log('Received export-approved notification:', data);
        this.handleExportApproved(data);
      }
    });

    this.socket.on('export-status-changed', (data) => {
      if (this.socket) {
        console.log('Received export-status-changed notification:', data);
        this.handleExportStatusChanged(data);
      }
    });

    this.socket.on('export-rejected', (data) => {
      if (this.socket) {
        console.log('Received export-rejected notification:', data);
        this.handleExportRejected(data);
      }
    });

    this.socket.on('invoice-created', (data) => {
      if (this.socket) {
        console.log('Received invoice-created notification:', data);
        this.handleInvoiceCreated(data);
      }
    });

    this.socket.on('invoice-approved', (data) => {
      if (this.socket) {
        console.log('✅ Received invoice-approved notification:', data);
        this.handleInvoiceApproved(data);
      }
    });

    this.socket.on('invoice-rejected', (data) => {
      if (this.socket) {
        console.log('❌ Received invoice-rejected notification:', data);
        this.handleInvoiceRejected(data);
      }
    });

    // Real-time chart events
    this.socket.on('chart-data-updated', (data) => {
      if (this.socket) {
        console.log('📊 Received chart-data-updated notification:', data);
        console.log('📊 Chart update type:', data.type);
        console.log('📊 Chart update action:', data.action);
        // This will be handled by individual components
      }
    });

    this.socket.on('invoice-deleted', (data) => {
      if (this.socket) {
        console.log('🗑️ Received invoice-deleted notification:', data);
        console.log('🗑️ Invoice ID:', data.invoiceId);
        // This will be handled by individual components
      }
    });
  }

  // Xử lý các loại notification
  handleExportCreated(data) {
    const notificationStore = useNotificationStore();
    notificationStore.notifyExportCreated(data);

    // Emit custom event for sidebar components
    window.dispatchEvent(new CustomEvent('export-created', { detail: data }));
  }

  handleExportApproved(data) {
    // Không tạo notification cho admin khi approve/reject
    // Chỉ emit custom event để cập nhật UI
    console.log('✅ Export approved (no notification for admin):', data);

    // Emit custom event for sidebar components
    window.dispatchEvent(new CustomEvent('export-approved', { detail: data }));
  }

  handleExportStatusChanged(data) {
    // Không tạo notification cho manager khi approve/reject
    // Chỉ emit custom event để cập nhật UI
    console.log('📦 Export status changed (no notification for manager):', data);

    // Emit custom event for sidebar components
    window.dispatchEvent(new CustomEvent('export-status-changed', { detail: data }));
  }

  handleExportRejected(data) {
    // Không tạo notification cho admin khi approve/reject
    // Chỉ emit custom event để cập nhật UI
    console.log('❌ Export rejected (no notification for admin):', data);

    // Emit custom event for sidebar components
    window.dispatchEvent(new CustomEvent('export-rejected', { detail: data }));
  }

  handleInvoiceCreated(data) {
    const notificationStore = useNotificationStore();
    notificationStore.notifyInvoiceCreated(data);
  }

  handleInvoiceApproved(data) {
    const notificationStore = useNotificationStore();
    notificationStore.addNotification({
      type: 'invoice_approved',
      title: '✅ Invoice Đã Duyệt',
      message: `Invoice ${data.invoiceNumber || data._id} - ${data.customerName || 'N/A'} đã được accounter duyệt`,
      data: data,
    });
  }

  handleInvoiceRejected(data) {
    const notificationStore = useNotificationStore();
    notificationStore.addNotification({
      type: 'invoice_rejected',
      title: '❌ Invoice Bị Từ Chối',
      message: `Invoice ${data.invoiceNumber || data._id} - ${data.customerName || 'N/A'} đã bị accounter từ chối`,
      data: data,
    });
  }

  // Gửi event đến server
  emit(event, data) {
    if (this.socket && this.isConnected) {
      this.socket.emit(event, data);
    } else {
      console.warn('Socket not connected, cannot emit event:', event);
    }
  }

  // Lắng nghe event từ server
  on(event, callback) {
    if (this.socket) {
      console.log('🎧 Setting up event listener for:', event);
      // Wrap callback to handle errors and undefined data
      this.socket.on(event, (data) => {
        try {
          // Ensure callback receives data (even if undefined)
          if (callback) {
            callback(data);
          }
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error);
        }
      });
    } else {
      console.warn('⚠️ Cannot set up event listener - socket not connected');
    }
  }

  // Hủy lắng nghe event
  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  // Ngắt kết nối
  disconnect() {
    this.stopConnectionMonitor();
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Kiểm tra và khôi phục kết nối
  checkAndReconnect() {
    if (!this.socket || !this.isConnected) {
      console.log('🔄 Checking connection status...');
      if (this.socket && this.socket.disconnected) {
        console.log('🔄 Attempting to reconnect...');
        this.socket.connect();
      } else if (!this.socket) {
        console.log('🔄 Creating new connection...');
        this.connect();
      }
    }
  }

  // Kiểm tra trạng thái kết nối
  isSocketConnected() {
    return this.socket && this.socket.connected && this.isConnected;
  }

  // Kiểm tra trạng thái kết nối
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      socketId: this.socket?.id || null,
      reconnectAttempts: this.reconnectAttempts,
    };
  }

  // Bật chế độ fallback khi Socket.IO không khả dụng
  enableFallbackMode() {
    console.log('🔄 Enabling fallback mode - notifications will work with polling');
    console.log('ℹ️ Real-time notifications disabled, using polling every 30 seconds');
    this.isConnected = false;
    this.fallbackMode = true;

    // Disconnect socket nếu có
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    // Có thể thêm logic fallback ở đây nếu cần
    // Ví dụ: bật polling, hiển thị thông báo cho user, etc.

    // Tự động thử kết nối lại sau 30 giây
    setTimeout(() => {
      if (this.fallbackMode) {
        console.log('🔄 Attempting to restore Socket.IO connection...');
        this.fallbackMode = false;
        this.connect();
      }
    }, 30000);
  }

  // Bắt đầu kiểm tra kết nối định kỳ
  startConnectionMonitor() {
    if (this.connectionMonitor) {
      clearInterval(this.connectionMonitor);
    }

    this.connectionMonitor = setInterval(() => {
      if (!this.isSocketConnected() && !this.fallbackMode) {
        console.log('🔍 Connection monitor: Socket disconnected, attempting reconnection...');
        this.checkAndReconnect();
      }
    }, 15000); // Kiểm tra mỗi 15 giây
  }

  // Dừng kiểm tra kết nối định kỳ
  stopConnectionMonitor() {
    if (this.connectionMonitor) {
      clearInterval(this.connectionMonitor);
      this.connectionMonitor = null;
    }
  }

  // Kiểm tra xem có đang ở chế độ fallback không
  isFallbackMode() {
    return !this.isConnected || this.reconnectAttempts >= this.maxReconnectAttempts;
  }
}

// Tạo singleton instance
const socketService = new SocketService();

export default socketService;
