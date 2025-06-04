const dotenv = require("dotenv");
dotenv.config();
const http = require("http");
const app = require("./app");
const sequelize = require("./src/config/database");
const adminController = require("./src/controllers/adminController");
const { initializeAssociations } = require("./src/models/associations");

const server = http.createServer(app);

const PORT = process.env.PORT || 3003;

// Create an async function to start the server
const startServer = async () => {
  try {
    // Sync database models
    await sequelize.sync();
    console.log("Database models synchronized");

    // Initialize associations with data clearing
    await initializeAssociations({
      clearData: false,
      clearOptions: {
        clearUsers: false,
        clearNews: false,
        clearAssociations: false,
      },
    });
    console.log("Database associations initialized");

    // Initialize admin accounts
    await adminController.initializeAdmin();
    console.log("Admin accounts initialized");

    // Start the server
    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

// Call the async function to start everything
startServer();
