const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");

// Register new user
router.post("/register", userController.register);

// Login user
router.post("/login", userController.login);

// Get all users
router.get("/", userController.getAllUsers);

module.exports = router;
