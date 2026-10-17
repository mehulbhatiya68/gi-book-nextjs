import { apiClient } from './client';
import { apiCache } from './cache';

// Helper to determine if a record is a party (customer or supplier), rejecting non-party accounts (bank, cash, expense)
export const isPartyRecord = (item: any): boolean => {
  if (!item || typeof item !== 'object') return false;
  const t = String(item.type || item.partyType || item.party_type || '').toLowerCase().trim();
  // Strictly reject non-party ledger accounts
  if (t === 'bank' || t === 'cash' || t === 'expense') {
    return false;
  }
  if (t === 'customer' || t === 'supplier') {
    return true;
  }
  if (item.is_customer === true || item.is_customer === 1 || item.is_supplier === true || item.is_supplier === 1) {
    return true;
  }
  if (item.partyName || item.party_type) {
    return true;
  }
  return false;
};

// In-flight deduplication map for party list requests
const partyInflight = new Map<string, Promise<any>>();

export const partyApi = {
  // 1. List Parties: GET /parties with fallback to POST /ledgers, dedicated cache & strict party filtering
  getParties: async (typeOrBusinessId?: any, options: { forceFresh?: boolean; silentError?: boolean } = {}) => {
    let typeFilter: string | undefined;
    if (typeof typeOrBusinessId === 'string' && ['customer', 'supplier'].includes(typeOrBusinessId.toLowerCase())) {
      typeFilter = typeOrBusinessId.toLowerCase();
    }

    const cacheEndpoint = typeFilter ? `/parties?type=${typeFilter}` : '/parties';

    // Return unexpired cached party data if available and fresh data is not explicitly requested
    if (!options?.forceFresh) {
      const cached = apiCache.get(cacheEndpoint, 'GET');
      if (cached) {
        return cached;
      }
    }

    // In-flight request deduplication to prevent duplicate concurrent network queries
    const inflightKey = apiCache.getCacheKey(cacheEndpoint, 'GET');
    if (partyInflight.has(inflightKey)) {
      return partyInflight.get(inflightKey)!;
    }

    const fetchPromise = (async () => {
      try {
        const url = typeFilter ? `/parties?type=${typeFilter}` : '/parties';
        const res: any = await apiClient(url, { method: 'GET', silentError: true, ...options });
        const rawList = res?.body?.data || res?.body?.parties || (Array.isArray(res?.body) ? res.body : (Array.isArray(res) ? res : []));
        const filtered = (Array.isArray(rawList) ? rawList : []).filter((item: any) => {
          if (!isPartyRecord(item)) return false;
          if (typeFilter) {
            const t = String(item.type || item.partyType || item.party_type || '').toLowerCase();
            return t === typeFilter;
          }
          return true;
        });

        const result = {
          ...res,
          message: res?.message || 'OK',
          body: {
            ...(typeof res?.body === 'object' && !Array.isArray(res?.body) ? res.body : {}),
            data: filtered,
            parties: filtered,
          },
        };
        apiCache.set(cacheEndpoint, result, 'GET');
        return result;
      } catch (err: any) {
        // Fallback if backend does not support GET /parties endpoint: retrieve from /ledgers
        try {
          const body: any = { per_page: 'all' };
          if (typeFilter) {
            body.type = typeFilter;
          }
          const ledgersRes: any = await apiClient('/ledgers', { method: 'POST', body, silentError: true, ...options });
          const list = ledgersRes?.body?.ledgers || ledgersRes?.body?.data || (Array.isArray(ledgersRes?.body) ? ledgersRes.body : []);

          const filtered = (Array.isArray(list) ? list : []).filter((item: any) => {
            if (!isPartyRecord(item)) return false;
            if (typeFilter) {
              const t = String(item.type || item.partyType || item.party_type || '').toLowerCase();
              return t === typeFilter;
            }
            return true;
          });

          const result = {
            message: 'OK',
            body: {
              ...(typeof ledgersRes?.body === 'object' && !Array.isArray(ledgersRes?.body) ? ledgersRes.body : {}),
              data: filtered,
              parties: filtered,
            },
          };
          apiCache.set(cacheEndpoint, result, 'GET');
          return result;
        } catch (fallbackErr) {
          return { message: 'OK', body: { data: [], parties: [] } };
        }
      }
    })();

    partyInflight.set(inflightKey, fetchPromise);
    try {
      return await fetchPromise;
    } finally {
      partyInflight.delete(inflightKey);
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
