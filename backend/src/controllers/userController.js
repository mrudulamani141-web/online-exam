/**
 * User & Platform Administration Controller
 */
const dbService = require('../services/dbService');

const userController = {
  /**
   * Get all registered users (Admin only)
   * GET /api/users
   */
  async getAllUsers(req, res, next) {
    try {
      const users = await dbService.getAllUsers();
      res.status(200).json({
        success: true,
        count: users.length,
        data: users
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Delete user (Admin only)
   * DELETE /api/users/:id
   */
  async deleteUser(req, res, next) {
    try {
      const { id } = req.params;

      if (id === req.user.id) {
        return res.status(400).json({
          success: false,
          message: 'You cannot delete your own administrative account.'
        });
      }

      await dbService.deleteUser(id);

      res.status(200).json({
        success: true,
        message: 'User and all related records deleted successfully.'
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Get system analytics & statistics
   * GET /api/users/stats
   */
  async getStats(req, res, next) {
    try {
      const stats = await dbService.getSystemStats();
      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = userController;
