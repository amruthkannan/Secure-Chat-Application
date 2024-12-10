const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000", // Allow requests from your React app
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 5000;

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  // Listen for joinServer event
  socket.on("joinServer", (username) => {
    console.log(`${username} joined the server.`);
    socket.username = username;
    io.emit("joinedServer", `${username} has joined the chat.`);
  });

  // Listen for sendMessage event
  socket.on("sendMessage", (data) => {
    console.log("Message received from", data.sender);
    // Emit the message to the specific recipient if needed
    socket.broadcast.emit("receiveMessage", {
      sender: data.sender,
      encryptedMessage: data.encryptedMessage
    });
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected:", socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
