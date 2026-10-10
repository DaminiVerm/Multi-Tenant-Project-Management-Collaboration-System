const mongoose = require("mongoose");
const schema = new mongoose.Schema({
  recipientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true },
  type: { type: String, required: true },
  message: { type: String, required: true, maxlength: 500 },
  entityId: { type: mongoose.Schema.Types.ObjectId, default: null },
  read: { type: Boolean, default: false, index: true }
}, { timestamps: true });
schema.index({ recipientId: 1, read: 1, createdAt: -1 });
module.exports = mongoose.model("Notification", schema);
