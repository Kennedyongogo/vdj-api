const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");

// Admin login route
router.post("/login", adminController.login);

// Get all admins route
router.get("/", adminController.getAllAdmins);

// Get admin by ID route
router.get("/:id", adminController.getAdminById);

module.exports = router;
