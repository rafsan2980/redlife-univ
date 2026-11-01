import { User, BloodRequest, DonorStats, BloodGroup } from '../types';

let AUTH_TOKEN = localStorage.getItem('blood_net_token') || '';

export function getAuthToken(): string {
  return AUTH_TOKEN;
}

export function setAuthToken(token: string) {
  AUTH_TOKEN = token;
  if (token) {
    localStorage.setItem('blood_net_token', token);
  } else {
    localStorage.removeItem('blood_net_token');
  }
}

// Free-hosting note: when the frontend is on Vercel and the backend on
// Render, set VITE_API_URL to the Render URL (e.g. https://...onrender.com).
// When both run on the same host (Render alone), leave it empty.
const API_BASE = (import.meta as any).env?.VITE_API_URL || '';

// Low-overhead standard fetch caller with headers
async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(AUTH_TOKEN ? { 'Authorization': `Bearer ${AUTH_TOKEN}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Network request failed');
  }
  return data;
}

export const api = {
  // Authentication
  async register(details: Partial<User> & { password?: string }): Promise<{ token: string; user: User }> {
    return fetchAPI('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(details),
    });
  },

  async login(identifier: string, passwordHash: string): Promise<{ token: string; user: User }> {
    return fetchAPI('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password: passwordHash }),
    });
  },

  async getMe(): Promise<{ user: User }> {
    return fetchAPI('/api/auth/me');
  },

  async updateMe(details: Partial<User>): Promise<{ user: User }> {
    return fetchAPI('/api/auth/me', {
      method: 'PUT',
      body: JSON.stringify(details),
    });
  },

  // Donors
  async getDonors(filters: { bloodGroup?: string; location?: string; availableOnly?: boolean }): Promise<User[]> {
    const params = new URLSearchParams();
    if (filters.bloodGroup) params.append('bloodGroup', filters.bloodGroup);
    if (filters.location) params.append('location', filters.location);
    if (filters.availableOnly) params.append('availableOnly', 'true');

    return fetchAPI(`/api/donors?${params.toString()}`);
  },

  // Statistics
  async getStats(): Promise<DonorStats> {
    return fetchAPI('/api/stats');
  },

  // Emergency Requests
  async getRequests(): Promise<BloodRequest[]> {
    return fetchAPI('/api/requests');
  },

  async createRequest(request: Partial<BloodRequest>): Promise<BloodRequest> {
    return fetchAPI('/api/requests', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  },

  async updateRequestStatus(id: string, status: 'pending' | 'fulfilled' | 'cancelled'): Promise<BloodRequest> {
    return fetchAPI(`/api/requests/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },

  async deleteRequest(id: string): Promise<{ message: string }> {
    return fetchAPI(`/api/requests/${id}`, {
      method: 'DELETE',
    });
  },

  // Admin section
  async adminGetUsers(): Promise<User[]> {
    return fetchAPI('/api/admin/users');
  },

  async adminToggleVerify(id: string): Promise<User> {
    return fetchAPI(`/api/admin/users/${id}/verify`, {
      method: 'PUT',
    });
  },

  async adminToggleSuspend(id: string): Promise<User> {
    return fetchAPI(`/api/admin/users/${id}/suspend`, {
      method: 'PUT',
    });
  },

  async adminUpdateDonor(id: string, details: Partial<User>): Promise<User> {
    return fetchAPI(`/api/admin/users/${id}/details`, {
      method: 'PUT',
      body: JSON.stringify(details),
    });
  },

  async adminUpdateRole(id: string, role: 'donor' | 'admin'): Promise<User> {
    return fetchAPI(`/api/admin/users/${id}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    });
  },

  async adminDeleteUser(id: string): Promise<{ message: string }> {
    return fetchAPI(`/api/admin/users/${id}`, {
      method: 'DELETE',
    });
  },

  async adminUpdateRequest(id: string, details: Partial<BloodRequest>): Promise<BloodRequest> {
    return fetchAPI(`/api/admin/requests/${id}`, {
      method: 'PUT',
      body: JSON.stringify(details),
    });
  },

  async adminGetActivities(): Promise<any[]> {
    return fetchAPI('/api/admin/activities');
  },

  // Donors/Users Notifications Section
  async getNotifications(): Promise<any[]> {
    return fetchAPI('/api/notifications');
  },

  async markNotificationRead(id: string): Promise<any> {
    return fetchAPI(`/api/notifications/${id}/read`, {
      method: 'PUT',
    });
  }
};
