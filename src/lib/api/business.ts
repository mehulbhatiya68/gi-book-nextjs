import { apiClient } from './client';

export const businessApi = {
  // 1. List Business Profiles: POST /business (getBusinesses)
  getBusinesses: (payload: any = {}) => {
    const { silentError, ...restPayload } = typeof payload === 'object' && payload !== null ? payload : {};
    return apiClient('business', {
      method: 'POST',
      body: {
        page: restPayload.page || 1,
        per_page: restPayload.per_page || 'all',
        sort_by: restPayload.sort_by || 'created_at',
        sort_dir: restPayload.sort_dir || 'desc',
        search: restPayload.search || '',
      },
      ...(silentError !== undefined ? { silentError } : {}),
    });
  },

  // 2. Create Business Profile: POST /business/store (storeBusinessProfile)
  createBusiness: (data: any) => {
    const rawLogo = data?.business_logo || data?.logo;
    const safeLogo = typeof rawLogo === 'string' && rawLogo.trim().length > 0 ? rawLogo.trim() : null;
    const rawPhoneDigits = String(data.contact_phone || data.phone || '').replace(/\D/g, '');
    const phoneInt = rawPhoneDigits ? parseInt(rawPhoneDigits, 10) : 0;
    const countryCodeInt = data.country_code ? parseInt(String(data.country_code).replace(/\D/g, ''), 10) : 91;

    return apiClient('business/store', {
      method: 'POST',
      body: {
        business_name: String(data.business_name || data.name || '').trim().slice(0, 255),
        business_logo: safeLogo,
        business_type: data.business_type || data.type ? String(data.business_type || data.type).trim().slice(0, 255) : null,
        address: String(data.address || data.address_line1 || '').trim().slice(0, 1000),
        gst_number: data.gst_number || data.gstNumber ? String(data.gst_number || data.gstNumber).trim().slice(0, 50) : null,
        pan_number: data.pan_number || data.panNumber ? String(data.pan_number || data.panNumber).trim().slice(0, 50) : null,
        cin: data.cin ? String(data.cin).trim().slice(0, 50) : null,
        tin: data.tin ? String(data.tin).trim().slice(0, 50) : null,
        contact_email: String(data.contact_email || data.email || '').trim().slice(0, 255),
        contact_phone: phoneInt,
        country_code: countryCodeInt,
      },
    });
  },

  // 3. Get Business Details: GET /business/{id}
  getBusiness: (id: string, options: any = {}) =>
    apiClient(`business/${id}`, options),

  // 4. Update Business Details: POST /business/{id} (updateBusinessProfile)
  updateBusiness: (id: string, data: any) => {
    const rawLogo = data?.business_logo || data?.logo;
    const safeLogo = typeof rawLogo === 'string' && rawLogo.trim().length > 0 ? rawLogo.trim() : null;
    const rawPhoneDigits = String(data.contact_phone || data.phone || '').replace(/\D/g, '');
    const phoneInt = rawPhoneDigits ? parseInt(rawPhoneDigits, 10) : 0;
    const countryCodeInt = data.country_code ? parseInt(String(data.country_code).replace(/\D/g, ''), 10) : 91;

    return apiClient(`business/${id}`, {
      method: 'POST',
      body: {
        business_name: String(data.business_name || data.name || '').trim().slice(0, 255),
        business_logo: safeLogo,
        business_type: data.business_type || data.type ? String(data.business_type || data.type).trim().slice(0, 255) : null,
        address: String(data.address || data.address_line1 || '').trim().slice(0, 1000),
        gst_number: data.gst_number || data.gstNumber ? String(data.gst_number || data.gstNumber).trim().slice(0, 50) : null,
        pan_number: data.pan_number || data.panNumber ? String(data.pan_number || data.panNumber).trim().slice(0, 50) : null,
        cin: data.cin ? String(data.cin).trim().slice(0, 50) : null,
        tin: data.tin ? String(data.tin).trim().slice(0, 50) : null,
        contact_email: String(data.contact_email || data.email || '').trim().slice(0, 255),
        contact_phone: phoneInt,
        country_code: countryCodeInt,
      },
    });
  },

  // 5. Delete Business Profile: DELETE /business/{id} (deleteBusinessProfile)
  deleteBusiness: (id: string, password?: string) =>
    apiClient(`business/${id}`, {
      method: 'DELETE',
      body: { password: password || '' },
    }),

  // 6. Select Business Profile: POST /business/select/{id} (selectBusiness)
  selectBusiness: (id: string) =>
    apiClient(`business/select/${id}`, { method: 'POST' }),
};
