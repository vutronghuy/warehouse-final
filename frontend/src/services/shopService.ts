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
}


export const shopService = new ShopService();
