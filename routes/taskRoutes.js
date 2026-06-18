const express = require("express");
const router = express.Router();
const {
  index,
  create,
  show,
  update,
  deleteTask,
  bulkCreate,
} = require("../controllers/taskController");

/**
 * @swagger
 * /api/tasks:
 *   get:
 *     summary: Get all tasks for authenticated user
 *     tags: [Tasks]
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
 *       - in: query
 *         name: find
 *         schema: { type: string, example: "meeting" }
 *       - in: query
 *         name: isCompleted
 *         schema: { type: boolean, example: false }
 *       - in: query
 *         name: priority
 *         schema: { type: string, enum: [low, medium, high] }
 *     responses:
 *       200:
 *         description: Tasks retrieved
 *         content:
 *           application/json:
 *             example:
 *               tasks:
 *                 - id: 1
 *                   title: "Buy groceries"
 *                   isCompleted: false
 *                   priority: "medium"
 *                   createdAt: "2025-06-01T10:00:00Z"
 *               total: 15
 *               page: 1
 *               limit: 10
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             example:
 *               message: "No user is authenticated."
 */
router.route("/").get(index);
/**
 * @swagger
 * /api/tasks:
 *   post:
 *     summary: Create a new task
 *     tags: [Tasks]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title]
 *             properties:
 *               title: { type: string, example: "Finish report" }
 *               isCompleted: { type: boolean, example: false }
 *               priority: { type: string, enum: [low, medium, high], example: "high" }
 *     responses:
 *       201:
 *         description: Task created
 *         content:
 *           application/json:
 *             example:
 *               message: "Task created successfully"
 *               task:
 *                 id: 42
 *                 title: "Finish report"
 *                 isCompleted: false
 *                 priority: "high"
 *                 createdAt: "2025-06-16T13:24:00Z"
 *       400:
 *         description: Validation error
 */
router.route("/").post(create);
/**
 * @swagger
 * /api/tasks/bulk:
 *   post:
 *     summary: Bulk create multiple tasks
 *     tags: [Tasks]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               tasks:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     title: { type: string }
 *                     priority: { type: string, enum: [low, medium, high] }
 *                     isCompleted: { type: boolean }
 *     responses:
 *       201:
 *         description: Bulk tasks created
 *         content:
 *           application/json:
 *             example:
 *               message: "12 tasks created successfully"
 *               count: 12
 */
router.route("/bulk").post(bulkCreate);
/**
 * @swagger
 * /api/tasks/{id}:
 *   get:
 *     summary: Get single task by ID
 *     tags: [Tasks]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer, example: 1 }
 *     responses:
 *       200:
 *         description: Task found
 *         content:
 *           application/json:
 *             example:
 *               id: 1
 *               title: "Buy groceries"
 *               isCompleted: false
 *               priority: "medium"
 *               createdAt: "2025-06-01T10:00:00Z"
 *       404:
 *         description: Task not found
 */
router.route("/:id").get(show);
/**
 * @swagger
 * /api/tasks/{id}:
 *   patch:
 *     summary: Update task
 *     tags: [Tasks]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer, example: 1 }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string, example: "Updated title" }
 *               isCompleted: { type: boolean, example: true }
 *               priority: { type: string, example: "low" }
 *     responses:
 *       200:
 *         description: Task updated
 *         content:
 *           application/json:
 *             example:
 *               message: "Task updated successfully"
 *               task: { id: 1, title: "Updated title", isCompleted: true }
 *       404:
 *         description: Task not found
 */
router.route("/:id").patch(update);
/**
 * @swagger
 * /api/tasks/{id}:
 *   delete:
 *     summary: Delete task
 *     tags: [Tasks]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer, example: 1 }
 *     responses:
 *       200:
 *         description: Task deleted
 *         content:
 *           application/json:
 *             example:
 *               message: "Task deleted successfully"
 *       404:
 *         description: Task not found
 */
router.route("/:id").delete(deleteTask);

module.exports = router;
