import { apiClient } from './client';
import { toApiDate } from './transaction';

export interface BulkReceivePaymentPayload {
  invoice_ids: string[];
  payment_ledger_id: string;
  amount: number;
  transaction_date: string;
  allocation_order?: string;
  remark?: string;
  proof_image?: string | null;
}

export const invoiceApi = {
  // 1. List Invoices: POST /invoices
  getInvoices: async (filters: any = {}) => {
    // Handle backwards compatibility if a plain ID string was passed instead of options object
    const { silentError, ...restFilters } = typeof filters === 'object' && filters !== null ? filters : {};
    const payload = typeof filters === 'object' && filters !== null
      ? restFilters
      : {};
    return apiClient('/invoices', {
      method: 'POST',
      body: payload,
      ...(silentError && { silentError })
    });
  },

  // 2. Create Sales / Purchase Invoice: POST /invoices/store
  createInvoice: async (data: any) => {
    return apiClient('/invoices/store', {
      method: 'POST',
      body: data,
    });
  },
  storeInvoice: async (data: any) => {
    return apiClient('/invoices/store', {
      method: 'POST',
      body: data,
    });
  },

  // 3. Get Invoice Details: GET /invoices/{id}
  getInvoiceDetails: async (id: string, options: any = {}) => {
    return apiClient(`/invoices/${id}`, {
      method: 'GET',
      ...options,
    });
  },
  getInvoice: async (id: string, options: any = {}) => {
    return apiClient(`/invoices/${id}`, {
      method: 'GET',
      ...options,
    });
  },

  // 4. Update Invoice: PUT /invoices/{id}
  updateInvoice: async (id: string, data: any) => {
    return apiClient(`/invoices/${id}`, {
      method: 'PUT',
      body: data,
    });
  },

  // 5. Delete Invoice: DELETE /invoices/{id}
  deleteInvoice: async (id: string) => {
    return apiClient(`/invoices/${id}`, {
      method: 'DELETE',
    });
  },

  // 6. Update Payment Status: PATCH /invoices/{id}/status
  updateInvoiceStatus: async (id: string, status: 'paid' | 'unpaid' | 'partially_paid') => {
    return await apiClient(`/invoices/${id}/status`, {
      method: 'PATCH',
      body: { status },
    });
  },

  // 7. Receive / Update Payment: POST /invoices/{id}/receive-payment
  receivePayment: async (id: string, paymentData: any) => {
    const {
      payment_id,
      payment_ledger_id,
      amount,
      transaction_date,
      transaction_number,
      remark,
      proof_image,
    } = paymentData || {};

    const cleanBody: any = {
      payment_ledger_id,
      amount: Number(amount),
      transaction_date: toApiDate(transaction_date),
    };

    if (payment_id) cleanBody.payment_id = payment_id;
    if (transaction_number && String(transaction_number).trim()) {
      cleanBody.transaction_number = String(transaction_number).trim();
    }
    if (remark && String(remark).trim()) {
      cleanBody.remark = String(remark).trim();
    }
    if (proof_image && String(proof_image).trim()) {
      cleanBody.proof_image = String(proof_image).trim();
    }

    const res: any = await apiClient(`/invoices/${id}/receive-payment`, {
      method: 'POST',
      body: cleanBody,
    });

    if (res?.body && typeof res.body === 'object') {
      const inv = res.body.invoice || res.body.data;
      const pmt = res.body.payment || res.body.transaction;
      if (inv) res.body.invoice = inv;
      if (pmt) res.body.payment = pmt;
    }

    return res;
  },

  // 7b. Bulk Receive Payment: POST /invoices/bulk-receive-payment
  bulkReceivePayment: async (data: BulkReceivePaymentPayload) => {
    const {
      invoice_ids,
      payment_ledger_id,
      amount,
      transaction_date,
      allocation_order,
      remark,
      proof_image,
    } = data || {};

    const cleanBody: any = {
      invoice_ids: Array.isArray(invoice_ids) ? invoice_ids : [],
      payment_ledger_id,
      amount: Number(amount),
      transaction_date: toApiDate(transaction_date),
    };

    if (allocation_order && allocation_order.trim()) {
      cleanBody.allocation_order = allocation_order.trim();
    }
    if (remark && remark.trim()) {
      cleanBody.remark = remark.trim();
    }
    if (proof_image && proof_image.trim()) {
      cleanBody.proof_image = proof_image.trim();
    }

    return apiClient('/invoices/bulk-receive-payment', {
      method: 'POST',
      body: cleanBody,
    });
  },

  // 8. Delete Invoice Payment: DELETE /invoices/{id}/payments/{paymentId}
  deleteInvoicePayment: async (id: string, paymentId: string) => {
    const res: any = await apiClient(`/invoices/${id}/payments/${paymentId}`, {
      method: 'DELETE',
    });
    if (res?.body && typeof res.body === 'object') {
      const inv = res.body.invoice || res.body.data;
      if (inv) res.body.invoice = inv;
    }
    return res;
  },

  // 9. Download Invoice PDF Info: GET /invoices/{id}/pdf
  getInvoicePdf: async (id: string) => {
    return apiClient(`/invoices/${id}/pdf`, {
      method: 'GET',
    });
  },

  // 10. HTML View URL helper
  getInvoiceViewUrl: (id: string | number) => {
    return `${process.env.NEXT_PUBLIC_API_BASE_URL}/invoices/${id}/view`;
  },

  // 11. PDF File Download URL helper
  getInvoicePdfFileUrl: (id: string | number) => {
    return `${process.env.NEXT_PUBLIC_API_BASE_URL}/invoices/${id}/pdf/file`;
  },

  // 12. View Online Invoice: Performs authenticated API call and renders the HTML bill in a new tab
  viewOnline: async (id: string | number) => {
    const { getAuthToken } = await import('./client');
    const token = getAuthToken();
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

    // Open a blank new tab immediately in the user interaction context to avoid popup blockers
    let previewWindow: Window | null = null;
    try {
      previewWindow = window.open('about:blank', '_blank');
      if (previewWindow) {
        previewWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Loading Invoice...</title>
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <style>
                body {
                  margin: 0;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  min-height: 100vh;
                  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                  background-color: #f8fafc;
                  color: #334155;
                }
                .loader-card {
                  text-align: center;
                  padding: 32px 24px;
                  background: white;
                  border-radius: 16px;
                  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 10px 15px -3px rgba(0, 0, 0, 0.1);
                  max-width: 340px;
                  width: 90%;
                }
                .spinner {
                  width: 40px;
                  height: 40px;
                  border: 3px solid #e2e8f0;
                  border-top-color: #4f46e5;
                  border-radius: 50%;
                  animation: spin 0.8s linear infinite;
                  margin: 0 auto 16px;
                }
                @keyframes spin { to { transform: rotate(360deg); } }
                h3 { margin: 0 0 6px; font-size: 16px; color: #0f172a; font-weight: 700; }
                p { margin: 0; font-size: 13px; color: #64748b; line-height: 1.5; }
              </style>
            </head>
            <body>
              <div class="loader-card">
                <div class="spinner"></div>
                <h3>Loading Invoice Bill...</h3>
                <p>Connecting securely to fetch your online invoice statement.</p>
              </div>
            </body>
          </html>
        `);
      }
    } catch (_) {}

    try {
      const headers: Record<string, string> = {
        Accept: 'text/html, application/json, */*',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Check if backend returned a dedicated view_url in /pdf metadata
      let directViewUrl: string | null = null;
      try {
        const metaRes: any = await apiClient(`/invoices/${id}/pdf`, { method: 'GET', silentError: true });
        const remoteView = metaRes?.body?.view_url || metaRes?.view_url;
        if (remoteView && (remoteView.startsWith('http://') || remoteView.startsWith('https://'))) {
          directViewUrl = remoteView;
        }
      } catch (_) {}

      const res = await fetch(`${API_BASE_URL}/invoices/${id}/view`, {
        method: 'GET',
        headers,
      });

      if (!res.ok) {
        if (directViewUrl) {
          if (previewWindow) previewWindow.location.href = directViewUrl;
          else window.open(directViewUrl, '_blank');
          return true;
        }
        const text = await res.text();
        let errMsg = `Unable to view invoice online (${res.status})`;
        try {
          const json = JSON.parse(text);
          if (json?.message) errMsg = json.message;
        } catch (_) {}
        throw new Error(errMsg);
      }

      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const json = await res.json();
        const target = json?.body?.view_url || json?.view_url || json?.body?.url || json?.url;
        if (target && (target.startsWith('http://') || target.startsWith('https://'))) {
          if (previewWindow) previewWindow.location.href = target;
          else window.open(target, '_blank');
          return true;
        }
      }

      const html = await res.text();
      if (previewWindow && !previewWindow.closed) {
        previewWindow.document.open();
        previewWindow.document.write(html);
        previewWindow.document.close();
      } else {
        const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
        const blobUrl = URL.createObjectURL(blob);
        window.open(blobUrl, '_blank');
      }
      return true;
    } catch (err: any) {
      if (previewWindow && !previewWindow.closed) {
        previewWindow.close();
      }
      throw err;
    }
  },

  // 13. Robust PDF Download Helper handling Auth token headers, blobs, and html2pdf file downloads
  downloadPdf: async (
    id: string | number,
    invoiceNumber?: string,
    invoiceData?: any,
    businessData?: any,
    userData?: any
  ) => {
    const { getAuthToken } = await import('./client');
    const token = getAuthToken();
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

    // 1. Try GET /invoices/{id}/pdf for Cloud pdf_url
    try {
      const res: any = await apiClient(`/invoices/${id}/pdf`, { method: 'GET', silentError: true });
      const pdfUrl = res?.body?.pdf_url || res?.pdf_url;
      if (pdfUrl && (pdfUrl.startsWith('http://') || pdfUrl.startsWith('https://'))) {
        window.open(pdfUrl, '_blank');
        return true;
      }
    } catch (e) {
      console.warn('getInvoicePdf metadata endpoint check failed:', e);
    }

    // 2. Stream binary PDF file from GET /invoices/{id}/pdf/file with Authorization header
    try {
      const fileEndpoint = `${API_BASE_URL}/invoices/${id}/pdf/file`;
      const response = await fetch(fileEndpoint, {
        method: 'GET',
        headers: {
          'Accept': 'application/pdf, application/json, */*',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
      });

      if (response.ok) {
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/pdf')) {
          const blob = await response.blob();
          const blobUrl = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = blobUrl;
          link.download = `Invoice-${invoiceNumber || id}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
          return true;
        }
      }
    } catch (e) {
      console.warn('PDF stream fetch failed:', e);
    }

    // 3. Client-side HTML-to-PDF File Download using html2pdf.js
    try {
      let invToRender = invoiceData;
      if (!invToRender) {
        const detailRes: any = await apiClient(`/invoices/${id}`, { method: 'GET', silentError: true });
        invToRender = detailRes?.body?.invoice || detailRes?.body?.data || detailRes?.body;
      }

      if (invToRender) {
        const { buildInvoiceHtml, saveAsClientPdf } = await import('@/lib/pdf/invoicePdf');
        const htmlStr = buildInvoiceHtml({
          invoice: invToRender,
          activeBusiness: businessData,
          currentUser: userData,
        });

        if (htmlStr) {
          const fileName = `Invoice-${invoiceNumber || invToRender.invoice_number || id}.pdf`;
          const saved = await saveAsClientPdf(htmlStr, fileName);
          if (saved) return true;
        }
      }
    } catch (e) {
      console.warn('Client side PDF generation failed:', e);
    }

    return false;
  },
};

