export interface TransactionLike {
  type?: string;
  transactionType?: string;
  normalizedType?: string;
  salesInvoiceId?: string | number | null;
  sales_invoice_id?: string | number | null;
  partyLedgerType?: string | null;
  party_ledger_type?: string | null;
  [key: string]: any;
}

export class TransactionDisplayUtils {
  private static readonly _internalTypes = new Set(['journal', 'invoice_settlement']);

  public static getNormalizedType(tx: TransactionLike): string {
    const raw = tx.normalizedType || tx.type || tx.transactionType || '';
    return raw.toLowerCase().trim();
  }

  public static isUserFacingPayment(tx: TransactionLike): boolean {
    const type = this.getNormalizedType(tx);
    if (this._internalTypes.has(type)) return false;
    return type === 'payment_in' || type === 'payment_out';
  }

  public static isInternalInvoiceLedgerEntry(tx: TransactionLike): boolean {
    const type = this.getNormalizedType(tx);
    if (type === 'invoice_settlement') return true;
    const invId = tx.salesInvoiceId || tx.sales_invoice_id;
    if (type === 'journal' && invId !== undefined && invId !== null && String(invId).trim() !== '') {
      return true;
    }
    return false;
  }

  public static isPaymentOut(tx: TransactionLike, partyLedgerType?: string): boolean {
    const type = this.getNormalizedType(tx);
    if (type === 'payment_out') return true;
    const pType = (partyLedgerType || tx.partyLedgerType || tx.party_ledger_type || '').toLowerCase();
    if (pType === 'supplier' && type === 'payment_out') return true;
    if (pType === 'customer' && type === 'payment_in') return false;
    return type === 'debit' || type === 'paid';
  }

  public static isPaymentIn(tx: TransactionLike, partyLedgerType?: string): boolean {
    const type = this.getNormalizedType(tx);
    if (type === 'payment_in') return true;
    const pType = (partyLedgerType || tx.partyLedgerType || tx.party_ledger_type || '').toLowerCase();
    if (pType === 'customer' && type === 'payment_in') return true;
    if (pType === 'supplier' && type === 'payment_out') return false;
    return type === 'credit' || type === 'receipt';
  }

  public static ledgerTypeShowsInRecentActivity(ledgerType?: string): boolean {
    const t = (ledgerType || '').toLowerCase().trim();
    return t === 'cash' || t === 'bank' || t === 'customer' || t === 'supplier';
  }
}
