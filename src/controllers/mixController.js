const Mix = require("../models/mix");
const Admin = require("../models/admin");
const { Op } = require("sequelize");
const fs = require("fs");
const path = require("path");

const mixController = {
  // Create a new mix
  createMix: async (req, res) => {
    try {
      const { title, description, fileType, duration, isPublic } = req.body;

      // Get DJ ID from authenticated user
      const djId = req.user.id;

      // Check if file was uploaded
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No file uploaded",
        });
      }

      // Get file size in bytes
      const size = req.file.size;

      // Create file URL
      const fileUrl = `/uploads/${req.file.filename}`;

      const mix = await Mix.create({
        title,
        description,
        fileUrl,
        fileType,
        duration,
        size,
        djId,
        isPublic,
      });

      res.status(201).json({
        success: true,
        data: mix,
        message: "Mix created successfully",
      });
    } catch (error) {
      // If there's an error, delete the uploaded file
      if (req.file) {
        const filePath = path.join(
          __dirname,
          "../../uploads",
          req.file.filename
        );
        fs.unlink(filePath, (err) => {
          if (err) console.error("Error deleting file:", err);
        });
      }

      console.error("Error creating mix:", error);
      res.status(500).json({
        success: false,
        message: "Error creating mix",
        error: error.message,
      });
    }
  },

  // Get all mixes
  getAllMixes: async (req, res) => {
    try {
      const mixes = await Mix.findAll({
        include: [
          {
            model: Admin,
            as: "admin",
            attributes: ["username", "email"],
          },
        ],
        order: [["createdAt", "DESC"]],
      });

      res.status(200).json({
        success: true,
        data: mixes,
      });
    } catch (error) {
      console.error("Error fetching mixes:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching mixes",
        error: error.message,
      });
    }
  },

  // Get mix by ID
  getMixById: async (req, res) => {
    try {
      const { id } = req.params;
      const mix = await Mix.findByPk(id, {
        include: [
          {
            model: Admin,
            as: "admin",
            attributes: ["username", "email"],
          },
        ],
      });

      if (!mix) {
        return res.status(404).json({
          success: false,
          message: "Mix not found",
        });
      }

      // Increment play count
      await mix.increment("playCount");

      res.status(200).json({
        success: true,
        data: mix,
      });
    } catch (error) {
      console.error("Error fetching mix:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching mix",
        error: error.message,
      });
    }
  },

  // Update mix
  updateMix: async (req, res) => {
    try {
      const { id } = req.params;
      const {
        title,
        description,
        fileUrl,
        fileType,
        duration,
        size,
        isPublic,
      } = req.body;

      const mix = await Mix.findByPk(id);

      if (!mix) {
        return res.status(404).json({
          success: false,
          message: "Mix not found",
        });
      }

      // Check if the authenticated user is the owner of the mix
      if (mix.djId !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to update this mix",
        });
      }

      await mix.update({
        title,
        description,
        fileUrl,
        fileType,
        duration,
        size,
        isPublic,
      });

      res.status(200).json({
        success: true,
        data: mix,
        message: "Mix updated successfully",
      });
    } catch (error) {
      console.error("Error updating mix:", error);
      res.status(500).json({
        success: false,
        message: "Error updating mix",
        error: error.message,
      });
    }
  },

  // Delete mix
  deleteMix: async (req, res) => {
    try {
      const { id } = req.params;
      const mix = await Mix.findByPk(id);

      if (!mix) {
        return res.status(404).json({
          success: false,
          message: "Mix not found",
        });
      }

      // Check if the authenticated user is the owner of the mix
      if (mix.djId !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to delete this mix",
        });
      }

      await mix.destroy();

      res.status(200).json({
        success: true,
        message: "Mix deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting mix:", error);
      res.status(500).json({
        success: false,
        message: "Error deleting mix",
        error: error.message,
      });
    }
  },

  // Get mixes by DJ
  getMixesByDJ: async (req, res) => {
    try {
      const { djId } = req.params;
      const mixes = await Mix.findAll({
        where: { djId },
        include: [
          {
            model: Admin,
            attributes: ["username", "email"],
          },
        ],
        order: [["createdAt", "DESC"]],
      });

      res.status(200).json({
        success: true,
        data: mixes,
      });
    } catch (error) {
      console.error("Error fetching DJ mixes:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching DJ mixes",
        error: error.message,
      });
    }
  },

  // Increment download count
  incrementDownloadCount: async (req, res) => {
    try {
      const { id } = req.params;
      const mix = await Mix.findByPk(id);

      if (!mix) {
        return res.status(404).json({
          success: false,
          message: "Mix not found",
        });
      }

      await mix.increment("downloadCount");

      res.status(200).json({
        success: true,
        message: "Download count incremented successfully",
      });
    } catch (error) {
      console.error("Error incrementing download count:", error);
      res.status(500).json({
        success: false,
        message: "Error incrementing download count",
        error: error.message,
      });
    }
  },

  // Download mix file
  downloadMix: async (req, res) => {
    try {
      const { id } = req.params;
      const mix = await Mix.findByPk(id);

      if (!mix) {
        return res.status(404).json({
          success: false,
          message: "Mix not found",
        });
      }

      const filePath = path.join(
        __dirname,
        "../../uploads",
        path.basename(mix.fileUrl)
      );

      // Check if file exists
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          success: false,
          message: "File not found",
        });
      }

      // Set headers for file download
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${path.basename(mix.fileUrl)}"`
      );
      res.setHeader(
        "Content-Type",
        mix.fileType === "audio" ? "audio/mpeg" : "video/mp4"
      );

      // Stream the file
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);

      // Increment download count
      await mix.increment("downloadCount");
    } catch (error) {
      console.error("Error downloading mix:", error);
      res.status(500).json({
        success: false,
        message: "Error downloading mix",
        error: error.message,
      });
    }
  },
};

module.exports = mixController;
