const express = require("express");
const cors = require("cors");
const path = require("path");
const app = express();

// CORS configuration
app.use(
  cors({
    origin: [
      "http://38.242.243.113:4036",
      "http://localhost:3000",
      "http://localhost:3001",
      "http://38.242.243.113:4037",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  })
);

// Parse JSON bodies
app.use(express.json());

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

// Serve static files from the uploads directory
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Import routes
const userRoutes = require("./src/routes/userRoutes");
const adminRoutes = require("./src/routes/adminRoutes");
const newsRoutes = require("./src/routes/newsRoutes");

// Use routes
app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/news", newsRoutes);
app.use("/api/admin", adminRoutes);

// 404 Route handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: "Something went wrong!",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

module.exports = app;
