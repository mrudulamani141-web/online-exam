/**
 * Exam Routes
 */
const express = require('express');
const router = express.Router();
const examController = require('../controllers/examController');
const questionController = require('../controllers/questionController');
const attemptController = require('../controllers/attemptController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { validateExam, validateQuestion } = require('../middleware/validator');

// Exam CRUD
router.get('/', authenticateToken, examController.getExams);
router.get('/:id', authenticateToken, examController.getExamById);
router.post('/', authenticateToken, authorizeRoles('admin', 'teacher'), validateExam, examController.createExam);
router.put('/:id', authenticateToken, authorizeRoles('admin', 'teacher'), validateExam, examController.updateExam);
router.delete('/:id', authenticateToken, authorizeRoles('admin', 'teacher'), examController.deleteExam);
router.patch('/:id/publish', authenticateToken, authorizeRoles('admin', 'teacher'), examController.togglePublish);

// Exam Questions Sub-routes
router.get('/:examId/questions', authenticateToken, questionController.getQuestions);
router.post('/:examId/questions', authenticateToken, authorizeRoles('admin', 'teacher'), validateQuestion, questionController.createQuestion);

// Exam Results Sub-route (for instructor/admin review)
router.get('/:examId/results', authenticateToken, authorizeRoles('admin', 'teacher'), attemptController.getExamResults);

module.exports = router;
