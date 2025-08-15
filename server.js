const PORT = process.env.PORT || 4000;

const io = require("socket.io")(PORT, {
  cors: {
    origin: "*",
  },
})

const rooms = {}

io.on("connection", (socket) => {
  console.log("User connected:", socket.id)

  socket.on("joinRoom", ({ roomId, userName }) => {
    socket.join(roomId)
    console.log(`${userName} joined room ${roomId}`)

    // Initialize room if it doesn't exist
    if (!rooms[roomId]) {
      rooms[roomId] = {
        users: [],
        videoState: { newVideoId: "", time: 0, playing: false, seekTime: 0 },
      }
    }

    // Add user to room if not already present
    if (!rooms[roomId].users.find((user) => user.id === socket.id)) {
      rooms[roomId].users = rooms[roomId].users.filter((user) => user.name !== userName)
      rooms[roomId].users.push({ id: socket.id, name: userName })
    }

    // Send current video state to the joining user
    if (rooms[roomId].videoState.newVideoId) {
      socket.emit("syncVideo", rooms[roomId].videoState)
    }

    // Send updated user list to all users in room
    const userNames = rooms[roomId].users.map((user) => user.name)
    io.to(roomId).emit("userUpdate", { users: userNames })
  })

  socket.on("syncVideo", ({ roomId, videoId, time, playing, seekTime }) => {
    console.log("Sync video received:", { roomId, videoId, time, playing, seekTime })

    if (!rooms[roomId]) {
      rooms[roomId] = { users: [], videoState: {} }
    }

    // Update room video state with all parameters
    rooms[roomId].videoState = {
      newVideoId: videoId,
      time: time || 0,
      playing: playing !== undefined ? playing : false,
      seekTime: seekTime !== undefined ? seekTime : time || 0,
    }

    // Broadcast to all other users in the room
    socket.to(roomId).emit("syncVideo", rooms[roomId].videoState)
  })

  socket.on("changeVideo", ({ roomId, videoId, time, playing }) => {
    console.log("Change video received:", { roomId, videoId, time, playing })

    if (!rooms[roomId]) {
      rooms[roomId] = { users: [], videoState: {} }
    }

    rooms[roomId].videoState = {
      newVideoId: videoId,
      time: time || 0,
      playing: playing !== undefined ? playing : true,
      seekTime: time || 0,
    }

    // Broadcast to all users in the room including sender
    io.to(roomId).emit("syncVideo", rooms[roomId].videoState)
  })

  socket.on("sendMessage", ({ roomId, userName, message }) => {
    io.to(roomId).emit("chatMessage", `${userName}: ${message}`)
  })

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id)

    // Remove user from all rooms
    Object.keys(rooms).forEach((roomId) => {
      if (rooms[roomId] && rooms[roomId].users) {
        rooms[roomId].users = rooms[roomId].users.filter((user) => user.id !== socket.id)

        // Send updated user list to remaining users
        const userNames = rooms[roomId].users.map((user) => user.name)
        io.to(roomId).emit("userUpdate", { users: userNames })

        // Clean up empty rooms
        if (rooms[roomId].users.length === 0) {
          delete rooms[roomId]
        }
      }
    })
  })
})

console.log("Socket.IO server running on port 4000")
