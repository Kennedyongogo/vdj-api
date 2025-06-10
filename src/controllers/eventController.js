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

  // Get event statistics for charts and diagrams
  getEventStats: async (req, res) => {
    try {
      const events = await Event.findAll();

      // Calculate statistics
      const stats = {
        // Status distribution (for pie chart)
        statusDistribution: {
          draft: 0,
          published: 0,
          cancelled: 0,
          completed: 0,
        },

        // Events by month and year (for bar chart)
        eventsByMonth: {},

        // Events by venue (for bar chart)
        eventsByVenue: {},

        // Average ticket price by status
        avgTicketPriceByStatus: {
          draft: 0,
          published: 0,
          cancelled: 0,
          completed: 0,
        },

        // Total events count
        totalEvents: events.length,

        // Public vs Private events (for pie chart)
        publicPrivateDistribution: {
          public: 0,
          private: 0,
        },

        // Available years and months for filtering
        availableYears: new Set(),
        availableMonths: new Set(),
      };

      // Process each event
      events.forEach((event) => {
        // Count status distribution
        stats.statusDistribution[event.status]++;

        // Count public vs private
        if (
          event.isPublic &&
          (event.status === "published" || event.status === "completed")
        ) {
          stats.publicPrivateDistribution.public++;
        } else {
          stats.publicPrivateDistribution.private++;
        }

        // Count events by month and year
        const date = new Date(event.startDate);
        const year = date.getFullYear();
        const month = date.toLocaleString("default", { month: "long" });

        // Add to available years and months
        stats.availableYears.add(year);
        stats.availableMonths.add(month);

        // Create a key that includes both year and month
        const yearMonthKey = `${year}-${month}`;
        stats.eventsByMonth[yearMonthKey] =
          (stats.eventsByMonth[yearMonthKey] || 0) + 1;

        // Count events by venue
        stats.eventsByVenue[event.venue] =
          (stats.eventsByVenue[event.venue] || 0) + 1;

        // Calculate average ticket price by status
        if (event.ticketPrice) {
          stats.avgTicketPriceByStatus[event.status] += parseFloat(
            event.ticketPrice
          );
        }
      });

      // Convert Sets to sorted arrays
      stats.availableYears = Array.from(stats.availableYears).sort();
      stats.availableMonths = Array.from(stats.availableMonths).sort((a, b) => {
        const months = [
          "January",
          "February",
          "March",
          "April",
          "May",
          "June",
          "July",
          "August",
          "September",
          "October",
          "November",
          "December",
        ];
        return months.indexOf(a) - months.indexOf(b);
      });

      // Calculate final averages for ticket prices
      Object.keys(stats.avgTicketPriceByStatus).forEach((status) => {
        const count = stats.statusDistribution[status];
        if (count > 0) {
          stats.avgTicketPriceByStatus[status] = (
            stats.avgTicketPriceByStatus[status] / count
          ).toFixed(2);
        }
      });

      // Format data for charts
      const chartData = {
        statusPieChart: Object.entries(stats.statusDistribution).map(
          ([status, count]) => ({
            label: status.charAt(0).toUpperCase() + status.slice(1),
            value: count,
          })
        ),

        monthlyBarChart: Object.entries(stats.eventsByMonth).map(
          ([yearMonth, count]) => {
            const [year, month] = yearMonth.split("-");
            return {
              label: `${month} ${year}`,
              value: count,
              year,
              month,
            };
          }
        ),

        venueBarChart: Object.entries(stats.eventsByVenue).map(
          ([venue, count]) => ({
            label: venue,
            value: count,
          })
        ),

        publicPrivatePieChart: Object.entries(
          stats.publicPrivateDistribution
        ).map(([type, count]) => ({
          label: type.charAt(0).toUpperCase() + type.slice(1),
          value: count,
        })),

        ticketPriceBarChart: Object.entries(stats.avgTicketPriceByStatus).map(
          ([status, price]) => ({
            label: status.charAt(0).toUpperCase() + status.slice(1),
            value: parseFloat(price),
          })
        ),
      };

      res.status(200).json({
        success: true,
        data: {
          rawStats: stats,
          chartData: chartData,
        },
      });
    } catch (error) {
      console.error("Error fetching event statistics:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching event statistics",
        error: error.message,
      });
    }
  },
};

module.exports = eventController;
