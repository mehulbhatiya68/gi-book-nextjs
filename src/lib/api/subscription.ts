import { apiClient } from './client';

export const subscriptionApi = {
  // 1. List Plans: GET /subscription/plans
  getPlans: async (options: Record<string, any> = {}) => {
    return apiClient('/subscription/plans', {
      method: 'GET',
      ...options,
    });
  },

  // 2. Activate Plan: POST /subscription/store
  activatePlan: async (planId: string, options: Record<string, any> = {}) => {
    return apiClient('/subscription/store', {
      method: 'POST',
      body: { plan_id: planId },
      ...options,
    });
  },

  // 3. List Subscriptions: POST /subscription
  getSubscriptions: async (page = 1, perPage = '10', options: Record<string, any> = {}) => {
    return apiClient('/subscription', {
      method: 'POST',
      body: { page, per_page: perPage },
      ...options,
    });
  },

  // 4. Feature Usage: GET /subscription/usage
  getUsage: async (options: Record<string, any> = {}) => {
    return apiClient('/subscription/usage', {
      method: 'GET',
      ...options,
    });
  },

  // 5. Payment Status: GET /payment/status
  getPaymentStatus: async (options: Record<string, any> = {}) => {
    return apiClient('/payment/status', {
      method: 'GET',
      ...options,
    });
  },

  // 6. Checkout Subscription (Testing): POST /payment/subscription/checkout
  checkoutSubscription: async (planId: string, durationType: 'monthly' | 'yearly', options: Record<string, any> = {}) => {
    return apiClient('/payment/subscription/checkout', {
      method: 'POST',
      body: { plan_id: planId, duration_type: durationType },
      ...options,
    });
  },
};
