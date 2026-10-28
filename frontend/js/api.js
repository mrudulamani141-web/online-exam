/**
 * Centralized API Client
 * Wraps Fetch API, manages JWT Authorization headers, and error handling.
 */

// Dynamically determine backend base URL
const API_BASE_URL = window.location.origin.includes(':5000')
  ? `${window.location.origin}/api`
  : 'http://localhost:5000/api';

/**
 * Universal API Request Helper
 * @param {string} endpoint - Path e.g. '/auth/login'
 * @param {object} options - Fetch options (method, headers, body)
 */
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  // Attach JWT Bearer token if logged in
  const token = localStorage.getItem('exam_auth_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const fetchOptions = {
    ...options,
    headers
  };

  try {
    const response = await fetch(url, fetchOptions);
    const data = await response.json().catch(() => ({}));

    // Handle 401 Session Expiry
    if (response.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/register')) {
      localStorage.removeItem('exam_auth_token');
      localStorage.removeItem('exam_auth_user');
      if (!window.location.pathname.includes('login.html')) {
        alert('Your session has expired. Please log in again.');
        window.location.href = 'login.html';
      }
      throw new Error(data.message || 'Session expired.');
    }

    if (!response.ok) {
      const errorMsg = data.message || `Request failed with status ${response.status}`;
      const error = new Error(errorMsg);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (err) {
    console.error(`[API Error] ${endpoint}:`, err);
    throw err;
  }
}
