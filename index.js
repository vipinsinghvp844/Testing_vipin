const WebSocket = require("ws");

// Set PORT dynamically or use default
const PORT = process.env.PORT || 8080;

// Create WebSocket server
const server = new WebSocket.Server({ port: PORT });

let onlineUsers = {}; // Store online users

server.on("connection", (ws) => {
  console.log("Client connected");

  // Send all currently online users to the newly connected client
  for (const userId in onlineUsers) {
    ws.send(
      JSON.stringify({
        type: "user_status_update",
        userId,
        status: "online",
        lastUpdated: onlineUsers[userId].lastUpdated,
      })
    );
  }

  ws.on("message", (message) => {
    try {
      const data = JSON.parse(message);

      if (data.type === "user_online") {
        // Add user to the onlineUsers object
        onlineUsers[data.userId] = {
          socket: ws,
          lastUpdated: new Date().toISOString(),
        };

        // Broadcast the new user's online status
        broadcastUserStatus(data.userId, "online", onlineUsers[data.userId].lastUpdated);
      } else if (data.type === "user_offline") {
        if (onlineUsers[data.userId]) {
          const lastUpdated = new Date().toISOString();
          // Broadcast offline status
          broadcastUserStatus(data.userId, "offline", lastUpdated);
          delete onlineUsers[data.userId];
        }
      } else {
        // Forward chat messages to other clients
        server.clients.forEach((client) => {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
          }
        });
      }
    } catch (error) {
      console.error("Error parsing WebSocket message:", error);
    }
  });

  ws.on("close", () => {
    // Find the disconnected user
    let disconnectedUserId = null;

    for (const userId in onlineUsers) {
      if (onlineUsers[userId].socket === ws) {
        disconnectedUserId = userId;
        delete onlineUsers[userId];
        break;
      }
    }

    if (disconnectedUserId) {
      const lastUpdated = new Date().toISOString();
      // Broadcast the offline status
      broadcastUserStatus(disconnectedUserId, "offline", lastUpdated);
    }

    console.log("Client disconnected");
  });
});

// ✅ Function to broadcast user status to all connected clients
function broadcastUserStatus(userId, status, lastUpdated) {
  const message = JSON.stringify({
    type: "user_status_update",
    userId,
    status,
    lastUpdated,
  });

  server.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

console.log(`WebSocket server is running on ws://localhost:${PORT}`);
