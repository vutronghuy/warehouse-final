import { httpClient, IResponse } from '@/core';

class ShopService {
  async getNewRegistationList(params: any): Promise<IResponse> {
    return await httpClient.get('v1/posts', {
      params,
    });
  }

  async getAccountingDashboard(params?: any): Promise<IResponse> {
    return await httpClient.get('api/reports/accounting', { params });
  }

  // API cho biểu đồ Top sản phẩm xuất nhiều nhất
  async getTopProducts(params?: any): Promise<IResponse> {
    return await httpClient.get('api/reports/top-products', { params });
  }

  // API cho biểu đồ Dòng tiền nhập-xuất kho
  async getCashFlow(params?: any): Promise<IResponse> {
    return await httpClient.get('api/reports/cash-flow', { params });
  }

  // API cho biểu đồ Giá trị hàng hóa tồn kho
  async getInventoryValue(params?: any): Promise<IResponse> {
    return await httpClient.get('api/reports/inventory-value', { params });
  }
}


export const shopService = new ShopService();
