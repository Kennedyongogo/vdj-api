const Mix = require("./mix");
const Admin = require("./admin");
const Event = require("./event");
const Trending = require("./trending");
const TrendingLike = require("./trendingLike");
const TrendingComment = require("./trendingComment");

// Define associations
const defineAssociations = () => {
  // Mix belongs to Admin (DJ)
  Mix.belongsTo(Admin, {
    foreignKey: "djId",
    as: "admin",
  });

  // Admin has many Mixes
  Admin.hasMany(Mix, {
    foreignKey: "djId",
    as: "mixes",
  });

  // Event belongs to Admin (DJ)
  Event.belongsTo(Admin, {
    foreignKey: "djId",
    as: "admin",
  });

  // Admin has many Events
  Admin.hasMany(Event, {
    foreignKey: "djId",
    as: "events",
  });

  // Trending associations
  Trending.belongsTo(Event, {
    foreignKey: "contentId",
    constraints: false,
    as: "event",
  });

  Trending.belongsTo(Mix, {
    foreignKey: "contentId",
    constraints: false,
    as: "mix",
  });

  // Event has many Trending entries
  Event.hasMany(Trending, {
    foreignKey: "contentId",
    constraints: false,
    as: "trending",
  });

  // Mix has many Trending entries
  Mix.hasMany(Trending, {
    foreignKey: "contentId",
    constraints: false,
    as: "trending",
  });

  // Trending has many Likes and Comments
  Trending.hasMany(TrendingLike, { foreignKey: "trendingId", as: "likes" });
  TrendingLike.belongsTo(Trending, { foreignKey: "trendingId" });

  Trending.hasMany(TrendingComment, {
    foreignKey: "trendingId",
    as: "comments",
  });
  TrendingComment.belongsTo(Trending, { foreignKey: "trendingId" });
};

module.exports = defineAssociations;
