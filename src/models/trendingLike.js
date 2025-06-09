const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const TrendingLike = sequelize.define(
  "trending_like",
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
  },
  {
    timestamps: true,
    indexes: [{ fields: ["trendingId"] }],
  }
);

module.exports = TrendingLike;
