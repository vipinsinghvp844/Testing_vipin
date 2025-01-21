const WebSocket = require("ws");

// Set PORT dynamically or use default
const PORT = process.env.PORT || 8080;

// Create WebSocket server
const server = new WebSocket.Server({ port: PORT });

let onlineUsers = {}; // Store online users
console.log("Server started. Online users:", onlineUsers);

const HEARTBEAT_INTERVAL = 30000;

server.on("connection", (ws) => {
  console.log("Client connected");

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
        onlineUsers[data.userId] = {
          socket: ws,
          lastUpdated: new Date().toISOString(),
        };
        broadcastUserStatus(
          data.userId,
          "online",
          onlineUsers[data.userId].lastUpdated // Ensure correct value
        );
      } else if (data.type === "user_offline") {
        const lastUpdated = new Date().toISOString();

        broadcastUserStatus(data.userId, "offline", lastUpdated);
        delete onlineUsers[data.userId];
      } else {
        // Forward chat messages
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
      // console.log('Sending to client:', message);

  ws.on("close", () => {
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
      broadcastUserStatus(disconnectedUserId, "offline", lastUpdated);
      // delete onlineUsers[disconnectedUserId];
    }

    console.log("Client disconnected");
  });
});

// ✅ Function to broadcast user status to all clients
function broadcastUserStatus(userId, status, lastUpdated) {
  const message = JSON.stringify({
    type: "user_status_update",
    userId,
    status,
    lastUpdated,
  });

  console.log("Broadcasting user status:", message); // Debugging
  setInterval(() => {
    server.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  },[HEARTBEAT_INTERVAL])
}

console.log(`WebSocket server is running on ws://localhost:${PORT}`);
