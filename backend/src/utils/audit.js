const AuditLog = require("../models/AuditLog");
async function writeAudit({ userId, organizationId, action, entity, entityId, oldValue = null, newValue = null }) {
  return AuditLog.create({ userId, organizationId, action, entity, entityId, oldValue, newValue });
}
module.exports = writeAudit;
