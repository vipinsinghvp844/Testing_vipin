const WebSocket = require("ws");

// Set PORT dynamically or use default
const PORT = process.env.PORT || 8080;

// Create WebSocket server
const server = new WebSocket.Server({ port: PORT });

let onlineUsers = {};
server.on("connection", (ws) => {
  console.log("Client connected");

  // When a message is received
  ws.on("message", (message) => {
    try {
      const data = JSON.parse(message);
      if (data.type === "user_online") {
        onlineUsers[data.userId] = ws;
        broadcastUserStatus(data.userId, "online");
      } else if (data.type === "user_offline") { 
        delete onlineUsers[data.userId];
        broadcastUserStatus(data.userId, "offline");
      } else {
        server.clients.forEach((client) => { 
          if (client !== ws && client.readyState == WebSocket.OPEN) {
            client.send(JSON.stringify(data));
          }
        });
      }
    } catch (error) {
      console.error("Error parsing WebSocket message:", error);
    }
    // console.log("Message received:", message);

    // Broadcast message to all connected clients except the sender
    // server.clients.forEach((client) => {
    //   if (client !== ws && client.readyState === WebSocket.OPEN) {
    //     client.send(message);
    //   }
    // });
  });

  // When a client disconnects
  ws.on("close", () => {
    let disconnectedUserId = null;

    for (const userId in onlineUsers) {
      if (onlineUsers[userId] === ws) {
        disconnectedUserId = userId;
        break;
      }
    }
    if (disconnectedUserId) {
      broadcastUserStatus(disconnectedUserId, "offline");
    }
    console.log("Client disconnected");
  });
});
// Function to broadcast user status to all clients

function broadcastUserStatus(userId, status) {
  const message = JSON.stringify({ type: "user_status_update", userId, status });
  server.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}
console.log(`WebSocket server is running on ws://localhost:${PORT}`);
