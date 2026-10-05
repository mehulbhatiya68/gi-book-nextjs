"use client";

import { isSalesInvoice, getInvoiceNumber, getInvoicePartyName } from "@/lib/utils/invoiceUtils";

export function buildInvoiceHtml({
  invoice,
  activeBusiness,
  currentUser,
  includePaymentHistory = true,
  paymentHistory = [],
}: {
  invoice: any;
  activeBusiness?: any;
  currentUser?: any;
  includePaymentHistory?: boolean;
  paymentHistory?: any[];
}): string {
  if (!invoice) return "";

  const isSales = isSalesInvoice(invoice);

  const party = invoice.ledger || invoice.party || invoice.supplier || {};
  const partyName = getInvoicePartyName(invoice);

  // Business Info
  const sellerName = activeBusiness?.name || currentUser?.businessName || "Business Name";
  const sellerAddress = activeBusiness?.address
    ? (typeof activeBusiness.address === "object"
        ? [activeBusiness.address.address || activeBusiness.address.street, activeBusiness.address.city, activeBusiness.address.state, activeBusiness.address.pincode || activeBusiness.address.pinCode].filter(Boolean).join(", ")
        : String(activeBusiness.address))
    : "Registered Business Office";
  const sellerPhone = activeBusiness?.phone || currentUser?.mobile || "";
  const sellerEmail = activeBusiness?.email || currentUser?.email || "";
  const sellerGSTIN = activeBusiness?.gst_number || activeBusiness?.gstNumber || activeBusiness?.gstin || "";

  // Customer Info
  const rawCustAddr = party?.billing_address || party?.billingAddress || party?.address;
  const customerAddress = rawCustAddr
    ? typeof rawCustAddr === "object"
      ? [
          rawCustAddr.street || rawCustAddr.address || rawCustAddr.line1,
          rawCustAddr.city,
          rawCustAddr.state,
          rawCustAddr.pin || rawCustAddr.pinCode || rawCustAddr.pincode,
        ]
          .filter(Boolean)
          .join(", ")
      : String(rawCustAddr)
    : "Address Not Provided";
  const customerPhone = party?.contact_number || party?.phone || party?.mobile || invoice.partyPhone || "";
  const customerEmail = party?.email || invoice.partyEmail || "";
  const customerGSTIN = party?.gst_number || party?.gstNumber || party?.gstin || invoice.partyGst || "";

  const invNum = getInvoiceNumber(invoice);
  const rawIssueDate = invoice.invoice_date || invoice.invoiceDate || invoice.date || (invoice.created_at ? String(invoice.created_at).split("T")[0] : null);
  const rawDueDate = invoice.due_date || invoice.dueDate || null;
  const invDate = rawIssueDate || rawDueDate || new Date().toISOString().split("T")[0];
  const dueDate = rawDueDate || invDate;

  const items = Array.isArray(invoice.items) ? invoice.items : (Array.isArray(invoice.invoice_items) ? invoice.invoice_items : []);
  const totalAmount = Number(invoice.amount ?? invoice.total_amount ?? invoice.totalAmount ?? invoice.grandTotal ?? 0);
  const paidAmount = Number(invoice.paid_amount ?? invoice.paidAmount ?? 0);
  const dueAmount = Number(invoice.balance_due ?? invoice.dueAmount ?? Math.max(0, totalAmount - paidAmount));

  // Additional fields
  const discountAmount = Number(invoice.discount_amount ?? invoice.discountAmount ?? invoice.discount ?? 0);
  const discountPercentage = Number(invoice.discount_percentage ?? invoice.discountPercentage ?? 0);

  const rawAddCharges = invoice.additional_charges ?? invoice.additionalCharges;
  const additionalChargesList: Array<{ name: string; amount: number }> = Array.isArray(rawAddCharges)
    ? rawAddCharges.map((ch: any) => ({ name: ch.name || ch.title || "Additional Charge", amount: Number(ch.amount || 0) }))
    : Number(rawAddCharges || 0) > 0
    ? [{ name: "Additional Charges", amount: Number(rawAddCharges) }]
    : [];

  const roundOffAmount = Number(invoice.round_off_amount ?? invoice.roundOffAmount ?? 0);
  const notesText = invoice.note || invoice.notes || invoice.terms || invoice.remark || "";

  let computedTaxable = 0;
  let computedTax = 0;

  const itemRows = items.map((item: any, idx: number) => {
    const itemName = item.item_name || item.itemName || item.name || item.item?.name || `Item ${idx + 1}`;
    const hsnCode = item.hsn_code || item.hsnCode || item.hsn || item.item?.hsn_sac_code || item.item?.hsnCode || "";
    const qty = Number(item.quantity ?? item.qty ?? 1);
    const rate = Number(item.rate ?? item.price ?? item.salesPrice ?? 0);
    const gstRate = Number(item.tax_rate ?? item.gstRate ?? 0);
    let lineAmt = Number(item.amount ?? item.lineTotal ?? item.total ?? (qty * rate));
    let taxable = gstRate > 0 ? lineAmt / (1 + gstRate / 100) : lineAmt;
    let tax = lineAmt - taxable;

    computedTaxable += taxable;
    computedTax += tax;

    return `
      <tr>
        <td style="text-align: center; border: 1px solid #cbd5e1; padding: 8px;">${idx + 1}</td>
        <td style="border: 1px solid #cbd5e1; padding: 8px;"><strong>${itemName}</strong>${hsnCode ? `<br/><span style="font-size: 9px; color: #64748b;">HSN: ${hsnCode}</span>` : ""}</td>
        <td style="text-align: center; border: 1px solid #cbd5e1; padding: 8px;">${qty}</td>
        <td style="text-align: right; border: 1px solid #cbd5e1; padding: 8px;">₹${rate.toFixed(2)}</td>
        <td style="text-align: center; border: 1px solid #cbd5e1; padding: 8px;">${gstRate}%</td>
        <td style="text-align: right; border: 1px solid #cbd5e1; padding: 8px; font-weight: bold;">₹${lineAmt.toFixed(2)}</td>
      </tr>
    `;
  }).join("");
  return `
    <div style="font-family: Arial, sans-serif; padding: 25px; color: #0f172a; background: #ffffff; max-width: 800px; margin: 0 auto; box-sizing: border-box;">
      <div style="display: flex; justify-content: space-between; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 20px;">
        <div>
          <h1 style="font-size: 22px; margin: 0; font-weight: 800; color: #0f172a;">${sellerName}</h1>
          <p style="font-size: 11px; color: #475569; margin-top: 4px; line-height: 1.4;">
            ${sellerAddress}<br/>
            ${sellerPhone ? "Ph: " + sellerPhone + " | " : ""}${sellerEmail ? "Email: " + sellerEmail : ""}<br/>
            ${sellerGSTIN ? "GSTIN: " + sellerGSTIN : ""}
          </p>
        </div>
        <div style="text-align: right;">
          <h2 style="font-size: 18px; margin: 0; color: #4f46e5; text-transform: uppercase;">${isSales ? "TAX INVOICE" : "PURCHASE INVOICE"}</h2>
          <p style="font-size: 11px; color: #475569; margin-top: 4px; line-height: 1.4;">
            <strong>Invoice #:</strong> ${invNum}<br/>
            <strong>Date:</strong> ${invDate}<br/>
            <strong>Due Date:</strong> ${dueDate}<br/>
            <strong>Status:</strong> <span style="text-transform: uppercase; font-weight: bold; color: ${invoice.status === 'paid' ? '#059669' : '#e11d48'};">${invoice.status || "UNPAID"}</span>
          </p>
        </div>
      </div>

      <div style="display: flex; gap: 20px; margin-bottom: 20px;">
        <div style="flex: 1; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; font-size: 11px; line-height: 1.4;">
          <div style="font-weight: 700; text-transform: uppercase; color: #64748b; margin-bottom: 4px;">Billed To (Customer / Party)</div>
          <strong style="font-size: 13px;">${partyName}</strong><br/>
          ${customerAddress}<br/>
          ${customerPhone ? "Phone: " + customerPhone + "<br/>" : ""}
          ${customerEmail ? "Email: " + customerEmail + "<br/>" : ""}
          ${customerGSTIN ? "GSTIN: " + customerGSTIN : ""}
        </div>
      </div>

      <table style="width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 10px;">
        <thead>
          <tr style="background: #f1f5f9;">
            <th style="width: 30px; text-align: center; border: 1px solid #cbd5e1; padding: 8px;">#</th>
            <th style="border: 1px solid #cbd5e1; padding: 8px; text-align: left;">Item Description</th>
            <th style="width: 50px; text-align: center; border: 1px solid #cbd5e1; padding: 8px;">Qty</th>
            <th style="width: 80px; text-align: right; border: 1px solid #cbd5e1; padding: 8px;">Rate</th>
            <th style="width: 60px; text-align: center; border: 1px solid #cbd5e1; padding: 8px;">GST</th>
            <th style="width: 90px; text-align: right; border: 1px solid #cbd5e1; padding: 8px;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemRows || `<tr><td colspan="6" style="text-align: center; padding: 12px; color: #94a3b8;">General Services / Billing</td></tr>`}
        </tbody>
      </table>

      <div style="display: flex; justify-content: flex-end; margin-top: 15px;">
        <div style="width: 290px; font-size: 11px; line-height: 1.8;">
          <div style="display: flex; justify-content: space-between;"><span>Taxable Subtotal:</span><span>₹${computedTaxable.toFixed(2)}</span></div>
          <div style="display: flex; justify-content: space-between;"><span>Total GST Tax:</span><span>+ ₹${computedTax.toFixed(2)}</span></div>
          ${discountAmount > 0 ? `<div style="display: flex; justify-content: space-between; color: #059669;"><span>Discount ${discountPercentage > 0 ? `(${discountPercentage.toFixed(2)}%)` : ''}:</span><span>- ₹${discountAmount.toFixed(2)}</span></div>` : ""}
          ${additionalChargesList.map((ch) => `<div style="display: flex; justify-content: space-between;"><span>${ch.name}:</span><span>+ ₹${ch.amount.toFixed(2)}</span></div>`).join("")}
          ${roundOffAmount !== 0 ? `<div style="display: flex; justify-content: space-between; color: #64748b;"><span>Round Off:</span><span>${roundOffAmount > 0 ? "+" : ""}₹${roundOffAmount.toFixed(2)}</span></div>` : ""}
          <div style="display: flex; justify-content: space-between; font-weight: 800; font-size: 14px; border-top: 2px solid #0f172a; padding-top: 6px; margin-top: 4px;"><span>Grand Total:</span><span>₹${totalAmount.toFixed(2)}</span></div>
          <div style="display: flex; justify-content: space-between; color: #059669;"><span>Paid Amount:</span><span>₹${paidAmount.toFixed(2)}</span></div>
          <div style="display: flex; justify-content: space-between; font-weight: 700; color: ${dueAmount > 0 ? '#e11d48' : '#059669'};"><span>Balance Due:</span><span>₹${dueAmount.toFixed(2)}</span></div>
        </div>
      </div>

      ${notesText ? `
        <div style="margin-top: 20px; padding: 10px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 11px; page-break-inside: avoid;">
          <strong style="text-transform: uppercase; color: #64748b; font-size: 10px; display: block; margin-bottom: 4px;">Terms &amp; Conditions / Notes:</strong>
          <span style="color: #334155;">${notesText}</span>
        </div>
      ` : ""}

      <div style="margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 12px; font-size: 10px; color: #94a3b8; display: flex; justify-content: space-between;">
        <span>Tax Invoice / Bill</span>
        <span>Authorized Signatory _____________________</span>
      </div>
    </div>
  `;
}

export async function saveAsClientPdf(htmlContent: string, fileName: string): Promise<boolean> {
  if (typeof window === "undefined") return false;

  return new Promise<boolean>((resolve) => {
    const doGenerate = (html2pdf: any) => {
      const container = document.createElement("div");
      container.style.position = "absolute";
      container.style.left = "-9999px";
      container.style.top = "-9999px";
      container.style.width = "800px";
      container.innerHTML = htmlContent;
      document.body.appendChild(container);

      const opt = {
        margin: 8,
        filename: fileName,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      };

      html2pdf()
        .set(opt)
        .from(container)
        .save()
        .then(() => {
          document.body.removeChild(container);
          resolve(true);
        })
        .catch((err: any) => {
          console.error("html2pdf save error:", err);
          document.body.removeChild(container);
          resolve(false);
        });
    };

    if ((window as any).html2pdf) {
      doGenerate((window as any).html2pdf);
    } else {
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
      script.onload = () => {
        if ((window as any).html2pdf) {
          doGenerate((window as any).html2pdf);
        } else {
          resolve(false);
        }
      };
      script.onerror = () => resolve(false);
      document.head.appendChild(script);
    }
  });
}
