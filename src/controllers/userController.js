const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { Op } = require("sequelize");
const User = require("../models/user");

// JWT secret key from environment variables
const JWT_SECRET = process.env.JWT_SECRET;

// JWT secret key - should be in environment variables in production
const userController = {
  // Register new user
  register: async (req, res) => {
    try {
      const { username, email, password, phoneNumber, latitude, longitude } =
        req.body;

      console.log("Registration attempt for:", {
        username,
        email,
        phoneNumber,
        latitude,
        longitude,
      });

      // Check if user already exists
      const existingUser = await User.findOne({
        where: {
          [Op.or]: [{ email: email }, { username: username }],
        },
      });

      if (existingUser) {
        console.log("User already exists:", {
          existingEmail: existingUser.email === email,
          existingUsername: existingUser.username === username,
        });
        return res.status(400).json({
          success: false,
          message: "User with this email or username already exists",
        });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Create new user
      const user = await User.create({
        username,
        email,
        password: hashedPassword,
        phoneNumber,
        latitude,
        longitude,
      });

      console.log("User created successfully:", {
        id: user.id,
        username: user.username,
        email: user.email,
      });

      // Generate JWT token
      const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
        expiresIn: "24h",
      });

      // Return success response without password
      const userWithoutPassword = { ...user.get() };
      delete userWithoutPassword.password;

      res.status(201).json({
        success: true,
        data: userWithoutPassword,
        token,
      });
    } catch (error) {
      console.error("Registration error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name,
        code: error.code,
      });

      res.status(500).json({
        success: false,
        message: "Error registering user",
        error: error.message,
      });
    }
  },

  // Login user
  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      // Find user by email
      const user = await User.findOne({ where: { email } });

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Invalid credentials",
        });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);

      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: "Invalid credentials",
        });
      }

      // Generate JWT token
      const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
        expiresIn: "24h",
      });

      // Return user data without password
      const userWithoutPassword = { ...user.get() };
      delete userWithoutPassword.password;

      res.status(200).json({
        success: true,
        data: userWithoutPassword,
        token,
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({
        success: false,
        message: "Error logging in",
        error: error.message,
      });
    }
  },

  // Get all users
  getAllUsers: async (req, res) => {
    try {
      const users = await User.findAll({
        attributes: { exclude: ["password"] }, // Exclude password from results
      });

      res.status(200).json({
        success: true,
        data: users,
      });
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching users",
        error: error.message,
      });
    }
  },
};

module.exports = userController;
