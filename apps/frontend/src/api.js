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

export function getAdminOverview() {
  return apiFetch('/admin/overview');
}

export function getAdminProviderHealth() {
  return apiFetch('/admin/provider-health');
}

export function getAdminCostSummary() {
  return apiFetch('/admin/cost-summary');
}

export function createCheckout(payload) {
  return apiFetch('/payments/checkout', {
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

export function getAccountExportUrl() {
  return `${API_URL}/account/export`;
}
