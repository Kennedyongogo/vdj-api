const User = require("./user");
const News = require("./news");
const Admin = require("./admin");
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

// Create a junction table for the many-to-many relationship
const AdminUser = sequelize.define(
  "AdminUser",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
  },
  {
    timestamps: true,
  }
);

const clearUserData = async (options = {}) => {
  try {
    const {
      clearNews = false,
      clearAssociations = false,
      clearUsers = false,
    } = options;

    if (clearNews) {
      await News.destroy({ where: {}, force: true });
      console.log("News data cleared successfully");
    }

    if (clearAssociations) {
      await AdminUser.destroy({ where: {}, force: true });
      console.log("Associations data cleared successfully");
    }

    if (clearUsers) {
      await User.destroy({ where: {}, force: true });
      console.log("Users data cleared successfully");
    }
  } catch (error) {
    console.error("Error clearing data:", error);
    throw error;
  }
};

const initializeAssociations = async (options = {}) => {
  try {
    const { clearData = false, clearOptions = {} } = options;

    // Sync models in order
    await User.sync({ alter: false });
    await Admin.sync({ alter: false });
    await News.sync({ alter: false });
    await AdminUser.sync({ alter: false });

    // Clear data if requested
    if (clearData) {
      await clearUserData(clearOptions);
    }

    // Define many-to-many associations
    Admin.belongsToMany(User, {
      through: AdminUser,
      as: "managedUsers",
    });

    User.belongsToMany(Admin, {
      through: AdminUser,
      as: "managingAdmins",
    });

    // User (Reporter) - News relationship
    User.hasMany(News, {
      foreignKey: "reporterId",
      as: "news",
      onDelete: "CASCADE",
    });
    News.belongsTo(User, {
      foreignKey: "reporterId",
      as: "reporter",
    });

    // Admin - News relationship (for approvals)
    Admin.hasMany(News, {
      foreignKey: "approvedBy",
      as: "approvedNews",
      onDelete: "SET NULL",
    });
    News.belongsTo(Admin, {
      foreignKey: "approvedBy",
      as: "approver",
    });

    console.log("Database associations initialized successfully");
  } catch (error) {
    console.error("Error in associations:", error);
    throw error;
  }
};

module.exports = { initializeAssociations, clearUserData };
