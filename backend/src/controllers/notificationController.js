const Notification = require("../models/Notification");
async function list(req, res, next) {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 30));
    const notifications = await Notification.find({ recipientId: req.user._id }).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit);
    res.json({ notifications });
  } catch (e) { next(e); }
}
async function markRead(req, res, next) {
  try {
    const notification = await Notification.findOneAndUpdate({ _id: req.params.id, recipientId: req.user._id }, { read: true }, { new: true });
    if (!notification) return res.status(404).json({ message: "Notification not found" });
    res.json({ notification });
  } catch (e) { next(e); }
}
module.exports = { list, markRead };
