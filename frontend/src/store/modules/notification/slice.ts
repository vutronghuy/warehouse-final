import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { INotification } from './types';

export const useNotificationStore = defineStore('notification', () => {
  // State
  const notifications = ref<INotification[]>([]);
  const unreadCount = ref(0);

  // Getters
  const getUnreadNotifications = computed(() => notifications.value.filter((n) => !n.read));

  const getNotificationsByType = (type: string) => notifications.value.filter((n) => n.type === type);

  // Actions
  const addNotification = (notification: Omit<INotification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: INotification = {
      ...notification,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      read: false,
    };

    notifications.value.unshift(newNotification);
    unreadCount.value++;

    // Keep only last 50 notifications to avoid memory issues
    if (notifications.value.length > 50) {
      notifications.value = notifications.value.slice(0, 50);
    }
  };

  const markAsRead = (notificationId: string) => {
    const notification = notifications.value.find((n) => n.id === notificationId);
    if (notification && !notification.read) {
      notification.read = true;
      unreadCount.value = Math.max(0, unreadCount.value - 1);
    }
  };

  const markAllAsRead = () => {
    notifications.value.forEach((n) => {
      n.read = true;
    });
    unreadCount.value = 0;
  };

  const removeNotification = (notificationId: string) => {
    const index = notifications.value.findIndex((n) => n.id === notificationId);
    if (index !== -1) {
      const notification = notifications.value[index];
      if (!notification.read) {
        unreadCount.value = Math.max(0, unreadCount.value - 1);
      }
      notifications.value.splice(index, 1);
    }
  };

  const deleteNotification = (notificationId: string) => {
    removeNotification(notificationId);
  };

  const clearAllNotifications = () => {
    notifications.value = [];
    unreadCount.value = 0;
  };

  // Reset store when navigating between pages to prevent accumulation
  const resetStore = () => {
    notifications.value = [];
    unreadCount.value = 0;
  };

  // Clear all notifications on page load/reload
  const clearOnPageLoad = () => {
    notifications.value = [];
    unreadCount.value = 0;
  };

  // Specific method for export created notification
  const notifyExportCreated = (exportData: any) => {
    const receiptNumber = exportData.receiptNumber || exportData._id;
    const customerName = exportData.customerName || 'Khách hàng không xác định';
    const totalAmount = exportData.totalAmount || 0;
    const itemCount = exportData.details?.length || 0;

    addNotification({
      type: 'export_created',
      title: '🔔 Phiếu Export Mới',
      message: `Phiếu ${receiptNumber} - ${customerName} (${itemCount} sản phẩm, $${totalAmount}) đã được tạo bởi staff và chờ review`,
      data: exportData,
    });
  };

  // Specific method for invoice created notification
  const notifyInvoiceCreated = (invoiceData: any) => {
    const invoiceNumber = invoiceData.invoiceNumber || invoiceData._id;
    const customerName = invoiceData.customerName || 'Khách hàng không xác định';
    const totalAmount = invoiceData.totalAmount || 0;
    const itemCount = invoiceData.items?.length || 0;

    addNotification({
      type: 'invoice_created',
      title: '📄 Invoice Mới',
      message: `Invoice ${invoiceNumber} - ${customerName} (${itemCount} sản phẩm, $${totalAmount}) đã được tạo bởi staff và chờ accounter review`,
      data: invoiceData,
    });
  };

  // Specific method for export approved notification
  const notifyExportApproved = (exportData: any) => {
    const receiptNumber = exportData.receiptNumber || exportData._id;
    const customerName = exportData.customerName || 'Khách hàng không xác định';
    const totalAmount = exportData.totalAmount || 0;
    const itemCount = exportData.details?.length || 0;

    addNotification({
      type: 'export_approved',
      title: '✅ Phiếu Export Đã Duyệt',
      message: `Phiếu ${receiptNumber} - ${customerName} (${itemCount} sản phẩm, $${totalAmount}) đã được admin duyệt và sẵn sàng tạo invoice`,
      data: exportData,
    });
  };

  // Specific method for invoice deleted notification
  const notifyInvoiceDeleted = (invoiceData: any) => {
    const invoiceNumber = invoiceData.invoiceNumber || invoiceData._id;
    const customerName = invoiceData.customerName || 'Khách hàng không xác định';
    const totalAmount = invoiceData.totalAmount || 0;
    const itemCount = invoiceData.items?.length || 0;

    addNotification({
      type: 'invoice_deleted',
      title: '🗑️ Invoice Đã Xóa',
      message: `Invoice ${invoiceNumber} - ${customerName} (${itemCount} sản phẩm, $${totalAmount}) đã được xóa bởi staff`,
      data: invoiceData,
    });
  };

  return {
    // State
    notifications,
    unreadCount,
    // Getters
    getUnreadNotifications,
    getNotificationsByType,
    // Actions
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    deleteNotification,
    clearAllNotifications,
    resetStore,
    clearOnPageLoad,
    notifyExportCreated,
    notifyInvoiceCreated,
    notifyExportApproved,
    notifyInvoiceDeleted,
  };
});
