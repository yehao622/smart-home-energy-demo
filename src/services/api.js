import { getToken } from './auth';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'https://smart-home-backend-latest.onrender.com';

async function apiFetch(url, options = {}) {
  const token = getToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${url}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed with status ${response.status}`);
  }

  return response.json();
}

export async function login(username, password) {
  return apiFetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}

export async function fetchDevices() {
  return apiFetch('/api/devices');
}

export async function fetchEnergyStats() {
  return apiFetch('/api/energy/stats');
}
