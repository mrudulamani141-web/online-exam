/**
 * Authentication Routes
 */
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');
const { validateRegister, validateLogin } = require('../middleware/validator');

router.post('/register', validateRegister, authController.register);
router.post('/login', validateLogin, authController.login);
router.get('/me', authenticateToken, authController.getProfile);

module.exports = router;
