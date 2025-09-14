const express = require("express");
const router = express.Router();
const { sendMessage, getMessages } = require("../controllers/contactController");
const authMiddleware = require("../middleware/authMiddleware");
const requireRole = require("../middleware/requireRole");

router.post("/", sendMessage);

router.get("/", authMiddleware, requireRole("admin"), getMessages);

module.exports = router;
