const Membership = require("../models/Membership");

async function getMembership(userId, organizationId) {
  return Membership.findOne({ userId, organizationId });
}
function requireRoles(...roles) {
  return async (req, res, next) => {
    try {
      const organizationId = req.params.organizationId || req.body.organizationId || req.query.organizationId;
      if (!organizationId) return res.status(400).json({ message: "organizationId is required" });
      const membership = await getMembership(req.user._id, organizationId);
      if (!membership) return res.status(403).json({ message: "You are not a member of this organization" });
      if (roles.length && !roles.includes(membership.role)) return res.status(403).json({ message: "Insufficient permissions" });
      req.membership = membership;
      next();
    } catch (error) { next(error); }
  };
}
module.exports = { getMembership, requireRoles };
