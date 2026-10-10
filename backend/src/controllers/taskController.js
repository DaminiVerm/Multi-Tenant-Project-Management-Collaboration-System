const Task = require("../models/Task");
const Project = require("../models/Project");
const Comment = require("../models/Comment");
const writeAudit = require("../utils/audit");
const createNotification = require("../utils/notify");
const Membership = require("../models/Membership");
const mongoose = require("mongoose");

async function taskAccess(req, task, allowedRoles = null) {
  const membership = await Membership.findOne({ organizationId: task.organizationId, userId: req.user._id });
  if (!membership) return { status: 403, message: "You do not have access to this organization" };
  if (allowedRoles && !allowedRoles.includes(membership.role)) return { status: 403, message: "Insufficient permissions" };
  if (!allowedRoles && membership.role === "MEMBER" && String(task.assigneeId || "") !== String(req.user._id) && String(task.createdBy) !== String(req.user._id)) {
    return { status: 403, message: "Members can edit only tasks assigned to them or created by them" };
  }
  return { membership };
}

const statuses = ["TODO", "IN_PROGRESS", "REVIEW", "DONE"];
const priorities = ["LOW", "MEDIUM", "HIGH", "URGENT"];

async function create(req, res, next) {
  try {
    const { organizationId, projectId } = req.body;
    const project = await Project.findOne({ _id: projectId, organizationId });
    if (!project) return res.status(404).json({ message: "Project not found in this organization" });
    const title = String(req.body.title || "").trim();
    if (!title) return res.status(400).json({ message: "Task title is required" });
    const task = await Task.create({
      organizationId, projectId, title, description: req.body.description || "",
      status: statuses.includes(req.body.status) ? req.body.status : "TODO",
      priority: priorities.includes(req.body.priority) ? req.body.priority : "MEDIUM",
      assigneeId: req.body.assigneeId || null,
      dueDate: req.body.dueDate || null,
      labels: Array.isArray(req.body.labels) ? req.body.labels.map(String).slice(0, 20) : [],
      createdBy: req.user._id
      
    });
    await writeAudit({ userId: req.user._id, organizationId, action: "TASK_CREATED", entity: "Task", entityId: task._id, newValue: { title, status: task.status } });
    const io = req.app.get("io");
    io?.to(`project:${projectId}`).emit("task:created", task);
    if (task.assigneeId) await createNotification({ recipientId: task.assigneeId, organizationId, type: "TASK_ASSIGNED", message: `You were assigned: ${task.title}`, entityId: task._id }, io);
    res.status(201).json({ task });
  } catch (e) { next(e); }
}

async function list(req, res, next) {
  try {
    const { organizationId, projectId } = req.query;

    if (!organizationId || !projectId) {
      return res.status(400).json({
        message: "Organization ID and Project ID are required."
      });
    }

    const membership = await Membership.findOne({
      organizationId,
      userId: req.user._id
    });

    if (!membership) {
      return res.status(403).json({
        message: "You do not have access to this organization."
      });
    }

    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(
      100,
      Math.max(1, Number(req.query.limit) || 100)
    );

    const query = {
      organizationId,
      projectId
    };

    if (req.query.status) query.status = req.query.status;
    if (req.query.priority) query.priority = req.query.priority;
    if (req.query.assigneeId) {
      query.assigneeId = req.query.assigneeId;
    }

    const [tasks, total] = await Promise.all([
      Task.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("assigneeId", "name email"),
      Task.countDocuments(query)
    ]);

    res.json({
      tasks,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    next(error);
  }
}


async function getOne(req, res, next) {
  try {
    const task = await Task.findById(req.params.id).populate("assigneeId", "name email").populate("createdBy", "name email");
    if (!task) return res.status(404).json({ message: "Task not found" });
    const access = await taskAccess(req, task, null);
    if (access.status) return res.status(access.status).json({ message: access.message });
    res.json({ task });
  } catch (e) { next(e); }
}
async function update(req, res, next) {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });
    const access = await taskAccess(req, task, null);
    if (access.status) return res.status(access.status).json({ message: access.message });
    const oldValue = {};
    const newValue = {};
    const fields = ["title", "description", "status", "priority", "assigneeId", "dueDate", "labels"];
    for (const field of fields) {
      if (req.body[field] === undefined) continue;
      if (field === "status" && !statuses.includes(req.body[field])) return res.status(400).json({ message: "Invalid status" });
      if (field === "priority" && !priorities.includes(req.body[field])) return res.status(400).json({ message: "Invalid priority" });
      oldValue[field] = task[field];
      task[field] = req.body[field];
      newValue[field] = task[field];
    }
    await task.save();
    await writeAudit({ userId: req.user._id, organizationId: task.organizationId, action: "TASK_UPDATED", entity: "Task", entityId: task._id, oldValue, newValue });
    const io = req.app.get("io");
    io?.to(`project:${task.projectId}`).emit("task:updated", task);
    if (newValue.assigneeId && String(newValue.assigneeId) !== String(oldValue.assigneeId)) {
      await createNotification({ recipientId: newValue.assigneeId, organizationId: task.organizationId, type: "TASK_ASSIGNED", message: `You were assigned: ${task.title}`, entityId: task._id }, io);
    }
    if (newValue.status && newValue.status !== oldValue.status && task.assigneeId) {
      await createNotification({ recipientId: task.assigneeId, organizationId: task.organizationId, type: "STATUS_CHANGED", message: `Task status changed: ${task.title}`, entityId: task._id }, io);
    }
    res.json({ task });
  } catch (e) { next(e); }
}
async function remove(req, res, next) {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });
    const access = await taskAccess(req, task, ["OWNER", "ADMIN"]);
    if (access.status) return res.status(access.status).json({ message: access.message });
    await task.deleteOne();
    await writeAudit({ userId: req.user._id, organizationId: task.organizationId, action: "TASK_DELETED", entity: "Task", entityId: task._id, oldValue: { title: task.title } });
    req.app.get("io")?.to(`project:${task.projectId}`).emit("task:deleted", { _id: task._id });
    res.json({ message: "Task deleted" });
  } catch (e) { next(e); }
}
async function addComment(req, res, next) {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });
    const access = await taskAccess(req, task, null);
    if (access.status) return res.status(access.status).json({ message: access.message });
    const text = String(req.body.text || "").trim();
    if (!text) return res.status(400).json({ message: "Comment text is required" });
    const comment = await Comment.create({ organizationId: task.organizationId, projectId: task.projectId, taskId: task._id, authorId: req.user._id, text });
    await writeAudit({ userId: req.user._id, organizationId: task.organizationId, action: "COMMENT_ADDED", entity: "Comment", entityId: comment._id, newValue: { taskId: task._id } });
    const io = req.app.get("io");
    io?.to(`project:${task.projectId}`).emit("comment:created", comment);
    res.status(201).json({ comment: await comment.populate("authorId", "name email") });
  } catch (e) { next(e); }
}
async function listComments(req, res, next) {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });
    const access = await taskAccess(req, task, null);
    if (access.status) return res.status(access.status).json({ message: access.message });
    const comments = await Comment.find({ taskId: task._id }).sort({ createdAt: 1 }).populate("authorId", "name email");
    res.json({ comments });
  } catch (e) { next(e); }
}
module.exports = { create, list, getOne, update, remove, addComment, listComments };
