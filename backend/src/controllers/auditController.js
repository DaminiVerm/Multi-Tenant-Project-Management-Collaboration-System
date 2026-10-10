const AuditLog = require("../models/AuditLog");
async function list(req, res, next) {
  try {
    const { organizationId, action, search } = req.query;
    if (!organizationId) return res.status(400).json({ message: "organizationId is required" });
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 25));
    const query = { organizationId };
    if (action) query.action = action;
    if (search) query.action = { $regex: String(search).slice(0, 80), $options: "i" };
    const [logs, total] = await Promise.all([
      AuditLog.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).populate("userId", "name email"),
      AuditLog.countDocuments(query)
    ]);
    res.json({ logs, total, page, limit });
  } catch (e) { next(e); }
}
module.exports = { list };
