const express = require("express");
const router = express.Router();
const serviceController = require("../controllers/serviceController");
const { adminMiddleware } = require("../middleware/auth");

// Public routes
router.get("/", serviceController.getAllServices); // Get all services
router.get("/:id", serviceController.getServiceById); // Get service by ID
router.post("/", serviceController.createService); // Moved here and removed adminMiddleware
router.post("/:id/book", serviceController.bookService); // Book a service

// Protected routes (require admin authentication)
router.put("/:id", adminMiddleware, serviceController.updateService); // Update service
router.delete("/:id", adminMiddleware, serviceController.deleteService); // Delete service

module.exports = router;
