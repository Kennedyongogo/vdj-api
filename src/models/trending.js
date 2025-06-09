const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Trending = sequelize.define(
  "trending",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    contentType: {
      type: DataTypes.ENUM("event", "mix"),
      allowNull: false,
    },
    contentId: {
      type: DataTypes.UUID,
      allowNull: false,
      // This will reference either event.id or mix.id
    },
    score: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
      // This will be calculated based on various factors
    },
    viewCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    engagementCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      // Tracks likes, shares, comments, etc.
    },
    trendingPeriod: {
      type: DataTypes.ENUM("daily", "weekly", "monthly"),
      defaultValue: "daily",
    },
    lastUpdated: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
      // Additional data like trending reasons, category, etc.
    },
  },
  {
    timestamps: true,
    indexes: [
      {
        fields: ["contentType", "contentId"],
      },
      {
        fields: ["score"],
      },
      {
        fields: ["trendingPeriod"],
      },
    ],
  }
);

module.exports = Trending;
