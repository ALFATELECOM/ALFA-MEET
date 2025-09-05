const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  methods: ["GET", "POST"],
  credentials: true
};

app.use(cors(corsOptions));
app.use(helmet());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Socket.io setup
const io = socketIo(server, {
  cors: corsOptions
});

// Store active rooms and users
const rooms = new Map();
const users = new Map();

// Room types
const ROOM_TYPES = {
  MEETING: 'meeting',
  WEBINAR: 'webinar'
};

// User roles
const USER_ROLES = {
  HOST: 'host',
  MODERATOR: 'moderator',
  PARTICIPANT: 'participant',
  ATTENDEE: 'attendee'
};

class Room {
  constructor(id, name, type, hostId) {
    this.id = id;
    this.name = name;
    this.type = type;
    this.hostId = hostId;
    this.participants = new Map();
    this.settings = {
      allowScreenShare: true,
      allowChat: true,
      allowRecording: true,
      muteOnEntry: type === ROOM_TYPES.WEBINAR,
      waitingRoom: false
    };
    this.createdAt = new Date();
    this.isRecording = false;
    this.chatHistory = [];
  }

  addParticipant(userId, socketId, userData) {
    const role = userId === this.hostId ? USER_ROLES.HOST : 
                 this.type === ROOM_TYPES.WEBINAR ? USER_ROLES.ATTENDEE : USER_ROLES.PARTICIPANT;
    
    this.participants.set(userId, {
      ...userData,
      id: userId,
      socketId,
      role,
      isAudioMuted: this.settings.muteOnEntry && role !== USER_ROLES.HOST,
      isVideoMuted: false,
      isScreenSharing: false,
      joinedAt: new Date()
    });
  }

  removeParticipant(userId) {
    this.participants.delete(userId);
  }

  getParticipants() {
    return Array.from(this.participants.values());
  }

  updateParticipant(userId, updates) {
    const participant = this.participants.get(userId);
    if (participant) {
      this.participants.set(userId, { ...participant, ...updates });
    }
  }
}

// API Routes
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.post('/api/rooms', (req, res) => {
  const { name, type, hostId, hostName } = req.body;
  
  if (!name || !type || !hostId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const roomId = uuidv4();
  const room = new Room(roomId, name, type, hostId);
  rooms.set(roomId, room);

  res.json({
    roomId,
    name,
    type,
    hostId,
    joinUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/room/${roomId}`
  });
});

app.get('/api/rooms/:roomId', (req, res) => {
  const { roomId } = req.params;
  const room = rooms.get(roomId);
  
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }

  res.json({
    id: room.id,
    name: room.name,
    type: room.type,
    hostId: room.hostId,
    participantCount: room.participants.size,
    settings: room.settings,
    createdAt: room.createdAt
  });
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join room
  socket.on('join-room', ({ roomId, userId, userData }) => {
    const room = rooms.get(roomId);
    
    if (!room) {
      socket.emit('error', { message: 'Room not found' });
      return;
    }

    // Add user to room
    room.addParticipant(userId, socket.id, userData);
    users.set(socket.id, { userId, roomId, userData });
    
    // Join socket room
    socket.join(roomId);

    // Notify user they joined successfully
    socket.emit('joined-room', {
      roomId,
      roomName: room.name,
      roomType: room.type,
      participants: room.getParticipants(),
      settings: room.settings,
      chatHistory: room.chatHistory
    });

    // Notify other participants
    socket.to(roomId).emit('user-joined', {
      userId,
      userData: room.participants.get(userId)
    });

    console.log(`User ${userId} joined room ${roomId}`);
  });

  // Handle WebRTC signaling
  socket.on('offer', ({ to, offer }) => {
    socket.to(to).emit('offer', { from: socket.id, offer });
  });

  socket.on('answer', ({ to, answer }) => {
    socket.to(to).emit('answer', { from: socket.id, answer });
  });

  socket.on('ice-candidate', ({ to, candidate }) => {
    socket.to(to).emit('ice-candidate', { from: socket.id, candidate });
  });

  // Media controls
  socket.on('toggle-audio', ({ roomId, userId, isMuted }) => {
    const room = rooms.get(roomId);
    if (room) {
      room.updateParticipant(userId, { isAudioMuted: isMuted });
      socket.to(roomId).emit('user-audio-toggled', { userId, isMuted });
    }
  });

  socket.on('toggle-video', ({ roomId, userId, isMuted }) => {
    const room = rooms.get(roomId);
    if (room) {
      room.updateParticipant(userId, { isVideoMuted: isMuted });
      socket.to(roomId).emit('user-video-toggled', { userId, isMuted });
    }
  });

  socket.on('start-screen-share', ({ roomId, userId }) => {
    const room = rooms.get(roomId);
    if (room && room.settings.allowScreenShare) {
      room.updateParticipant(userId, { isScreenSharing: true });
      socket.to(roomId).emit('user-screen-share-started', { userId });
    }
  });

  socket.on('stop-screen-share', ({ roomId, userId }) => {
    const room = rooms.get(roomId);
    if (room) {
      room.updateParticipant(userId, { isScreenSharing: false });
      socket.to(roomId).emit('user-screen-share-stopped', { userId });
    }
  });

  // Chat functionality
  socket.on('send-message', ({ roomId, userId, message, userName }) => {
    const room = rooms.get(roomId);
    if (room && room.settings.allowChat) {
      const chatMessage = {
        id: uuidv4(),
        userId,
        userName,
        message,
        timestamp: new Date()
      };
      
      room.chatHistory.push(chatMessage);
      io.to(roomId).emit('new-message', chatMessage);
    }
  });

  // Host controls for webinar mode
  socket.on('mute-participant', ({ roomId, targetUserId, hostId }) => {
    const room = rooms.get(roomId);
    if (room && room.hostId === hostId) {
      room.updateParticipant(targetUserId, { isAudioMuted: true });
      const targetParticipant = room.participants.get(targetUserId);
      if (targetParticipant) {
        io.to(targetParticipant.socketId).emit('force-mute');
        socket.to(roomId).emit('user-audio-toggled', { userId: targetUserId, isMuted: true });
      }
    }
  });

  socket.on('remove-participant', ({ roomId, targetUserId, hostId }) => {
    const room = rooms.get(roomId);
    if (room && room.hostId === hostId) {
      const targetParticipant = room.participants.get(targetUserId);
      if (targetParticipant) {
        io.to(targetParticipant.socketId).emit('removed-from-room');
        room.removeParticipant(targetUserId);
        socket.to(roomId).emit('user-left', { userId: targetUserId });
      }
    }
  });

  // Recording controls
  socket.on('start-recording', ({ roomId, hostId }) => {
    const room = rooms.get(roomId);
    if (room && room.hostId === hostId && room.settings.allowRecording) {
      room.isRecording = true;
      io.to(roomId).emit('recording-started');
    }
  });

  socket.on('stop-recording', ({ roomId, hostId }) => {
    const room = rooms.get(roomId);
    if (room && room.hostId === hostId) {
      room.isRecording = false;
      io.to(roomId).emit('recording-stopped');
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    const user = users.get(socket.id);
    if (user) {
      const { userId, roomId } = user;
      const room = rooms.get(roomId);
      
      if (room) {
        room.removeParticipant(userId);
        socket.to(roomId).emit('user-left', { userId });
        
        // If host left, end the room
        if (room.hostId === userId) {
          io.to(roomId).emit('room-ended');
          rooms.delete(roomId);
        }
      }
      
      users.delete(socket.id);
    }
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
