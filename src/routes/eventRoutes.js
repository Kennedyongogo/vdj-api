const express = require("express");
const router = express.Router();
const eventController = require("../controllers/eventController");
const { adminMiddleware } = require("../middleware/auth");
const imageUpload = require("../middleware/imageUploadMiddleware");

// Public routes
router.get("/", eventController.getAllEvents); // Get all events
router.get("/public", eventController.getPublicEvents); // Get only published and completed events
router.get("/:id", eventController.getEventById); // Get event by ID
router.get("/dj/:djId", eventController.getEventsByDJ); // Get events by DJ
router.get("/stats/charts", eventController.getEventStats); // Get event statistics for charts

// Protected routes (require admin authentication)
router.post(
  "/",
  adminMiddleware,
  imageUpload.single("banner"),
  eventController.createEvent
); // Create new event with banner
router.put(
  "/:id",
  adminMiddleware,
  imageUpload.single("banner"),
  eventController.updateEvent
); // Update event with optional banner
router.delete("/:id", adminMiddleware, eventController.deleteEvent); // Delete event

module.exports = router;
