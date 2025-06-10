const express = require("express");
const router = express.Router();
const messageController = require("../controllers/messageController");

// Get all messages
router.get("/", messageController.getAllMessages);

// Get a message by ID
router.get("/:id", messageController.getMessageById);

module.exports = router;
