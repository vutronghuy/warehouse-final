import { httpClient, IResponse } from '@/core';

class ShopService {
  async getNewRegistationList(params: any): Promise<IResponse> {
    return await httpClient.get('v1/posts', {
      params,
    });
  }
}

export const shopService = new ShopService();
