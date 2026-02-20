/**
 * API Service — gọi Spring Boot backend
 * Base URL: /api/v1 (proxy qua Vite dev server)
 * JWT token tự động gắn vào header Authorization
 */

const BASE = '/api/v1';

function getToken() {
  return localStorage.getItem('kms_token');
}

function getHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

async function request(endpoint, options = {}) {
  const res = await fetch(`${BASE}${endpoint}`, {
    headers: getHeaders(),
    ...options,
  });

  if (res.status === 401) {
    localStorage.removeItem('kms_token');
    localStorage.removeItem('kms_user');
    window.location.reload();
    throw new Error('Phiên đăng nhập hết hạn');
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(err.message || `HTTP ${res.status}`);
  }

  if (res.status === 204) return null;
  return res.json();
}

// ============ AUTH ============
export const authAPI = {
  login(username, password) {
    return request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  },

  logout() {
    return request('/auth/logout', { method: 'POST' }).catch(() => {});
  },

  getMe() {
    return request('/auth/me');
  },

  // Admin: user management
  getUsers() {
    return request('/auth/users');
  },

  createUser(data) {
    return request('/auth/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateUser(id, data) {
    return request(`/auth/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deleteUser(id) {
    return request(`/auth/users/${id}`, { method: 'DELETE' });
  },

  // Admin: change password (không cần pass cũ)
  changePassword(userId, newPassword) {
    return request('/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify({ userId, newPassword }),
    });
  },
};

// ============ KNOWLEDGE ITEMS ============
export const itemsAPI = {
  getAll(sort = 'updated') {
    return request(`/items?sort=${sort}`);
  },

  getById(id) {
    return request(`/items/${id}`);
  },

  create(data) {
    return request('/items', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update(id, data) {
    return request(`/items/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete(id) {
    return request(`/items/${id}`, { method: 'DELETE' });
  },

  search({ query, type, tags, sort }) {
    const params = new URLSearchParams();
    if (query) params.append('q', query);
    if (type && type !== 'All') params.append('type', type);
    if (tags?.length) tags.forEach((t) => params.append('tags', t));
    if (sort) params.append('sort', sort);
    return request(`/items/search?${params}`);
  },

  rate(id, stars) {
    return request(`/items/${id}/rate`, {
      method: 'POST',
      body: JSON.stringify({ stars }),
    });
  },

  addComment(id, text) {
    return request(`/items/${id}/comments`, {
      method: 'POST',
      body: JSON.stringify({ userName: '', text }), // backend overrides userName from JWT
    });
  },

  publish(id) {
    return request(`/items/${id}/publish`, { method: 'PUT' });
  },

  archive(id) {
    return request(`/items/${id}/archive`, { method: 'PUT' });
  },
};

// ============ STATS ============
export const statsAPI = {
  get() {
    return request('/stats');
  },
};
