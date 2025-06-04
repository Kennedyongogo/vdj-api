const { Sequelize } = require("sequelize");
require("dotenv").config();

const sequelize = new Sequelize(
  process.env.POSTGRES_DB || "Arip_db",
  process.env.POSTGRES_USER || "postgres",
  process.env.POSTGRES_PASSWORD || "Training@2025",
  {
    host: process.env.DB_HOST || "db",
    port: process.env.DB_PORT || 5432,
    dialect: "postgres",
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    retry: {
      max: 5,
      match: [
        /SequelizeConnectionRefusedError/,
        /SequelizeConnectionError/,
        /SequelizeHostNotFoundError/,
        /SequelizeConnectionTimedOutError/,
      ],
      backoffBase: 1000,
      backoffExponent: 1.5,
    },
  }
);

module.exports = sequelize;
