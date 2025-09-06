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
  userReward.history.push({ points, reason, roomId, timestamp: new Date() });
  return userReward;
}

function getUserRewards(userId) { return userRewards.get(userId) || { userId, points: 0, history: [] }; }
function getLeaderboard(limit = 10) { return Array.from(userRewards.values()).sort((a,b)=>b.points-a.points).slice(0, limit); }
function calculateEngagementScore(actions){ if(!actions||actions.length===0) return 0; const w={ 'message':10,'reaction':5,'hand-raise':15,'screen-share':20,'poll-vote':8,'camera-on':3,'mic-on':3,'join':5,'stay-duration':1}; let s=0; actions.forEach(a=>{ s+=w[a.action]||1; }); return Math.min(Math.round(s/10),100);} 
function generateMeetingReport(roomId){ const room=rooms.get(roomId); if(!room) return null; const participants=Array.from(room.participants.values()).map(p=>{ const analytics=room.participantAnalytics.get(p.id)||{}; return { ...p, analytics, joinDuration:new Date()-new Date(p.joinedAt), pointsEarned:getUserRewards(p.id).points }; }); return { roomId, roomName:room.name, type:room.type, status:room.isRecording?'active':'ended', participants, totalMessages:room.chatHistory.length, totalReactions:room.reactionHistory.length, aiModeUsed:room.aiMode.enabled, recordingDuration:room.recordingStatus==='recording'?'ongoing':'completed', generatedAt:new Date().toISOString() }; }

// Health/debug
app.get('/health', (req,res)=>{ res.json({ status:'OK', timestamp:new Date().toISOString(), server:'ALFA MEET Backend', version:'1.0.0', activeRooms:rooms.size, activeUsers:users.size }); });
app.get('/debug',(req,res)=>{ res.json({ activeRooms:Array.from(rooms.keys()), activeUsers:users.size, corsOrigins:corsOptions.origin, timestamp:new Date().toISOString() }); });

// In-memory meetings store for admin endpoints
const meetings = new Map();
const meetingsByRoomId = new Map();

// --- Minimal Admin & Meetings API ---
app.post('/api/admin/login', (req, res) => {
  const { email, password } = req.body || {};
  if ((email === 'admin@zoom.com' && password === 'admin123') || process.env.SKIP_ADMIN_AUTH === 'true') {
    return res.json({
      success: true,
      user: {
        id: 'admin-1',
        email: email || 'admin@zoom.com',
        name: 'Admin User',
        role: 'admin'
      }
    });
  }
  res.status(401).json({ success: false, error: 'Invalid credentials' });
});

app.post('/api/meetings', (req, res) => {
  try {
    const payload = req.body || {};
    const id = payload.id || `meeting-${Date.now()}`;
    const roomId = payload.roomId || Math.random().toString(36).substring(2, 10);
    const meeting = {
      id,
      title: payload.title || 'Meeting',
      description: payload.description || '',
      scheduledFor: payload.scheduledFor || new Date().toISOString(),
      duration: typeof payload.duration === 'number' ? payload.duration : 60,
      maxParticipants: typeof payload.maxParticipants === 'number' ? payload.maxParticipants : 10,
      createdBy: payload.createdBy || 'Admin',
      createdAt: new Date().toISOString(),
      status: 'scheduled',
      roomId,
      allowScreenShare: payload.allowScreenShare !== false,
      allowChat: payload.allowChat !== false,
      isRecurring: !!payload.isRecurring,
      requirePassword: !!payload.requirePassword,
      password: payload.password || '',
      waitingRoom: !!payload.waitingRoom
    };
    meetings.set(id, meeting);
    meetingsByRoomId.set(roomId, meeting);
    res.json({ success: true, meeting });
  } catch (e) {
    res.status(500).json({ success: false, error: 'Failed to create meeting' });
  }
});

app.get('/api/meetings', (req, res) => {
  res.json({ success: true, meetings: Array.from(meetings.values()) });
});

app.post('/api/meetings/:meetingId/start', (req, res) => {
  const { meetingId } = req.params;
  const meeting = meetings.get(meetingId);
  if (!meeting) return res.status(404).json({ success: false, error: 'Meeting not found' });
  meeting.status = 'active';
  meeting.startedAt = new Date().toISOString();
  meetings.set(meetingId, meeting);
  res.json({ success: true, meeting });
});

app.post('/api/meetings/:meetingId/end', (req, res) => {
  const { meetingId } = req.params;
  const meeting = meetings.get(meetingId);
  if (!meeting) return res.status(404).json({ success: false, error: 'Meeting not found' });
  meeting.status = 'ended';
  meeting.endedAt = new Date().toISOString();
  meetings.set(meetingId, meeting);
  const roomId = meeting.roomId;
  if (rooms.has(roomId)) {
    io.to(roomId).emit('room-ended', { timestamp: new Date().toISOString() });
    rooms.delete(roomId);
  }
  res.json({ success: true, meeting });
});

app.get('/api/rooms/active', (req, res) => {
  const list = Array.from(rooms.keys()).map(roomId => ({
    roomId,
    meetingId: meetingsByRoomId.get(roomId)?.id || null
  }));
  res.json({ rooms: list });
});

// Meeting meta by room id
app.get('/api/meetings/room/:roomId', (req, res) => {
  const { roomId } = req.params;
  const meeting = meetingsByRoomId.get(roomId);
  if (!meeting) return res.status(404).json({ success: false, error: 'Meeting not found' });
  res.json({ success: true, meeting: {
    id: meeting.id,
    roomId: meeting.roomId,
    title: meeting.title,
    requirePassword: !!meeting.requirePassword,
    waitingRoom: !!meeting.waitingRoom
  }});
});

// Create room helpers (kept)
app.post('/api/rooms', (req, res) => {
  const { name, type, hostId, hostName } = req.body;
  if (!name || !type || !hostId) return res.status(400).json({ error: 'Missing required fields' });
  const roomId = uuidv4();
  const room = new Room(roomId, name, type, hostId);
  rooms.set(roomId, room);
  res.json({ roomId, name, type, hostId, joinUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/room/${roomId}` });
});

app.get('/api/rooms/:roomId', (req, res) => {
  const { roomId } = req.params;
  const room = rooms.get(roomId);
  if (!room) return res.status(404).json({ error: 'Room not found' });
  res.json({ id: room.id, name: room.name, type: room.type, hostId: room.hostId, participantCount: room.participants.size, settings: room.settings, createdAt: room.createdAt, recordingStatus: room.recordingStatus, activePoll: room.activePoll, reactionCount: room.reactionHistory.length });
});

// Rewards endpoints (kept)
app.get('/api/rewards/leaderboard', (req,res)=>{ const limit=parseInt(req.query.limit)||10; res.json(getLeaderboard(limit)); });
app.get('/api/rewards/user/:userId', (req,res)=>{ const { userId }=req.params; res.json(getUserRewards(userId)); });

// Socket.io connection handling - Enhanced
io.on('connection', (socket) => {
  console.log('🔌 User connected:', socket.id);
  socket.emit('connection-confirmed', { socketId: socket.id, timestamp: new Date().toISOString(), server: 'ALFA MEET Backend' });
  // Join room
  socket.on('join-room', ({ roomId, userId, userName, userData }) => {
    try {
      if (!roomId || !userId || !userName) { socket.emit('error', { message: 'Missing required room join data' }); return; }
      let room = rooms.get(roomId);
      if (!room) { room = new Room(roomId, `Room ${roomId}`, ROOM_TYPES.MEETING, userId); rooms.set(roomId, room); }
      if (room.blockedUsers.has(userId)) { socket.emit('join-rejected', { reason: 'User is blocked from this room' }); return; }
      const participantData = { userName, ...userData };
      room.addParticipant(userId, socket.id, participantData);
      users.set(socket.id, { userId, roomId, userData: participantData });
      socket.join(roomId);
      const currentHands = raisedHands.get(roomId) ? Array.from(raisedHands.get(roomId).values()) : [];
      const participants = room.getParticipants();
      console.log(`✅ JOIN: room=${roomId} user=${userId} (${userName}) participants=${participants.length}`);
      socket.emit('joined-room', { success: true, roomId, roomName: room.name, roomType: room.type, participants, settings: room.settings, chatHistory: room.chatHistory, reactionHistory: room.reactionHistory.slice(-50), raisedHands: currentHands, activePoll: room.activePoll, recordingStatus: room.recordingStatus, meetingNotes: room.meetingNotes, userRewards: getUserRewards(userId), timestamp: new Date().toISOString() });
      socket.to(roomId).emit('user-joined', { userId, userData: room.participants.get(userId), participantCount: room.participants.size, timestamp: new Date().toISOString() });
      io.to(roomId).emit('room-participants', { participants, count: room.participants.size, timestamp: new Date().toISOString() });
    } catch (error) {
      console.error('❌ Error in join-room:', error);
      socket.emit('error', { message: 'Failed to join room', error: error.message });
    }
  });

  // Graceful leave-room
  socket.on('leave-room', ({ roomId }) => {
    const user = users.get(socket.id);
    if (!user) return;
    const { userId } = user;
    const room = rooms.get(roomId);
    if (!room) return;
    room.removeParticipant(userId);
    socket.leave(roomId);
    console.log(`👋 LEAVE: room=${roomId} user=${userId}`);
    socket.to(roomId).emit('user-left', { userId, participantCount: room.participants.size, timestamp: new Date().toISOString() });
    io.to(roomId).emit('room-participants', { participants: room.getParticipants(), count: room.participants.size, timestamp: new Date().toISOString() });
    users.delete(socket.id);
  });

  // WebRTC signaling
  socket.on('webrtc-offer', ({ roomId, targetId, offer }) => {
    const sender = users.get(socket.id); const room = rooms.get(roomId); if (!sender || !room) return; const target = room.participants.get(targetId); if (target && target.socketId) io.to(target.socketId).emit('webrtc-offer', { fromId: sender.userId, offer });
  });
  socket.on('webrtc-answer', ({ roomId, targetId, answer }) => {
    const sender = users.get(socket.id); const room = rooms.get(roomId); if (!sender || !room) return; const target = room.participants.get(targetId); if (target && target.socketId) io.to(target.socketId).emit('webrtc-answer', { fromId: sender.userId, answer });
  });
  socket.on('ice-candidate', (payload) => { if (payload && payload.to) { const { to, candidate } = payload; socket.to(to).emit('ice-candidate', { from: socket.id, candidate }); return; } });
  socket.on('ice-candidate', ({ roomId, targetId, candidate }) => { const sender = users.get(socket.id); const room = rooms.get(roomId); if (!sender || !room) return; const target = room.participants.get(targetId); if (target && target.socketId) io.to(target.socketId).emit('ice-candidate', { fromId: sender.userId, candidate }); });

  // Media toggles
  socket.on('toggle-audio', ({ roomId, userId, isMuted }) => { const room = rooms.get(roomId); if (!room) return; room.updateParticipant(userId, { isAudioMuted: !!isMuted }); io.to(roomId).emit('user-audio-toggled', { userId, isMuted: !!isMuted }); console.log(`🎤 AUDIO: room=${roomId} user=${userId} muted=${!!isMuted}`); });
  socket.on('toggle-video', ({ roomId, userId, isMuted }) => { const room = rooms.get(roomId); if (!room) return; room.updateParticipant(userId, { isVideoMuted: !!isMuted }); io.to(roomId).emit('user-video-toggled', { userId, isMuted: !!isMuted }); console.log(`📷 VIDEO: room=${roomId} user=${userId} muted=${!!isMuted}`); });
  socket.on('end-room', ({ roomId, hostId }) => { const room = rooms.get(roomId); if (room && room.hostId === hostId) { io.to(roomId).emit('room-ended', { timestamp: new Date().toISOString() }); rooms.delete(roomId); console.log(`🏁 END ROOM: room=${roomId} by host=${hostId}`); } });

  // Admin: force mute/unmute a participant
  socket.on('mute-participant', ({ roomId, targetUserId }) => {
    const room = rooms.get(roomId);
    if (!room) return;
    const target = room.participants.get(targetUserId);
    if (!target) return;
      room.updateParticipant(targetUserId, { isAudioMuted: true });
    io.to(roomId).emit('user-audio-toggled', { userId: targetUserId, isMuted: true });
    // Direct signal to target to enforce locally
    if (target.socketId) io.to(target.socketId).emit('force-mute');
    console.log(`🛑 ADMIN MUTE: room=${roomId} target=${targetUserId}`);
  });

  socket.on('unmute-participant', ({ roomId, targetUserId }) => {
    const room = rooms.get(roomId);
    if (!room) return;
    const target = room.participants.get(targetUserId);
    if (!target) return;
    room.updateParticipant(targetUserId, { isAudioMuted: false });
    io.to(roomId).emit('user-audio-toggled', { userId: targetUserId, isMuted: false });
    if (target.socketId) io.to(target.socketId).emit('force-unmute');
    console.log(`✅ ADMIN UNMUTE: room=${roomId} target=${targetUserId}`);
  });

  // Screen share markers
  socket.on('start-screen-share', ({ roomId, userId }) => { const room = rooms.get(roomId); if (!room) return; room.updateParticipant(userId, { isScreenSharing: true }); io.to(roomId).emit('room-participants', { participants: room.getParticipants(), count: room.participants.size, timestamp: new Date().toISOString() }); console.log(`🖥️ SHARE START: room=${roomId} user=${userId}`); });
  socket.on('stop-screen-share', ({ roomId, userId }) => { const room = rooms.get(roomId); if (!room) return; room.updateParticipant(userId, { isScreenSharing: false }); io.to(roomId).emit('room-participants', { participants: room.getParticipants(), count: room.participants.size, timestamp: new Date().toISOString() }); console.log(`🖥️ SHARE STOP: room=${roomId} user=${userId}`); });

  // Disconnect cleanup
  socket.on('disconnect', () => {
    const user = users.get(socket.id); if (!user) return; const { userId, roomId } = user; const room = rooms.get(roomId); if (!room) { users.delete(socket.id); return; }
        room.removeParticipant(userId);
    socket.to(roomId).emit('user-left', { userId, participantCount: room.participants.size, timestamp: new Date().toISOString() });
    io.to(roomId).emit('room-participants', { participants: room.getParticipants(), count: room.participants.size, timestamp: new Date().toISOString() });
      users.delete(socket.id);
    console.log(`🔴 DISCONNECT: room=${roomId} user=${userId}`);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => { console.log(`Server running on port ${PORT}`); });

module.exports = app;
