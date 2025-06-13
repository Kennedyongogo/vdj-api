const Service = require("../models/service");

const serviceController = {
  // Create a new service
  createService: async (req, res) => {
    try {
      const {
        name,
        description,
        type,
        duration,
        isActive,
        contactName,
        contactEmail,
        contactPhone,
        eventDate,
      } = req.body;

      const serviceData = {
        name,
        description,
        type,
        duration,
        isActive,
        contactName,
        contactEmail,
        contactPhone,
        eventDate,
      };

      // Only add djId if the user is authenticated as an admin
      if (req.user && req.user.isAdmin) {
        serviceData.djId = req.user.id;
      }

      const service = await Service.create(serviceData);

      res.status(201).json({
        success: true,
        data: service,
        message: "Service created successfully",
      });
    } catch (error) {
      console.error("Error creating service:", error);
      res.status(500).json({
        success: false,
        message: "Error creating service",
        error: error.message,
      });
    }
  },

  // Get all services
  getAllServices: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;

      const { count, rows: services } = await Service.findAndCountAll({
        order: [["createdAt", "DESC"]],
        limit,
        offset,
      });

      const totalPages = Math.ceil(count / limit);

      res.status(200).json({
        success: true,
        data: services,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: count,
          itemsPerPage: limit,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      });
    } catch (error) {
      console.error("Error fetching services:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching services",
        error: error.message,
      });
    }
  },

  // Get service by ID
  getServiceById: async (req, res) => {
    try {
      const { id } = req.params;
      const service = await Service.findByPk(id);

      if (!service) {
        return res.status(404).json({
          success: false,
          message: "Service not found",
        });
      }

      res.status(200).json({
        success: true,
        data: service,
      });
    } catch (error) {
      console.error("Error fetching service:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching service",
        error: error.message,
      });
    }
  },

  // Update service
  updateService: async (req, res) => {
    try {
      const { id } = req.params;
      const { name, description, type, duration, isActive } = req.body;

      const service = await Service.findByPk(id);

      if (!service) {
        return res.status(404).json({
          success: false,
          message: "Service not found",
        });
      }

      await service.update({
        name,
        description,
        type,
        duration,
        isActive,
      });

      res.status(200).json({
        success: true,
        data: service,
        message: "Service updated successfully",
      });
    } catch (error) {
      console.error("Error updating service:", error);
      res.status(500).json({
        success: false,
        message: "Error updating service",
        error: error.message,
      });
    }
  },

  // Delete service
  deleteService: async (req, res) => {
    try {
      const { id } = req.params;
      const service = await Service.findByPk(id);

      if (!service) {
        return res.status(404).json({
          success: false,
          message: "Service not found",
        });
      }

      await service.destroy();

      res.status(200).json({
        success: true,
        message: "Service deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting service:", error);
      res.status(500).json({
        success: false,
        message: "Error deleting service",
        error: error.message,
      });
    }
  },

  // Book a service
  bookService: async (req, res) => {
    try {
      const { id } = req.params;
      const {
        contactName,
        contactEmail,
        contactPhone,
        eventDate,
        type,
        name,
        description,
        duration,
      } = req.body;

      const service = await Service.findByPk(id);

      if (!service) {
        return res.status(404).json({
          success: false,
          message: "Service not found",
        });
      }

      // Update service with contact details and service information
      await service.update({
        contactName,
        contactEmail,
        contactPhone,
        eventDate,
        type,
        name,
        description,
        duration,
      });

      res.status(200).json({
        success: true,
        data: service,
        message: "Service booked successfully",
      });
    } catch (error) {
      console.error("Error booking service:", error);
      res.status(500).json({
        success: false,
        message: "Error booking service",
        error: error.message,
      });
    }
  },
};

module.exports = serviceController;
