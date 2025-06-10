const Message = require("../models/message");

const messageController = {
  // Get all messages (optionally, you can add pagination later)
  getAllMessages: async (req, res) => {
    try {
      const messages = await Message.findAll({
        order: [["timestamp", "ASC"]],
      });
      res.status(200).json({
        success: true,
        data: messages,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error fetching messages",
        error: error.message,
      });
    }
  },

  // Get a single message by ID
  getMessageById: async (req, res) => {
    try {
      const { id } = req.params;
      const message = await Message.findByPk(id);
      if (!message) {
        return res.status(404).json({
          success: false,
          message: "Message not found",
        });
      }
      res.status(200).json({
        success: true,
        data: message,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error fetching message",
        error: error.message,
      });
    }
  },
};

module.exports = messageController;
