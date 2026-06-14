const express = require("express");
const app = express();
const errorHandler = require("./middleware/error-handler");
const notFound = require("./middleware/not-found");
const { StatusCodes } = require("http-status-codes");
const userRoutes = require("./routes/userRoutes");
const taskRoutes = require("./routes/taskRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
// const authMiddleware = require("./middleware/auth");
const jwtMiddleware = require("./middleware/jwtMiddleware");
const cookieParser = require("cookie-parser");
const cors = require("cors");

// ==========================================

app.set("trust proxy", 1);
const helmet = require("helmet");
const { xss } = require("express-xss-sanitizer");
const rateLimiter = require("express-rate-limit");

const prisma = require("./db/prisma");

app.use(rateLimiter({ windowMs: 15 * 60 * 1000, max: 100 }));
app.use(helmet());

// ============== swagger ===================
const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");
const { type } = require("./validation/querySchema");
const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Task Management API",
      version: "1.0.0",
      description: "Node.js Express, Prisma Task Management API",
    },
    components: {
      securitySchemas: {
        cookiesAuth: {
          type: "apiKey",
          in: "cookie",
          name: "jwt",
        },
      },
    },
  },
  apis: ["./routes/*.js"],
});

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ==========================================
const origins = ["http://localhost:3001"];
app.use(
  cors({
    origin: origins,
    credentials: true,
    methods: "GET,POST,PATCH,PUT,DELETE",
    allowedHeaders: "CONTENT-TYPE, X-CSRF-TOKEN",
  }),
);
app.use((req, res, next) => {
  console.log(
    "method: ",
    req.method,
    "\n path: ",
    req.path,
    "\n query:",
    req.query,
  );
  next();
});
app.get("/health", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "OK", db: "connected" });
  } catch (err) {
    res
      .status(500)
      .json({ message: `DB not connected, error: ${err.message}` });
  }
});
app.get("/", (req, res) => {
  res.json({ message: "Hello World!" });
});

app.post("/testpost", (req, res) => {
  res.status(StatusCodes.OK).json({ message: "Request received." });
});
// =================  User
app.use(cookieParser());
app.use(express.json({ limit: "1mb" }));
app.use(xss());
app.use("/api/tasks", jwtMiddleware, taskRoutes);
app.use("/api/users", userRoutes);
app.use("/api/analytics", jwtMiddleware, analyticsRoutes);

// 404 route
app.use(notFound);
app.use(errorHandler);
/*



*/
const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`Server is listening on port ${port}...`);
  console.log(`To visit click on Ctr + http://localhost:${port}`);
});
/*



*/
server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`Port ${port} is already in use.`);
  } else {
    console.error("Server error: ", err);
  }
});
let isShuttingDown = false;
// for database shutdown

async function shutdown(code = 0) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log("Shutting down gracefully...");
  try {
    await new Promise((resolve) => server.close(resolve));
    // shutdown database
    await prisma.$disconnect();
    console.log("Prisma disconnected");
    console.log("HTTP server closed.");
  } catch (err) {
    console.log("Error during shutdown: ", err);
    code = 1;
  } finally {
    console.log("Exiting process...");
    process.exit(code);
  }
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));
process.on("uncaughtException", (err) => {
  console.log("Uncaught exception:", err);
  shutdown(1);
});
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled rejection:", reason);
  shutdown(1);
});
//
//
//
//
module.exports = { app, server };
