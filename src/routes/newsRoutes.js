const express = require("express");
const router = express.Router();
const newsController = require("../controllers/newsController");
const { authMiddleware, adminMiddleware } = require("../middleware/auth");

// Public Routes
// Get all approved news
router.get("/", newsController.getApprovedNews);

// Protected Routes (require authentication)
// Create new news article
router.post("/", authMiddleware, newsController.createNews);

// Get pending news (accessible by both admins and users)
router.get("/pending", authMiddleware, newsController.getPendingNews);

// Admin Routes
// Get all pending news for review
router.get("/admin/pending", adminMiddleware, newsController.getPendingNews);

// Approve a news article
router.put("/admin/:id/approve", adminMiddleware, newsController.approveNews);

// Reject a news article
router.put("/admin/:id/reject", adminMiddleware, newsController.rejectNews);

// Delete a news article
router.delete("/admin/:id", adminMiddleware, newsController.deleteNews);

// Get specific news article (must be last to avoid conflicts with other routes)
router.get("/:id", newsController.getNewsById);

module.exports = router;
