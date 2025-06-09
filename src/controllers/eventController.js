const Event = require("../models/event");
const Admin = require("../models/admin");
const { Op } = require("sequelize");
const fs = require("fs");
const path = require("path");

const eventController = {
  // Create a new event
  createEvent: async (req, res) => {
    try {
      const {
        name,
        description,
        venue,
        venueAddress,
        startDate,
        endDate,
        ticketPrice,
        currency = "KES",
        isPublic,
        eventHosts,
        tags,
        socialLinks,
      } = req.body;

      // Get DJ ID from authenticated user
      const djId = req.user.id;

      // Create banner URL if file was uploaded
      let bannerUrl = null;
      if (req.file) {
        bannerUrl = `/uploads/images/${req.file.filename}`;
      }

      const event = await Event.create({
        name,
        description,
        venue,
        venueAddress,
        startDate,
        endDate,
        bannerUrl,
        ticketPrice,
        currency,
        isPublic,
        eventHosts: eventHosts ? JSON.parse(eventHosts) : [],
        tags: tags ? JSON.parse(tags) : [],
        socialLinks: socialLinks ? JSON.parse(socialLinks) : {},
        djId,
      });

      res.status(201).json({
        success: true,
        data: event,
        message: "Event created successfully",
      });
    } catch (error) {
      // If there's an error, delete the uploaded banner
      if (req.file) {
        const filePath = path.join(
          process.cwd(),
          "uploads/images",
          req.file.filename
        );
        if (fs.existsSync(filePath)) {
          fs.unlink(filePath, (err) => {
            if (err) console.error("Error deleting file:", err);
          });
        }
      }

      console.error("Error creating event:", error);
      res.status(500).json({
        success: false,
        message: "Error creating event",
        error: error.message,
      });
    }
  },

  // Get all events
  getAllEvents: async (req, res) => {
    try {
      const events = await Event.findAll({
        include: [
          {
            model: Admin,
            as: "admin",
            attributes: ["username", "email"],
          },
        ],
        order: [["startDate", "ASC"]],
      });

      res.status(200).json({
        success: true,
        data: events,
      });
    } catch (error) {
      console.error("Error fetching events:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching events",
        error: error.message,
      });
    }
  },

  // Get event by ID
  getEventById: async (req, res) => {
    try {
      const { id } = req.params;
      const event = await Event.findByPk(id, {
        include: [
          {
            model: Admin,
            as: "admin",
            attributes: ["username", "email"],
          },
        ],
      });

      if (!event) {
        return res.status(404).json({
          success: false,
          message: "Event not found",
        });
      }

      res.status(200).json({
        success: true,
        data: event,
      });
    } catch (error) {
      console.error("Error fetching event:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching event",
        error: error.message,
      });
    }
  },

  // Update event
  updateEvent: async (req, res) => {
    try {
      const { id } = req.params;
      const {
        name,
        description,
        venue,
        venueAddress,
        startDate,
        endDate,
        ticketPrice,
        currency = "KES",
        isPublic,
        eventHosts,
        tags,
        socialLinks,
        status,
      } = req.body;

      const event = await Event.findByPk(id);

      if (!event) {
        return res.status(404).json({
          success: false,
          message: "Event not found",
        });
      }

      // Check if the authenticated user is the owner of the event
      if (event.djId !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to update this event",
        });
      }

      // Handle banner update if new file is uploaded
      let bannerUrl = event.bannerUrl;
      if (req.file) {
        // Delete old banner if exists
        if (event.bannerUrl) {
          const oldFilePath = path.join(
            process.cwd(),
            "uploads/images",
            path.basename(event.bannerUrl)
          );
          if (fs.existsSync(oldFilePath)) {
            fs.unlink(oldFilePath, (err) => {
              if (err) console.error("Error deleting old banner:", err);
            });
          }
        }
        bannerUrl = `/uploads/images/${req.file.filename}`;
      }

      await event.update({
        name,
        description,
        venue,
        venueAddress,
        startDate,
        endDate,
        bannerUrl,
        ticketPrice,
        currency,
        isPublic,
        eventHosts: eventHosts ? JSON.parse(eventHosts) : event.eventHosts,
        tags: tags ? JSON.parse(tags) : event.tags,
        socialLinks: socialLinks ? JSON.parse(socialLinks) : event.socialLinks,
        status,
      });

      res.status(200).json({
        success: true,
        data: event,
        message: "Event updated successfully",
      });
    } catch (error) {
      // If there's an error and a new file was uploaded, delete it
      if (req.file) {
        const filePath = path.join(
          process.cwd(),
          "uploads/images",
          req.file.filename
        );
        if (fs.existsSync(filePath)) {
          fs.unlink(filePath, (err) => {
            if (err) console.error("Error deleting file:", err);
          });
        }
      }

      console.error("Error updating event:", error);
      res.status(500).json({
        success: false,
        message: "Error updating event",
        error: error.message,
      });
    }
  },

  // Delete event
  deleteEvent: async (req, res) => {
    try {
      const { id } = req.params;
      const event = await Event.findByPk(id);

      if (!event) {
        return res.status(404).json({
          success: false,
          message: "Event not found",
        });
      }

      // Check if the authenticated user is the owner of the event
      if (event.djId !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to delete this event",
        });
      }

      // Delete banner if exists
      if (event.bannerUrl) {
        const filePath = path.join(
          __dirname,
          "../../uploads/images",
          path.basename(event.bannerUrl)
        );
        fs.unlink(filePath, (err) => {
          if (err) console.error("Error deleting banner:", err);
        });
      }

      await event.destroy();

      res.status(200).json({
        success: true,
        message: "Event deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting event:", error);
      res.status(500).json({
        success: false,
        message: "Error deleting event",
        error: error.message,
      });
    }
  },

  // Get events by DJ
  getEventsByDJ: async (req, res) => {
    try {
      const { djId } = req.params;
      const events = await Event.findAll({
        where: { djId },
        include: [
          {
            model: Admin,
            attributes: ["username", "email"],
          },
        ],
        order: [["startDate", "ASC"]],
      });

      res.status(200).json({
        success: true,
        data: events,
      });
    } catch (error) {
      console.error("Error fetching DJ events:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching DJ events",
        error: error.message,
      });
    }
  },

  // Get public events (published and completed only)
  getPublicEvents: async (req, res) => {
    try {
      const events = await Event.findAll({
        where: {
          status: {
            [Op.in]: ["published", "completed"],
          },
        },
        include: [
          {
            model: Admin,
            as: "admin",
            attributes: ["username", "email"],
          },
        ],
        order: [["startDate", "ASC"]],
      });

      res.status(200).json({
        success: true,
        data: events,
      });
    } catch (error) {
      console.error("Error fetching public events:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching public events",
        error: error.message,
      });
    }
  },
};

module.exports = eventController;
