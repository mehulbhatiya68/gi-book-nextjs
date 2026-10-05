import { apiClient } from './client';

export interface ItemPayload {
  item_name: string;
  item_code?: string;
  hsn?: string;
  hsn_code?: string;
  hsn_sac_code?: string;
  item_type: 'product' | 'service';
  unit?: string;
  sales_price?: number;
  sales_price_tax_type?: 'with_tax' | 'without_tax';
  purchase_price?: number;
  purchase_price_tax_type?: 'with_tax' | 'without_tax';
  tax_rate?: number;
  description?: string;
  current_stock?: number;
  min_stock_alert?: number;
  max_stock_alert?: number;
}

export const itemApi = {
  getItems: (params: any = {}) => {
    let payload: any = { per_page: 'all' };
    let silentError = false;
    if (typeof params === 'object' && params !== null && !Array.isArray(params)) {
      const { silentError: se, ...restParams } = params;
      silentError = Boolean(se);
      payload = { per_page: 'all', ...restParams };
    }
    return apiClient('/items', { method: 'POST', body: payload, ...(silentError && { silentError }) });
  },

  createItem: (data: ItemPayload) => {
    return apiClient('/items/store', { method: 'POST', body: data }).catch(async (err: any) => {
      const msg = String(err?.message || err || '');
      if (msg.includes('not allowed')) {
        const { hsn_sac_code, hsn_code, hsn, ...fallbackData } = (data || {}) as any;
        return apiClient('/items/store', { method: 'POST', body: fallbackData, silentError: true });
      }
      throw err;
    });
  },
  storeItem: (data: ItemPayload) => itemApi.createItem(data),

  getItem: (id: string | number) => apiClient(`/items/${id}`),
  getItemDetails: (id: string | number) => apiClient(`/items/${id}`),

  updateItem: (id: string | number, data: Partial<ItemPayload>) => {
    const { current_stock, currentStock, stockQuantity, stock, hsn_code, hsn, ...cleanData } = (data || {}) as any;
    return apiClient(`/items/${id}`, { method: 'PUT', body: cleanData }).catch(async (err: any) => {
      const msg = String(err?.message || err || '');
      if (msg.includes('not allowed')) {
        const { hsn_sac_code, ...fallbackData } = cleanData;
        return apiClient(`/items/${id}`, { method: 'PUT', body: fallbackData, silentError: true });
      }
      throw err;
    });
  },

  deleteItem: (id: string | number) => apiClient(`/items/${id}`, { method: 'DELETE' }),

  adjustStock: (id: string | number, data: { adjustment_type: 'add' | 'reduce'; quantity: number; reason?: string; adjustment_date?: string }) =>
    apiClient(`/items/${id}/adjust-stock`, { method: 'POST', body: data }),

  getStockAdjustments: (id: string | number, params: any = {}) => {
    const { silentError, ...restParams } = typeof params === 'object' && params !== null && !Array.isArray(params) ? params : {};
    const payload = {
      page: 1,
      per_page: '100',
      sort_by: 'adjustment_date',
      sort_dir: 'desc',
      ...restParams,
    };
    return apiClient(`/items/${id}/stock-adjustments`, { method: 'POST', body: payload, ...(silentError && { silentError }) });
  },

  // GET /items/lookup
  itemLookup: (params: any = {}) => {
    const queryObj = typeof params === 'string' ? { query: params } : (params || {});
    const query = new URLSearchParams(queryObj).toString();
    return apiClient(`/items/lookup${query ? `?${query}` : ''}`, { method: 'GET' });
  },

  // POST /hsn-sac-codes
  getHsnSacCodes: (params: any = {}) => {
    let payload: any = { per_page: 'all' };
    let silentError = false;
    if (typeof params === 'string') {
      payload = { per_page: 'all', search: params, query: params };
    } else if (typeof params === 'object' && params !== null && !Array.isArray(params)) {
      const { silentError: se, ...restParams } = params;
      silentError = Boolean(se);
      payload = { per_page: 'all', ...restParams };
    }
    return apiClient('/hsn-sac-codes', {
      method: 'POST',
      body: payload,
      ...(silentError && { silentError }),
    }).catch((err: any) => {
      // Fallback to GET if POST returns 405 Method Not Allowed
      if (err?.status === 405 || (err?.message && String(err.message).includes('405'))) {
        const query = new URLSearchParams(payload).toString();
        return apiClient(`/hsn-sac-codes${query ? `?${query}` : ''}`, {
          method: 'GET',
          ...(silentError && { silentError }),
        });
      }
      throw err;
    });
  },
};
