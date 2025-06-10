const WebSocket = require("ws");
const Message = require("../models/message");
const jwt = require("jsonwebtoken");
const Admin = require("../models/admin");
const JWT_SECRET = process.env.JWT_SECRET;

function setupWebSocketServer(server) {
  const wss = new WebSocket.Server({ server, path: "/ws/chat" });

  // Store connected clients
  const clients = new Set();

  wss.on("connection", (ws) => {
    // Add new client to the set
    clients.add(ws);
    console.log("New client connected");

    // Send welcome message
    ws.send(
      JSON.stringify({
        text: "Welcome to the chat! How can I help you today?",
        sender: "support",
        timestamp: new Date().toISOString(),
      })
    );

    ws.on("message", async (message) => {
      try {
        const parsedMessage = JSON.parse(message);

        // Default sender is user
        let sender = "user";

        // If token is present, verify it
        if (parsedMessage.token) {
          try {
            const decoded = jwt.verify(parsedMessage.token, JWT_SECRET);
            if (decoded.isAdmin) {
              const admin = await Admin.findByPk(decoded.id);
              if (admin) {
                sender = "support";
              }
            }
          } catch (err) {
            sender = "user";
          }
        }

        // Save message to the database
        await Message.create({
          text: parsedMessage.text,
          sender,
          timestamp: parsedMessage.timestamp || new Date(),
        });

        // Broadcast message to all connected clients
        clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(
              JSON.stringify({
                text: parsedMessage.text,
                sender,
                timestamp: parsedMessage.timestamp || new Date(),
              })
            );
          }
        });
      } catch (error) {
        console.error("Error processing message:", error);
      }
    });

    ws.on("close", () => {
      // Remove client from the set when they disconnect
      clients.delete(ws);
      console.log("Client disconnected");
    });

    ws.on("error", (error) => {
      console.error("WebSocket error:", error);
      clients.delete(ws);
    });
  });

  return wss;
}

module.exports = setupWebSocketServer;
