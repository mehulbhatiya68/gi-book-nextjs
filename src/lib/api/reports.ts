import { apiClient, getAuthToken } from './client';

const getApiBaseUrl = () => {
  return process.env.NEXT_PUBLIC_API_BASE_URL || '';
};

// Convert query parameters object to search string
const buildQueryString = (query: Record<string, any> = {}) => {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([k, v]) => {
    if (v !== undefined && v !== null && String(v).trim() !== '') {
      params.append(k, String(v));
    }
  });
  const str = params.toString();
  return str ? `?${str}` : '';
};

export const reportsApi = {
  // 1. Generic Report POST: POST /reports/$type
  reportPost: async (type: string, payload: Record<string, any> = {}) => {
    return apiClient(`/reports/${type}`, {
      method: 'POST',
      body: payload,
      silentError: true,
    });
  },

  // 2. GET /reports/$type/view URI builder
  reportView: (type: string, query: Record<string, any> = {}) => {
    const qs = buildQueryString(query);
    return `${getApiBaseUrl()}/reports/${type}/view${qs}`;
  },

  // 3. GET /reports/$type/pdf URI builder
  reportPdf: (type: string, query: Record<string, any> = {}) => {
    const qs = buildQueryString(query);
    return `${getApiBaseUrl()}/reports/${type}/pdf${qs}`;
  },

  // 4. GET /reports/$type/excel URI builder
  reportExcel: (type: string, query: Record<string, any> = {}) => {
    const qs = buildQueryString(query);
    return `${getApiBaseUrl()}/reports/${type}/excel${qs}`;
  },

  // 5. GET /reports/$type/csv URI builder
  reportCsv: (type: string, query: Record<string, any> = {}) => {
    const qs = buildQueryString(query);
    return `${getApiBaseUrl()}/reports/${type}/csv${qs}`;
  },

  // Backwards compatibility aliases
  getReportViewUrl: (type: string, params: string = '') => {
    const baseUrl = getApiBaseUrl();
    return `${baseUrl}/reports/${type}/view${params ? (params.startsWith('?') ? params : '?' + params) : ''}`;
  },
  getReportPdfUrl: (type: string, params: string = '') => {
    const baseUrl = getApiBaseUrl();
    return `${baseUrl}/reports/${type}/pdf${params ? (params.startsWith('?') ? params : '?' + params) : ''}`;
  },
  getReportExcelUrl: (type: string, params: string = '') => {
    const baseUrl = getApiBaseUrl();
    return `${baseUrl}/reports/${type}/excel${params ? (params.startsWith('?') ? params : '?' + params) : ''}`;
  },
  getReportCsvUrl: (type: string, params: string = '') => {
    const baseUrl = getApiBaseUrl();
    return `${baseUrl}/reports/${type}/csv${params ? (params.startsWith('?') ? params : '?' + params) : ''}`;
  },

  // Specific report POST methods
  getSalesOverview: (filters: Record<string, any> = {}) => reportsApi.reportPost('sales-overview', filters),
  getPurchaseExpense: (filters: Record<string, any> = {}) => reportsApi.reportPost('purchase-expense', filters),
  getInvoiceSummary: (filters: Record<string, any> = {}) => reportsApi.reportPost('invoice-summary', filters),
  getPaymentActivity: (filters: Record<string, any> = {}) => reportsApi.reportPost('payment-activity', filters),
  getLedgerStatement: (filters: Record<string, any> = {}) => reportsApi.reportPost('ledger-statement', filters),
  getProfitLoss: (filters: Record<string, any> = {}) => reportsApi.reportPost('profit-loss', filters),
  getInventoryStatus: (filters: Record<string, any> = {}) => reportsApi.reportPost('inventory-status', filters),
  getStockMovement: (filters: Record<string, any> = {}) => reportsApi.reportPost('stock-movement', filters),
  getCustomerInsights: (filters: Record<string, any> = {}) => reportsApi.reportPost('customer-insights', filters),

  // API File Download Actions
  downloadReportPdf: async (type: string, query: Record<string, any> = {}, customFilename?: string) => {
    const url = reportsApi.reportPdf(type, query);
    const token = getAuthToken();
    const headers: Record<string, string> = {
      'Accept': 'application/pdf, application/octet-stream, */*',
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(url, { headers });
    if (!res.ok) {
      throw new Error(`Failed to download report PDF (HTTP ${res.status})`);
    }
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = customFilename || `${type}_report_${new Date().toISOString().split('T')[0]}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);
  },

  downloadReportExcel: async (type: string, query: Record<string, any> = {}, customFilename?: string) => {
    const url = reportsApi.reportExcel(type, query);
    const token = getAuthToken();
    const headers: Record<string, string> = {
      'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel, application/octet-stream, */*',
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(url, { headers });
    if (!res.ok) {
      throw new Error(`Failed to download report Excel (HTTP ${res.status})`);
    }
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = customFilename || `${type}_report_${new Date().toISOString().split('T')[0]}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);
  },

  downloadReportCsv: async (type: string, query: Record<string, any> = {}, customFilename?: string) => {
    const url = reportsApi.reportCsv(type, query);
    const token = getAuthToken();
    const headers: Record<string, string> = {
      'Accept': 'text/csv, application/csv, application/octet-stream, */*',
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(url, { headers });
    if (!res.ok) {
      throw new Error(`Failed to download report CSV (HTTP ${res.status})`);
    }
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = customFilename || `${type}_report_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);
  },

  openServerView: async (type: string, query: Record<string, any> = {}) => {
    const url = reportsApi.reportView(type, query);
    const token = getAuthToken();
    const headers: Record<string, string> = {
      'Accept': 'text/html, application/xhtml+xml, */*',
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(url, { headers });
    if (!res.ok) {
      throw new Error(`Failed to fetch report HTML view (HTTP ${res.status})`);
    }
    const html = await res.text();
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
    }
  },
};

