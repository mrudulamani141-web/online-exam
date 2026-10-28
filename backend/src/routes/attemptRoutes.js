/**
 * Exam Attempts and Results Routes
 */
const express = require('express');
const router = express.Router();
const attemptController = require('../controllers/attemptController');
const { authenticateToken } = require('../middleware/auth');

router.post('/start', authenticateToken, attemptController.startAttempt);
router.post('/:id/submit', authenticateToken, attemptController.submitAttempt);
router.get('/my-attempts', authenticateToken, attemptController.getMyAttempts);
router.get('/:id', authenticateToken, attemptController.getAttemptById);

module.exports = router;
