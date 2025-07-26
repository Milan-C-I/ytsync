const io = require("socket.io")(4000, {
  cors: {
    origin: "*",
  },
});

let rooms = {};

io.on("connection", (socket) => {
  console.log("User connected");

  socket.on("joinRoom", ({ roomId, userName }) => {
    socket.join(roomId);
    console.log(`${userName} joined room ${roomId}`);

    // Send current video state if available
    if (rooms[roomId]) {
      socket.emit("syncVideo", rooms[roomId]);
    }
  });

  socket.on("syncVideo", ({ roomId, videoId, time, playing }) => {
    // Store video state in room
    rooms[roomId] = { newVideoId: videoId, time, playing };
    socket.to(roomId).emit("syncVideo", rooms[roomId]);
  });

  socket.on("changeVideo", ({ roomId, videoId }) => {
    rooms[roomId] = { newVideoId: videoId, time: 0, playing: false };
    io.to(roomId).emit("syncVideo", rooms[roomId]);
  });

  socket.on("sendMessage", ({ roomId, userName, message }) => {
    io.to(roomId).emit("chatMessage", `${userName}: ${message}`);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});
