const Trending = require("../models/trending");
const Event = require("../models/event");
const Mix = require("../models/mix");
const { Op } = require("sequelize");
const TrendingLike = require("../models/trendingLike");
const TrendingComment = require("../models/trendingComment");

const trendingController = {
  // Create or update trending entry
  createOrUpdateTrending: async (req, res) => {
    try {
      const {
        contentType,
        contentId,
        score,
        viewCount,
        engagementCount,
        trendingPeriod,
        metadata,
      } = req.body;

      // Validate content type and ID
      if (!["event", "mix"].includes(contentType)) {
        return res.status(400).json({
          success: false,
          message: "Invalid content type. Must be either 'event' or 'mix'",
        });
      }

      // Check if content exists
      const content =
        contentType === "event"
          ? await Event.findByPk(contentId)
          : await Mix.findByPk(contentId);

      if (!content) {
        return res.status(404).json({
          success: false,
          message: `${contentType} not found`,
        });
      }

      // Find existing trending entry or create new one
      const [trending, created] = await Trending.findOrCreate({
        where: {
          contentType,
          contentId,
          trendingPeriod,
        },
        defaults: {
          score,
          viewCount,
          engagementCount,
          metadata,
        },
      });

      if (!created) {
        // Update existing trending entry
        await trending.update({
          score,
          viewCount,
          engagementCount,
          metadata,
          lastUpdated: new Date(),
        });
      }

      // Include the related content in the response
      const includeOptions =
        contentType === "event"
          ? [{ model: Event, as: "event" }]
          : [{ model: Mix, as: "mix" }];

      const updatedTrending = await Trending.findByPk(trending.id, {
        include: includeOptions,
      });

      res.status(created ? 201 : 200).json({
        success: true,
        data: updatedTrending,
        message: created
          ? "Trending entry created successfully"
          : "Trending entry updated successfully",
      });
    } catch (error) {
      console.error("Error creating/updating trending:", error);
      res.status(500).json({
        success: false,
        message: "Error creating/updating trending",
        error: error.message,
      });
    }
  },

  // Get all trending items
  getAllTrending: async (req, res) => {
    try {
      const { period = "daily", limit = 10 } = req.query;

      const trendingItems = await Trending.findAll({
        where: {
          trendingPeriod: period,
          isActive: true,
        },
        include: [
          {
            model: Event,
            as: "event",
            required: false,
            where: {
              id: { [Op.col]: "trending.contentId" },
            },
            attributes: [
              "id",
              "name",
              "description",
              "venue",
              "venueAddress",
              "startDate",
              "endDate",
              "bannerUrl",
              "ticketPrice",
              "currency",
              "isPublic",
              "status",
              "djId",
              "eventHosts",
              "tags",
              "socialLinks",
            ],
          },
          {
            model: Mix,
            as: "mix",
            required: false,
            where: {
              id: { [Op.col]: "trending.contentId" },
            },
            attributes: [
              "id",
              "title",
              "description",
              "fileUrl",
              "fileType",
              "duration",
              "size",
              "djId",
              "isPublic",
              "downloadCount",
              "playCount",
            ],
          },
        ],
        order: [["score", "DESC"]],
        limit: parseInt(limit),
      });

      // Add like and comment counts to each trending item
      const formattedItems = await Promise.all(
        trendingItems.map(async (item) => {
          const formattedItem = item.toJSON();
          if (item.contentType === "event" && item.event) {
            formattedItem.content = item.event;
            delete formattedItem.event;
            delete formattedItem.mix;
          } else if (item.contentType === "mix" && item.mix) {
            formattedItem.content = item.mix;
            delete formattedItem.event;
            delete formattedItem.mix;
          }
          // Add like and comment counts
          formattedItem.likeCount = await TrendingLike.count({
            where: { trendingId: item.id },
          });
          formattedItem.commentCount = await TrendingComment.count({
            where: { trendingId: item.id },
          });
          return formattedItem;
        })
      );

      res.status(200).json({
        success: true,
        data: formattedItems,
      });
    } catch (error) {
      console.error("Error fetching trending items:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching trending items",
        error: error.message,
      });
    }
  },

  // Get trending items by content type
  getTrendingByType: async (req, res) => {
    try {
      const { type, period = "daily", limit = 10 } = req.query;

      if (!["event", "mix"].includes(type)) {
        return res.status(400).json({
          success: false,
          message: "Invalid content type. Must be either 'event' or 'mix'",
        });
      }

      const trendingItems = await Trending.findAll({
        where: {
          contentType: type,
          trendingPeriod: period,
          isActive: true,
        },
        include: [{ model: type === "event" ? Event : Mix, as: type }],
        order: [["score", "DESC"]],
        limit: parseInt(limit),
      });

      res.status(200).json({
        success: true,
        data: trendingItems,
      });
    } catch (error) {
      console.error("Error fetching trending items by type:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching trending items by type",
        error: error.message,
      });
    }
  },

  // Update trending metrics
  updateTrendingMetrics: async (req, res) => {
    try {
      const { id } = req.params;
      const { viewCount, engagementCount } = req.body;

      const trending = await Trending.findByPk(id);

      if (!trending) {
        return res.status(404).json({
          success: false,
          message: "Trending entry not found",
        });
      }

      // Calculate new score based on updated metrics
      const newScore = calculateTrendingScore(
        viewCount || trending.viewCount,
        engagementCount || trending.engagementCount
      );

      await trending.update({
        viewCount: viewCount || trending.viewCount,
        engagementCount: engagementCount || trending.engagementCount,
        score: newScore,
        lastUpdated: new Date(),
      });

      res.status(200).json({
        success: true,
        data: trending,
        message: "Trending metrics updated successfully",
      });
    } catch (error) {
      console.error("Error updating trending metrics:", error);
      res.status(500).json({
        success: false,
        message: "Error updating trending metrics",
        error: error.message,
      });
    }
  },

  // Delete trending entry
  deleteTrending: async (req, res) => {
    try {
      const { id } = req.params;
      const trending = await Trending.findByPk(id);

      if (!trending) {
        return res.status(404).json({
          success: false,
          message: "Trending entry not found",
        });
      }

      await trending.destroy();

      res.status(200).json({
        success: true,
        message: "Trending entry deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting trending entry:", error);
      res.status(500).json({
        success: false,
        message: "Error deleting trending entry",
        error: error.message,
      });
    }
  },

  // Get trending status for specific content
  getContentTrendingStatus: async (req, res) => {
    try {
      const { contentType, contentId } = req.params;

      if (!["event", "mix"].includes(contentType)) {
        return res.status(400).json({
          success: false,
          message: "Invalid content type. Must be either 'event' or 'mix'",
        });
      }

      const trendingStatus = await Trending.findAll({
        where: {
          contentType,
          contentId,
        },
        include: [
          { model: contentType === "event" ? Event : Mix, as: contentType },
        ],
      });

      res.status(200).json({
        success: true,
        data: trendingStatus,
      });
    } catch (error) {
      console.error("Error fetching content trending status:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching content trending status",
        error: error.message,
      });
    }
  },

  // Increment view count for a trending item
  incrementViewCount: async (req, res) => {
    try {
      const { id } = req.params;
      const trending = await Trending.findByPk(id);
      if (!trending) {
        return res
          .status(404)
          .json({ success: false, message: "Trending entry not found" });
      }
      trending.viewCount += 1;
      trending.score = calculateTrendingScore(
        trending.viewCount,
        trending.engagementCount
      );
      trending.lastUpdated = new Date();
      await trending.save();
      res.status(200).json({ success: true, data: trending });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error incrementing view count",
        error: error.message,
      });
    }
  },

  // Increment engagement count for a trending item
  incrementEngagementCount: async (req, res) => {
    try {
      const { id } = req.params;
      const trending = await Trending.findByPk(id);
      if (!trending) {
        return res
          .status(404)
          .json({ success: false, message: "Trending entry not found" });
      }
      trending.engagementCount += 1;
      trending.score = calculateTrendingScore(
        trending.viewCount,
        trending.engagementCount
      );
      trending.lastUpdated = new Date();
      await trending.save();
      res.status(200).json({ success: true, data: trending });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error incrementing engagement count",
        error: error.message,
      });
    }
  },

  // Like a trending item
  likeTrending: async (req, res) => {
    const { id } = req.params; // trendingId
    try {
      const trending = await Trending.findByPk(id);
      if (!trending) {
        return res
          .status(404)
          .json({ success: false, message: "Trending item not found" });
      }

      const like = await TrendingLike.create({ trendingId: id });

      // Increment engagement count and update score
      trending.engagementCount += 1;
      trending.score = calculateTrendingScore(
        trending.viewCount,
        trending.engagementCount
      );
      trending.lastUpdated = new Date();
      await trending.save();

      res.status(201).json({ success: true, data: like });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error liking",
        error: error.message,
      });
    }
  },

  // Unlike a trending item
  unlikeTrending: async (req, res) => {
    const { id } = req.params;
    try {
      const trending = await Trending.findByPk(id);
      if (!trending) {
        return res
          .status(404)
          .json({ success: false, message: "Trending item not found" });
      }

      const deleted = await TrendingLike.destroy({ where: { trendingId: id } });
      if (!deleted) {
        return res
          .status(404)
          .json({ success: false, message: "Like not found" });
      }

      // Decrement engagement count and update score
      trending.engagementCount = Math.max(0, trending.engagementCount - 1);
      trending.score = calculateTrendingScore(
        trending.viewCount,
        trending.engagementCount
      );
      trending.lastUpdated = new Date();
      await trending.save();

      res.status(200).json({ success: true, message: "Unliked" });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error unliking",
        error: error.message,
      });
    }
  },

  // Add a comment
  addComment: async (req, res) => {
    const { id } = req.params;
    const { comment } = req.body;
    try {
      const trending = await Trending.findByPk(id);
      if (!trending) {
        return res
          .status(404)
          .json({ success: false, message: "Trending item not found" });
      }

      const newComment = await TrendingComment.create({
        trendingId: id,
        comment,
      });

      // Increment engagement count and update score
      trending.engagementCount += 1;
      trending.score = calculateTrendingScore(
        trending.viewCount,
        trending.engagementCount
      );
      trending.lastUpdated = new Date();
      await trending.save();

      res.status(201).json({ success: true, data: newComment });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error commenting",
        error: error.message,
      });
    }
  },

  // Get comments for a trending item
  getComments: async (req, res) => {
    const { id } = req.params;
    try {
      const comments = await TrendingComment.findAll({
        where: { trendingId: id },
        order: [["createdAt", "DESC"]],
      });
      res.status(200).json({ success: true, data: comments });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error fetching comments",
        error: error.message,
      });
    }
  },
};

// Helper function to calculate trending score
function calculateTrendingScore(viewCount, engagementCount) {
  // You can adjust these weights based on your requirements
  const viewWeight = 0.4;
  const engagementWeight = 0.6;

  // Normalize the counts (you might want to adjust this based on your data)
  const normalizedViews = Math.log10(viewCount + 1);
  const normalizedEngagement = Math.log10(engagementCount + 1);

  // Calculate weighted score
  return normalizedViews * viewWeight + normalizedEngagement * engagementWeight;
}

module.exports = trendingController;
