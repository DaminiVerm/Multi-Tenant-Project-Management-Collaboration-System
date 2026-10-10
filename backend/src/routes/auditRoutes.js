const router = require("express").Router();
const auth = require("../middleware/auth");
const { requireRoles } = require("../middleware/permissions");
const c = require("../controllers/auditController");
router.get("/", auth, requireRoles("OWNER", "ADMIN"), c.list);
module.exports = router;
