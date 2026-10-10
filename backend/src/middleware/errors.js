function notFound(req, res) { res.status(404).json({ message: `Route not found: ${req.method} ${req.path}` }); }
function errorHandler(err, req, res, next) {
  console.error(err);
  if (err.code === 11000) return res.status(409).json({ message: "A record with this value already exists" });
  if (err.name === "ValidationError" || err.name === "CastError") return res.status(400).json({ message: "Invalid request data" });
  res.status(err.status || 500).json({ message: err.status ? err.message : "Internal server error" });
}
module.exports = { notFound, errorHandler };
