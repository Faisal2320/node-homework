const express = require("express");
const router = express.Router();
const {
  getUserAnalytics,
  getUsersWithStats,
  searchTasks,
} = require("../controllers/analyticsController");
/**
 * @swagger
 * /api/analytics/users/{id}:
 *   get:
 *     summary: Get analytics for a specific user
 *     tags:
 *       - Analytics
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Analytics returned
 *       404:
 *         description: User not found
 */
router.route("/users/:id").get(getUserAnalytics);
/**
 * @swagger
 * /api/analytics/users:
 *   get:
 *     summary: Get paginated users with task statistics
 *     tags:
 *       - Analytics
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Users retrieved
 */
router.route("/users").get(getUsersWithStats);
/**
 * @swagger
 * /api/analytics/tasks/search:
 *   get:
 *     summary: Search tasks and users
 *     tags:
 *       - Analytics
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Search results
 *       400:
 *         description: Invalid query
 */
router.route("/tasks/search").get(searchTasks);

module.exports = router;
