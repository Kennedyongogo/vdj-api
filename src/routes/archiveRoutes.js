const express = require("express");
const router = express.Router();
const archiveController = require("../controllers/archiveController");
const { adminMiddleware } = require("../middleware/auth");
const { archiveUpload } = require("../middleware/uploadMiddleware");

// Public routes
router.get("/", archiveController.getAllArchives); // Get all archives
router.get("/:id", archiveController.getArchiveById); // Get archive by ID
router.get("/dj/:djId", archiveController.getArchivesByDJ); // Get archives by DJ

// Protected routes (require admin authentication)
router.post(
  "/",
  adminMiddleware,
  archiveUpload,
  archiveController.createArchive
); // Create new archive entry

router.put(
  "/:id",
  adminMiddleware,
  archiveUpload,
  archiveController.updateArchive
); // Update archive entry

router.delete("/:id", adminMiddleware, archiveController.deleteArchive); // Delete archive entry

module.exports = router;
