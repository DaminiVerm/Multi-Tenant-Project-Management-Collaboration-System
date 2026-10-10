const Organization = require("../models/Organization");
const Membership = require("../models/Membership");
const User = require("../models/User");
const writeAudit = require("../utils/audit");
const createNotification = require("../utils/notify");

async function create(req, res, next) {
  try {
    const name = String(req.body.name || "").trim();
    if (name.length < 2 || name.length > 120) return res.status(400).json({ message: "Organization name must be 2-120 characters" });
    const org = await Organization.create({ name, ownerId: req.user._id });
    await Membership.create({ organizationId: org._id, userId: req.user._id, role: "OWNER" });
    await writeAudit({ userId: req.user._id, organizationId: org._id, action: "ORGANIZATION_CREATED", entity: "Organization", entityId: org._id, newValue: { name } });
    res.status(201).json({ organization: org });
  } catch (e) { next(e); }
}
async function list(req, res, next) {
  try {
    const memberships = await Membership.find({ userId: req.user._id }).populate("organizationId");
    res.json({ organizations: memberships.filter(m => m.organizationId).map(m => ({ ...m.organizationId.toObject(), role: m.role })) });
  } catch (e) { next(e); }
}
async function addMember(req, res, next) {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const role = ["ADMIN", "MEMBER", "VIEWER"].includes(req.body.role) ? req.body.role : "MEMBER";
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found. Ask them to register first." });
    const membership = await Membership.create({ organizationId: req.params.organizationId, userId: user._id, role });
    const io = req.app.get("io");
    await createNotification({ recipientId: user._id, organizationId: req.params.organizationId, type: "ORGANIZATION_ADDED", message: "You were added to an organization", entityId: req.params.organizationId }, io);
    await writeAudit({ userId: req.user._id, organizationId: req.params.organizationId, action: "MEMBER_ADDED", entity: "Membership", entityId: membership._id, newValue: { userId: user._id, role } });
    res.status(201).json({ membership: await membership.populate("userId", "name email") });
  } catch (e) { next(e); }
}
async function removeMember(req, res, next) {
  try {
    const target = await Membership.findOne({ organizationId: req.params.organizationId, userId: req.params.userId });
    if (!target) return res.status(404).json({ message: "Membership not found" });
    if (target.role === "OWNER") return res.status(400).json({ message: "Owner cannot be removed through this endpoint" });
    await target.deleteOne();
    await writeAudit({ userId: req.user._id, organizationId: req.params.organizationId, action: "MEMBER_REMOVED", entity: "Membership", entityId: target._id, oldValue: { userId: target.userId, role: target.role } });
    res.json({ message: "Member removed" });
  } catch (e) { next(e); }
}
async function members(req, res, next) {
  try {
    const rows = await Membership.find({ organizationId: req.params.organizationId }).populate("userId", "name email");
    res.json({ members: rows });
  } catch (e) { next(e); }
}
module.exports = { create, list, addMember, removeMember, members };
