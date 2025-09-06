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
// Waiting room queues per room
const waitingQueues = new Map();

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
      meetingLocked: false,
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
      // Meeting locked
      if (room.settings.meetingLocked && userId !== room.hostId) {
        socket.emit('join-rejected', { reason: 'locked', message: 'Meeting is locked by host' });
        return;
      }
      // Waiting room flow (non-host only)
      if (room.settings.waitingRoom && userId !== room.hostId) {
        if (!waitingQueues.has(roomId)) waitingQueues.set(roomId, []);
        const queue = waitingQueues.get(roomId);
        const pending = { userId, userName, socketId: socket.id };
        queue.push(pending);
        waitingQueues.set(roomId, queue);
        socket.join(roomId); // Allow host to target socket via room broadcast if needed
        socket.emit('waiting-room', { status: 'pending', position: queue.length });
        const host = room.participants.get(room.hostId);
        if (host && host.socketId) io.to(host.socketId).emit('waiting-room-updated', { waiting: queue });
        console.log(`⏳ WAITING: room=${roomId} user=${userId} (${userName})`);
        return;
      }
      // If this userId already exists in the room, evict the old session to avoid duplicates
      const existing = room.participants.get(userId);
      if (existing && existing.socketId && existing.socketId !== socket.id) {
        try {
          const oldSocket = io.sockets.sockets.get(existing.socketId);
          if (oldSocket) {
            oldSocket.leave(roomId);
            io.to(existing.socketId).emit('force-disconnect', { reason: 'duplicate-session' });
          }
        } catch {}
        room.removeParticipant(userId);
      }
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

  // Host admits/denies user from waiting room
  socket.on('admit-user', ({ roomId, targetUserId }) => {
    const room = rooms.get(roomId); if (!room) return;
    const acting = users.get(socket.id); if (!acting || acting.userId !== room.hostId) return;
    const queue = waitingQueues.get(roomId) || [];
    const idx = queue.findIndex(u => u.userId === targetUserId);
    if (idx === -1) return;
    const [pending] = queue.splice(idx, 1);
    waitingQueues.set(roomId, queue);
    const participantData = { userName: pending.userName };
    room.addParticipant(pending.userId, pending.socketId, participantData);
    users.set(pending.socketId, { userId: pending.userId, roomId, userData: participantData });
    io.to(pending.socketId).emit('joined-room', { success: true, roomId, roomName: room.name, roomType: room.type, participants: room.getParticipants(), settings: room.settings, chatHistory: room.chatHistory, reactionHistory: room.reactionHistory.slice(-50), raisedHands: Array.from(raisedHands.get(roomId) || []), activePoll: room.activePoll, recordingStatus: room.recordingStatus, meetingNotes: room.meetingNotes, userRewards: getUserRewards(pending.userId), timestamp: new Date().toISOString() });
    socket.to(roomId).emit('user-joined', { userId: pending.userId, userData: room.participants.get(pending.userId), participantCount: room.participants.size, timestamp: new Date().toISOString() });
    io.to(roomId).emit('room-participants', { participants: room.getParticipants(), count: room.participants.size, timestamp: new Date().toISOString() });
    const host = room.participants.get(room.hostId); if (host && host.socketId) io.to(host.socketId).emit('waiting-room-updated', { waiting: waitingQueues.get(roomId) || [] });
    console.log(`✅ ADMIT: room=${roomId} user=${pending.userId}`);
  });

  socket.on('deny-user', ({ roomId, targetUserId }) => {
    const room = rooms.get(roomId); if (!room) return;
    const acting = users.get(socket.id); if (!acting || acting.userId !== room.hostId) return;
    const queue = waitingQueues.get(roomId) || [];
    const idx = queue.findIndex(u => u.userId === targetUserId);
    if (idx === -1) return;
    const [pending] = queue.splice(idx, 1);
    waitingQueues.set(roomId, queue);
    if (pending.socketId) io.to(pending.socketId).emit('join-rejected', { reason: 'denied', message: 'Host denied entry' });
    const host = room.participants.get(room.hostId); if (host && host.socketId) io.to(host.socketId).emit('waiting-room-updated', { waiting: waitingQueues.get(roomId) || [] });
    console.log(`❌ DENY: room=${roomId} user=${targetUserId}`);
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

  // Admin: co-host management
  socket.on('add-cohost', ({ roomId, targetUserId }) => {
    const room = rooms.get(roomId);
    if (!room) return;
    // Only host can assign co-host
    const acting = users.get(socket.id);
    if (!acting || acting.userId !== room.hostId) return;
    const target = room.participants.get(targetUserId);
    if (!target) return;
    room.coHosts.add(targetUserId);
    room.updateParticipant(targetUserId, { role: USER_ROLES.CO_HOST });
    io.to(roomId).emit('room-participants', { participants: room.getParticipants(), count: room.participants.size, timestamp: new Date().toISOString() });
    console.log(`⭐ ADD CO-HOST: room=${roomId} target=${targetUserId}`);
  });

  socket.on('remove-cohost', ({ roomId, targetUserId }) => {
    const room = rooms.get(roomId);
    if (!room) return;
    // Only host can remove co-host
    const acting = users.get(socket.id);
    if (!acting || acting.userId !== room.hostId) return;
    const target = room.participants.get(targetUserId);
    if (!target) return;
    room.coHosts.delete(targetUserId);
    // Demote to participant unless they are the host
    const newRole = targetUserId === room.hostId ? USER_ROLES.HOST : USER_ROLES.PARTICIPANT;
    room.updateParticipant(targetUserId, { role: newRole });
    io.to(roomId).emit('room-participants', { participants: room.getParticipants(), count: room.participants.size, timestamp: new Date().toISOString() });
    console.log(`⬇️ REMOVE CO-HOST: room=${roomId} target=${targetUserId}`);
  });

  // Screen share markers
  socket.on('start-screen-share', ({ roomId, userId }) => { const room = rooms.get(roomId); if (!room) return; room.updateParticipant(userId, { isScreenSharing: true }); io.to(roomId).emit('room-participants', { participants: room.getParticipants(), count: room.participants.size, timestamp: new Date().toISOString() }); console.log(`🖥️ SHARE START: room=${roomId} user=${userId}`); });
  socket.on('stop-screen-share', ({ roomId, userId }) => { const room = rooms.get(roomId); if (!room) return; room.updateParticipant(userId, { isScreenSharing: false }); io.to(roomId).emit('room-participants', { participants: room.getParticipants(), count: room.participants.size, timestamp: new Date().toISOString() }); console.log(`🖥️ SHARE STOP: room=${roomId} user=${userId}`); });

  // Chat messages
  socket.on('send-message', (data) => {
    try {
      const { roomId, userId, userName, message, timestamp } = data || {};
    const room = rooms.get(roomId);
      if (!room || !message) return;
      const msg = { id: uuidv4(), userId, userName, message, timestamp: timestamp || new Date().toISOString() };
      room.chatHistory.push(msg);
      io.to(roomId).emit('new-message', msg);
      console.log(`💬 CHAT: room=${roomId} user=${userId} ${message}`);
    } catch (e) { console.error('send-message error', e); }
  });

  // Reactions
  socket.on('send-reaction', (data) => {
    try {
      const { roomId, userId, userName, emoji, timestamp } = data || {};
    const room = rooms.get(roomId);
      if (!room || !emoji) return;
      const reaction = { id: uuidv4(), userId, userName, emoji, timestamp: timestamp || new Date().toISOString() };
      room.reactionHistory.push(reaction);
      io.to(roomId).emit('new-reaction', reaction);
      console.log(`😀 REACTION: room=${roomId} user=${userId} ${emoji}`);
    } catch (e) { console.error('send-reaction error', e); }
  });

  // Raise hand
  socket.on('raise-hand', (data) => {
    try {
      const { roomId, userId, userName } = data || {};
      if (!roomId || !userId) return;
      if (!raisedHands.has(roomId)) raisedHands.set(roomId, new Set());
      raisedHands.get(roomId).add(userId);
      io.to(roomId).emit('hand-raised', { userId, userName, timestamp: new Date().toISOString() });
      console.log(`✋ HAND RAISED: room=${roomId} user=${userId}`);
    } catch (e) { console.error('raise-hand error', e); }
  });

  socket.on('lower-hand', (data) => {
    try {
      const { roomId, userId } = data || {};
      if (!roomId || !userId) return;
      if (raisedHands.has(roomId)) raisedHands.get(roomId).delete(userId);
      io.to(roomId).emit('hand-lowered', { userId, timestamp: new Date().toISOString() });
      console.log(`✋ HAND LOWERED: room=${roomId} user=${userId}`);
    } catch (e) { console.error('lower-hand error', e); }
  });

  // Host tools
  socket.on('mute-all', ({ roomId }) => {
    const room = rooms.get(roomId);
    if (!room) return;
    const acting = users.get(socket.id);
    if (!acting || acting.userId !== room.hostId) return;
    room.participants.forEach((p, id) => {
      room.updateParticipant(id, { isAudioMuted: true });
      if (p.socketId) io.to(p.socketId).emit('force-mute');
      io.to(roomId).emit('user-audio-toggled', { userId: id, isMuted: true });
    });
    console.log(`🔇 MUTE ALL: room=${roomId}`);
  });

  socket.on('toggle-chat-lock', ({ roomId }) => {
    const room = rooms.get(roomId);
    if (!room) return;
    const acting = users.get(socket.id);
    if (!acting || acting.userId !== room.hostId) return;
    const next = !(room.settings.allowChat !== false);
    // next === true means lock chat -> allowChat false
    room.settings.allowChat = !next;
    io.to(roomId).emit('chat-locked', { locked: next });
    console.log(`🔐 CHAT LOCK: room=${roomId} locked=${next}`);
  });

  socket.on('toggle-meeting-lock', ({ roomId }) => {
    const room = rooms.get(roomId);
    if (!room) return;
    const acting = users.get(socket.id);
    if (!acting || acting.userId !== room.hostId) return;
    room.settings.meetingLocked = !room.settings.meetingLocked;
    io.to(roomId).emit('meeting-lock-changed', { locked: room.settings.meetingLocked });
    console.log(`🔒 MEETING LOCK: room=${roomId} locked=${room.settings.meetingLocked}`);
  });

  socket.on('toggle-waiting-room', ({ roomId }) => {
    const room = rooms.get(roomId);
    if (!room) return;
    const acting = users.get(socket.id);
    if (!acting || acting.userId !== room.hostId) return;
    room.settings.waitingRoom = !room.settings.waitingRoom;
    io.to(roomId).emit('waiting-room-toggled', { enabled: room.settings.waitingRoom });
    console.log(`🚪 WAITING ROOM TOGGLE: room=${roomId} enabled=${room.settings.waitingRoom}`);
  });

  // Host-only: remove a participant from the room
  socket.on('remove-participant', ({ roomId, targetUserId }) => {
    const room = rooms.get(roomId);
    if (!room) return;
    const acting = users.get(socket.id);
    if (!acting || acting.userId !== room.hostId) return;
    if (targetUserId === room.hostId) return; // cannot remove host
    const target = room.participants.get(targetUserId);
    if (!target) return;
    // Notify target and disconnect from room
    if (target.socketId) {
      io.to(target.socketId).emit('removed-from-room', { roomId, reason: 'removed-by-host' });
      const targetSocket = io.sockets.sockets.get(target.socketId);
      try { targetSocket && targetSocket.leave(roomId); } catch {}
    }
        room.removeParticipant(targetUserId);
    io.to(roomId).emit('user-left', { userId: targetUserId, participantCount: room.participants.size, timestamp: new Date().toISOString() });
    io.to(roomId).emit('room-participants', { participants: room.getParticipants(), count: room.participants.size, timestamp: new Date().toISOString() });
    console.log(`🚪 REMOVE USER: room=${roomId} target=${targetUserId}`);
  });

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
