const express = require("express");
const router = express.Router();
const { register, logon, logoff } = require("../controllers/userController");
const jwtMiddleware = require("../middleware/jwtMiddleware");

/**
 * @swagger
 * /api/users/register:
 *   post:
 *     summary: Register a new user
 *     tags:
 *       - Users
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               recaptchaToken:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Validation failed
 */
router.route("/register").post(register);
/**
 * @swagger
 * /api/users/logon:
 *   post:
 *     summary: Authenticate user
 *     tags:
 *       - Users
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Authentication failed
 */
router.route("/logon").post(logon);
/**
 * @swagger
 * /api/users/logoff:
 *   post:
 *     summary: Log out current user
 *     tags:
 *       - Users
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Logged out successfully
 *       401:
 *         description: Unauthorized
 */
router.route("/logoff").post(jwtMiddleware, logoff);

module.exports = router;
