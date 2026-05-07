function ValidateContentType(req, res, next) {
  if (req.method === "POST") {
    const contentType = req.get("Content-Type");
    if (!contentType || !contentType.includes("application/json")) {
      return res.status(400).json({
        error: "Content-Type must be application/json",
        requestId: req.requestId,
      });
    }
  }
  next();
}
module.exports = ValidateContentType;
