const Notification = require("../models/Notification");
async function createNotification({ recipientId, organizationId, type, message, entityId }, io) {
  const notification = await Notification.create({ recipientId, organizationId, type, message, entityId });
  if (io) io.to(`user:${recipientId}`).emit("notification:new", notification);
  return notification;
}
module.exports = createNotification;
