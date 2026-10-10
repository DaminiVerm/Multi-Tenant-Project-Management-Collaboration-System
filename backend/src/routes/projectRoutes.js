
const express = require("express");
const router = express.Router();

const { create, list, getOne } = require("../controllers/projectController");
const auth = require("../middleware/auth");

router.post("/", auth, create);
router.get("/", auth, list);
router.get("/:id", auth, getOne);

module.exports = router;
