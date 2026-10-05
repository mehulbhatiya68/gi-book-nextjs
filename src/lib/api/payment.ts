import { transactionApi, TransactionPayload } from './transaction';

export interface PaymentPayload {
  payment_ledger_id: string;
  party_ledger_id: string;
  project_id?: string | null;
  site_id?: string | null;
  amount: number;
  type: 'payment_in' | 'payment_out';
  transaction_number?: string;
  remark?: string;
  proof_image?: string | null;
  transaction_date: string;
  sales_invoice_id?: string | null;
  purchase_invoice_id?: string | null;
  invoice_id?: string | null;
}

export const paymentApi = {
  // 1. List Payments: Queries /transactions and filters for payment transactions
  getPayments: async (params: any = {}) => {
    try {
      const res: any = await transactionApi.getTransactions(params);
      const rawList = Array.isArray(res?.body)
        ? res.body
        : (res?.body?.transactions || res?.body?.data || res?.body?.payments || []);

      const list = Array.isArray(rawList) ? rawList : [];

      // Filter for payment transactions
      const paymentsOnly = list.filter((tx: any) => {
        const txType = String(tx.type || tx.transactionType || '').toLowerCase();
        const isPayment = txType === 'payment_in' || txType === 'payment_out' || txType === 'credit' || txType === 'debit';
        if (!isPayment) return false;

        if (typeof params === 'object' && params !== null) {
          if (params.type) {
            const pType = String(params.type).toLowerCase();
            if (txType !== pType) {
              const isMatch =
                (pType === 'credit' && (txType === 'payment_in' || txType === 'credit')) ||
                (pType === 'debit' && (txType === 'payment_out' || txType === 'debit')) ||
                (pType === 'payment_in' && (txType === 'payment_in' || txType === 'credit')) ||
                (pType === 'payment_out' && (txType === 'payment_out' || txType === 'debit'));
              if (!isMatch) return false;
            }
          }
          if (params.party_ledger_id) {
            const targetParty = String(params.party_ledger_id);
            const matchesParty =
              String(tx.party_ledger_id || '') === targetParty ||
              String(tx.toLedgerId || '') === targetParty ||
              String(tx.party?.id || '') === targetParty ||
              String(tx.party_id || '') === targetParty;
            if (!matchesParty) return false;
          }
          if (params.sales_invoice_id) {
            const targetInv = String(params.sales_invoice_id);
            const matchesInv =
              String(tx.sales_invoice_id || '') === targetInv ||
              String(tx.invoice_id || '') === targetInv;
            if (!matchesInv) return false;
          }
          if (params.purchase_invoice_id) {
            const targetInv = String(params.purchase_invoice_id);
            const matchesInv =
              String(tx.purchase_invoice_id || '') === targetInv ||
              String(tx.invoice_id || '') === targetInv;
            if (!matchesInv) return false;
          }
          if (params.invoice_id) {
            const targetInv = String(params.invoice_id);
            const matchesInv =
              String(tx.invoice_id || '') === targetInv ||
              String(tx.sales_invoice_id || '') === targetInv ||
              String(tx.purchase_invoice_id || '') === targetInv;
            if (!matchesInv) return false;
          }
        }

        return true;
      });

      // Construct a response that supports both Array and object-property access
      const bodyWithAliases: any = [...paymentsOnly];
      bodyWithAliases.data = paymentsOnly;
      bodyWithAliases.payments = paymentsOnly;

      return {
        message: 'OK',
        body: bodyWithAliases,
      };
    } catch (err) {
      return {
        message: 'OK',
        body: { data: [], payments: [] },
      };
    }
  },

  // 2. Create Payment: POST /transactions/store
  createPayment: async (data: PaymentPayload) => {
    return transactionApi.storeTransaction(data as TransactionPayload);
  },

  // 3. Get single Payment details
  getPayment: async (id: string | number) => {
    return transactionApi.getTransactionById(id);
  },

  getPaymentDetails: async (id: string | number) => {
    return transactionApi.getTransactionById(id);
  },

  // 4. Update Payment: PUT /transactions/:id
  updatePayment: async (id: string | number, data: Partial<PaymentPayload>) => {
    return transactionApi.updateTransaction(id, data as Partial<TransactionPayload>);
  },

  // 5. Delete Payment: DELETE /transactions/:id
  deletePayment: async (id: string | number) => {
    return transactionApi.deleteTransaction(id);
  },
};

