/**
 * Authentication and Role Authorization Middleware
 */
const jwt = require('jsonwebtoken');
const config = require('../config/config');

/**
 * Verifies JWT Bearer token from the Authorization header
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No authorization header provided.'
    });
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({
      success: false,
      message: 'Invalid authorization format. Format must be "Bearer <token>".'
    });
  }

  const token = parts[1];
  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = decoded; // { id, email, full_name, role }
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired session token. Please log in again.'
    });
  }
}

/**
 * Restricts route access to specific roles ('admin', 'teacher', 'student')
 */
function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Access restricted to [${allowedRoles.join(', ')}]. Your current role is "${req.user.role}".`
      });
    }

    next();
  };
}

module.exports = {
  authenticateToken,
  authorizeRoles
};
