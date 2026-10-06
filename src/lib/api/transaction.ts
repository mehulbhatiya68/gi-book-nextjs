import { apiClient } from './client';

export interface TransactionPayload {
  type: 'payment_in' | 'payment_out' | 'contra' | 'journal';
  payment_ledger_id: string;
  party_ledger_id: string;
  amount: number;
  transaction_date: string;
  transaction_number?: string;
  remark?: string;
  proof_image?: string | null;
  project_id?: string | null;
  site_id?: string | null;
  sales_invoice_id?: string | null;
  purchase_invoice_id?: string | null;
  invoice_id?: string | null;
}

export interface TransactionData {
  id?: string;
  transaction_number?: string;
  transactionNumber?: string;
  amount?: number;
  type?: 'payment_in' | 'payment_out' | 'contra' | 'journal' | string;
  transaction_date?: string;
  transactionDate?: string;
  remark?: string;
  proof_image?: string | null;
  proofImage?: string | null;
  payment_ledger_id?: string;
  paymentLedgerId?: string;
  party_ledger_id?: string;
  partyLedgerId?: string;
  project_id?: string | null;
  projectId?: string | null;
  site_id?: string | null;
  siteId?: string | null;
  sales_invoice_id?: string | null;
  salesInvoiceId?: string | null;
  payment_ledger?: any;
  paymentLedger?: any;
  party_ledger?: any;
  partyLedger?: any;
  project?: any;
  site?: any;
  sales_invoice?: any;
  salesInvoice?: any;
  is_invoice_receivable?: boolean;
  isInvoiceReceivable?: boolean;
  can_delete?: boolean;
  canDelete?: boolean;
  edit_policy_message?: string | null;
  editPolicyMessage?: string | null;
  edit_policy?: {
    can_delete?: boolean;
    message?: string;
  } | null;
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
  normalizedType?: string;
  isPayment?: boolean;
}

export function normalizeTransaction(raw: any): TransactionData {
  if (!raw || typeof raw !== 'object') return raw;

  const policy = raw.edit_policy || raw.editPolicy;
  const policyMessage = policy && typeof policy === 'object' ? String(policy.message || '') : (raw.edit_policy_message || raw.editPolicyMessage || null);
  const policyCanDelete = policy && typeof policy === 'object' ? policy.can_delete === true : (raw.can_delete ?? raw.canDelete ?? true);

  const txNum = String(raw.transaction_number ?? raw.invoice_number ?? raw.number ?? raw.receipt_number ?? raw.receiptNo ?? '').trim();
  const txType = String(raw.type ?? raw.transaction_type ?? '').trim().toLowerCase();
  const txDate = String(raw.transaction_date ?? raw.due_date ?? raw.date ?? raw.created_at ?? '').trim();
  const isPay = txType === 'payment_in' || txType === 'payment_out';

  return {
    ...raw,
    id: raw.id ? String(raw.id) : undefined,
    transaction_number: txNum || undefined,
    transactionNumber: txNum || undefined,
    amount: raw.amount !== undefined && raw.amount !== null ? Number(raw.amount) : 0,
    type: txType,
    normalizedType: txType,
    isPayment: isPay,
    transaction_date: txDate,
    transactionDate: txDate,
    remark: raw.remark || raw.notes || '',
    proof_image: raw.proof_image || raw.proofImage || null,
    proofImage: raw.proof_image || raw.proofImage || null,
    payment_ledger_id: raw.payment_ledger_id || raw.paymentLedgerId,
    paymentLedgerId: raw.payment_ledger_id || raw.paymentLedgerId,
    party_ledger_id: raw.party_ledger_id || raw.partyLedgerId,
    partyLedgerId: raw.party_ledger_id || raw.partyLedgerId,
    project_id: raw.project_id || raw.projectId || null,
    projectId: raw.project_id || raw.projectId || null,
    site_id: raw.site_id || raw.siteId || null,
    siteId: raw.site_id || raw.siteId || null,
    sales_invoice_id: raw.sales_invoice_id || raw.salesInvoiceId || null,
    salesInvoiceId: raw.sales_invoice_id || raw.salesInvoiceId || null,
    payment_ledger: raw.payment_ledger || raw.paymentLedger || null,
    paymentLedger: raw.payment_ledger || raw.paymentLedger || null,
    party_ledger: raw.party_ledger || raw.partyLedger || null,
    partyLedger: raw.party_ledger || raw.partyLedger || null,
    project: raw.project || null,
    site: raw.site || null,
    sales_invoice: raw.sales_invoice || raw.salesInvoice || null,
    salesInvoice: raw.sales_invoice || raw.salesInvoice || null,
    is_invoice_receivable: raw.is_invoice_receivable === true || raw.isInvoiceReceivable === true,
    isInvoiceReceivable: raw.is_invoice_receivable === true || raw.isInvoiceReceivable === true,
    can_delete: policyCanDelete,
    canDelete: policyCanDelete,
    edit_policy_message: policyMessage,
    editPolicyMessage: policyMessage,
    edit_policy: typeof policy === 'object' ? policy : { can_delete: policyCanDelete, message: policyMessage },
    created_at: raw.created_at || raw.createdAt,
    createdAt: raw.created_at || raw.createdAt,
    updated_at: raw.updated_at || raw.updatedAt,
    updatedAt: raw.updated_at || raw.updatedAt,
  };
}

export function toApiDate(dateStr?: string | null): string {
  if (!dateStr || !dateStr.trim()) return '';
  const str = dateStr.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  if (str.includes('T')) return str.split('T')[0];
  const d = new Date(str);
  if (!isNaN(d.getTime())) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  return str;
}

export const transactionApi = {
  // 1. List transactions: POST /transactions
  getTransactions: async (params: any = {}) => {
    const { silentError, ledgerId, ...bodyParams } = params || {};
    const clientOptions = { silentError: silentError ?? true };

    let targetId = ledgerId || bodyParams.id;
    let targetType = bodyParams.type;

    // If type is a transaction_type filter like 'payment_in' or 'payment_out', assign it to transaction_type
    if (targetType && ['payment_in', 'payment_out', 'contra', 'journal'].includes(targetType)) {
      bodyParams.transaction_type = targetType;
      targetType = undefined;
    }

    if (targetId) {
      // Direct query for specific ledger / project / site
      const payload: any = {
        type: targetType || 'ledger',
        id: String(targetId),
        per_page: 'all',
        ...bodyParams,
      };

      try {
        const res: any = await apiClient('/transactions', { method: 'POST', body: payload, ...clientOptions });
        const rawList = res?.body?.transactions || res?.body?.data || (Array.isArray(res?.body) ? res.body : (Array.isArray(res) ? res : []));
        const list = (Array.isArray(rawList) ? rawList : []).map(normalizeTransaction);

        const body: any = {
          ...(typeof res?.body === 'object' && !Array.isArray(res?.body) ? res.body : {}),
          transactions: list,
          data: list,
        };

        return { ...res, body };
      } catch (err: any) {
        if (clientOptions.silentError) {
          const emptyBody: any = [];
          emptyBody.transactions = [];
          emptyBody.data = [];
          return { message: 'OK', body: emptyBody };
        }
        throw err;
      }
    } else {
      // General list query: try direct POST /transactions
      try {
        const directRes: any = await apiClient('/transactions', {
          method: 'POST',
          body: { per_page: 'all', ...bodyParams },
          ...clientOptions,
        });
        if (directRes && (directRes.body !== undefined || directRes.data !== undefined || Array.isArray(directRes))) {
          const rawDirectList = directRes?.body?.transactions || directRes?.body?.data || (Array.isArray(directRes?.body) ? directRes.body : (Array.isArray(directRes) ? directRes : []));
          const list = (Array.isArray(rawDirectList) ? rawDirectList : []).map(normalizeTransaction);
          return {
            ...directRes,
            body: {
              ...(typeof directRes?.body === 'object' && !Array.isArray(directRes?.body) ? directRes.body : {}),
              transactions: list,
              data: list,
            },
          };
        }
      } catch (_) {}

      // Fallback if direct query returns empty or backend requires explicit ledger type & id
      try {
        const ledgersRes: any = await apiClient('/ledgers', { method: 'POST', body: { per_page: 'all' }, ...clientOptions }).catch(() => ({ body: [] }));
        const lList = Array.isArray(ledgersRes?.body)
          ? ledgersRes.body
          : ledgersRes?.body?.ledgers || ledgersRes?.body?.data || [];

        if (Array.isArray(lList) && lList.length > 0) {
          const txResults = await Promise.all(
            lList.map((l: any) =>
              apiClient('/transactions', {
                method: 'POST',
                body: { type: 'ledger', id: String(l.id), per_page: 'all', ...bodyParams },
                ...clientOptions,
              }).catch(() => null)
            )
          );

          const txMap = new Map();
          txResults.forEach((res: any) => {
            const list = res?.body?.transactions || res?.body?.data || (Array.isArray(res?.body) ? res.body : []);
            if (Array.isArray(list)) {
              list.forEach((tx: any) => {
                if (tx && tx.id) txMap.set(String(tx.id), normalizeTransaction(tx));
              });
            }
          });

          const combinedList = Array.from(txMap.values());
          const body: any = { transactions: combinedList, data: combinedList };
          return { message: 'OK', body };
        } else {
          const emptyBody: any = [];
          emptyBody.transactions = [];
          emptyBody.data = [];
          return { message: 'OK', body: emptyBody };
        }
      } catch (err: any) {
        if (clientOptions.silentError) {
          const emptyBody: any = [];
          emptyBody.transactions = [];
          emptyBody.data = [];
          return { message: 'OK', body: emptyBody };
        }
        throw err;
      }
    }
  },

  // 2. Get single transaction details (Robust multi-layer fallback when backend has no dedicated single detail endpoint)
  getTransactionById: async (id: string | number, options: any = {}) => {
    if (!id) return { message: 'Not found', body: null };
    const idStr = String(id).trim();

    // Step 1: Attempt direct GET /transactions/{id}
    try {
      const res: any = await apiClient(`/transactions/${idStr}`, { method: 'GET', silentError: true, ...options });
      if (res?.body && (res.body.id || res.body.transaction?.id || res.body.data?.id)) {
        const item = normalizeTransaction(res.body.transaction || res.body.data || res.body);
        if (res.body && typeof res.body === 'object') {
          res.body.transaction = item;
          res.body.data = item;
          res.body.payment = item;
        }
        return res;
      }
    } catch (e) {
      // Ignore direct GET error if endpoint is unavailable on backend
    }

    // Step 2: Fallback list search via transactionApi.getTransactions
    try {
      const listRes: any = await transactionApi.getTransactions({ silentError: true, ...options });
      const list = Array.isArray(listRes?.body?.transactions)
        ? listRes.body.transactions
        : Array.isArray(listRes?.body?.data)
        ? listRes.body.data
        : (Array.isArray(listRes?.body) ? listRes.body : []);
      const found = Array.isArray(list)
        ? list.find(
            (t: any) =>
              String(t.id) === idStr ||
              String(t.transaction_number || t.number || t.receipt_number || "").toLowerCase() === idStr.toLowerCase()
          )
        : null;
      if (found) {
        const normalized = normalizeTransaction(found);
        return { message: 'OK', body: { transaction: normalized, data: normalized, payment: normalized, ...normalized } };
      }
    } catch (err) {
      // Ignore
    }

    // Step 3: Fallback per-ledger scan (POST /transactions for each ledger ID)
    try {
      const ledgersRes: any = await apiClient('/ledgers', { method: 'POST', body: { per_page: 'all' }, silentError: true }).catch(() => ({ body: [] }));
      const lList = Array.isArray(ledgersRes?.body)
        ? ledgersRes.body
        : ledgersRes?.body?.ledgers || ledgersRes?.body?.data || [];

      if (Array.isArray(lList) && lList.length > 0) {
        const txResults = await Promise.all(
          lList.map((l: any) =>
            apiClient('/transactions', {
              method: 'POST',
              body: { type: 'ledger', id: String(l.id), per_page: 'all' },
              silentError: true,
            }).catch(() => null)
          )
        );

        for (const res of txResults) {
          const list = res?.body?.transactions || res?.body?.data || (Array.isArray(res?.body) ? res.body : []);
          if (Array.isArray(list)) {
            const matched = list.find(
              (t: any) =>
                String(t.id) === idStr ||
                String(t.transaction_number || t.number || t.receipt_number || "").toLowerCase() === idStr.toLowerCase()
            );
            if (matched) {
              const normalized = normalizeTransaction(matched);
              return { message: 'OK', body: { transaction: normalized, data: normalized, payment: normalized, ...normalized } };
            }
          }
        }
      }
    } catch (_) {}

    // Step 4: Fallback search across all invoices for linked receive-payment records
    try {
      const invoicesRes: any = await apiClient('/invoices', { method: 'POST', body: { per_page: 'all' }, silentError: true }).catch(() => null);
      const invList = Array.isArray(invoicesRes?.body)
        ? invoicesRes.body
        : invoicesRes?.body?.invoices || invoicesRes?.body?.data || [];

      if (Array.isArray(invList)) {
        for (const inv of invList) {
          const txList = Array.isArray(inv.transactions)
            ? inv.transactions
            : Array.isArray(inv.payments)
            ? inv.payments
            : Array.isArray(inv.ledger_transactions)
            ? inv.ledger_transactions
            : [];

          const matchedTx = txList.find(
            (t: any) =>
              String(t.id) === idStr ||
              String(t.transaction_number || t.number || t.receipt_number || "").toLowerCase() === idStr.toLowerCase()
          );

          if (matchedTx) {
            const synthesized = normalizeTransaction({
              id: matchedTx.id || idStr,
              transaction_number: matchedTx.transaction_number || matchedTx.number || matchedTx.receiptNo || idStr,
              amount: Number(matchedTx.amount || 0),
              transaction_date: matchedTx.transaction_date || matchedTx.date || inv.invoice_date || inv.created_at,
              remark: matchedTx.remark || matchedTx.notes || `Payment for invoice ${inv.invoice_number || inv.id}`,
              type: matchedTx.type || 'payment_in',
              party_ledger_id: inv.ledger_id || inv.party_id,
              sales_invoice_id: inv.id,
              invoice_id: inv.id,
              sales_invoice: inv,
              party_ledger: inv.ledger || inv.party,
              payment_ledger: matchedTx.payment_ledger || { name: matchedTx.mode || 'Cash / Bank' },
            });
            return { message: 'OK', body: { transaction: synthesized, data: synthesized, payment: synthesized, ...synthesized } };
          }
        }
      }
    } catch (_) {}

    return { message: 'Not found', body: null };
  },

  // 3. Store new transaction: POST /transactions/store
  storeTransaction: async (data: TransactionPayload) => {
    const payload: any = {
      type: data.type,
      payment_ledger_id: data.payment_ledger_id,
      party_ledger_id: data.party_ledger_id,
      amount: Number(data.amount),
      transaction_date: toApiDate(data.transaction_date),
    };
    if (data.transaction_number && data.transaction_number.trim()) {
      payload.transaction_number = data.transaction_number.trim();
    }
    if (data.remark && data.remark.trim()) {
      payload.remark = data.remark.trim();
    }
    if (data.proof_image && data.proof_image.trim()) {
      payload.proof_image = data.proof_image.trim();
    }
    if (data.project_id && data.project_id.trim()) {
      payload.project_id = data.project_id.trim();
    }
    if (data.site_id && data.site_id.trim()) {
      payload.site_id = data.site_id.trim();
    }
    if (data.sales_invoice_id && data.sales_invoice_id.trim()) {
      payload.sales_invoice_id = data.sales_invoice_id.trim();
    }

    const res: any = await apiClient('/transactions/store', { method: 'POST', body: payload });
    if (res?.body && typeof res.body === 'object') {
      const tx = normalizeTransaction(res.body.transaction || res.body.data || res.body);
      res.body.transaction = tx;
      res.body.data = tx;
    }
    return res;
  },

  // 4. Update transaction: PUT /transactions/:id
  updateTransaction: async (id: string | number, data: Partial<TransactionPayload>) => {
    const payload: any = {};
    if (data.type) payload.type = data.type;
    if (data.payment_ledger_id) payload.payment_ledger_id = data.payment_ledger_id;
    if (data.party_ledger_id) payload.party_ledger_id = data.party_ledger_id;
    if (data.amount !== undefined) payload.amount = Number(data.amount);
    if (data.transaction_date) payload.transaction_date = toApiDate(data.transaction_date);
    if (data.transaction_number && data.transaction_number.trim()) {
      payload.transaction_number = data.transaction_number.trim();
    }
    if (data.remark && data.remark.trim()) {
      payload.remark = data.remark.trim();
    }
    if (data.proof_image && data.proof_image.trim()) {
      payload.proof_image = data.proof_image.trim();
    }
    if (data.project_id && data.project_id.trim()) {
      payload.project_id = data.project_id.trim();
    }
    if (data.site_id && data.site_id.trim()) {
      payload.site_id = data.site_id.trim();
    }
    if (data.sales_invoice_id && data.sales_invoice_id.trim()) {
      payload.sales_invoice_id = data.sales_invoice_id.trim();
    }

    const res: any = await apiClient(`/transactions/${id}`, { method: 'PUT', body: payload });
    if (res?.body && typeof res.body === 'object') {
      const tx = normalizeTransaction(res.body.transaction || res.body.data || res.body);
      res.body.transaction = tx;
      res.body.data = tx;
    }
    return res;
  },

  // 5. Delete transaction: DELETE /transactions/:id
  deleteTransaction: (id: string | number) =>
    apiClient(`/transactions/${id}`, { method: 'DELETE' }),
};
