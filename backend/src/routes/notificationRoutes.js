const router = require("express").Router();
const auth = require("../middleware/auth");
const c = require("../controllers/notificationController");
router.use(auth);
router.get("/", c.list);
router.patch("/:id/read", c.markRead);
module.exports = router;
