const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Admin = require("../models/admin");
const { Op } = require("sequelize");

// JWT secret key from environment variables
const JWT_SECRET = process.env.JWT_SECRET;

// Predefined admin credentials for two admins
const DEFAULT_ADMINS = [
  {
    username: "GMajiwa",
    email: "magiwagreevyne@gmail.com",
    password: "MJArip@2025", // This will be hashed when server starts
    phoneNumber: "+254798231083",
    latitude: -1.29883,
    longitude: 36.81606,
  },
  {
    username: "Kennedy Oduor",
    email: "ongogokennedy89@gmail.com",
    password: "*Carlmart2025", // This will be hashed when server starts
    phoneNumber: "+254798757460",
    latitude: -1.29883,
    longitude: 36.81606,
  },
];

// Initialize admin accounts when server starts
const initializeAdmin = async () => {
  try {
    // Get all emails and usernames from DEFAULT_ADMINS
    const defaultEmails = DEFAULT_ADMINS.map((a) => a.email);
    const defaultUsernames = DEFAULT_ADMINS.map((a) => a.username);

    // Delete admins not in DEFAULT_ADMINS
    await Admin.destroy({
      where: {
        [Op.and]: [
          { email: { [Op.notIn]: defaultEmails } },
          { username: { [Op.notIn]: defaultUsernames } },
        ],
      },
    });

    for (const adminData of DEFAULT_ADMINS) {
      // Check if admin already exists by email or username
      const existingAdmin = await Admin.findOne({
        where: {
          [Op.or]: [
            { email: adminData.email },
            { username: adminData.username },
          ],
        },
      });

      // Hash the default password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(adminData.password, salt);

      if (!existingAdmin) {
        // Create admin account
        await Admin.create({
          ...adminData,
          password: hashedPassword,
        });
        console.log(
          `Default admin account created successfully: ${adminData.username}`
        );
      } else {
        // Update existing admin
        await existingAdmin.update({
          ...adminData,
          password: hashedPassword,
        });
        console.log(`Admin account updated: ${adminData.username}`);
      }
    }
  } catch (error) {
    console.error("Error initializing admin accounts:", error);
  }
};

const adminController = {
  // Initialize admin accounts
  initializeAdmin,

  // Login admin
  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      // Find admin by email
      const admin = await Admin.findOne({ where: { email } });

      if (!admin) {
        return res.status(401).json({
          success: false,
          message: "Invalid credentials",
        });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, admin.password);

      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: "Invalid credentials",
        });
      }

      // Generate JWT token
      const token = jwt.sign(
        {
          id: admin.id,
          email: admin.email,
          username: admin.username,
          isAdmin: true, // Add admin flag to token
        },
        JWT_SECRET,
        { expiresIn: "24h" }
      );

      // Return admin data without password
      const adminWithoutPassword = { ...admin.get() };
      delete adminWithoutPassword.password;

      res.status(200).json({
        success: true,
        data: adminWithoutPassword,
        token,
      });
    } catch (error) {
      console.error("Admin login error:", error);
      res.status(500).json({
        success: false,
        message: "Error logging in",
        error: error.message,
      });
    }
  },

  // Get all admins
  getAllAdmins: async (req, res) => {
    try {
      const admins = await Admin.findAll({
        attributes: { exclude: ["password"] }, // Exclude password from results
      });

      res.status(200).json({
        success: true,
        data: admins,
      });
    } catch (error) {
      console.error("Error fetching admins:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching admins",
        error: error.message,
      });
    }
  },
};

module.exports = adminController;

// Initialize admin accounts when the module is loaded
initializeAdmin();
