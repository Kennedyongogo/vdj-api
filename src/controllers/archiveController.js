const Archive = require("../models/archive");
const Admin = require("../models/admin");
const fs = require("fs");
const path = require("path");

const archiveController = {
  // Create a new archive entry
  createArchive: async (req, res) => {
    try {
      const {
        eventName,
        eventDate,
        venue,
        location,
        description,
        setlist,
        genre,
        attendance,
        isPublic,
      } = req.body;

      // Get DJ ID from authenticated user
      const djId = req.user.id;

      // Handle uploaded files
      const videos = req.files?.videos
        ? req.files.videos.map((file) => `/uploads/${file.filename}`)
        : [];
      const images = req.files?.images
        ? req.files.images.map((file) => `/uploads/${file.filename}`)
        : [];

      const archive = await Archive.create({
        eventName,
        eventDate,
        venue,
        location,
        description,
        videos,
        images,
        setlist,
        genre,
        attendance,
        isPublic,
        djId,
      });

      res.status(201).json({
        success: true,
        data: archive,
        message: "Archive entry created successfully",
      });
    } catch (error) {
      // If there's an error, delete any uploaded files
      if (req.files) {
        Object.values(req.files)
          .flat()
          .forEach((file) => {
            const filePath = path.join(
              __dirname,
              "../../uploads",
              file.filename
            );
            fs.unlink(filePath, (err) => {
              if (err) console.error("Error deleting file:", err);
            });
          });
      }

      console.error("Error creating archive:", error);
      res.status(500).json({
        success: false,
        message: "Error creating archive entry",
        error: error.message,
      });
    }
  },

  // Get all archive entries
  getAllArchives: async (req, res) => {
    try {
      const archives = await Archive.findAll({
        include: [
          {
            model: Admin,
            as: "admin",
            attributes: ["username", "email"],
          },
        ],
        order: [["eventDate", "DESC"]],
      });

      res.status(200).json({
        success: true,
        data: archives,
      });
    } catch (error) {
      console.error("Error fetching archives:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching archives",
        error: error.message,
      });
    }
  },

  // Get archive by ID
  getArchiveById: async (req, res) => {
    try {
      const { id } = req.params;
      const archive = await Archive.findByPk(id, {
        include: [
          {
            model: Admin,
            as: "admin",
            attributes: ["username", "email"],
          },
        ],
      });

      if (!archive) {
        return res.status(404).json({
          success: false,
          message: "Archive entry not found",
        });
      }

      res.status(200).json({
        success: true,
        data: archive,
      });
    } catch (error) {
      console.error("Error fetching archive:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching archive",
        error: error.message,
      });
    }
  },

  // Update archive
  updateArchive: async (req, res) => {
    try {
      const { id } = req.params;
      const {
        eventName,
        eventDate,
        venue,
        location,
        description,
        setlist,
        genre,
        attendance,
        isPublic,
      } = req.body;

      const archive = await Archive.findByPk(id);

      if (!archive) {
        return res.status(404).json({
          success: false,
          message: "Archive entry not found",
        });
      }

      // Check if the authenticated user is the owner
      if (archive.djId !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to update this archive entry",
        });
      }

      // Handle new file uploads
      const newVideos = req.files?.videos
        ? req.files.videos.map((file) => `/uploads/${file.filename}`)
        : [];
      const newImages = req.files?.images
        ? req.files.images.map((file) => `/uploads/${file.filename}`)
        : [];

      // Combine existing and new files
      const videos = [...archive.videos, ...newVideos];
      const images = [...archive.images, ...newImages];

      await archive.update({
        eventName,
        eventDate,
        venue,
        location,
        description,
        videos,
        images,
        setlist,
        genre,
        attendance,
        isPublic,
      });

      res.status(200).json({
        success: true,
        data: archive,
        message: "Archive entry updated successfully",
      });
    } catch (error) {
      console.error("Error updating archive:", error);
      res.status(500).json({
        success: false,
        message: "Error updating archive entry",
        error: error.message,
      });
    }
  },

  // Delete archive
  deleteArchive: async (req, res) => {
    try {
      const { id } = req.params;
      const archive = await Archive.findByPk(id);

      if (!archive) {
        return res.status(404).json({
          success: false,
          message: "Archive entry not found",
        });
      }

      // Check if the authenticated user is the owner
      if (archive.djId !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to delete this archive entry",
        });
      }

      // Delete associated files
      const deleteFiles = async (fileUrls) => {
        for (const url of fileUrls) {
          const filename = path.basename(url);
          const filePath = path.join(__dirname, "../../uploads", filename);
          try {
            await fs.promises.unlink(filePath);
          } catch (err) {
            console.error(`Error deleting file ${filename}:`, err);
          }
        }
      };

      await deleteFiles(archive.videos);
      await deleteFiles(archive.images);

      await archive.destroy();

      res.status(200).json({
        success: true,
        message: "Archive entry deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting archive:", error);
      res.status(500).json({
        success: false,
        message: "Error deleting archive entry",
        error: error.message,
      });
    }
  },

  // Get archives by DJ
  getArchivesByDJ: async (req, res) => {
    try {
      const { djId } = req.params;
      const archives = await Archive.findAll({
        where: { djId },
        include: [
          {
            model: Admin,
            as: "admin",
            attributes: ["username", "email"],
          },
        ],
        order: [["eventDate", "DESC"]],
      });

      res.status(200).json({
        success: true,
        data: archives,
      });
    } catch (error) {
      console.error("Error fetching DJ archives:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching DJ archives",
        error: error.message,
      });
    }
  },
};

module.exports = archiveController;
