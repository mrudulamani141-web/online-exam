/**
 * Exam Controller
 * Handles CRUD operations, search filters, and publication toggles for exams.
 */
const dbService = require('../services/dbService');

const examController = {
  /**
   * List exams with filtering
   * GET /api/exams
   */
  async getExams(req, res, next) {
    try {
      const { search, teacherId, isPublished } = req.query;
      const filters = {};

      if (search) filters.search = search;
      if (teacherId) filters.teacherId = teacherId;

      // Students can only see published exams
      if (req.user && req.user.role === 'student') {
        filters.isPublished = true;
      } else if (isPublished !== undefined) {
        filters.isPublished = isPublished === 'true';
      }

      const exams = await dbService.getAllExams(filters);

      // Add question count to each exam summary
      const examsWithCounts = await Promise.all(
        exams.map(async exam => {
          const questions = await dbService.getQuestionsByExamId(exam.id, false);
          return {
            ...exam,
            question_count: questions.length
          };
        })
      );

      res.status(200).json({
        success: true,
        count: examsWithCounts.length,
        data: examsWithCounts
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Get single exam with its questions
   * GET /api/exams/:id
   */
  async getExamById(req, res, next) {
    try {
      const { id } = req.params;
      const exam = await dbService.getExamById(id);

      if (!exam) {
        return res.status(404).json({
          success: false,
          message: 'Exam not found.'
        });
      }

      // Check access permission: students cannot access unpublished exams
      if (req.user && req.user.role === 'student' && !exam.is_published) {
        return res.status(403).json({
          success: false,
          message: 'This exam is not currently available for students.'
        });
      }

      // Students receive questions without answer keys
      const includeAnswers = req.user && (req.user.role === 'admin' || req.user.id === exam.teacher_id);
      const questions = await dbService.getQuestionsByExamId(id, includeAnswers);

      res.status(200).json({
        success: true,
        data: {
          ...exam,
          questions
        }
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Create new exam
   * POST /api/exams
   */
  async createExam(req, res, next) {
    try {
      const { title, description, subject, duration_minutes, total_marks, passing_marks, is_published, start_date, end_date } = req.body;

      const newExam = await dbService.createExam({
        title,
        description,
        subject,
        teacher_id: req.user.id,
        duration_minutes: duration_minutes || 30,
        total_marks: total_marks || 100,
        passing_marks: passing_marks || 40,
        is_published: is_published || false,
        start_date: start_date || null,
        end_date: end_date || null
      });

      res.status(201).json({
        success: true,
        message: 'Exam created successfully.',
        data: newExam
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Update existing exam
   * PUT /api/exams/:id
   */
  async updateExam(req, res, next) {
    try {
      const { id } = req.params;
      const existingExam = await dbService.getExamById(id);

      if (!existingExam) {
        return res.status(404).json({
          success: false,
          message: 'Exam not found.'
        });
      }

      // Authorization check: only exam creator or admin
      if (req.user.role !== 'admin' && existingExam.teacher_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: You can only modify your own exams.'
        });
      }

      const updatedExam = await dbService.updateExam(id, req.body);

      res.status(200).json({
        success: true,
        message: 'Exam updated successfully.',
        data: updatedExam
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Delete exam
   * DELETE /api/exams/:id
   */
  async deleteExam(req, res, next) {
    try {
      const { id } = req.params;
      const existingExam = await dbService.getExamById(id);

      if (!existingExam) {
        return res.status(404).json({
          success: false,
          message: 'Exam not found.'
        });
      }

      // Authorization check: only exam creator or admin
      if (req.user.role !== 'admin' && existingExam.teacher_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: You can only delete your own exams.'
        });
      }

      await dbService.deleteExam(id);

      res.status(200).json({
        success: true,
        message: 'Exam and its associated questions/results deleted successfully.'
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Publish / Unpublish Exam Toggle
   * PATCH /api/exams/:id/publish
   */
  async togglePublish(req, res, next) {
    try {
      const { id } = req.params;
      const existingExam = await dbService.getExamById(id);

      if (!existingExam) {
        return res.status(404).json({
          success: false,
          message: 'Exam not found.'
        });
      }

      if (req.user.role !== 'admin' && existingExam.teacher_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: You can only change publication for your own exams.'
        });
      }

      const updated = await dbService.updateExam(id, {
        is_published: !existingExam.is_published
      });

      res.status(200).json({
        success: true,
        message: `Exam successfully ${updated.is_published ? 'published' : 'unpublished'}.`,
        data: updated
      });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = examController;
