const express = require("express");
const app = express();
const errorHandler = require("./middleware/error-handler");
const notFound = require("./middleware/not-found");
const { StatusCodes } = require("http-status-codes");
const userRouter = require("./routes/userRoutes");
const authMiddleware = require("./middleware/auth");
const taskRouter = require("./routes/taskRoutes");
const prisma = require("./db/prisma");
global.userId = null;
global.users = [];
global.tasks = [];
app.use((req, res, next) => {
  console.log(
    "method: ",
    req.method,
    "\n",
    "path: ",
    req.path,
    "\n",
    "query:",
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
app.use(express.json({ limit: "1kb" }));
app.use("/api/users", userRouter);
app.use("/api/tasks", authMiddleware, taskRouter);

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
