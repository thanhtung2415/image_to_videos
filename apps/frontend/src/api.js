const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
export const API_BASE_URL = API_URL;

export function getToken() {
  return localStorage.getItem('image_to_videos_token');
}

export function getProjectEventsUrl(id) {
  const token = getToken();
  return `${API_URL}/projects/${id}/events?token=${encodeURIComponent(token || '')}`;
}

export function saveSession({ token, user }) {
  localStorage.setItem('image_to_videos_token', token);
  localStorage.setItem('image_to_videos_user', JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem('image_to_videos_token');
  localStorage.removeItem('image_to_videos_user');
}

export function getStoredUser() {
  const raw = localStorage.getItem('image_to_videos_user');
  return raw ? JSON.parse(raw) : null;
}

async function parseResponse(response) {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || 'Request failed');
  }

  return data;
}

export async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = {
    ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers
  };

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers
  });

  return parseResponse(response);
}

export function login(payload) {
  return apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export function register(payload) {
  return apiFetch('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export function getProjects() {
  return apiFetch('/projects');
}

export function getProviders() {
  return apiFetch('/providers');
}

export function getPricingPlans() {
  return apiFetch('/pricing/plans');
}

export function getNotifications() {
  return apiFetch('/notifications');
}

export function getCreditTransactions() {
  return apiFetch('/credits/transactions');
}

export function getCreditWallet() {
  return apiFetch('/credits/wallet');
}

export function getCurrentUser() {
  return apiFetch('/users/me');
}

export function getNotificationPreferences() {
  return apiFetch('/notifications/preferences/me');
}

export function updateNotificationPreferences(payload) {
  return apiFetch('/notifications/preferences/me', {
    method: 'PATCH',
    body: JSON.stringify(payload)
  });
}

export function getAdminOverview() {
  return apiFetch('/admin/overview');
}

export function getAdminAuditLogs() {
  return apiFetch('/admin/audit-logs');
}

export function getAdminProviderHealth() {
  return apiFetch('/admin/provider-health');
}

export function getAdminUsers(search = '') {
  if (typeof search === 'object') {
    const params = new URLSearchParams();

    Object.entries(search).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.set(key, value);
      }
    });

    return apiFetch(`/admin/users${params.toString() ? `?${params}` : ''}`);
  }

  const query = search ? `?search=${encodeURIComponent(search)}` : '';
  return apiFetch(`/admin/users${query}`);
}

export function getAdminUser(id) {
  return apiFetch(`/admin/users/${id}`);
}

export function updateAdminUser(id, payload) {
  return apiFetch(`/admin/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload)
  });
}

export function adjustAdminUserCredits(id, payload) {
  return apiFetch(`/admin/users/${id}/credits/adjust`, {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export function getAdminCostSummary() {
  return apiFetch('/admin/cost-summary');
}

export function getAdminReportSummary(days = 30) {
  return apiFetch(`/admin/reports/summary?days=${encodeURIComponent(days)}`);
}

export function getAdminReportOverview({ from = '', to = '' } = {}) {
  const query = new URLSearchParams();

  if (from) {
    query.set('from', from);
  }

  if (to) {
    query.set('to', to);
  }

  return apiFetch(`/admin/reports/overview${query.toString() ? `?${query}` : ''}`);
}

export function getAdminSettings() {
  return apiFetch('/admin/settings');
}

export function updateAdminSettings(payload) {
  return apiFetch('/admin/settings', {
    method: 'PATCH',
    body: JSON.stringify(payload)
  });
}

export function getAdminVideoCosts() {
  return apiFetch('/admin/video-costs');
}

export function updateAdminVideoCosts(payload) {
  return apiFetch('/admin/video-costs', {
    method: 'PATCH',
    body: JSON.stringify(payload)
  });
}

export function getAdminCoupons() {
  return apiFetch('/admin/coupons');
}

export function createAdminCoupon(payload) {
  return apiFetch('/admin/coupons', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export function getAdminPromotions() {
  return apiFetch('/admin/promotions');
}

export function getAdminPromotion(id) {
  return apiFetch(`/admin/promotions/${id}`);
}

export function getAdminPromotionRegistrations(id) {
  return apiFetch(`/admin/promotions/${id}/registrations`);
}

export function createAdminPromotion(payload) {
  return apiFetch('/admin/promotions', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export function updateAdminPromotion(id, payload) {
  return apiFetch(`/admin/promotions/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload)
  });
}

export function getAdminContentReports() {
  return apiFetch('/admin/content-reports');
}

export function updateAdminContentReport(id, payload) {
  return apiFetch(`/admin/content-reports/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload)
  });
}

export function getAdminVideos(status = '') {
  if (typeof status === 'object') {
    const params = new URLSearchParams();

    Object.entries(status).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.set(key, value);
      }
    });

    return apiFetch(`/admin/videos${params.toString() ? `?${params}` : ''}`);
  }

  const query = status ? `?status=${encodeURIComponent(status)}` : '';
  return apiFetch(`/admin/videos${query}`);
}

export function getAdminVideo(id) {
  return apiFetch(`/admin/videos/${id}`);
}

export function getAdminPricingPlans() {
  return apiFetch('/admin/credit-packages');
}

export function createAdminPricingPlan(payload) {
  return apiFetch('/admin/credit-packages', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export function updateAdminPricingPlan(id, payload) {
  return apiFetch(`/admin/credit-packages/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload)
  });
}

export function getAdminPayments(status = '') {
  const query = status ? `?status=${encodeURIComponent(status)}` : '';
  return apiFetch(`/admin/payments${query}`);
}

export function refundAdminPayment(id, payload) {
  return apiFetch(`/payments/${id}/refund`, {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export function createCheckout(payload) {
  return apiFetch('/payments/checkout', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export function getActivePromotions() {
  return apiFetch('/promotions/active');
}

export function registerPromotion(payload) {
  return apiFetch('/promotions/register', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export function getProject(id) {
  return apiFetch(`/projects/${id}`);
}

export function createProject(formData) {
  return apiFetch('/projects', {
    method: 'POST',
    body: formData
  });
}

export function cancelProject(id) {
  return apiFetch(`/projects/${id}/cancel`, {
    method: 'POST'
  });
}

export function reportProject(payload) {
  return apiFetch('/content/reports', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export function deleteAccount() {
  return apiFetch('/account', {
    method: 'DELETE'
  });
}

export function updateProfile(payload) {
  return apiFetch('/users/me', {
    method: 'PATCH',
    body: JSON.stringify(payload)
  });
}

export function changePassword(payload) {
  return apiFetch('/users/me/password', {
    method: 'PATCH',
    body: JSON.stringify(payload)
  });
}

export function getAccountExportUrl() {
  return `${API_URL}/account/export`;
}
