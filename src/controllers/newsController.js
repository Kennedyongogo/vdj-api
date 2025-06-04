const { Op } = require("sequelize");
const News = require("../models/news");
const User = require("../models/user");
const Admin = require("../models/admin");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { sendEmail } = require("../utils/emailService");

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Use project root uploads directory
    const uploadDir = path.join(process.cwd(), "uploads");
    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype.startsWith("image/") ||
      file.mimetype.startsWith("video/")
    ) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only images and videos are allowed."));
    }
  },
}).single("media");

const newsController = {
  // Create new news article (for users)
  createNews: async (req, res) => {
    upload(req, res, async function (err) {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message,
        });
      }

      try {
        const {
          title,
          content,
          mediaType,
          category,
          tags,
          sourceVerification,
        } = req.body;

        // Validate category
        const validCategories = [
          "Politics",
          "Business & Economy",
          "Technology",
          "Health",
          "Education",
          "Science",
          "Environment",
          "Sports",
          "Entertainment",
          "Lifestyle",
          "Crime & Law",
          "Religion & Spirituality",
          "International (World)",
          "Local/Regional News",
          "Editorial & Opinion",
        ];

        if (!validCategories.includes(category)) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid category. Please select from the valid categories.",
            validCategories: validCategories,
          });
        }

        // Get reporter ID from authenticated user
        const reporterId = req.user.id;

        // Handle file upload
        let mediaUrl = null;
        if (req.file) {
          // Create URL for the uploaded file
          const fileUrl = `/uploads/${req.file.filename}`;
          mediaUrl = fileUrl;
        }

        const news = await News.create({
          title,
          content,
          mediaType,
          mediaUrl,
          category,
          tags: JSON.parse(tags),
          sourceVerification,
          reporterId,
          status: "pending", // Initial status
        });

        // Get reporter details
        const reporter = await User.findByPk(reporterId);

        // Get all admin emails
        const admins = await Admin.findAll({
          attributes: ["email", "username"],
        });

        // Prepare email content
        const emailSubject = `New News Article Pending Approval: ${title}`;
        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #19bdb7;">New Article for Review</h2>
            <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px;">
              <p style="margin: 10px 0;"><strong>Title:</strong> ${title}</p>
              <p style="margin: 10px 0;"><strong>Category:</strong> ${category}</p>
              <p style="margin: 10px 0;"><strong>Reporter:</strong> ${
                reporter.username
              } (${reporter.email})</p>
              ${
                sourceVerification
                  ? `<p style="margin: 10px 0;"><strong>Source Verification:</strong> ${sourceVerification}</p>`
                  : ""
              }
              <p style="margin: 10px 0;"><strong>Tags:</strong> ${JSON.parse(
                tags
              ).join(", ")}</p>
              <p style="margin: 10px 0;"><strong>Content Preview:</strong> ${content.substring(
                0,
                200
              )}...</p>
              ${
                mediaUrl
                  ? `<p style="margin: 10px 0;"><strong>Media:</strong> ${mediaUrl}</p>`
                  : ""
              }
            </div>
            <p style="margin-top: 20px; color: #666;">Please review and take action on this article at your earliest convenience.</p>
            <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 12px;">
              <p>This is an automated notification from the ARIP News System.</p>
            </div>
          </div>
        `;

        // Send email to all admins
        for (const admin of admins) {
          await sendEmail(admin.email, emailSubject, emailHtml);
        }

        res.status(201).json({
          success: true,
          data: news,
          message: "News article submitted successfully and pending approval",
        });
      } catch (error) {
        console.error("Error creating news:", error);
        res.status(500).json({
          success: false,
          message: "Error creating news article",
          error: error.message,
        });
      }
    });
  },

  // Approve news article (for admins)
  approveNews: async (req, res) => {
    try {
      const { id } = req.params;
      const adminId = req.user.id; // Get admin ID from authenticated user

      const news = await News.findByPk(id, {
        include: [
          {
            model: User,
            as: "reporter",
            attributes: ["id", "username", "email"],
          },
        ],
      });

      if (!news) {
        return res.status(404).json({
          success: false,
          message: "News article not found",
        });
      }

      if (news.status !== "pending") {
        return res.status(400).json({
          success: false,
          message: "Only pending news can be approved",
        });
      }

      await news.update({
        status: "approved",
        approvedBy: adminId,
        publishedAt: new Date(),
      });

      // Send email notification to the reporter
      const emailSubject = `Your News Article Has Been Approved: ${news.title}`;
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #19bdb7;">Great News! Your Article Has Been Approved</h2>
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px;">
            <p style="margin: 10px 0;"><strong>Title:</strong> ${news.title}</p>
            <p style="margin: 10px 0;"><strong>Category:</strong> ${
              news.category
            }</p>
            <p style="margin: 10px 0;"><strong>Published At:</strong> ${new Date().toLocaleString()}</p>
          </div>
          <p style="margin-top: 20px; color: #666;">Your article is now live and visible to all users. Thank you for contributing to our platform!</p>
          <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 12px;">
            <p>This is an automated notification from the ARIP News System.</p>
          </div>
        </div>
      `;

      await sendEmail(news.reporter.email, emailSubject, emailHtml);

      res.status(200).json({
        success: true,
        data: news,
        message: "News article approved successfully",
      });
    } catch (error) {
      console.error("Error approving news:", error);
      res.status(500).json({
        success: false,
        message: "Error approving news article",
        error: error.message,
      });
    }
  },

  // Reject news article (for admins)
  rejectNews: async (req, res) => {
    try {
      const { id } = req.params;
      const { rejectionReason } = req.body;
      const adminId = req.user.id;

      const news = await News.findByPk(id, {
        include: [
          {
            model: User,
            as: "reporter",
            attributes: ["id", "username", "email"],
          },
        ],
      });

      if (!news) {
        return res.status(404).json({
          success: false,
          message: "News article not found",
        });
      }

      if (news.status !== "pending") {
        return res.status(400).json({
          success: false,
          message: "Only pending news can be rejected",
        });
      }

      await news.update({
        status: "rejected",
        approvedBy: adminId,
        rejectionReason,
      });

      // Send email notification to the reporter
      const emailSubject = `Your News Article Requires Changes: ${news.title}`;
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #e74c3c;">Article Review Update</h2>
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px;">
            <p style="margin: 10px 0;"><strong>Title:</strong> ${news.title}</p>
            <p style="margin: 10px 0;"><strong>Category:</strong> ${news.category}</p>
            <p style="margin: 10px 0;"><strong>Rejection Reason:</strong> ${rejectionReason}</p>
          </div>
          <p style="margin-top: 20px; color: #666;">Please review the feedback and make the necessary changes to your article. You can submit a new version after making the required modifications.</p>
          <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 12px;">
            <p>This is an automated notification from the ARIP News System.</p>
          </div>
        </div>
      `;

      await sendEmail(news.reporter.email, emailSubject, emailHtml);

      res.status(200).json({
        success: true,
        data: news,
        message: "News article rejected successfully",
      });
    } catch (error) {
      console.error("Error rejecting news:", error);
      res.status(500).json({
        success: false,
        message: "Error rejecting news article",
        error: error.message,
      });
    }
  },

  // Get all news (public and authenticated)
  getApprovedNews: async (req, res) => {
    try {
      const { page = 1, limit = 10, category, tags, search } = req.query;

      const offset = (page - 1) * limit;
      const where = {};

      // If user is not authenticated, only show approved news
      if (!req.user) {
        where.status = "approved";
      }

      // Add category filter if provided
      if (category) {
        where.category = category;
      }

      // Add tags filter if provided
      if (tags) {
        const tagArray = tags.split(",");
        where.tags = { [Op.overlap]: tagArray };
      }

      // Add search filter if provided
      if (search) {
        where[Op.or] = [
          { title: { [Op.iLike]: `%${search}%` } },
          { content: { [Op.iLike]: `%${search}%` } },
        ];
      }

      const { count, rows: news } = await News.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [["createdAt", "DESC"]],
        include: [
          {
            model: User,
            as: "reporter",
            attributes: ["id", "username", "email"],
          },
          {
            model: Admin,
            as: "approver",
            attributes: ["id", "username", "email"],
          },
        ],
      });

      res.status(200).json({
        success: true,
        data: news,
        pagination: {
          total: count,
          page: parseInt(page),
          pages: Math.ceil(count / limit),
        },
      });
    } catch (error) {
      console.error("Error fetching news:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching news articles",
        error: error.message,
      });
    }
  },

  // Get pending news (for admins and users)
  getPendingNews: async (req, res) => {
    try {
      const { page = 1, limit = 10 } = req.query;
      const offset = (page - 1) * limit;

      // Build where clause based on user role
      const where = { status: "pending" };
      if (!req.user.isAdmin) {
        // If not admin, only show user's own pending news
        where.reporterId = req.user.id;
      }

      const { count, rows: news } = await News.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [["createdAt", "DESC"]],
        include: [
          {
            model: User,
            as: "reporter",
            attributes: ["id", "username", "email"],
          },
        ],
      });

      res.status(200).json({
        success: true,
        data: news,
        pagination: {
          total: count,
          page: parseInt(page),
          pages: Math.ceil(count / limit),
        },
      });
    } catch (error) {
      console.error("Error fetching pending news:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching pending news articles",
        error: error.message,
      });
    }
  },

  // Get single news article by ID
  getNewsById: async (req, res) => {
    try {
      const { id } = req.params;

      const news = await News.findByPk(id, {
        include: [
          {
            model: User,
            as: "reporter",
            attributes: ["id", "username", "email"],
          },
          {
            model: Admin,
            as: "approver",
            attributes: ["id", "username", "email"],
          },
        ],
      });

      if (!news) {
        return res.status(404).json({
          success: false,
          message: "News article not found",
        });
      }

      // Only return approved news to public
      if (news.status !== "approved" && !req.user?.isAdmin) {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        });
      }

      res.status(200).json({
        success: true,
        data: news,
      });
    } catch (error) {
      console.error("Error fetching news by ID:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching news article",
        error: error.message,
      });
    }
  },

  // Delete news article (for admins)
  deleteNews: async (req, res) => {
    try {
      const { id } = req.params;
      const adminId = req.user.id;

      const news = await News.findByPk(id);

      if (!news) {
        return res.status(404).json({
          success: false,
          message: "News article not found",
        });
      }

      // Log the deletion for audit purposes
      console.log(`News article ${id} deleted by admin ${adminId}`);

      // Delete the news article
      await news.destroy();

      res.status(200).json({
        success: true,
        message: "News article deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting news:", error);
      res.status(500).json({
        success: false,
        message: "Error deleting news article",
        error: error.message,
      });
    }
  },
};

module.exports = newsController;
