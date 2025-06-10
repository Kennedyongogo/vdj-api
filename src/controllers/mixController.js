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

  // Get mix statistics for charts and diagrams
  getMixStats: async (req, res) => {
    try {
      const mixes = await Mix.findAll();

      // Calculate statistics
      const stats = {
        // File type distribution (for pie chart)
        fileTypeDistribution: {
          audio: 0,
          video: 0,
          mp4: 0,
        },

        // Public vs Private distribution (for pie chart)
        publicPrivateDistribution: {
          public: 0,
          private: 0,
        },

        // Mixes by month and year (for bar chart)
        mixesByMonth: {},

        // Most downloaded mixes (for bar chart)
        mostDownloadedMixes: [],

        // Most played mixes (for bar chart)
        mostPlayedMixes: [],

        // Average file size by type
        avgFileSizeByType: {
          audio: 0,
          video: 0,
          mp4: 0,
        },

        // Total storage used
        totalStorageUsed: 0,

        // Total mixes count
        totalMixes: mixes.length,

        // Available years and months for filtering
        availableYears: new Set(),
        availableMonths: new Set(),
      };

      // Process each mix
      mixes.forEach((mix) => {
        // Count file type distribution
        stats.fileTypeDistribution[mix.fileType]++;

        // Count public vs private
        if (mix.isPublic) {
          stats.publicPrivateDistribution.public++;
        } else {
          stats.publicPrivateDistribution.private++;
        }

        // Count mixes by month and year
        const date = new Date(mix.createdAt);
        const year = date.getFullYear();
        const month = date.toLocaleString("default", { month: "long" });

        // Add to available years and months
        stats.availableYears.add(year);
        stats.availableMonths.add(month);

        // Create a key that includes both year and month
        const yearMonthKey = `${year}-${month}`;
        stats.mixesByMonth[yearMonthKey] =
          (stats.mixesByMonth[yearMonthKey] || 0) + 1;

        // Add to most downloaded and played mixes
        stats.mostDownloadedMixes.push({
          title: mix.title,
          downloadCount: mix.downloadCount,
        });

        stats.mostPlayedMixes.push({
          title: mix.title,
          playCount: mix.playCount,
        });

        // Calculate average file size by type
        if (mix.size) {
          stats.avgFileSizeByType[mix.fileType] += mix.size;
          stats.totalStorageUsed += mix.size;
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

      // Sort and limit most downloaded and played mixes
      stats.mostDownloadedMixes
        .sort((a, b) => b.downloadCount - a.downloadCount)
        .slice(0, 10);
      stats.mostPlayedMixes
        .sort((a, b) => b.playCount - a.playCount)
        .slice(0, 10);

      // Calculate final averages for file sizes
      Object.keys(stats.avgFileSizeByType).forEach((type) => {
        const count = stats.fileTypeDistribution[type];
        if (count > 0) {
          stats.avgFileSizeByType[type] = (
            stats.avgFileSizeByType[type] / count
          ).toFixed(2);
        }
      });

      // Format data for charts
      const chartData = {
        fileTypePieChart: Object.entries(stats.fileTypeDistribution).map(
          ([type, count]) => ({
            label: type.charAt(0).toUpperCase() + type.slice(1),
            value: count,
          })
        ),

        publicPrivatePieChart: Object.entries(
          stats.publicPrivateDistribution
        ).map(([type, count]) => ({
          label: type.charAt(0).toUpperCase() + type.slice(1),
          value: count,
        })),

        monthlyBarChart: Object.entries(stats.mixesByMonth).map(
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

        downloadedMixesBarChart: stats.mostDownloadedMixes.map((mix) => ({
          label: mix.title,
          value: mix.downloadCount,
        })),

        playedMixesBarChart: stats.mostPlayedMixes.map((mix) => ({
          label: mix.title,
          value: mix.playCount,
        })),

        fileSizeBarChart: Object.entries(stats.avgFileSizeByType).map(
          ([type, size]) => ({
            label: type.charAt(0).toUpperCase() + type.slice(1),
            value: parseFloat(size),
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
      console.error("Error fetching mix statistics:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching mix statistics",
        error: error.message,
      });
    }
  },
};

module.exports = mixController;
