/**
 * User & Analytics Routes
 */
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

router.get('/', authenticateToken, authorizeRoles('admin'), userController.getAllUsers);
router.delete('/:id', authenticateToken, authorizeRoles('admin'), userController.deleteUser);
router.get('/stats', authenticateToken, authorizeRoles('admin', 'teacher'), userController.getStats);

module.exports = router;
