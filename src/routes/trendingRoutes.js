const express = require("express");
const router = express.Router();
const trendingController = require("../controllers/trendingController");
const { adminMiddleware } = require("../middleware/auth");

// Public routes
router.get("/", trendingController.getAllTrending); // Get all trending items
router.get("/type", trendingController.getTrendingByType); // Get trending by content type
router.get(
  "/status/:contentType/:contentId",
  trendingController.getContentTrendingStatus
); // Get trending status for specific content

// Public routes for incrementing counts
router.post("/:id/view", trendingController.incrementViewCount); // Increment view count
router.post("/:id/engage", trendingController.incrementEngagementCount); // Increment engagement count

// Like/unlike routes (now public)
router.post("/:id/like", trendingController.likeTrending); // Like a trending item
router.delete("/:id/like", trendingController.unlikeTrending); // Unlike a trending item

// Comment routes (now public)
router.post("/:id/comment", trendingController.addComment); // Add a comment
router.get("/:id/comments", trendingController.getComments); // Get comments for a trending item

// Protected routes (require admin authentication)
router.post("/", adminMiddleware, trendingController.createOrUpdateTrending); // Create or update trending entry
router.put(
  "/metrics/:id",
  adminMiddleware,
  trendingController.updateTrendingMetrics
); // Update trending metrics
router.delete("/:id", adminMiddleware, trendingController.deleteTrending); // Delete trending entry

module.exports = router;
