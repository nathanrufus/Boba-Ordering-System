const { ZodError } = require("zod");

function errorHandler(err, req, res, next) {
  // Zod validation errors
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: "VALIDATION_ERROR",
      message: "Invalid request data",
      details: err.errors,
    });
  }

  // Custom errors with statusCode
  if (err && err.statusCode) {
    return res.status(err.statusCode).json({
      error: err.code || "APP_ERROR",
      message: err.message || "Request failed",
    });
  }

  // Fallback
  console.error(err);
  return res.status(500).json({
    error: "INTERNAL_SERVER_ERROR",
    message: "Something went wrong",
  });
}

module.exports = { errorHandler };