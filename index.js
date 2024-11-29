const WebSocket = require("ws");

// Set PORT dynamically or use default
const PORT = process.env.PORT || 8080;

// Create WebSocket server
const server = new WebSocket.Server({ port: PORT });

server.on("connection", (ws) => {
  console.log("Client connected");

  // When a message is received
  ws.on("message", (message) => {
    console.log("Message received:", message);

    // Broadcast message to all connected clients except the sender
    server.clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });

  // When a client disconnects
  ws.on("close", () => {
    console.log("Client disconnected");
  });
});

console.log(`WebSocket server is running on ws://localhost:${PORT}`);
