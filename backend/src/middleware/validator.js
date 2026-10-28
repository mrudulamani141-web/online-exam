/**
 * Request Validation Middleware & Sanitization Helpers
 */

function validateRegister(req, res, next) {
  const { email, password, full_name, role } = req.body;

  if (!email || !password || !full_name) {
    return res.status(400).json({
      success: false,
      message: 'Email, password, and full name are required.'
    });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a valid email address.'
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 6 characters long.'
    });
  }

  if (role && !['admin', 'teacher', 'student'].includes(role)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid role specified. Role must be admin, teacher, or student.'
    });
  }

  next();
}

function validateLogin(req, res, next) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Both email and password are required.'
    });
  }
  next();
}

function validateExam(req, res, next) {
  const { title, subject, duration_minutes, total_marks, passing_marks } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ success: false, message: 'Exam title is required.' });
  }

  if (!subject || !subject.trim()) {
    return res.status(400).json({ success: false, message: 'Subject is required.' });
  }

  if (duration_minutes !== undefined && (isNaN(duration_minutes) || Number(duration_minutes) <= 0)) {
    return res.status(400).json({ success: false, message: 'Duration must be a positive number in minutes.' });
  }

  if (passing_marks !== undefined && total_marks !== undefined) {
    if (Number(passing_marks) > Number(total_marks)) {
      return res.status(400).json({
        success: false,
        message: 'Passing marks cannot exceed total marks.'
      });
    }
  }

  next();
}

function validateQuestion(req, res, next) {
  const { question_text, question_type, points, correct_answer, options } = req.body;

  if (!question_text || !question_text.trim()) {
    return res.status(400).json({ success: false, message: 'Question text is required.' });
  }

  if (!['multiple_choice', 'true_false', 'short_answer'].includes(question_type)) {
    return res.status(400).json({
      success: false,
      message: 'Question type must be multiple_choice, true_false, or short_answer.'
    });
  }

  if (question_type === 'multiple_choice') {
    if (!Array.isArray(options) || options.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Multiple choice questions must have at least 2 options.'
      });
    }
  }

  if (correct_answer === undefined || correct_answer === null || String(correct_answer).trim() === '') {
    return res.status(400).json({
      success: false,
      message: 'A correct answer must be provided for grading.'
    });
  }

  if (points !== undefined && (isNaN(points) || Number(points) <= 0)) {
    return res.status(400).json({ success: false, message: 'Points must be a positive integer.' });
  }

  next();
}

module.exports = {
  validateRegister,
  validateLogin,
  validateExam,
  validateQuestion
};
