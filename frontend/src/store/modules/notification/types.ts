export interface INotification {
  id: string;
  type: 'export_created' | 'export_updated' | 'export_deleted' | 'export_approved' | 'invoice_created' | 'invoice_updated' | 'invoice_deleted' | 'invoice_approved' | 'invoice_rejected' | 'low_stock';
  title: string;
  message: string;
  timestamp: Date;
  data?: any;
  read: boolean;
}

export interface INotificationState {
  notifications: INotification[];
  unreadCount: number;
}

