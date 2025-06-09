const jwt = require("jsonwebtoken");
const Admin = require("../models/admin");

// JWT secret key from environment variables
const JWT_SECRET = process.env.JWT_SECRET;

// Middleware to verify JWT token and authenticate admin
const adminMiddleware = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No authentication token, access denied",
      });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Check if token has admin flag
    if (!decoded.isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin privileges required",
      });
    }

    // Find admin by id
    const admin = await Admin.findByPk(decoded.id);

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Admin not found",
      });
    }

    // Add admin to request object
    req.user = admin;
    req.user.isAdmin = true;
    next();
  } catch (error) {
    console.error("Admin authentication error:", error);
    res.status(401).json({
      success: false,
      message: "Token is invalid or expired",
    });
  }
};

module.exports = {
  adminMiddleware,
};
