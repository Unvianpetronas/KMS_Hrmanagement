/**
 * API Service — gọi Spring Boot backend
 * Base URL: /api/v1 (proxy qua Vite dev server)
 * JWT token tự động gắn vào header Authorization
 */

const BASE = import.meta.env.VITE_API_URL || '/api/v1';
const REQUEST_TIMEOUT_MS = 15000;
const CHAT_TIMEOUT_MS = 120000;

function getToken() {
  return localStorage.getItem('kms_token');
}

function getHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

async function request(endpoint, options = {}, timeoutMs = REQUEST_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  let res;
  try {
    res = await fetch(`${BASE}${endpoint}`, {
      headers: getHeaders(),
      signal: controller.signal,
      ...options,
    });
  } catch (err) {
    if (err.name === 'AbortError') throw new Error('Request timed out');
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }

  if (res.status === 401) {
    localStorage.removeItem('kms_token');
    localStorage.removeItem('kms_user');
    window.dispatchEvent(new Event('auth:logout'));
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
    return request('/auth/logout', { method: 'POST' }).catch((err) => {
      console.warn('Logout request failed:', err.message);
    });
  },

  getMe() {
    return request('/auth/me');
  },

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

  getMyRating(id) {
    return request(`/items/${id}/my-rating`).catch(() => ({ stars: 0, hasRated: false }));
  },

  addComment(id, text) {
    return request(`/items/${id}/comments`, {
      method: 'POST',
      body: JSON.stringify({ userName: '', text }),
    });
  },

  publish(id) {
    return request(`/items/${id}/publish`, { method: 'PUT' });
  },

  archive(id) {
    return request(`/items/${id}/archive`, { method: 'PUT' });
  },

  accept(id) {
    return request(`/items/${id}/accept`, { method: 'PUT' });
  },

  recordView(id) {
    return request(`/items/${id}/view`, { method: 'POST' }).catch(() => {});
  },

  getStale(months = 12) {
    return request(`/items/stale?months=${months}`);
  },

  bulkArchive(ids) {
    return request('/items/bulk-archive', {
      method: 'PUT',
      body: JSON.stringify({ ids }),
    });
  },
};

// ============ TAGS ============
export const tagsAPI = {
  getAll() {
    return request('/tags');
  },

  create(data) {
    return request('/tags', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update(tagName, data) {
    return request(`/tags/${encodeURIComponent(tagName)}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete(tagName) {
    return request(`/tags/${encodeURIComponent(tagName)}`, { method: 'DELETE' });
  },
};

// ============ CHAT ============
export const chatAPI = {
  send(message, history) {
    return request('/chat', {
      method: 'POST',
      body: JSON.stringify({ message, conversationHistory: history }),
    }, CHAT_TIMEOUT_MS);
  },
};

// ============ STATS ============
export const statsAPI = {
  get() {
    return request('/stats');
  },
};
