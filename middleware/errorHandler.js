function notFound(req, res, next) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

function errorHandler(err, req, res, next) {
  console.error("[error]", err.message);
  const status = err.status || 500;
  res.status(status).json({
    message: status === 500 ? "Internal server error" : err.message
  });
}

module.exports = { notFound, errorHandler };
