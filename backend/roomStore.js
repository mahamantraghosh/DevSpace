// In-memory store for active rooms
// Structure:
// rooms = {
//   [roomId]: {
//     roomId: string,
//     users: [{ socketId: string, username: string }],
//     code: { html: string, css: string, js: string },
//     messages: [{ id: string, sender: string, text: string, timestamp: number }]
//   }
// }
const rooms = new Map();

function getOrCreateRoom(roomId) {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      roomId,
      users: [],
      code: {
        html: `<!-- Welcome to DevSpace! -->
<div class="playground">
  <h1>Code Collaboratively in Real-Time</h1>
  <p>Invite your friends and start coding!</p>
  <button id="action-btn">Click Me</button>
</div>`,
        css: `/* Tailwind is available! Or add custom styles below */
body {
  font-family: 'Outfit', sans-serif;
  background: radial-gradient(circle at top, #0f172a, #020617);
  color: #f8fafc;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 80vh;
  margin: 0;
}

.playground {
  background: rgba(30, 41, 59, 0.4);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  padding: 2.5rem;
  border-radius: 1rem;
  text-align: center;
  box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.5);
  max-width: 450px;
}

h1 {
  font-size: 1.8rem;
  margin-bottom: 0.5rem;
  background: linear-gradient(135deg, #38bdf8, #818cf8);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

p {
  color: #94a3b8;
  margin-bottom: 1.5rem;
}

button {
  background: linear-gradient(135deg, #0ea5e9, #6366f1);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
}

button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
}`,
        js: `// Interactive JavaScript
const btn = document.getElementById('action-btn');

btn.addEventListener('click', () => {
  // Try changing this code!
  btn.textContent = '🎉 Awesome!';
  btn.style.background = 'linear-gradient(135deg, #10b981, #059669)';
  
  // Confetti effect can be coded here
  console.log("Button clicked!");
});`
      },
      messages: []
    });
  }
  return rooms.get(roomId);
}

function addUserToRoom(roomId, socketId, username) {
  const room = getOrCreateRoom(roomId);
  // Avoid duplicate sockets
  const exists = room.users.some(u => u.socketId === socketId);
  if (!exists) {
    room.users.push({ socketId, username });
  }
  return room;
}

function removeUserFromRoom(socketId) {
  let affectedRoomId = null;
  let username = null;

  for (const [roomId, room] of rooms.entries()) {
    const userIndex = room.users.findIndex(u => u.socketId === socketId);
    if (userIndex !== -1) {
      username = room.users[userIndex].username;
      room.users.splice(userIndex, 1);
      affectedRoomId = roomId;

      // Clean up empty rooms to avoid memory bloat
      if (room.users.length === 0) {
        rooms.delete(roomId);
      }
      break;
    }
  }

  return { roomId: affectedRoomId, username, activeUsers: affectedRoomId ? (rooms.get(affectedRoomId)?.users || []) : [] };
}

function updateRoomCode(roomId, codeType, value) {
  const room = rooms.get(roomId);
  if (room && room.code) {
    room.code[codeType] = value;
  }
}

function addMessageToRoom(roomId, sender, text) {
  const room = rooms.get(roomId);
  if (room) {
    const message = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      sender,
      text,
      timestamp: Date.now()
    };
    room.messages.push(message);
    // Limit to last 100 messages to conserve memory
    if (room.messages.length > 100) {
      room.messages.shift();
    }
    return message;
  }
  return null;
}

function getRoomState(roomId) {
  return rooms.get(roomId) || null;
}

module.exports = {
  getOrCreateRoom,
  addUserToRoom,
  removeUserFromRoom,
  updateRoomCode,
  addMessageToRoom,
  getRoomState
};
