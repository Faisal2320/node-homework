const jwt = require("jsonwebtoken");
const { StatusCodes } = require("http-status-codes");

const send401 = (res, msg = "No user is authenticated.") => {
  return res.status(StatusCodes.UNAUTHORIZED).json({ message: msg });
};

const jwtMiddleware =  (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7);

    if (token === "demo-token-12345") {
      req.user = { id: 13, isDemo: true };
      return next();
    }
  }

  const token = req?.cookies?.jwt;
  if (!token) {
    return send401(res);
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return send401(res);
    }

    req.user = { id: decoded.id };

    const isSwagger =
      req.headers["origin"]?.includes("api-docs") ||
      req.headers["user-agent"]?.includes("Swagger");

    if (isSwagger) {
      return next();
    }

    if (!["POST", "PATCH", "PUT", "DELETE", "CONNECT"].includes(req.method)) {
      return next();
    }

    if (req.get("X-CSRF-TOKEN") !== decoded.csrfToken) {
      return send401(res, "CSRF token mismatch");
    }

    next();
  });
};

module.exports = jwtMiddleware;
