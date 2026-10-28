/**
 * Authentication Controller
 * Handles user registration, login, JWT token issuance, and current session profile retrieval.
 */
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config/config');
const dbService = require('../services/dbService');

function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role
    },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );
}

const authController = {
  /**
   * User Registration
   * POST /api/auth/register
   */
  async register(req, res, next) {
    try {
      const { email, password, full_name, role = 'student' } = req.body;

      // Check if user already exists
      const existing = await dbService.findUserByEmail(email);
      if (existing) {
        return res.status(409).json({
          success: false,
          message: 'An account with this email address already exists.'
        });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash(password, salt);

      // Create user record
      const newUser = await dbService.createUser({
        email,
        password_hash,
        full_name,
        role
      });

      // Generate JWT
      const token = generateToken(newUser);

      res.status(201).json({
        success: true,
        message: 'Account registered successfully.',
        data: {
          user: {
            id: newUser.id,
            email: newUser.email,
            full_name: newUser.full_name,
            role: newUser.role
          },
          token
        }
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * User Login
   * POST /api/auth/login
   */
  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      // Find user
      const user = await dbService.findUserByEmail(email);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password.'
        });
      }

      // Check active state
      if (user.is_active === false) {
        return res.status(403).json({
          success: false,
          message: 'This account has been deactivated. Please contact an administrator.'
        });
      }

      // Verify password
      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password.'
        });
      }

      // Generate JWT
      const token = generateToken(user);

      res.status(200).json({
        success: true,
        message: 'Login successful.',
        data: {
          user: {
            id: user.id,
            email: user.email,
            full_name: user.full_name,
            role: user.role
          },
          token
        }
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Get Current Authenticated Profile
   * GET /api/auth/me
   */
  async getProfile(req, res, next) {
    try {
      const user = await dbService.findUserById(req.user.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User profile not found.'
        });
      }

      res.status(200).json({
        success: true,
        data: {
          user
        }
      });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = authController;
