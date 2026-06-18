const express = require("express");
const router = express.Router();
const {
  getUserAnalytics,
  getUsersWithStats,
  searchTasks,
} = require("../controllers/analyticsController");
/**
 * @swagger
 * /api/analytics/{id}:
 *   get:
 *     summary: Get analytics for a specific user
 *     tags: [Analytics]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: User analytics retrieved successfully
 *         content:
 *           application/json:
 *             example:
 *               taskStats:
 *                 - isCompleted: false
 *                   _count: { id: 8 }
 *                 - isCompleted: true
 *                   _count: { id: 12 }
 *               recentTasks:
 *                 - id: 45
 *                   title: "Prepare presentation"
 *                   isCompleted: false
 *                   priority: "high"
 *                   createdAt: "2025-06-15T09:30:00Z"
 *                   userId: 1
 *                   User: { name: "Demo User" }
 *               weeklyProgress:
 *                 - createdAt: "2025-06-10T00:00:00Z"
 *                   _count: { id: 3 }
 *                 - createdAt: "2025-06-11T00:00:00Z"
 *                   _count: { id: 5 }
 *       400:
 *         description: Invalid user ID
 *         content:
 *           application/json:
 *             example:
 *               Message: "Invalid user id"
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             example:
 *               message: "User with id 999 not found"
 */
router.route("/users/:id").get(getUserAnalytics);
/**
 * @swagger
 * /api/analytics/users:
 *   get:
 *     summary: Get list of users with task statistics
 *     tags: [Analytics]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, example: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, example: 10 }
 *     responses:
 *       200:
 *         description: Users with stats retrieved
 *         content:
 *           application/json:
 *             example:
 *               users:
 *                 - id: 1
 *                   name: "Demo User"
 *                   email: "demo@example.com"
 *                   createAt: "2025-05-20T10:00:00Z"
 *                   _count: { Task: 25 }
 *                   Task:
 *                     - { id: 101 }
 *                     - { id: 102 }
 *               pagination:
 *                 page: 1
 *                 limit: 10
 *                 total: 42
 *                 pages: 5
 *                 hasNext: true
 *                 hasPrev: false
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             example:
 *               message: "No user is authenticated."
 */
router.route("/users").get(getUsersWithStats);
/**
 * @swagger
 * /api/analytics/search:
 *   get:
 *     summary: Search tasks and users
 *     tags: [Analytics]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema: { type: string }
 *         example: "meeting"
 *       - in: query
 *         name: limit
 *         schema: { type: integer, example: 20 }
 *     responses:
 *       200:
 *         description: Search results
 *         content:
 *           application/json:
 *             example:
 *               results:
 *                 - id: 67
 *                   title: "Team meeting notes"
 *                   isCompleted: false
 *                   priority: "high"
 *                   createdAt: "2025-06-14T14:20:00Z"
 *                   userId: 3
 *                   user_name: "Alice Smith"
 *               query: "meeting"
 *               count: 7
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             example:
 *               error: "Search query must be at least 2 characters long"
 */
router.route("/tasks/search").get(searchTasks);

module.exports = router;
