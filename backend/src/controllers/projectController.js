const Project = require("../models/Project");
const writeAudit = require("../utils/audit");
const Membership = require("../models/Membership");

async function create(req, res, next) {
  try {
    const name = String(req.body.name || "").trim();
    if (name.length < 2) return res.status(400).json({ message: "Project name must be at least 2 characters" });
    const project = await Project.create({ organizationId: req.body.organizationId, name, description: req.body.description || "", createdBy: req.user._id });
    await writeAudit({ userId: req.user._id, organizationId: project.organizationId, action: "PROJECT_CREATED", entity: "Project", entityId: project._id, newValue: { name } });
    res.status(201).json({ project });
  } catch (e) { next(e); }
}
async function list(req, res, next) {
  try {
    const { organizationId } = req.query;
    if (!organizationId) return res.status(400).json({ message: "organizationId is required" });
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
    const projects = await Project.find({ organizationId }).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit);
    res.json({ projects, page, limit });
  } catch (e) { next(e); }
}
async function getOne(req, res, next) {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });
    const membership = await Membership.findOne({ organizationId: project.organizationId, userId: req.user._id });
    if (!membership) return res.status(403).json({ message: "You do not have access to this project" });
    res.json({ project });
  } catch (e) { next(e); }
}
module.exports = { create, list, getOne };
