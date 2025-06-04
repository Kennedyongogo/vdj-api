const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const News = sequelize.define(
  "news",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    mediaType: {
      type: DataTypes.ENUM("image", "video"),
      allowNull: true,
    },
    mediaUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("pending", "approved", "rejected"),
      defaultValue: "pending",
    },
    rejectionReason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    sourceVerification: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    publishedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    category: {
      type: DataTypes.ENUM(
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
        "Editorial & Opinion"
      ),
      allowNull: false,
    },
    tags: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
    },
    reporterId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
    approvedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "admins",
        key: "id",
      },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = News;
