const express = require("express");
const router = express.Router();
const mixController = require("../controllers/mixController");
const { adminMiddleware } = require("../middleware/auth");
const upload = require("../middleware/uploadMiddleware");

// Public routes
router.get("/", mixController.getAllMixes); // Get all mixes
router.get("/:id", mixController.getMixById); // Get mix by ID
router.get("/dj/:djId", mixController.getMixesByDJ); // Get mixes by DJ
router.get("/stats/charts", mixController.getMixStats); // Get mix statistics for charts
router.post("/:id/download", mixController.incrementDownloadCount); // Track download
router.get("/:id/download-file", mixController.downloadMix); // Download mix file

// Protected routes (require admin authentication)
router.post(
  "/",
  adminMiddleware,
  upload.single("file"),
  mixController.createMix
); // Create new mix
router.put("/:id", adminMiddleware, mixController.updateMix); // Update mix
router.delete("/:id", adminMiddleware, mixController.deleteMix); // Delete mix

module.exports = router;
