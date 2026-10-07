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

export function getPaymentModeDisplay(
  item: any,
  ledgersMap?: Map<string, any> | Record<string, any>
): string {
  if (!item) return "Cash";

  const classifyString = (str: string): string | null => {
    if (!str || typeof str !== "string") return null;
    const lower = str.toLowerCase().trim();
    if (!lower) return null;

    if (["payment_in", "payment_out", "payment", "credit", "debit", "contra", "transfer", "journal"].includes(lower)) {
      return null;
    }

    if (lower.includes("cheque") || lower.includes("check") || lower.includes("draft")) return "Cheque";
    if (lower.includes("upi") || lower.includes("gpay") || lower.includes("phonepe") || lower.includes("paytm") || lower.includes("bhim")) return "UPI";
    if (
      lower.includes("online") ||
      lower.includes("netbanking") ||
      lower.includes("neft") ||
      lower.includes("rtgs") ||
      lower.includes("imps") ||
      lower.includes("card") ||
      lower.includes("gateway") ||
      lower.includes("stripe") ||
      lower.includes("razorpay")
    ) {
      return "Online";
    }
    if (
      lower === "cash" ||
      lower.includes("cash") ||
      lower.includes("petty")
    ) {
      return "Cash";
    }
    if (
      lower === "bank" ||
      lower.includes("bank") ||
      lower.includes("account") ||
      lower.includes("transfer") ||
      lower.includes("hdfc") ||
      lower.includes("sbi") ||
      lower.includes("icici") ||
      lower.includes("axis") ||
      lower.includes("kotak") ||
      lower.includes("pnb") ||
      lower.includes("canara") ||
      lower.includes("union") ||
      lower.includes("bob") ||
      lower.includes("idfc") ||
      lower.includes("indusind") ||
      lower.includes("yes bank") ||
      lower.includes("rbl") ||
      lower.includes("deposit") ||
      lower.includes("current") ||
      lower.includes("saving")
    ) {
      return "Bank";
    }

    return null;
  };

  const classifyLedgerObj = (lObj: any): string | null => {
    if (!lObj || typeof lObj !== "object") return null;
    const lType = String(lObj.type || lObj.ledger_type || lObj.category || "").toLowerCase();
    if (lType === "cash") return "Cash";
    if (lType === "bank") return "Bank";

    const lName = String(lObj.name || lObj.title || lObj.ledger_name || "");
    return classifyString(lName);
  };

  // 1. Explicit payment_mode / paymentMode / payment_method / paymentMethod
  const explicitMode =
    item.payment_mode ||
    item.paymentMode ||
    item.payment_method ||
    item.paymentMethod;

  if (explicitMode && typeof explicitMode === "string") {
    const classified = classifyString(explicitMode);
    if (classified) return classified;
  }

  // 2. Embedded ledger objects: payment_ledger, paymentLedger, payment_account, to_ledger, from_ledger
  const ledgerObj = item.payment_ledger || item.paymentLedger || item.payment_account || item.paymentAccount;
  const classifiedLedgerObj = classifyLedgerObj(ledgerObj);
  if (classifiedLedgerObj) return classifiedLedgerObj;

  const typeStr = String(item.type || item.transaction_type || item.transactionType || "").toLowerCase();
  const relLedger = (typeStr === "payment_in" || typeStr === "credit")
    ? (item.to_ledger || item.toLedger)
    : (typeStr === "payment_out" || typeStr === "debit")
    ? (item.from_ledger || item.fromLedger)
    : null;
  const classifiedRelLedger = classifyLedgerObj(relLedger);
  if (classifiedRelLedger) return classifiedRelLedger;

  // 3. Lookup via ledgersMap with IDs
  const pLedgerId = String(
    item.payment_ledger_id ||
    item.paymentLedgerId ||
    item.ledger_id ||
    item.to_ledger_id ||
    item.from_ledger_id ||
    (typeof item.payment_ledger === "string" ? item.payment_ledger : "") ||
    ""
  );

  if (pLedgerId && ledgersMap) {
    const found = typeof (ledgersMap as any).get === "function"
      ? (ledgersMap as Map<string, any>).get(pLedgerId)
      : (ledgersMap as Record<string, any>)[pLedgerId];

    if (found) {
      if (typeof found === "object") {
        const classifiedFoundObj = classifyLedgerObj(found);
        if (classifiedFoundObj) return classifiedFoundObj;
      } else if (typeof found === "string") {
        const classifiedFoundStr = classifyString(found);
        if (classifiedFoundStr) return classifiedFoundStr;
      }
    }
  }

  // 4. Fallback strings: item.mode, item.payment_ledger_name, item.ledger_name
  const fallbackStr = String(item.mode || item.payment_ledger_name || item.ledger_name || "").trim();
  if (fallbackStr) {
    const classifiedFb = classifyString(fallbackStr);
    if (classifiedFb) return classifiedFb;
  }

  // 5. Final fallback based on transaction type or default "Cash"
  if (typeStr.includes("bank")) return "Bank";
  if (typeStr.includes("upi")) return "UPI";
  if (typeStr.includes("online")) return "Online";
  if (typeStr.includes("cheque")) return "Cheque";

  return "Cash";
}
