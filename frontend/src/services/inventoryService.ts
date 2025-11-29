import { httpClient, IResponse } from '@/core';

class InventoryService {
  /**
   * Lấy danh sách inventory với pagination và filters
   */
  async getAllInventory(params?: any): Promise<IResponse> {
    return await httpClient.get('/api/inventory', { params });
  }

  /**
   * Lấy inventory theo ID
   */
  async getInventoryById(id: string): Promise<IResponse> {
    return await httpClient.get(`/api/inventory/${id}`);
  }

  /**
   * Lấy inventory theo productId và warehouseId
   */
  async getInventoryByProductAndWarehouse(productId: string, warehouseId: string): Promise<IResponse> {
    return await httpClient.get(`/api/inventory/product/${productId}/warehouse/${warehouseId}`);
  }

  /**
   * Điều chỉnh tồn kho (Admin và Super Admin only)
   */
  async updateInventory(id: string, data: { quantity: number; notes?: string }): Promise<IResponse> {
    return await httpClient.put(`/api/inventory/${id}`, data);
  }

  /**
   * Đồng bộ inventory từ Product.quantity
   */
  async syncInventory(warehouseId?: string): Promise<IResponse> {
    const params = warehouseId ? { warehouseId } : {};
    return await httpClient.post('/api/inventory/sync', null, { params });
  }

  /**
   * Lấy thống kê inventory
   */
  async getInventoryStats(warehouseId?: string): Promise<IResponse> {
    const params = warehouseId ? { warehouseId } : {};
    return await httpClient.get('/api/inventory/stats', { params });
  }

  /**
   * Lấy danh sách inventory transactions
   */
  async getAllTransactions(params?: any): Promise<IResponse> {
    return await httpClient.get('/api/inventory/transactions', { params });
  }

  /**
   * Lấy transaction theo ID
   */
  async getTransactionById(id: string): Promise<IResponse> {
    return await httpClient.get(`/api/inventory/transactions/${id}`);
  }

  /**
   * Tạo manual transaction (Admin và Super Admin only)
   */
  async createTransaction(data: {
    productId: string;
    warehouseId: string;
    transactionType: 'import' | 'export' | 'adjustment' | 'reservation' | 'release';
    quantityChange: number;
    quantityBefore?: number;
    batchNumber?: string;
    notes?: string;
    referenceId?: string;
  }): Promise<IResponse> {
    return await httpClient.post('/api/inventory/transactions', data);
  }

  /**
   * Lấy thống kê transactions
   */
  async getTransactionStats(params?: any): Promise<IResponse> {
    return await httpClient.get('/api/inventory/transactions/stats', { params });
  }
}

export const inventoryService = new InventoryService();

