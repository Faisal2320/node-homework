const express = require("express");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const dogsRouter = require("./routes/dogs");
const ValidateContentType = require("./controllers/content-type");
const errorController = require("./controllers/errorController");
const headersController = require("./controllers/headersController");
const timestampController = require("./controllers/timestampController");

const app = express();

// Your middleware here
app.use((req, res, next) => {
  req.requestId = uuidv4();
  res.setHeader("X-Request-Id", req.requestId);
  next();
});
app.use(timestampController); // logging middleware
app.use(headersController);
app.use(express.json({ limit: "1mb" }));
app.use(ValidateContentType);
app.use("/images", express.static(path.join(__dirname, "public/images")));
app.use("/", dogsRouter); // Do not remove this line
app.use(errorController);
// not found error handler
app.use((req, res) => {
  res.status(404).json({
    error: "Route not found",
    requestId: req.requestId,
  });
});
//
//
//
//
const server = app.listen(3000, () =>
  console.log("Server listening on port 3000"),
);
module.exports = server;
