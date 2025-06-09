const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const TrendingComment = sequelize.define(
  "trending_comment",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    trendingId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  },
  {
    timestamps: true,
    indexes: [{ fields: ["trendingId"] }],
  }
);

module.exports = TrendingComment;
