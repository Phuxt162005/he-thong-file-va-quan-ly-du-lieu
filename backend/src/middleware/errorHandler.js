module.exports = (err, req, res, next) => {
  console.error(err);

  let statusCode = err.statusCode || 500;

  if (err.name === "ValidationError") {
    statusCode = 400;
  } else if (err.name === "CastError") {
    statusCode = 400;
  } else if (err.code === 11000) {
    statusCode = 409;
  }

  if (statusCode < 400 || statusCode > 599) {
    statusCode = 500;
  }

  return res.status(statusCode).json({
    message:
      statusCode === 500
        ? "Internal server error"
        : err.message || "Request failed",
  });
};
