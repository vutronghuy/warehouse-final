/**
 * Socket.IO Service Helper
 * Cung cấp các method để emit events đến clients
 */

class SocketService {
  constructor() {
    this.io = null;
  }

  // Set Socket.IO instance
  setIO(io) {
    this.io = io;
  }

  // Get Socket.IO instance
  getIO() {
    return this.io;
  }

  // Emit event to all clients
  emitToAll(event, data) {
    if (this.io) {
      this.io.emit(event, data);
      console.log(`📡 Emitted ${event} to all clients:`, data);
    } else {
      console.warn('⚠️ Socket.IO not initialized');
    }
  }

  // Emit event to specific room
  emitToRoom(room, event, data) {
    if (this.io) {
      this.io.to(room).emit(event, data);
      console.log(`📡 Emitted ${event} to room ${room}:`, data);
    } else {
      console.warn('⚠️ Socket.IO not initialized');
    }
  }

  // Emit event to specific client
  emitToClient(socketId, event, data) {
    if (this.io) {
      this.io.to(socketId).emit(event, data);
      console.log(`📡 Emitted ${event} to client ${socketId}:`, data);
    } else {
      console.warn('⚠️ Socket.IO not initialized');
    }
  }

  // Notification events
  notifyInvoiceCreated(invoiceData) {
    const notification = {
      type: 'invoice_created',
      title: '📄 Invoice Mới',
      message: `Invoice ${invoiceData.invoiceNumber || invoiceData._id} - ${invoiceData.customerName || 'Khách hàng không xác định'} đã được tạo bởi staff`,
      data: invoiceData,
      timestamp: new Date()
    };

    // Gửi đến tất cả accounters
    this.emitToRoom('accounters', 'invoice-created', notification);
    console.log('📢 Invoice created notification sent to accounters');
  }

  notifyInvoiceDeleted(invoiceData) {
    const notification = {
      type: 'invoice_deleted',
      title: '🗑️ Invoice Đã Xóa',
      message: `Invoice ${invoiceData.invoiceNumber || invoiceData._id} - ${invoiceData.customerName || 'Khách hàng không xác định'} đã được xóa bởi staff`,
      data: invoiceData,
      timestamp: new Date()
    };

    // Gửi đến tất cả accounters
    this.emitToRoom('accounters', 'invoice-deleted', notification);
    console.log('📢 Invoice deleted notification sent to accounters');
  }

  notifyInvoiceApproved(invoiceData) {
    const notification = {
      type: 'invoice_approved',
      title: '✅ Invoice Đã Duyệt',
      message: `Invoice ${invoiceData.invoiceNumber || invoiceData._id} - ${invoiceData.customerName || 'Khách hàng không xác định'} đã được accounter duyệt`,
      data: invoiceData,
      timestamp: new Date()
    };

    // Gửi đến tất cả staff, managers, admins
    this.emitToRoom('staff', 'invoice-approved', notification);
    this.emitToRoom('managers', 'invoice-approved', notification);
    this.emitToRoom('admins', 'invoice-approved', notification);
    this.emitToRoom('admin_super', 'invoice-approved', notification);
    console.log('📢 Invoice approved notification sent to all roles');
  }

  notifyInvoiceRejected(invoiceData) {
    const notification = {
      type: 'invoice_rejected',
      title: '❌ Invoice Bị Từ Chối',
      message: `Invoice ${invoiceData.invoiceNumber || invoiceData._id} - ${invoiceData.customerName || 'Khách hàng không xác định'} đã bị accounter từ chối`,
      data: invoiceData,
      timestamp: new Date()
    };

    // Gửi đến tất cả staff, managers, admins
    this.emitToRoom('staff', 'invoice-rejected', notification);
    this.emitToRoom('managers', 'invoice-rejected', notification);
    this.emitToRoom('admins', 'invoice-rejected', notification);
    this.emitToRoom('admin_super', 'invoice-rejected', notification);
    console.log('📢 Invoice rejected notification sent to all roles');
  }

  notifyExportCreated(exportData) {
    const notification = {
      type: 'export_created',
      title: '📦 Export Mới',
      message: `Export ${exportData.receiptNumber || exportData._id} - ${exportData.customerName || 'Khách hàng không xác định'} cần review`,
      data: exportData,
      timestamp: new Date()
    };

    // Gửi đến managers và admins
    this.emitToRoom('managers', 'export-created', notification);
    this.emitToRoom('admins', 'export-created', notification);
    console.log('📢 Export created notification sent to managers and admins');
  }

  notifyExportApproved(exportData) {
    const notification = {
      type: 'export_approved',
      title: '✅ Export Đã Duyệt',
      message: `Export ${exportData.receiptNumber || exportData._id} - ${exportData.customerName || 'Khách hàng không xác định'} đã được admin duyệt`,
      data: exportData,
      timestamp: new Date()
    };

    // Gửi đến staff
    this.emitToRoom('staff', 'export-approved', notification);
    console.log('📢 Export approved notification sent to staff');
  }

  notifyLowStock(productData) {
    const notification = {
      type: 'low_stock',
      title: '⚠️ Sản Phẩm Sắp Hết Hàng',
      message: `Sản phẩm ${productData.name} chỉ còn ${productData.quantity} sản phẩm`,
      data: productData,
      timestamp: new Date()
    };

    // Gửi đến admin super
    this.emitToRoom('admin_super', 'low-stock', notification);
    console.log('📢 Low stock notification sent to admin super');
  }

  // Chart data update notifications
  notifyChartDataUpdated(type, data = {}) {
    const updateData = {
      type, // 'invoice', 'inventory', 'products', 'sales', 'customers', 'all'
      data,
      timestamp: new Date()
    };

    // Gửi đến tất cả rooms liên quan
    this.emitToRoom('accounters', 'chart-data-updated', updateData);
    this.emitToRoom('admins', 'chart-data-updated', updateData);
    this.emitToRoom('managers', 'chart-data-updated', updateData);
    this.emitToRoom('admin_super', 'chart-data-updated', updateData);
    
    console.log(`📊 Chart data updated notification sent (type: ${type})`);
  }

  // Get connected clients count
  getConnectedClientsCount() {
    if (this.io) {
      return this.io.engine.clientsCount;
    }
    return 0;
  }

  // Get rooms info
  getRoomsInfo() {
    if (this.io) {
      const rooms = [];
      this.io.sockets.adapter.rooms.forEach((sockets, room) => {
        if (room !== room) { // Skip socket IDs
          rooms.push({
            room,
            clients: sockets.size
          });
        }
      });
      return rooms;
    }
    return [];
  }
}

// Export singleton instance
const socketService = new SocketService();
module.exports = socketService;
