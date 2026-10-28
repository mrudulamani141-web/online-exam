/**
 * Attempt and Results Controller
 * Manages active exam sessions, auto-grading submission handling,
 * and result analytics for students and instructors.
 */
const dbService = require('../services/dbService');
const gradingService = require('../services/gradingService');

const attemptController = {
  /**
   * Start a new exam attempt
   * POST /api/attempts/start
   */
  async startAttempt(req, res, next) {
    try {
      const { exam_id } = req.body;
      const student_id = req.user.id;

      if (!exam_id) {
        return res.status(400).json({
          success: false,
          message: 'exam_id is required.'
        });
      }

      // Fetch exam
      const exam = await dbService.getExamById(exam_id);
      if (!exam) {
        return res.status(404).json({
          success: false,
          message: 'Exam not found.'
        });
      }

      if (!exam.is_published && req.user.role === 'student') {
        return res.status(403).json({
          success: false,
          message: 'Cannot start attempt: This exam is not currently published.'
        });
      }

      // Check if student has already completed this exam
      const previousAttempts = await dbService.getAttemptsByStudent(student_id);
      const activeAttempt = previousAttempts.find(
        a => a.exam_id === exam_id && a.status === 'in_progress'
      );

      let attemptRecord;
      if (activeAttempt) {
        // Resume existing active attempt
        attemptRecord = activeAttempt;
      } else {
        // Create new attempt
        attemptRecord = await dbService.createAttempt({
          exam_id,
          student_id
        });
      }

      // Fetch questions without answer keys for the student
      const questions = await dbService.getQuestionsByExamId(exam_id, false);

      res.status(200).json({
        success: true,
        message: 'Exam session started.',
        data: {
          attempt: attemptRecord,
          exam: {
            id: exam.id,
            title: exam.title,
            description: exam.description,
            subject: exam.subject,
            duration_minutes: exam.duration_minutes,
            total_marks: exam.total_marks,
            passing_marks: exam.passing_marks
          },
          questions
        }
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Submit exam answers and compute score
   * POST /api/attempts/:id/submit
   */
  async submitAttempt(req, res, next) {
    try {
      const { id } = req.params;
      const { answers = {}, is_timed_out = false } = req.body;

      const attempt = await dbService.getAttemptById(id);
      if (!attempt) {
        return res.status(404).json({
          success: false,
          message: 'Attempt session not found.'
        });
      }

      // Security check: Only the student who started the attempt can submit it
      if (req.user.role !== 'admin' && attempt.student_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: You cannot submit an exam on behalf of another user.'
        });
      }

      if (attempt.status === 'completed' || attempt.status === 'timed_out') {
        return res.status(400).json({
          success: false,
          message: 'This exam attempt has already been submitted and finalized.',
          data: attempt
        });
      }

      // Fetch exam questions WITH correct answers for grading
      const questions = await dbService.getQuestionsByExamId(attempt.exam_id, true);
      const exam = await dbService.getExamById(attempt.exam_id);
      const passingMarks = exam ? exam.passing_marks : 40;

      // Grade submission
      const gradeResult = gradingService.gradeSubmission(questions, answers, passingMarks);

      // Update attempt in database
      const updatedAttempt = await dbService.updateAttempt(id, {
        submitted_at: new Date().toISOString(),
        status: is_timed_out ? 'timed_out' : 'completed',
        total_score: gradeResult.totalScore,
        max_score: gradeResult.maxScore,
        percentage: gradeResult.percentage,
        is_passed: gradeResult.isPassed,
        answers,
        feedback: gradeResult.feedback
      });

      res.status(200).json({
        success: true,
        message: 'Exam submitted successfully.',
        data: {
          attempt: updatedAttempt,
          resultSummary: {
            total_score: gradeResult.totalScore,
            max_score: gradeResult.maxScore,
            percentage: gradeResult.percentage,
            is_passed: gradeResult.isPassed,
            feedback: gradeResult.feedback
          }
        }
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Get logged-in student's attempts history
   * GET /api/attempts/my-attempts
   */
  async getMyAttempts(req, res, next) {
    try {
      const attempts = await dbService.getAttemptsByStudent(req.user.id);
      res.status(200).json({
        success: true,
        count: attempts.length,
        data: attempts
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Get specific attempt details by ID
   * GET /api/attempts/:id
   */
  async getAttemptById(req, res, next) {
    try {
      const { id } = req.params;
      const attempt = await dbService.getAttemptById(id);

      if (!attempt) {
        return res.status(404).json({
          success: false,
          message: 'Attempt record not found.'
        });
      }

      // Verify permission: Student can only view their own; Teacher or Admin can view any
      const isOwner = attempt.student_id === req.user.id;
      const isPrivileged = req.user.role === 'admin' || req.user.role === 'teacher';

      if (!isOwner && !isPrivileged) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: You do not have permission to view this attempt.'
        });
      }

      res.status(200).json({
        success: true,
        data: attempt
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Get all student attempts for a specific exam (Teachers / Admins)
   * GET /api/exams/:examId/results
   */
  async getExamResults(req, res, next) {
    try {
      const { examId } = req.params;
      const exam = await dbService.getExamById(examId);

      if (!exam) {
        return res.status(404).json({
          success: false,
          message: 'Exam not found.'
        });
      }

      if (req.user.role !== 'admin' && exam.teacher_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: You can only view results for your own exams.'
        });
      }

      const attempts = await dbService.getAttemptsByExam(examId);

      // Compute aggregates
      const completed = attempts.filter(a => a.status === 'completed' || a.status === 'timed_out');
      const passedCount = completed.filter(a => a.is_passed).length;
      const avgScore = completed.length > 0
        ? Number((completed.reduce((acc, curr) => acc + Number(curr.percentage || 0), 0) / completed.length).toFixed(2))
        : 0;

      res.status(200).json({
        success: true,
        summary: {
          totalSubmissions: completed.length,
          passedCount,
          failedCount: completed.length - passedCount,
          averagePercentage: avgScore
        },
        data: attempts
      });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = attemptController;
