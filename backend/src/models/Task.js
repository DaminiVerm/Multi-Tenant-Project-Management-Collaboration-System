const mongoose = require("mongoose");
const schema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 200 },
  description: { type: String, default: "", maxlength: 10000 },
  status: { type: String, enum: ["TODO", "IN_PROGRESS", "REVIEW", "DONE"], default: "TODO", index: true },
  priority: { type: String, enum: ["LOW", "MEDIUM", "HIGH", "URGENT"], default: "MEDIUM", index: true },
  assigneeId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
  dueDate: { type: Date, default: null },
  labels: [{ type: String, trim: true }],
  attachments: [{ filename: String, url: String, size: Number, uploadedBy: mongoose.Schema.Types.ObjectId }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
}, { timestamps: true });
schema.index({ organizationId: 1, projectId: 1, status: 1 });
schema.index({ organizationId: 1, assigneeId: 1, dueDate: 1 });
module.exports = mongoose.model("Task", schema);
