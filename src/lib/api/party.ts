import { apiClient } from './client';

export const partyApi = {
  // 1. List Parties: GET /parties with fallback to POST /ledgers
  getParties: async (typeOrBusinessId?: any) => {
    let typeFilter: string | undefined;
    if (typeof typeOrBusinessId === 'string' && ['customer', 'supplier'].includes(typeOrBusinessId.toLowerCase())) {
      typeFilter = typeOrBusinessId.toLowerCase();
    }

    try {
      const url = typeFilter ? `/parties?type=${typeFilter}` : '/parties';
      return await apiClient(url, { method: 'GET', silentError: true });
    } catch (err: any) {
      // Fallback if backend does not support GET /parties endpoint
      try {
        const body: any = { per_page: 'all' };
        if (typeFilter) {
          body.type = typeFilter;
        }
        const ledgersRes: any = await apiClient('/ledgers', { method: 'POST', body, silentError: true });
        const list = ledgersRes?.body?.ledgers || ledgersRes?.body?.data || (Array.isArray(ledgersRes?.body) ? ledgersRes.body : []);
        
        const filtered = list.filter((item: any) => {
          if (typeFilter) return item.type === typeFilter;
          return item.type === 'customer' || item.type === 'supplier';
        });

        return {
          message: 'OK',
          body: {
            data: filtered,
            parties: filtered
          }
        };
      } catch (fallbackErr) {
        return { message: 'OK', body: { data: [], parties: [] } };
      }
    }
  },

  // 2. Add Party: POST /parties with fallback to POST /ledgers/store
  createParty: async (data: any) => {
    try {
      return await apiClient('/parties', {
        method: 'POST',
        body: data,
        silentError: true,
      });
    } catch (err) {
      return apiClient('/ledgers/store', {
        method: 'POST',
        body: data,
      });
    }
  },

  // 3. Get Party Details: GET /parties/{id} with fallback to GET /ledgers/{id}
  getPartyDetails: async (id: string) => {
    try {
      return await apiClient(`/parties/${id}`, { method: 'GET', silentError: true });
    } catch (err) {
      const res: any = await apiClient(`/ledgers/${id}`, { method: 'GET' });
      if (res?.body?.ledger) {
        return { message: 'OK', body: { party: res.body.ledger } };
      }
      return res;
    }
  },

  // 4. Update Party: PUT /parties/{id} with fallback to PUT /ledgers/{id}
  updateParty: async (id: string, data: any) => {
    try {
      return await apiClient(`/parties/${id}`, {
        method: 'PUT',
        body: data,
        silentError: true,
      });
    } catch (err) {
      return apiClient(`/ledgers/${id}`, {
        method: 'PUT',
        body: data,
      });
    }
  },

  // 5. Delete Party: DELETE /parties/{id} with fallback to DELETE /ledgers/{id}
  deleteParty: async (id: string) => {
    try {
      return await apiClient(`/parties/${id}`, { method: 'DELETE', silentError: true });
    } catch (err) {
      return apiClient(`/ledgers/${id}`, { method: 'DELETE' });
    }
  },

  // 6. Party Transactions: GET /parties/{id}/transactions with fallback to POST /transactions
  getPartyTransactions: async (id: string) => {
    try {
      return await apiClient(`/parties/${id}/transactions`, { method: 'GET', silentError: true });
    } catch (err) {
      try {
        return await apiClient('/transactions', {
          method: 'POST',
          body: { type: 'ledger', id: String(id), per_page: 'all' },
          silentError: true,
        });
      } catch (e) {
        return { message: 'OK', body: { data: [], transactions: [] } };
      }
    }
  },
};
