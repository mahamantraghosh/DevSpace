const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const {
  addUserToRoom,
  removeUserFromRoom,
  updateRoomCode,
  addMessageToRoom,
  getRoomState
} = require('./roomStore');

const app = express();
app.use(cors());
app.use(express.json());

// Basic health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date() });
});

// GET room state REST endpoint (useful for room checks before websocket join)
app.get('/api/rooms/:roomId', (req, res) => {
  const { roomId } = req.params;
  const room = getRoomState(roomId);
  if (room) {
    res.json({ exists: true, activeUsersCount: room.users.length });
  } else {
    res.json({ exists: false, activeUsersCount: 0 });
  }
});

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*', // Allow any origin in development
    methods: ['GET', 'POST']
  }
});

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // 1. Join Room
  socket.on('join-room', ({ roomId, username }) => {
    if (!roomId || !username) return;

    socket.join(roomId);
    
    // Add user to the room store
    const room = addUserToRoom(roomId, socket.id, username);
    
    console.log(`User ${username} (${socket.id}) joined room ${roomId}`);

    // Emit initial room state to the newly joined client
    socket.emit('room-init', {
      roomId,
      code: room.code,
      messages: room.messages,
      users: room.users
    });

    // Notify other clients in the room about the new user joining
    socket.to(roomId).emit('user-joined', {
      users: room.users,
      joinedUser: { socketId: socket.id, username }
    });
  });

  // 2. Code Synchronization
  socket.on('editor-change', ({ roomId, codeType, value }) => {
    if (!roomId || !codeType) return;
    
    // Update store state
    updateRoomCode(roomId, codeType, value);

    // Broadcast change to all other users in the room
    socket.to(roomId).emit('editor-update', {
      codeType,
      value,
      senderSocketId: socket.id
    });
  });

  // 3. User Typing Status
  socket.on('typing-status', ({ roomId, username, isTyping }) => {
    if (!roomId) return;
    socket.to(roomId).emit('typing-update', {
      username,
      isTyping,
      socketId: socket.id
    });
  });

  // 4. Send Message (Chat)
  socket.on('send-message', ({ roomId, sender, text }) => {
    if (!roomId || !sender || !text) return;

    const message = addMessageToRoom(roomId, sender, text);
    if (message) {
      // Broadcast chat message to the entire room (including sender)
      io.to(roomId).emit('receive-message', message);
    }
  });

  // 5. Disconnect Handler
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    const { roomId, username, activeUsers } = removeUserFromRoom(socket.id);
    
    if (roomId) {
      console.log(`User ${username} left room ${roomId}`);
      // Notify remaining clients in the room
      io.to(roomId).emit('user-left', {
        users: activeUsers,
        leftUser: { socketId: socket.id, username }
      });
    }
  });
});

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`DevSpace backend listening on port ${PORT}`);
});
