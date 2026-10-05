import { apiClient } from './client';

export interface LedgerPayload {
  name: string;
  type: 'customer' | 'supplier' | 'bank' | 'cash' | 'expense';
  opening_balance: number;
  opening_balance_type?: 'credit' | 'debit';
  account_number?: string | null;
  ifsc_code?: string | null;
  bank_name?: string | null;
  branch_name?: string | null;
  upi_id?: string | null;
  gstin?: string | null;
  contact_number?: string | null;
  email?: string | null;
  address?: string | null;
  billing_address?: any;
  shipping_address?: any;
  country_code?: number | null;
  is_active?: boolean;
}

export const ledgerApi = {
  getLedgers: async (params: any = {}) => {
    const extraParams = typeof params === 'string' ? { search: params, per_page: 'all' } : { per_page: 'all', ...params };
    const { silentError, ...bodyParams } = extraParams;
    const clientOptions = silentError !== undefined ? { silentError } : {};
    const res: any = await apiClient('/ledgers', { method: 'POST', body: bodyParams, ...clientOptions });

    const rawList = res?.body?.ledgers || res?.body?.data || (Array.isArray(res?.body) ? res.body : (Array.isArray(res) ? res : []));
    const list = Array.isArray(rawList) ? rawList : [];

    // Normalize body so both .ledgers and .data work cleanly as arrays
    const body: any = {
      ...(typeof res?.body === 'object' && !Array.isArray(res?.body) ? res.body : {}),
      ledgers: list,
      data: list,
    };

    return {
      ...res,
      body,
    };
  },

  storeLedger: (data: LedgerPayload, options: any = {}) => apiClient('/ledgers/store', { method: 'POST', body: data, ...options }),
  
  getLedger: async (id: string | number, options: any = {}) => {
    const res: any = await apiClient(`/ledgers/${id}`, { method: 'GET', ...options });
    const ledger = res?.body?.ledger || res?.body?.data || res?.body || res?.ledger;
    if (res?.body && typeof res.body === 'object') {
      res.body.ledger = ledger;
      res.body.data = ledger;
    }
    return res;
  },
  
  updateLedger: (id: string | number, data: Partial<LedgerPayload>, options: any = {}) => apiClient(`/ledgers/${id}`, { method: 'PUT', body: data, ...options }),
  
  deleteLedger: (id: string | number, options: any = {}) => apiClient(`/ledgers/${id}`, { method: 'DELETE', ...options }),
  
  getTransactions: (ledgerId: string | number, params: any = {}) => {
    const extraParams = typeof params === 'string' ? { search: params } : (params || {});
    const { silentError, ...bodyParams } = extraParams;
    const clientOptions = silentError !== undefined ? { silentError } : {};
    const payload = { type: 'ledger', id: String(ledgerId), per_page: 'all', ...bodyParams };
    return apiClient('/transactions', { method: 'POST', body: payload, ...clientOptions });
  },
};

