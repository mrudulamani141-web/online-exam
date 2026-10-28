/**
 * Question Direct Routes
 */
const express = require('express');
const router = express.Router();
const questionController = require('../controllers/questionController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { validateQuestion } = require('../middleware/validator');

router.put('/:id', authenticateToken, authorizeRoles('admin', 'teacher'), validateQuestion, questionController.updateQuestion);
router.delete('/:id', authenticateToken, authorizeRoles('admin', 'teacher'), questionController.deleteQuestion);

module.exports = router;
