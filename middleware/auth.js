const { StatusCodes } = require("http-status-codes");
const authMiddleware = (req, res, next) => {
  if (global.user_id === null) {
    console.log("Auth Called: ", global.user_id);
    res.status(StatusCodes.UNAUTHORIZED).json({ message: "unauthorized" });
  } else {
    next();
  }
};
module.exports = authMiddleware;
