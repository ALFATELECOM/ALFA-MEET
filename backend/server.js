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

// CORS configuration - Enhanced for better connectivity
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      "http://localhost:3000",
      "https://localhost:3000",
      "https://alfa-meet.vercel.app",
      "https://alfa-meet-vercel.app", 
      "https://alfa-meet-frontend.vercel.app",
      "https://www.alfa-meet.vercel.app",
      process.env.FRONTEND_URL
    ].filter(Boolean);

    // Check if origin is allowed
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      // Log for debugging but still allow (for development)
      console.log('⚠️  CORS: Unknown origin:', origin);
      callback(null, true); // Allow all origins for now
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true,
  optionsSuccessStatus: 200,
  allowedHeaders: ["Content-Type", "Authorization", "x-requested-with", "Accept"]
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

// Socket.io setup - Enhanced for better connectivity  
const io = socketIo(server, {
  cors: {
    origin: function (origin, callback) {
      // Allow requests with no origin
      if (!origin) return callback(null, true);
      
      const allowedOrigins = [
        "http://localhost:3000",
        "https://localhost:3000", 
        "https://alfa-meet.vercel.app",
        "https://alfa-meet-vercel.app",
        "https://alfa-meet-frontend.vercel.app", 
        "https://www.alfa-meet.vercel.app",
        process.env.FRONTEND_URL
      ].filter(Boolean);

      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        console.log('⚠️  Socket.IO CORS: Unknown origin:', origin);
        callback(null, true); // Allow all origins for now
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "x-requested-with", "Accept"],
    transports: ['websocket', 'polling']
  },
  allowEIO3: true,
  pingTimeout: 60000,
  pingInterval: 25000,
  upgradeTimeout: 30000,
  maxHttpBufferSize: 1e6
});

// Store active rooms, users, rewards, and reactions
const rooms = new Map();
const users = new Map();
const userRewards = new Map();
const activeReactions = new Map();
const raisedHands = new Map();
const blockedUsers = new Map();
const suspendedUsers = new Map();
const coHosts = new Map();

// Room types
const ROOM_TYPES = {
  MEETING: 'meeting',
  WEBINAR: 'webinar'
};

// User roles
const USER_ROLES = {
  HOST: 'host',
  MODERATOR: 'moderator',
  CO_HOST: 'co-host',
  PARTICIPANT: 'participant',
  ATTENDEE: 'attendee',
  PANELIST: 'panelist'
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
      waitingRoom: false,
      allowReactions: true,
      allowRaiseHand: true,
      rewardsEnabled: true,
      maxParticipants: 10000,
      requireAdminStart: false,
      allowCoHosts: true,
      userManagement: {
        allowBlock: true,
        allowSuspend: true,
        allowKick: true
      }
    };
    this.createdAt = new Date();
    this.isRecording = false;
    this.recordingStatus = 'stopped'; // 'recording', 'paused', 'stopped'
    this.chatHistory = [];
    this.reactionHistory = [];
    this.polls = [];
    this.activePoll = null;
    this.breakoutRooms = [];
    this.meetingNotes = '';
    this.whiteboardData = { drawings: [], isActive: false };
    this.coHosts = new Set();
    this.blockedUsers = new Set();
    this.suspendedUsers = new Set();
    this.meetingImage = null;
    this.participantAnalytics = new Map();
    this.aiMode = {
      enabled: false,
      transcription: false,
      summary: false,
      moderation: false,
      insights: false
    };
  }

  addParticipant(userId, socketId, userData) {
    let role = userId === this.hostId ? USER_ROLES.HOST : 
               this.type === ROOM_TYPES.WEBINAR ? USER_ROLES.ATTENDEE : USER_ROLES.PARTICIPANT;
    if (userData && userData.role && Object.values(USER_ROLES).includes(userData.role)) {
      // Allow explicit role only for non-attendee when not violating webinar rules; will still be validated by admin actions later
      role = userData.role;
    }
    
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

// Helper functions
function awardPoints(userId, userName, points, reason, roomId) {
  if (!userRewards.has(userId)) {
    userRewards.set(userId, {
      userId,
      userName,
      points: 0,
      history: []
    });
  }
  
  const userReward = userRewards.get(userId);
  userReward.points += points;
  userReward.history.push({
    points,
    reason,
    roomId,
    timestamp: new Date()
  });
  
  return userReward;
}

function getUserRewards(userId) {
  return userRewards.get(userId) || { userId, points: 0, history: [] };
}

function getLeaderboard(limit = 10) {
  return Array.from(userRewards.values())
    .sort((a, b) => b.points - a.points)
    .slice(0, limit);
}

function calculateEngagementScore(actions) {
  if (!actions || actions.length === 0) return 0;
  
  const weights = {
    'message': 10,
    'reaction': 5,
    'hand-raise': 15,
    'screen-share': 20,
    'poll-vote': 8,
    'camera-on': 3,
    'mic-on': 3,
    'join': 5,
    'stay-duration': 1 // per minute
  };
  
  let score = 0;
  actions.forEach(action => {
    score += weights[action.action] || 1;
  });
  
  return Math.min(Math.round(score / 10), 100); // Cap at 100
}

function generateMeetingReport(roomId) {
  const room = rooms.get(roomId);
  if (!room) return null;
  
  const participants = Array.from(room.participants.values()).map(p => {
    const analytics = room.participantAnalytics.get(p.id) || {};
    return {
      ...p,
      analytics,
      joinDuration: new Date() - new Date(p.joinedAt),
      pointsEarned: getUserRewards(p.id).points
    };
  });
  
  return {
    roomId,
    roomName: room.name,
    type: room.type,
    status: room.isRecording ? 'active' : 'ended',
    participants,
    totalMessages: room.chatHistory.length,
    totalReactions: room.reactionHistory.length,
    aiModeUsed: room.aiMode.enabled,
    recordingDuration: room.recordingStatus === 'recording' ? 'ongoing' : 'completed',
    generatedAt: new Date().toISOString()
  };
}

// Enhanced API Routes with better logging
app.get('/health', (req, res) => {
  console.log('🏥 Health check requested from:', req.headers.origin || 'unknown');
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    server: 'ALFA MEET Backend',
    version: '1.0.0',
    activeRooms: rooms.size,
    activeUsers: users.size
  });
});

// Add debugging endpoint
app.get('/debug', (req, res) => {
  res.json({
    activeRooms: Array.from(rooms.keys()),
    activeUsers: users.size,
    corsOrigins: corsOptions.origin,
    timestamp: new Date().toISOString()
  });
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
    createdAt: room.createdAt,
    recordingStatus: room.recordingStatus,
    activePoll: room.activePoll,
    reactionCount: room.reactionHistory.length
  });
});

// Rewards API endpoints
app.get('/api/rewards/leaderboard', (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const leaderboard = getLeaderboard(limit);
  res.json(leaderboard);
});

app.get('/api/rewards/user/:userId', (req, res) => {
  const { userId } = req.params;
  const userReward = getUserRewards(userId);
  res.json(userReward);
});

// Room statistics
app.get('/api/rooms/:roomId/stats', (req, res) => {
  const { roomId } = req.params;
  const room = rooms.get(roomId);
  
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }

  const roomHands = raisedHands.get(roomId) || new Map();
  
  res.json({
    participantCount: room.participants.size,
    messageCount: room.chatHistory.length,
    reactionCount: room.reactionHistory.length,
    raisedHandsCount: roomHands.size,
    pollCount: room.polls.length,
    activePoll: room.activePoll,
    recordingStatus: room.recordingStatus,
    isRecording: room.isRecording,
    meetingDuration: Math.floor((new Date() - room.createdAt) / 1000 / 60), // in minutes
    participants: room.getParticipants().map(p => ({
      id: p.id,
      userName: p.userName || p.name,
      role: p.role,
      joinedAt: p.joinedAt,
      isAudioMuted: p.isAudioMuted,
      isVideoMuted: p.isVideoMuted,
      isScreenSharing: p.isScreenSharing
    }))
  });
});

// Socket.io connection handling - Enhanced
io.on('connection', (socket) => {
  console.log('🔌 User connected:', socket.id);
  console.log('📍 Origin:', socket.handshake.headers.origin);
  console.log('🌐 User Agent:', socket.handshake.headers['user-agent']);
  console.log('🕒 Connection Time:', new Date().toISOString());
  
  // Send connection confirmation
  socket.emit('connection-confirmed', {
    socketId: socket.id,
    timestamp: new Date().toISOString(),
    server: 'ALFA MEET Backend'
  });

  // Join room (enhanced with better error handling)
  socket.on('join-room', ({ roomId, userId, userName, userData }) => {
    try {
      console.log(`🚪 Join room request: ${userId} (${userName}) -> ${roomId}`);
      
      if (!roomId || !userId || !userName) {
        socket.emit('error', { message: 'Missing required room join data' });
        return;
      }

      let room = rooms.get(roomId);
      
      // Auto-create room if it doesn't exist
      if (!room) {
        console.log(`🏗️ Creating new room: ${roomId}`);
        room = new Room(roomId, `Room ${roomId}`, ROOM_TYPES.MEETING, userId);
        rooms.set(roomId, room);
      }

      // Check if user is blocked
      if (room.blockedUsers.has(userId)) {
        socket.emit('join-rejected', { reason: 'User is blocked from this room' });
        return;
      }

      // Add user to room
      const participantData = { userName, ...userData };
      room.addParticipant(userId, socket.id, participantData);
      users.set(socket.id, { userId, roomId, userData: participantData });
      
      // Join socket room
      socket.join(roomId);

      // Get current raised hands for this room
      const currentHands = raisedHands.get(roomId) ? Array.from(raisedHands.get(roomId).values()) : [];
      const participants = room.getParticipants();

      console.log(`✅ User ${userId} (${userName}) successfully joined room ${roomId}`);
      console.log(`📊 Room ${roomId} now has ${room.participants.size} participants:`, participants.map(p => p.userName));

      // Notify user they joined successfully
      socket.emit('joined-room', {
        success: true,
        roomId,
        roomName: room.name,
        roomType: room.type,
        participants,
        settings: room.settings,
        chatHistory: room.chatHistory,
        reactionHistory: room.reactionHistory.slice(-50), // Last 50 reactions
        raisedHands: currentHands,
        activePoll: room.activePoll,
        recordingStatus: room.recordingStatus,
        meetingNotes: room.meetingNotes,
        userRewards: getUserRewards(userId),
        timestamp: new Date().toISOString()
      });

      // Notify other participants with full participant data
      socket.to(roomId).emit('user-joined', {
        userId,
        userData: room.participants.get(userId),
        participantCount: room.participants.size,
        timestamp: new Date().toISOString()
      });

      // Send updated participants list to all users in room
      io.to(roomId).emit('room-participants', {
        participants,
        count: room.participants.size,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ Error in join-room:', error);
      socket.emit('error', { message: 'Failed to join room', error: error.message });
    }
  });

  // Handle legacy WebRTC signaling by socket id
  socket.on('offer', ({ to, offer }) => {
    socket.to(to).emit('offer', { from: socket.id, offer });
  });

  socket.on('answer', ({ to, answer }) => {
    socket.to(to).emit('answer', { from: socket.id, answer });
  });

  socket.on('ice-candidate', (payload) => {
    // Support both legacy { to, candidate } and new { roomId, targetId, candidate }
    if (payload && payload.to) {
      const { to, candidate } = payload;
      socket.to(to).emit('ice-candidate', { from: socket.id, candidate });
      return;
    }
  });

  // Handle room-aware WebRTC signaling by userId (frontend expects 'webrtc-*' events)
  socket.on('webrtc-offer', ({ roomId, targetId, offer }) => {
    try {
      const sender = users.get(socket.id);
      const room = rooms.get(roomId);
      if (!sender || !room) return;
      const targetParticipant = room.participants.get(targetId);
      if (targetParticipant && targetParticipant.socketId) {
        io.to(targetParticipant.socketId).emit('webrtc-offer', {
          fromId: sender.userId,
          offer
        });
      }
    } catch (err) {
      console.error('❌ Error handling webrtc-offer:', err);
    }
  });

  socket.on('webrtc-answer', ({ roomId, targetId, answer }) => {
    try {
      const sender = users.get(socket.id);
      const room = rooms.get(roomId);
      if (!sender || !room) return;
      const targetParticipant = room.participants.get(targetId);
      if (targetParticipant && targetParticipant.socketId) {
        io.to(targetParticipant.socketId).emit('webrtc-answer', {
          fromId: sender.userId,
          answer
        });
      }
    } catch (err) {
      console.error('❌ Error handling webrtc-answer:', err);
    }
  });

  socket.on('ice-candidate', ({ roomId, targetId, candidate }) => {
    try {
      if (!roomId || !targetId) return; // handled by legacy handler above
      const sender = users.get(socket.id);
      const room = rooms.get(roomId);
      if (!sender || !room) return;
      const targetParticipant = room.participants.get(targetId);
      if (targetParticipant && targetParticipant.socketId) {
        io.to(targetParticipant.socketId).emit('ice-candidate', {
          fromId: sender.userId,
          candidate
        });
      }
    } catch (err) {
      console.error('❌ Error handling ICE candidate:', err);
    }
  });

  // Media controls
  socket.on('toggle-audio', ({ roomId, userId, isMuted }) => {
    const room = rooms.get(roomId);
    if (room) {
      // Webinar policy: host/co-host can unmute; attendees default muted
      const participant = room.participants.get(userId);
      const isWebinar = room.type === ROOM_TYPES.WEBINAR;
      const isPrivileged = participant && (participant.role === 'host' || participant.role === 'co-host');
      const nextMuted = isWebinar && !isPrivileged ? true : !!isMuted;
      room.updateParticipant(userId, { isAudioMuted: nextMuted });
      io.to(roomId).emit('user-audio-toggled', { userId, isMuted: nextMuted });
      console.log(`[AUDIO] ${userId} => ${nextMuted ? 'muted' : 'unmuted'} in room ${roomId} (webinar=${isWebinar})`);
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

  // Chat functionality with rewards
  socket.on('send-message', ({ roomId, userId, message, userName, timestamp }) => {
    const room = rooms.get(roomId);
    if (room && room.settings.allowChat) {
      const chatMessage = {
        id: uuidv4(),
        userId,
        userName,
        message,
        timestamp: timestamp || new Date()
      };
      
      room.chatHistory.push(chatMessage);
      
      // Award points for sending message
      if (room.settings.rewardsEnabled) {
        awardPoints(userId, userName, 20, 'Chat message', roomId);
      }
      
      io.to(roomId).emit('new-message', chatMessage);
    }
  });

  // Reward system
  socket.on('award-points', ({ roomId, userId, userName, points, reason, awardedBy }) => {
    const room = rooms.get(roomId);
    if (room && room.settings.rewardsEnabled) {
      awardPoints(userId, userName, points, reason, roomId);
      
      // Notify room about the reward
      io.to(roomId).emit('points-awarded', {
        userId,
        userName,
        points,
        reason,
        awardedBy,
        timestamp: new Date()
      });
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
        console.log(`[ADMIN] Host ${hostId} muted ${targetUserId} in room ${roomId}`);
      }
    }
  });

  socket.on('unmute-participant', ({ roomId, targetUserId, hostId }) => {
    const room = rooms.get(roomId);
    if (room && room.hostId === hostId) {
      room.updateParticipant(targetUserId, { isAudioMuted: false });
      const targetParticipant = room.participants.get(targetUserId);
      if (targetParticipant) {
        io.to(targetParticipant.socketId).emit('force-unmute');
        socket.to(roomId).emit('user-audio-toggled', { userId: targetUserId, isMuted: false });
        console.log(`[ADMIN] Host ${hostId} unmuted ${targetUserId} in room ${roomId}`);
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

  // Reactions system
  socket.on('send-reaction', ({ roomId, userId, userName, reactionId, emoji }) => {
    const room = rooms.get(roomId);
    if (room && room.settings.allowReactions) {
      const reaction = {
        id: uuidv4(),
        userId,
        userName,
        reactionId,
        emoji,
        timestamp: new Date(),
        x: Math.random() * 80 + 10,
        y: Math.random() * 80 + 10
      };
      
      room.reactionHistory.push(reaction);
      io.to(roomId).emit('reaction-sent', reaction);
    }
  });

  // Raise hand functionality
  socket.on('raise-hand', ({ roomId, userId, userName }) => {
    const room = rooms.get(roomId);
    if (room && room.settings.allowRaiseHand) {
      const handRaise = {
        id: uuidv4(),
        userId,
        userName,
        timestamp: new Date(),
        acknowledged: false
      };
      
      if (!raisedHands.has(roomId)) {
        raisedHands.set(roomId, new Map());
      }
      
      raisedHands.get(roomId).set(userId, handRaise);
      io.to(roomId).emit('hand-raised', handRaise);
    }
  });

  socket.on('lower-hand', ({ roomId, userId }) => {
    const room = rooms.get(roomId);
    if (room) {
      if (raisedHands.has(roomId)) {
        raisedHands.get(roomId).delete(userId);
      }
      io.to(roomId).emit('hand-lowered', { userId });
    }
  });

  socket.on('acknowledge-hand', ({ roomId, handId, hostId }) => {
    const room = rooms.get(roomId);
    if (room && room.hostId === hostId) {
      if (raisedHands.has(roomId)) {
        const roomHands = raisedHands.get(roomId);
        for (let [userId, hand] of roomHands) {
          if (hand.id === handId) {
            hand.acknowledged = true;
            io.to(roomId).emit('hand-acknowledged', { handId, userId });
            break;
          }
        }
      }
    }
  });

  socket.on('clear-all-hands', ({ roomId, hostId }) => {
    const room = rooms.get(roomId);
    if (room && room.hostId === hostId) {
      raisedHands.set(roomId, new Map());
      io.to(roomId).emit('all-hands-cleared');
    }
  });

  // Recording controls (enhanced)
  socket.on('start-recording', ({ roomId, hostId }) => {
    const room = rooms.get(roomId);
    if (room && room.hostId === hostId && room.settings.allowRecording) {
      room.isRecording = true;
      room.recordingStatus = 'recording';
      io.to(roomId).emit('recording-started', { timestamp: new Date() });
    }
  });

  socket.on('pause-recording', ({ roomId, hostId }) => {
    const room = rooms.get(roomId);
    if (room && room.hostId === hostId && room.isRecording) {
      room.recordingStatus = 'paused';
      io.to(roomId).emit('recording-paused', { timestamp: new Date() });
    }
  });

  socket.on('resume-recording', ({ roomId, hostId }) => {
    const room = rooms.get(roomId);
    if (room && room.hostId === hostId && room.recordingStatus === 'paused') {
      room.recordingStatus = 'recording';
      io.to(roomId).emit('recording-resumed', { timestamp: new Date() });
    }
  });

  socket.on('stop-recording', ({ roomId, hostId }) => {
    const room = rooms.get(roomId);
    if (room && room.hostId === hostId) {
      room.isRecording = false;
      room.recordingStatus = 'stopped';
      io.to(roomId).emit('recording-stopped', { timestamp: new Date() });
    }
  });

  // Meeting mode controls
  socket.on('toggle-webinar-mode', ({ roomId, hostId, enabled }) => {
    const room = rooms.get(roomId);
    if (room && room.hostId === hostId) {
      room.type = enabled ? ROOM_TYPES.WEBINAR : ROOM_TYPES.MEETING;
      io.to(roomId).emit('webinar-mode-toggled', { enabled, timestamp: new Date() });
    }
  });

  // Poll system
  socket.on('create-poll', ({ roomId, hostId, question, options, duration }) => {
    const room = rooms.get(roomId);
    if (room && room.hostId === hostId) {
      const poll = {
        id: uuidv4(),
        question,
        options: options.map((option, index) => ({
          id: index,
          text: option,
          votes: 0,
          voters: []
        })),
        createdAt: new Date(),
        endsAt: new Date(Date.now() + duration * 1000),
        isActive: true,
        totalVotes: 0
      };
      
      room.polls.push(poll);
      room.activePoll = poll;
      io.to(roomId).emit('poll-created', poll);
      
      // Auto-close poll after duration
      setTimeout(() => {
        poll.isActive = false;
        if (room.activePoll?.id === poll.id) {
          room.activePoll = null;
        }
        io.to(roomId).emit('poll-closed', { pollId: poll.id });
      }, duration * 1000);
    }
  });

  socket.on('vote-poll', ({ roomId, pollId, optionId, userId, userName }) => {
    const room = rooms.get(roomId);
    if (room) {
      const poll = room.polls.find(p => p.id === pollId && p.isActive);
      if (poll) {
        // Check if user already voted
        const hasVoted = poll.options.some(option => 
          option.voters.some(voter => voter.userId === userId)
        );
        
        if (!hasVoted) {
          const option = poll.options.find(o => o.id === optionId);
          if (option) {
            option.votes++;
            option.voters.push({ userId, userName });
            poll.totalVotes++;
            
            io.to(roomId).emit('poll-vote-recorded', {
              pollId,
              optionId,
              userId,
              totalVotes: poll.totalVotes,
              optionVotes: option.votes
            });
          }
        }
      }
    }
  });

  // Whiteboard functionality
  socket.on('whiteboard-update', ({ roomId, drawingData, userId }) => {
    const room = rooms.get(roomId);
    if (room) {
      room.whiteboardData.drawings.push({
        ...drawingData,
        userId,
        timestamp: new Date()
      });
      room.whiteboardData.isActive = true;
      
      socket.to(roomId).emit('whiteboard-updated', {
        drawingData: { ...drawingData, userId },
        timestamp: new Date()
      });
    }
  });

  socket.on('clear-whiteboard', ({ roomId, hostId }) => {
    const room = rooms.get(roomId);
    if (room && room.hostId === hostId) {
      room.whiteboardData = { drawings: [], isActive: false };
      io.to(roomId).emit('whiteboard-cleared');
    }
  });

  // Meeting notes
  socket.on('update-meeting-notes', ({ roomId, hostId, notes }) => {
    const room = rooms.get(roomId);
    if (room && (room.hostId === hostId || room.coHosts.has(hostId))) {
      room.meetingNotes = notes;
      socket.to(roomId).emit('meeting-notes-updated', { notes, timestamp: new Date() });
    }
  });

  // User Management - Block User
  socket.on('block-user', ({ roomId, targetUserId, adminId, reason }) => {
    const room = rooms.get(roomId);
    if (room && (room.hostId === adminId || room.coHosts.has(adminId))) {
      room.blockedUsers.add(targetUserId);
      blockedUsers.set(targetUserId, { 
        blockedBy: adminId, 
        reason, 
        timestamp: new Date(),
        roomId 
      });
      
      const targetParticipant = room.participants.get(targetUserId);
      if (targetParticipant) {
        io.to(targetParticipant.socketId).emit('user-blocked', { reason });
        room.removeParticipant(targetUserId);
        socket.to(roomId).emit('user-removed', { userId: targetUserId, reason: 'blocked' });
      }
      
      console.log(`User ${targetUserId} blocked from room ${roomId} by ${adminId}`);
    }
  });

  // User Management - Suspend User
  socket.on('suspend-user', ({ roomId, targetUserId, adminId, duration, reason }) => {
    const room = rooms.get(roomId);
    if (room && (room.hostId === adminId || room.coHosts.has(adminId))) {
      const suspendUntil = new Date(Date.now() + duration * 60 * 1000); // duration in minutes
      
      room.suspendedUsers.add(targetUserId);
      suspendedUsers.set(targetUserId, { 
        suspendedBy: adminId, 
        reason, 
        suspendedUntil,
        timestamp: new Date(),
        roomId 
      });
      
      const targetParticipant = room.participants.get(targetUserId);
      if (targetParticipant) {
        io.to(targetParticipant.socketId).emit('user-suspended', { 
          reason, 
          duration, 
          suspendedUntil 
        });
        
        // Mute and disable video for suspended user
        room.updateParticipant(targetUserId, { 
          isAudioMuted: true, 
          isVideoMuted: true, 
          isSuspended: true 
        });
        
        socket.to(roomId).emit('user-suspended-notification', { 
          userId: targetUserId, 
          reason, 
          duration 
        });
      }
      
      // Auto-unsuspend after duration
      setTimeout(() => {
        if (room.suspendedUsers.has(targetUserId)) {
          room.suspendedUsers.delete(targetUserId);
          suspendedUsers.delete(targetUserId);
          
          if (room.participants.has(targetUserId)) {
            room.updateParticipant(targetUserId, { isSuspended: false });
            io.to(roomId).emit('user-unsuspended', { userId: targetUserId });
          }
        }
      }, duration * 60 * 1000);
      
      console.log(`User ${targetUserId} suspended from room ${roomId} for ${duration} minutes`);
    }
  });

  // Add Co-Host
  socket.on('add-cohost', ({ roomId, targetUserId, hostId }) => {
    const room = rooms.get(roomId);
    if (room && room.hostId === hostId) {
      room.coHosts.add(targetUserId);
      room.updateParticipant(targetUserId, { role: 'co-host' });
      
      const targetParticipant = room.participants.get(targetUserId);
      if (targetParticipant) {
        io.to(targetParticipant.socketId).emit('promoted-to-cohost');
        socket.to(roomId).emit('cohost-added', { 
          userId: targetUserId, 
          userName: targetParticipant.userName 
        });
      }
      
      console.log(`User ${targetUserId} promoted to co-host in room ${roomId}`);
    }
  });

  // Remove Co-Host
  socket.on('remove-cohost', ({ roomId, targetUserId, hostId }) => {
    const room = rooms.get(roomId);
    if (room && room.hostId === hostId) {
      room.coHosts.delete(targetUserId);
      room.updateParticipant(targetUserId, { role: USER_ROLES.PARTICIPANT });
      
      const targetParticipant = room.participants.get(targetUserId);
      if (targetParticipant) {
        io.to(targetParticipant.socketId).emit('cohost-removed');
        socket.to(roomId).emit('cohost-removed-notification', { 
          userId: targetUserId, 
          userName: targetParticipant.userName 
        });
      }
      
      console.log(`User ${targetUserId} removed from co-host in room ${roomId}`);
    }
  });

  // AI Mode Controls
  socket.on('toggle-ai-mode', ({ roomId, hostId, aiFeatures }) => {
    const room = rooms.get(roomId);
    if (room && (room.hostId === hostId || room.coHosts.has(hostId))) {
      room.aiMode = { ...room.aiMode, ...aiFeatures };
      io.to(roomId).emit('ai-mode-updated', { aiMode: room.aiMode, timestamp: new Date() });
      
      console.log(`AI mode updated in room ${roomId}:`, aiFeatures);
    }
  });

  // Meeting Image Upload
  socket.on('update-meeting-image', ({ roomId, hostId, imageData }) => {
    const room = rooms.get(roomId);
    if (room && (room.hostId === hostId || room.coHosts.has(hostId))) {
      room.meetingImage = imageData;
      io.to(roomId).emit('meeting-image-updated', { imageData, timestamp: new Date() });
    }
  });

  // Advanced Analytics Tracking
  socket.on('track-participant-action', ({ roomId, userId, action, data }) => {
    const room = rooms.get(roomId);
    if (room) {
      if (!room.participantAnalytics.has(userId)) {
        room.participantAnalytics.set(userId, {
          userId,
          actions: [],
          totalActions: 0,
          engagementScore: 0,
          lastActive: new Date()
        });
      }
      
      const analytics = room.participantAnalytics.get(userId);
      analytics.actions.push({
        action,
        data,
        timestamp: new Date()
      });
      analytics.totalActions++;
      analytics.lastActive = new Date();
      
      // Calculate engagement score
      analytics.engagementScore = calculateEngagementScore(analytics.actions);
    }
  });

  // Handle disconnection - Enhanced
  socket.on('disconnect', (reason) => {
    console.log('❌ User disconnected:', socket.id, 'Reason:', reason);
    
    const user = users.get(socket.id);
    if (user) {
      const { userId, roomId, userData } = user;
      const room = rooms.get(roomId);
      
      console.log(`👋 User ${userId} (${userData?.userName || 'Unknown'}) left room ${roomId}`);
      
      if (room) {
        // Remove participant from room
        room.removeParticipant(userId);
        
        // Clean up raised hands
        if (raisedHands.has(roomId)) {
          raisedHands.get(roomId).delete(userId);
        }
        
        // Notify remaining participants
        socket.to(roomId).emit('user-left', { 
          userId, 
          userName: userData?.userName,
          participantCount: room.participants.size,
          timestamp: new Date().toISOString()
        });
        
        // Send updated participants list
        io.to(roomId).emit('room-participants', {
          participants: room.getParticipants(),
          count: room.participants.size,
          timestamp: new Date().toISOString()
        });
        
        console.log(`📊 Room ${roomId} now has ${room.participants.size} participants`);
        
        // If host left, transfer host or end the room
        if (room.hostId === userId) {
          const remainingParticipants = room.getParticipants();
          if (remainingParticipants.length > 0) {
            // Transfer host to first co-host or first participant
            const newHost = remainingParticipants.find(p => room.coHosts.has(p.id)) || remainingParticipants[0];
            room.hostId = newHost.id;
            room.updateParticipant(newHost.id, { role: 'host' });
            
            io.to(roomId).emit('host-transferred', {
              newHostId: newHost.id,
              newHostName: newHost.userName,
              timestamp: new Date().toISOString()
            });
            
            console.log(`👑 Host transferred to ${newHost.id} (${newHost.userName}) in room ${roomId}`);
          } else {
            // No participants left, end the room
            io.to(roomId).emit('room-ended', { timestamp: new Date().toISOString() });
            rooms.delete(roomId);
            raisedHands.delete(roomId);
            console.log(`🏁 Room ${roomId} ended - no participants remaining`);
          }
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
