const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Event = sequelize.define(
  "event",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    venue: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    venueAddress: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    bannerUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    ticketPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    currency: {
      type: DataTypes.STRING,
      defaultValue: "KES",
    },
    isPublic: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    status: {
      type: DataTypes.ENUM("draft", "published", "cancelled", "completed"),
      defaultValue: "draft",
    },
    djId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "admins",
        key: "id",
      },
    },
    // Store event hosts as a JSON array
    eventHosts: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
      // This will store an array of host objects with properties like name, role, contact, etc.
    },
    // Additional metadata
    tags: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
    },
    socialLinks: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {},
    },
  },
  {
    timestamps: true,
  }
);

module.exports = Event;
