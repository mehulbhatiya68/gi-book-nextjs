export interface NormalizedInvoice {
  id: string;
  invoiceNumber: string;
  isPurchase: boolean;
  isSales: boolean;
  type: 'purchase' | 'sales';
  partyName: string;
  partyId?: string;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  status: 'paid' | 'unpaid' | 'partially_paid';
  date: string;
  dueDate: string;
  items: any[];
}

/**
 * Robustly detects if an invoice (new or legacy) is a Purchase invoice.
 */
export function isPurchaseInvoice(inv: any): boolean {
  if (!inv) return false;

  // 1. Direct boolean flags
  if (inv.is_purchase === true || inv.isPurchase === true || inv.is_supplier === true) return true;
  if (inv.is_sales === true || inv.isSales === true || inv.is_customer === true) return false;

  // 2. Type strings
  const typeStr = String(inv.type || inv.invoice_type || inv.invoiceType || inv.category || '').toLowerCase();
  if (
    typeStr.includes('purchase') ||
    typeStr.includes('buy') ||
    typeStr.includes('p_inv') ||
    typeStr === 'pur' ||
    typeStr === 'supplier'
  ) {
    return true;
  }
  if (typeStr.includes('sale') || typeStr.includes('sell') || typeStr === 'customer') {
    return false;
  }

  // 3. Invoice Number Prefixes
  const numStr = String(
    inv.invoice_number ||
    inv.invoiceNumberStr ||
    (typeof inv.invoiceNumber === 'object' ? inv.invoiceNumber?.number : inv.invoiceNumber) ||
    inv.number ||
    ''
  ).toUpperCase().trim();

  if (
    numStr.startsWith('PUR') ||
    numStr.startsWith('PINV') ||
    numStr.startsWith('PI') ||
    numStr.startsWith('PURCHASE') ||
    numStr.startsWith('P-') ||
    numStr.startsWith('P/')
  ) {
    return true;
  }

  // 4. Ledger or Party type
  const ledgerType = String(
    inv.ledger?.type ||
    inv.party?.type ||
    inv.supplier?.type ||
    inv.party_type ||
    inv.ledger_type ||
    ''
  ).toLowerCase();

  if (ledgerType === 'supplier' || ledgerType === 'vendor') {
    return true;
  }

  // 5. Presence of supplier object vs customer object
  if ((inv.supplier || inv.supplier_id) && !inv.customer && !inv.customer_id) {
    return true;
  }

  return false;
}

/**
 * Robustly detects if an invoice (new or legacy) is a Sales invoice.
 */
export function isSalesInvoice(inv: any): boolean {
  return !isPurchaseInvoice(inv);
}

/**
 * Extract clean displayable invoice number for legacy or structured invoice objects.
 */
export function getInvoiceNumber(inv: any): string {
  if (!inv) return '';
  if (typeof inv.invoiceNumber === 'object' && inv.invoiceNumber !== null) {
    const prefix = inv.invoiceNumber.prefixEnabled ? (inv.invoiceNumber.prefix || '') + ' ' : '';
    const num = inv.invoiceNumber.number || '';
    const suffix = inv.invoiceNumber.suffixEnabled ? ' ' + (inv.invoiceNumber.suffix || '') : '';
    const formatted = `${prefix}${num}${suffix}`.trim();
    if (formatted) return formatted;
  }
  return String(
    inv.invoice_number ||
    inv.invoiceNumberStr ||
    inv.invoiceNumber ||
    inv.number ||
    inv.inv_number ||
    (inv.id ? `#${inv.id}` : 'INV-0001')
  );
}

/**
 * Extract party/customer/supplier name safely from legacy or new invoice payload.
 */
export function getInvoicePartyName(inv: any): string {
  if (!inv) return 'General Party';
  return (
    inv.ledger?.name ||
    inv.partyName ||
    inv.party_name ||
    inv.party?.partyName ||
    inv.party?.name ||
    inv.supplier?.partyName ||
    inv.supplier?.name ||
    inv.customer?.name ||
    inv.customer?.partyName ||
    'General Customer'
  );
}

/**
 * Extract ledger ID / party ID safely.
 */
export function getInvoicePartyId(inv: any): string | undefined {
  if (!inv) return undefined;
  return (
    inv.ledger_id ||
    inv.ledger?.id ||
    inv.party_id ||
    inv.partyId ||
    inv.party?.id ||
    inv.supplier_id ||
    inv.supplierId ||
    inv.supplier?.id ||
    inv.customer_id ||
    inv.customer?.id
  );
}

/**
 * Extract financial amounts (total, paid, due, status) for legacy and new invoices.
 */
export function getInvoiceAmounts(inv: any) {
  if (!inv) return { totalAmount: 0, paidAmount: 0, dueAmount: 0, status: 'unpaid' as const };

  const totalAmount = Math.max(0, Number(inv.amount ?? inv.total_amount ?? inv.totalAmount ?? inv.grandTotal ?? inv.grand_total ?? inv.total ?? 0));

  let status = String(inv.status || '').toLowerCase();
  let paidAmount = Math.max(0, Number(inv.paid_amount ?? inv.paidAmount ?? 0));
  let dueAmount = Number(inv.balance_due ?? inv.balanceDue ?? inv.due_amount ?? inv.dueAmount);

  // Check attached transactions/payments array on invoice if present
  const attachedTxs = Array.isArray(inv.transactions)
    ? inv.transactions
    : Array.isArray(inv.payments)
    ? inv.payments
    : Array.isArray(inv.ledger_transactions)
    ? inv.ledger_transactions
    : Array.isArray(inv.paymentHistory)
    ? inv.paymentHistory
    : Array.isArray(inv.payment_history)
    ? inv.payment_history
    : Array.isArray(inv.payments_history)
    ? inv.payments_history
    : [];

  if (attachedTxs.length > 0) {
    const txSum = attachedTxs.reduce((sum: number, tx: any) => sum + Number(tx.amount || 0), 0);
    if (txSum > 0) {
      paidAmount = Math.max(paidAmount, txSum);
    }
  }

  // If status is explicitly 'paid' or is_paid is true, enforce zero due amount & paidAmount = totalAmount
  if (status === 'paid' || inv.is_paid === true || inv.isPaid === true) {
    status = 'paid';
    dueAmount = 0;
    paidAmount = totalAmount;
  } else if (status === 'unpaid') {
    if (paidAmount >= totalAmount && totalAmount > 0) {
      status = 'paid';
      dueAmount = 0;
      paidAmount = totalAmount;
    } else if (paidAmount > 0) {
      status = 'partially_paid';
      dueAmount = Math.max(0, totalAmount - paidAmount);
    } else {
      status = 'unpaid';
      dueAmount = totalAmount;
      paidAmount = 0;
    }
  } else if (status === 'partially_paid' || status === 'partial') {
    status = 'partially_paid';
    if (isNaN(dueAmount) || dueAmount <= 0) {
      if (paidAmount > 0) {
        dueAmount = Math.max(0, totalAmount - paidAmount);
      } else {
        dueAmount = totalAmount;
      }
    }
    if (paidAmount <= 0 && dueAmount < totalAmount) {
      paidAmount = Math.max(0, totalAmount - dueAmount);
    }
    if (dueAmount <= 0 && totalAmount > 0) {
      status = 'paid';
      dueAmount = 0;
      paidAmount = totalAmount;
    } else if (paidAmount >= totalAmount && totalAmount > 0) {
      status = 'paid';
      dueAmount = 0;
      paidAmount = totalAmount;
    }
  } else {
    // Unspecified status string: determine from paidAmount / dueAmount
    if (isNaN(dueAmount)) {
      dueAmount = Math.max(0, totalAmount - paidAmount);
    }
    if (dueAmount <= 0 && totalAmount > 0) {
      status = 'paid';
      dueAmount = 0;
      paidAmount = totalAmount;
    } else if (paidAmount > 0 && dueAmount > 0) {
      status = 'partially_paid';
    } else {
      status = 'unpaid';
      dueAmount = totalAmount;
      paidAmount = 0;
    }
  }

  return { totalAmount, paidAmount, dueAmount, status: status as 'paid' | 'unpaid' | 'partially_paid' };
}

/**
 * Returns a fully normalized invoice object compatible with all legacy schemas.
 */
export function normalizeInvoice(inv: any): NormalizedInvoice {
  const isPurch = isPurchaseInvoice(inv);
  const invNum = getInvoiceNumber(inv);
  const partyName = getInvoicePartyName(inv);
  const partyId = getInvoicePartyId(inv);
  const { totalAmount, paidAmount, dueAmount, status } = getInvoiceAmounts(inv);

  const date = inv?.created_at
    ? String(inv.created_at).split('T')[0]
    : inv?.invoice_date || inv?.invoiceDate || inv?.date || new Date().toISOString().split('T')[0];
  const dueDate = inv?.due_date || inv?.dueDate || date;

  const items =
    inv?.items ||
    inv?.invoice_items ||
    inv?.sales_invoice_items ||
    inv?.purchase_invoice_items ||
    inv?.invoiceItems ||
    inv?.items_list ||
    inv?.details ||
    [];

  return {
    id: String(inv?.id || ''),
    invoiceNumber: invNum,
    isPurchase: isPurch,
    isSales: !isPurch,
    type: isPurch ? 'purchase' : 'sales',
    partyName,
    partyId,
    totalAmount,
    paidAmount,
    dueAmount,
    status,
    date,
    dueDate,
    items,
  };
}
