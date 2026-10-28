/**
 * Authentication & Session Management
 */

function getCurrentUser() {
  try {
    const raw = localStorage.getItem('exam_auth_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function getToken() {
  return localStorage.getItem('exam_auth_token');
}

function saveAuthSession(user, token) {
  localStorage.setItem('exam_auth_user', JSON.stringify(user));
  localStorage.setItem('exam_auth_token', token);
}

function clearAuthSession() {
  localStorage.removeItem('exam_auth_user');
  localStorage.removeItem('exam_auth_token');
  localStorage.removeItem('active_exam_answers');
}

/**
 * Page Guard: Ensures user is authenticated and has required role
 * @param {Array<string>} allowedRoles - Optional array of roles permitted
 */
function checkAuth(allowedRoles = []) {
  const user = getCurrentUser();
  const token = getToken();

  if (!user || !token) {
    window.location.href = 'login.html';
    return null;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    alert(`Access denied. This page is restricted to [${allowedRoles.join(', ')}].`);
    window.location.href = 'dashboard.html';
    return null;
  }

  return user;
}

/**
 * Setup navigation header based on current user state
 */
function initNavbar() {
  const navContainer = document.querySelector('.nav-container');
  if (!navContainer) return;

  const user = getCurrentUser();
  const rightSection = document.getElementById('nav-user-section');
  if (!rightSection) return;

  if (user) {
    rightSection.innerHTML = `
      <div class="user-menu">
        <span class="user-badge">
          <span>👤 ${escapeHtml(user.full_name)}</span>
          <span class="role-tag ${user.role}">${user.role}</span>
        </span>
        <a href="dashboard.html" class="btn btn-secondary btn-sm">Dashboard</a>
        <button onclick="handleLogout()" class="btn btn-secondary btn-sm" title="Log Out">Log Out</button>
      </div>
    `;
  } else {
    rightSection.innerHTML = `
      <a href="login.html" class="btn btn-secondary btn-sm">Log In</a>
      <a href="login.html?tab=register" class="btn btn-primary btn-sm">Register</a>
    `;
  }
}

function handleLogout() {
  clearAuthSession();
  showToast('Logged out successfully.', 'info');
  setTimeout(() => {
    window.location.href = 'login.html';
  }, 300);
}

// Auto-run navbar setup on page load
document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
});
