/**
 * Question Management Controller
 * Handles question authoring, updates, point weights, and option configurations.
 */
const dbService = require('../services/dbService');

const questionController = {
  /**
   * Get all questions for an exam
   * GET /api/exams/:examId/questions
   */
  async getQuestions(req, res, next) {
    try {
      const { examId } = req.params;
      const exam = await dbService.getExamById(examId);

      if (!exam) {
        return res.status(404).json({
          success: false,
          message: 'Exam not found.'
        });
      }

      // Hide answer keys if student
      const isPrivileged = req.user && (req.user.role === 'admin' || req.user.id === exam.teacher_id);
      const questions = await dbService.getQuestionsByExamId(examId, isPrivileged);

      res.status(200).json({
        success: true,
        count: questions.length,
        data: questions
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Add question to exam
   * POST /api/exams/:examId/questions
   */
  async createQuestion(req, res, next) {
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
          message: 'Forbidden: You can only add questions to your own exams.'
        });
      }

      const { question_text, question_type, points, options, correct_answer, explanation, order_index } = req.body;

      const newQuestion = await dbService.createQuestion({
        exam_id: examId,
        question_text,
        question_type,
        points: points || 1,
        options: options || [],
        correct_answer,
        explanation: explanation || '',
        order_index: order_index || 1
      });

      res.status(201).json({
        success: true,
        message: 'Question added successfully.',
        data: newQuestion
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Update question
   * PUT /api/questions/:id
   */
  async updateQuestion(req, res, next) {
    try {
      const { id } = req.params;
      const existing = await dbService.getQuestionById(id);

      if (!existing) {
        return res.status(404).json({
          success: false,
          message: 'Question not found.'
        });
      }

      const exam = await dbService.getExamById(existing.exam_id);
      if (req.user.role !== 'admin' && exam && exam.teacher_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: You can only modify questions in your own exams.'
        });
      }

      const updated = await dbService.updateQuestion(id, req.body);

      res.status(200).json({
        success: true,
        message: 'Question updated successfully.',
        data: updated
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Delete question
   * DELETE /api/questions/:id
   */
  async deleteQuestion(req, res, next) {
    try {
      const { id } = req.params;
      const existing = await dbService.getQuestionById(id);

      if (!existing) {
        return res.status(404).json({
          success: false,
          message: 'Question not found.'
        });
      }

      const exam = await dbService.getExamById(existing.exam_id);
      if (req.user.role !== 'admin' && exam && exam.teacher_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: You can only delete questions from your own exams.'
        });
      }

      await dbService.deleteQuestion(id);

      res.status(200).json({
        success: true,
        message: 'Question deleted successfully.'
      });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = questionController;
