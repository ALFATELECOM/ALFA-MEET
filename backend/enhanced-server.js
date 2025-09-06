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

// Meeting storage
const meetings = new Map();
const meetingTemplates = new Map();
const adminUsers = new Map();

// Initialize admin user
adminUsers.set('admin@zoom.com', {
  id: 'admin-1',
  email: 'admin@zoom.com',
  name: 'Admin User',
  role: 'admin',
  personalMeetingId: '070-387-7760',
  createdAt: new Date().toISOString()
});

// Initialize meeting templates
const initializeTemplates = () => {
  const templates = [
    {
      id: 'team-meeting',
      name: 'Team Meeting',
      description: 'Regular team sync with video, chat, and screen sharing',
      duration: 60,
      maxParticipants: 100,
      features: ['video', 'audio', 'chat', 'screenShare'],
      settings: {
        allowScreenShare: true,
        enableChat: true,
        enableReactions: true,
        waitingRoom: false,
        requirePassword: false
      }
    },
    {
      id: 'client-presentation',
      name: 'Client Presentation',
      description: 'Professional presentation with waiting room and recording',
      duration: 90,
      maxParticipants: 50,
      features: ['video', 'audio', 'screenShare', 'recording', 'waitingRoom'],
      settings: {
        allowScreenShare: true,
        enableChat: true,
        enableReactions: false,
        waitingRoom: true,
        requirePassword: true
      }
    },
    {
      id: 'webinar',
      name: 'Webinar',
      description: 'Large audience webinar with Q&A and polls',
      duration: 120,
      maxParticipants: 10000,
      meetingType: 'webinar',
      features: ['webinarMode', 'qa', 'polls', 'registration'],
      settings: {
        allowScreenShare: false,
        enableChat: true,
        enableReactions: true,
        waitingRoom: true,
        requirePassword: false
      }
    },
    {
      id: 'training',
      name: 'Training Session',
      description: 'Interactive training with breakout rooms and whiteboard',
      duration: 180,
      maxParticipants: 200,
      features: ['video', 'audio', 'breakoutRooms', 'whiteboard', 'recording'],
      settings: {
        allowScreenShare: true,
        enableChat: true,
        enableReactions: true,
        waitingRoom: false,
        requirePassword: false
      }
    },
    {
      id: 'interview',
      name: 'Interview',
      description: 'One-on-one interview with recording and waiting room',
      duration: 45,
      maxParticipants: 10,
      features: ['video', 'audio', 'recording', 'waitingRoom', 'privateChat'],
      settings: {
        allowScreenShare: true,
        enableChat: true,
        enableReactions: false,
        waitingRoom: true,
        requirePassword: true
      }
    },
    {
      id: 'all-hands',
      name: 'All Hands Meeting',
      description: 'Company-wide meeting with live streaming',
      duration: 90,
      maxParticipants: 10000,
      meetingType: 'webinar',
      features: ['webinarMode', 'liveStream', 'qa', 'recording'],
      settings: {
        allowScreenShare: false,
        enableChat: true,
        enableReactions: true,
        waitingRoom: false,
        requirePassword: false
      }
    }
  ];

  templates.forEach(template => {
    meetingTemplates.set(template.id, template);
  });
};

initializeTemplates();

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

// Meeting status
const MEETING_STATUS = {
  SCHEDULED: 'scheduled',
  ACTIVE: 'active',
  ENDED: 'ended',
  CANCELLED: 'cancelled'
};

class Room {
  constructor(id, name, type, hostId, meetingData = null) {
    this.id = id;
    this.name = name;
    this.type = type;
    this.hostId = hostId;
    this.participants = new Map();
    this.meetingData = meetingData; // Store original meeting data
    this.settings = {
      allowScreenShare: meetingData?.allowScreenShare ?? true,
      allowChat: meetingData?.enableChat ?? true,
      allowRecording: meetingData?.enableRecording ?? true,
      muteOnEntry: type === ROOM_TYPES.WEBINAR,
      waitingRoom: meetingData?.waitingRoom ?? false,
      allowReactions: meetingData?.enableReactions ?? true,
      allowRaiseHand: true,
      rewardsEnabled: true,
      maxParticipants: meetingData?.maxParticipants ?? 10000,
      requireAdminStart: false,
      allowCoHosts: true,
      userManagement: {
        allowBlock: true,
        allowSuspend: true,
        allowKick: true
      },
      requirePassword: meetingData?.requirePassword ?? false,
      password: meetingData?.password || null
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
  }

  addParticipant(userId, userData) {
    this.participants.set(userId, {
      id: userId,
      ...userData,
      joinedAt: new Date(),
      isAudioMuted: false,
      isVideoMuted: false,
      isScreenSharing: false,
      role: userId === this.hostId ? USER_ROLES.HOST : USER_ROLES.PARTICIPANT,
      permissions: this.getPermissions(userId === this.hostId ? USER_ROLES.HOST : USER_ROLES.PARTICIPANT)
    });
  }

  removeParticipant(userId) {
    const participant = this.participants.get(userId);
    if (participant) {
      participant.leftAt = new Date();
      this.participants.delete(userId);
    }
    return participant;
  }

  getPermissions(role) {
    switch (role) {
      case USER_ROLES.HOST:
        return {
          canMute: true,
          canUnmute: true,
          canKick: true,
          canManageBreakouts: true,
          canRecord: true,
          canShareScreen: true,
          canManagePolls: true,
          canManageWhiteboard: true
        };
      case USER_ROLES.MODERATOR:
        return {
          canMute: true,
          canUnmute: true,
          canKick: true,
          canManageBreakouts: false,
          canRecord: false,
          canShareScreen: true,
          canManagePolls: true,
          canManageWhiteboard: true
        };
      default:
        return {
          canMute: false,
          canUnmute: false,
          canKick: false,
          canManageBreakouts: false,
          canRecord: false,
          canShareScreen: this.settings.allowScreenShare,
          canManagePolls: false,
          canManageWhiteboard: false
        };
    }
  }
}

// API Routes

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    rooms: rooms.size,
    users: users.size,
    meetings: meetings.size
  });
});

// Debug endpoint
app.get('/debug', (req, res) => {
  res.json({
    rooms: Array.from(rooms.keys()),
    users: Array.from(users.keys()),
    meetings: Array.from(meetings.keys()),
    templates: Array.from(meetingTemplates.keys()),
    admins: Array.from(adminUsers.keys())
  });
});

// Admin Authentication
app.post('/api/admin/login', (req, res) => {
  const { email, password } = req.body;
  
  // Simple authentication (in production, use proper password hashing)
  if (email === 'admin@zoom.com' && password === 'admin123') {
    const admin = adminUsers.get(email);
    res.json({
      success: true,
      user: admin
    });
  } else {
    res.status(401).json({
      success: false,
      error: 'Invalid credentials'
    });
  }
});

// Meeting Management APIs

// Get all meetings
app.get('/api/meetings', (req, res) => {
  const meetingList = Array.from(meetings.values()).map(meeting => ({
    ...meeting,
    participants: meeting.participants ? meeting.participants.length : 0
  }));
  
  res.json({
    success: true,
    meetings: meetingList
  });
});

// Get active rooms (live sessions)
app.get('/api/rooms/active', (req, res) => {
  try {
    const activeRooms = Array.from(rooms.values()).map(room => ({
      roomId: room.id,
      name: room.name,
      type: room.type,
      hostId: room.hostId,
      participants: Array.from(room.participants.values()).map(p => ({
        id: p.id,
        userName: p.userName,
        role: p.role,
        isAudioMuted: p.isAudioMuted,
        isVideoMuted: p.isVideoMuted
      })),
      participantCount: room.participants.size,
      meetingId: room.meetingData?.id || null,
      meetingTitle: room.meetingData?.title || null,
      createdAt: room.createdAt
    }));

    res.json({ success: true, rooms: activeRooms });
  } catch (error) {
    console.error('Error fetching active rooms:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch active rooms' });
  }
});

// End a room by roomId (admin action)
app.post('/api/rooms/:roomId/end', (req, res) => {
  try {
    const { roomId } = req.params;
    const room = rooms.get(roomId);
    if (!room) {
      return res.status(404).json({ success: false, error: 'Room not found' });
    }

    // If linked meeting exists, mark it ended as well
    if (room.meetingData && meetings.has(room.meetingData.id)) {
      const meeting = meetings.get(room.meetingData.id);
      meeting.status = MEETING_STATUS.ENDED;
      meeting.endedAt = new Date().toISOString();
      meeting.updatedAt = new Date().toISOString();
      meetings.set(meeting.id, meeting);
    }

    io.to(roomId).emit('room-ended', { roomId });
    rooms.delete(roomId);
    console.log(`🛑 Room force-ended by admin: ${roomId}`);

    res.json({ success: true });
  } catch (error) {
    console.error('Error ending room:', error);
    res.status(500).json({ success: false, error: 'Failed to end room' });
  }
});

// Create meeting
app.post('/api/meetings', (req, res) => {
  try {
    const meetingData = req.body;
    
    // Validate required fields
    if (!meetingData.title || !meetingData.date || !meetingData.time) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: title, date, time'
      });
    }

    // Generate meeting ID
    const meetingId = `meeting-${Date.now()}`;
    const roomId = meetingData.meetingIdType === 'personal' 
      ? '070-387-7760' 
      : Math.random().toString(36).substring(2, 15);

    // Create meeting object
    const meeting = {
      id: meetingId,
      roomId: roomId,
      title: meetingData.title,
      description: meetingData.description || '',
      date: meetingData.date,
      time: meetingData.time,
      timezone: meetingData.timezone || 'GMT+5:30',
      duration: meetingData.duration || 60,
      maxParticipants: meetingData.maxParticipants || 100,
      meetingType: meetingData.meetingType || 'meeting',
      template: meetingData.template || '',
      
      // Security settings
      requirePassword: meetingData.requirePassword || false,
      password: meetingData.password || null,
      waitingRoom: meetingData.waitingRoom || false,
      requireAuth: meetingData.requireAuth || false,
      
      // Feature settings
      allowScreenShare: meetingData.allowScreenShare !== false,
      enableChat: meetingData.enableChat !== false,
      enableRecording: meetingData.enableRecording || false,
      enableReactions: meetingData.enableReactions !== false,
      
      // Meeting ID settings
      meetingIdType: meetingData.meetingIdType || 'auto',
      
      // Status and metadata
      status: MEETING_STATUS.SCHEDULED,
      createdBy: 'admin', // In production, get from auth
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      
      // Runtime data
      participants: [],
      startedAt: null,
      endedAt: null,
      actualDuration: 0,
      recordingUrl: null,
      chatHistory: [],
      analytics: {
        peakParticipants: 0,
        totalMessages: 0,
        totalReactions: 0,
        participantJoinTimes: {},
        participantLeaveTimes: {}
      }
    };

    // Apply template settings if template is selected
    if (meetingData.template && meetingTemplates.has(meetingData.template)) {
      const template = meetingTemplates.get(meetingData.template);
      meeting.duration = template.duration;
      meeting.maxParticipants = template.maxParticipants;
      meeting.meetingType = template.meetingType || meeting.meetingType;
      
      // Apply template settings
      Object.assign(meeting, template.settings);
    }

    // Store meeting
    meetings.set(meetingId, meeting);

    console.log(`✅ Meeting created: ${meeting.title} (ID: ${meetingId}, Room: ${roomId})`);

    res.json({
      success: true,
      meeting: meeting
    });

  } catch (error) {
    console.error('Error creating meeting:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create meeting'
    });
  }
});

// Get meeting by ID
app.get('/api/meetings/:id', (req, res) => {
  const meetingId = req.params.id;
  const meeting = meetings.get(meetingId);
  
  if (!meeting) {
    return res.status(404).json({
      success: false,
      error: 'Meeting not found'
    });
  }
  
  res.json({
    success: true,
    meeting: meeting
  });
});

// Update meeting
app.put('/api/meetings/:id', (req, res) => {
  const meetingId = req.params.id;
  const meeting = meetings.get(meetingId);
  
  if (!meeting) {
    return res.status(404).json({
      success: false,
      error: 'Meeting not found'
    });
  }
  
  // Update meeting data
  const updatedMeeting = {
    ...meeting,
    ...req.body,
    updatedAt: new Date().toISOString()
  };
  
  meetings.set(meetingId, updatedMeeting);
  
  res.json({
    success: true,
    meeting: updatedMeeting
  });
});

// Delete meeting
app.delete('/api/meetings/:id', (req, res) => {
  const meetingId = req.params.id;
  
  if (!meetings.has(meetingId)) {
    return res.status(404).json({
      success: false,
      error: 'Meeting not found'
    });
  }
  
  meetings.delete(meetingId);
  
  res.json({
    success: true,
    message: 'Meeting deleted successfully'
  });
});

// Start meeting
app.post('/api/meetings/:id/start', (req, res) => {
  const meetingId = req.params.id;
  const meeting = meetings.get(meetingId);
  
  if (!meeting) {
    return res.status(404).json({
      success: false,
      error: 'Meeting not found'
    });
  }
  
  // Update meeting status
  meeting.status = MEETING_STATUS.ACTIVE;
  meeting.startedAt = new Date().toISOString();
  meeting.updatedAt = new Date().toISOString();
  
  // Create room if it doesn't exist
  if (!rooms.has(meeting.roomId)) {
    const room = new Room(meeting.roomId, meeting.title, meeting.meetingType, 'admin', meeting);
    rooms.set(meeting.roomId, room);
    console.log(`🏠 Room created for meeting: ${meeting.roomId}`);
  }
  
  meetings.set(meetingId, meeting);
  
  res.json({
    success: true,
    meeting: meeting,
    joinUrl: `/join/${meeting.roomId}`
  });
});

// End meeting
app.post('/api/meetings/:id/end', (req, res) => {
  const meetingId = req.params.id;
  const meeting = meetings.get(meetingId);
  
  if (!meeting) {
    return res.status(404).json({
      success: false,
      error: 'Meeting not found'
    });
  }
  
  // Update meeting status
  meeting.status = MEETING_STATUS.ENDED;
  meeting.endedAt = new Date().toISOString();
  meeting.updatedAt = new Date().toISOString();
  
  if (meeting.startedAt) {
    meeting.actualDuration = Math.floor(
      (new Date(meeting.endedAt) - new Date(meeting.startedAt)) / 60000
    ); // Duration in minutes
  }
  
  // Remove room
  if (rooms.has(meeting.roomId)) {
    const room = rooms.get(meeting.roomId);
    // Notify all participants that meeting ended
    io.to(meeting.roomId).emit('meeting-ended', {
      message: 'The meeting has been ended by the host',
      meeting: meeting
    });
    rooms.delete(meeting.roomId);
    console.log(`🏠 Room deleted for ended meeting: ${meeting.roomId}`);
  }
  
  meetings.set(meetingId, meeting);
  
  res.json({
    success: true,
    meeting: meeting
  });
});

// Get meeting templates
app.get('/api/templates', (req, res) => {
  const templateList = Array.from(meetingTemplates.values());
  
  res.json({
    success: true,
    templates: templateList
  });
});

// Get meeting analytics
app.get('/api/meetings/:id/analytics', (req, res) => {
  const meetingId = req.params.id;
  const meeting = meetings.get(meetingId);
  
  if (!meeting) {
    return res.status(404).json({
      success: false,
      error: 'Meeting not found'
    });
  }
  
  res.json({
    success: true,
    analytics: meeting.analytics
  });
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`🔌 User connected: ${socket.id}`);
  
  // Store user connection
  users.set(socket.id, {
    id: socket.id,
    connectedAt: new Date(),
    currentRoom: null
  });

  // Send connection confirmation
  socket.emit('connection-confirmed', {
    socketId: socket.id,
    timestamp: new Date().toISOString()
  });

  // Join room
  socket.on('join-room', async (data) => {
    try {
      const { roomId, userId, userName, userData = {} } = data;
      
      console.log(`👤 User ${userName} (${userId}) attempting to join room: ${roomId}`);

      // Check if user is blocked
      if (blockedUsers.has(userId)) {
        socket.emit('join-rejected', {
          reason: 'blocked',
          message: 'You have been blocked from joining meetings'
        });
        return;
      }

      // Check if user is suspended
      if (suspendedUsers.has(userId)) {
        socket.emit('join-rejected', {
          reason: 'suspended',
          message: 'Your account is suspended'
        });
        return;
      }

      // Get or create room
      let room = rooms.get(roomId);
      
      // If room doesn't exist, try to find associated meeting
      if (!room) {
        // Look for a meeting with this room ID
        const meeting = Array.from(meetings.values()).find(m => m.roomId === roomId);
        if (meeting && meeting.status === MEETING_STATUS.SCHEDULED) {
          // Auto-start the meeting
          meeting.status = MEETING_STATUS.ACTIVE;
          meeting.startedAt = new Date().toISOString();
          meetings.set(meeting.id, meeting);
        }
        
        // Create room
        const roomType = userData.meetingType || ROOM_TYPES.MEETING;
        room = new Room(roomId, `Room ${roomId}`, roomType, userId, meeting);
        rooms.set(roomId, room);
        console.log(`🏠 New room created: ${roomId} (Type: ${roomType})`);
      }

      // Check room capacity
      if (room.participants.size >= room.settings.maxParticipants) {
        socket.emit('join-rejected', {
          reason: 'capacity',
          message: 'Room is at maximum capacity'
        });
        return;
      }

      // Check password if required
      if (room.settings.requirePassword && room.settings.password) {
        if (!userData.password || userData.password !== room.settings.password) {
          socket.emit('join-rejected', {
            reason: 'password',
            message: 'Incorrect password'
          });
          return;
        }
      }

      // Join socket room
      socket.join(roomId);
      
      // Update user info
      const user = users.get(socket.id);
      if (user) {
        user.currentRoom = roomId;
        user.userId = userId;
        user.userName = userName;
      }

      // Add participant to room
      room.addParticipant(userId, {
        socketId: socket.id,
        userName,
        ...userData
      });

      // Get participant list
      const participants = Array.from(room.participants.values()).map(p => ({
        id: p.id,
        userName: p.userName,
        role: p.role,
        isAudioMuted: p.isAudioMuted,
        isVideoMuted: p.isVideoMuted,
        isScreenSharing: p.isScreenSharing,
        joinedAt: p.joinedAt
      }));

      // Notify user they joined successfully
      socket.emit('joined-room', {
        roomId,
        participants,
        chatHistory: room.chatHistory,
        roomSettings: room.settings,
        userRole: room.participants.get(userId)?.role || USER_ROLES.PARTICIPANT
      });

      // Notify others in room
      socket.to(roomId).emit('user-joined', {
        userId,
        userData: room.participants.get(userId)
      });

      // Send updated participant list to all
      io.to(roomId).emit('room-participants', participants);

      console.log(`✅ User ${userName} joined room ${roomId}. Total participants: ${room.participants.size}`);

      // Update meeting analytics if this is an active meeting
      const meeting = Array.from(meetings.values()).find(m => m.roomId === roomId);
      if (meeting) {
        meeting.analytics.participantJoinTimes[userId] = new Date().toISOString();
        if (room.participants.size > meeting.analytics.peakParticipants) {
          meeting.analytics.peakParticipants = room.participants.size;
        }
        meetings.set(meeting.id, meeting);
      }

    } catch (error) {
      console.error('Error in join-room:', error);
      socket.emit('join-rejected', {
        reason: 'error',
        message: 'Failed to join room'
      });
    }
  });

  // Send message
  socket.on('send-message', (data) => {
    const { roomId, userId, userName, message, timestamp } = data;
    const room = rooms.get(roomId);
    
    if (room) {
      const messageData = {
        id: uuidv4(),
        userId,
        userName,
        message,
        timestamp: timestamp || new Date().toISOString()
      };
      
      // Store in room history
      room.chatHistory.push(messageData);
      
      // Award points for chat message
      if (!userRewards.has(userId)) {
        userRewards.set(userId, { points: 0, messages: 0 });
      }
      const rewards = userRewards.get(userId);
      rewards.points += 20; // 20 points per message
      rewards.messages += 1;
      
      // Broadcast message
      io.to(roomId).emit('new-message', messageData);
      
      // Send reward update
      socket.emit('reward-update', {
        userId,
        points: rewards.points,
        totalMessages: rewards.messages
      });

      // Update meeting analytics
      const meeting = Array.from(meetings.values()).find(m => m.roomId === roomId);
      if (meeting) {
        meeting.analytics.totalMessages += 1;
        meetings.set(meeting.id, meeting);
      }
      
      console.log(`💬 Message from ${userName} in ${roomId}: ${message}`);
    }
  });

  // Send reaction
  socket.on('send-reaction', (data) => {
    const { roomId, userId, userName, emoji, timestamp } = data;
    const room = rooms.get(roomId);
    
    if (room && room.settings.allowReactions) {
      const reactionData = {
        id: uuidv4(),
        userId,
        userName,
        emoji,
        timestamp: timestamp || new Date().toISOString()
      };
      
      // Store in room history
      room.reactionHistory.push(reactionData);
      
      // Broadcast reaction
      io.to(roomId).emit('new-reaction', reactionData);

      // Update meeting analytics
      const meeting = Array.from(meetings.values()).find(m => m.roomId === roomId);
      if (meeting) {
        meeting.analytics.totalReactions += 1;
        meetings.set(meeting.id, meeting);
      }
      
      console.log(`😀 Reaction ${emoji} from ${userName} in ${roomId}`);
    }
  });

  // Raise hand
  socket.on('raise-hand', (data) => {
    const { roomId, userId, userName } = data;
    
    if (!raisedHands.has(roomId)) {
      raisedHands.set(roomId, new Set());
    }
    
    raisedHands.get(roomId).add(userId);
    
    // Notify room
    io.to(roomId).emit('hand-raised', {
      userId,
      userName,
      timestamp: new Date().toISOString()
    });
    
    console.log(`✋ ${userName} raised hand in ${roomId}`);
  });

  // Lower hand
  socket.on('lower-hand', (data) => {
    const { roomId, userId } = data;
    
    if (raisedHands.has(roomId)) {
      raisedHands.get(roomId).delete(userId);
    }
    
    // Notify room
    io.to(roomId).emit('hand-lowered', {
      userId,
      timestamp: new Date().toISOString()
    });
    
    console.log(`✋ Hand lowered for user ${userId} in ${roomId}`);
  });

  // WebRTC Signaling Events
  socket.on('webrtc-offer', (data) => {
    const { roomId, targetId, offer } = data;
    const room = rooms.get(roomId);
    if (!room) return;
    // Determine sender's userId from socketId
    let fromUserId = null;
    for (const [uid, participant] of room.participants.entries()) {
      if (participant.socketId === socket.id) {
        fromUserId = uid;
        break;
      }
    }
    console.log(`📞 WebRTC offer from ${fromUserId || socket.id} to ${targetId} in room ${roomId}`);
    // Forward offer to target user
    const target = room.participants.get(targetId);
    if (target) {
      io.to(target.socketId).emit('webrtc-offer', {
        fromId: fromUserId || socket.id,
        offer: offer
      });
    }
  });

  socket.on('webrtc-answer', (data) => {
    const { roomId, targetId, answer } = data;
    const room = rooms.get(roomId);
    if (!room) return;
    // Determine sender's userId from socketId
    let fromUserId = null;
    for (const [uid, participant] of room.participants.entries()) {
      if (participant.socketId === socket.id) {
        fromUserId = uid;
        break;
      }
    }
    console.log(`📞 WebRTC answer from ${fromUserId || socket.id} to ${targetId} in room ${roomId}`);
    const target = room.participants.get(targetId);
    if (target) {
      io.to(target.socketId).emit('webrtc-answer', {
        fromId: fromUserId || socket.id,
        answer: answer
      });
    }
  });

  socket.on('ice-candidate', (data) => {
    const { roomId, targetId, candidate } = data;
    const room = rooms.get(roomId);
    if (!room) return;
    let fromUserId = null;
    for (const [uid, participant] of room.participants.entries()) {
      if (participant.socketId === socket.id) {
        fromUserId = uid;
        break;
      }
    }
    console.log(`🧊 ICE candidate from ${fromUserId || socket.id} to ${targetId} in room ${roomId}`);
    const target = room.participants.get(targetId);
    if (target) {
      io.to(target.socketId).emit('ice-candidate', {
        fromId: fromUserId || socket.id,
        candidate: candidate
      });
    }
  });

  // Media state updates
  socket.on('toggle-audio', (data) => {
    const { roomId, userId, isAudioEnabled } = data;
    const room = rooms.get(roomId);
    
    if (room && room.participants.has(userId)) {
      const participant = room.participants.get(userId);
      participant.isAudioMuted = !isAudioEnabled;
      
      // Notify other participants
      socket.to(roomId).emit('participant-audio-toggle', {
        userId,
        isAudioMuted: participant.isAudioMuted
      });
      
      console.log(`🎤 Audio ${isAudioEnabled ? 'enabled' : 'disabled'} for ${userId} in ${roomId}`);
    }
  });

  socket.on('toggle-video', (data) => {
    const { roomId, userId, isVideoEnabled } = data;
    const room = rooms.get(roomId);
    
    if (room && room.participants.has(userId)) {
      const participant = room.participants.get(userId);
      participant.isVideoMuted = !isVideoEnabled;
      
      // Notify other participants
      socket.to(roomId).emit('participant-video-toggle', {
        userId,
        isVideoMuted: participant.isVideoMuted
      });
      
      console.log(`📹 Video ${isVideoEnabled ? 'enabled' : 'disabled'} for ${userId} in ${roomId}`);
    }
  });

  // Host ends the room via socket event
  socket.on('end-room', (data) => {
    const { roomId, hostId } = data || {};
    const room = rooms.get(roomId);
    if (!room) return;
    // Only host can end the room
    if (room.hostId && room.hostId !== hostId) return;
    // End linked meeting if exists
    if (room.meetingData && meetings.has(room.meetingData.id)) {
      const meeting = meetings.get(room.meetingData.id);
      meeting.status = MEETING_STATUS.ENDED;
      meeting.endedAt = new Date().toISOString();
      meeting.updatedAt = new Date().toISOString();
      meetings.set(meeting.id, meeting);
    }
    io.to(roomId).emit('room-ended', { roomId });
    rooms.delete(roomId);
    console.log(`🛑 Room ended via socket: ${roomId}`);
  });

  // Leave room
  socket.on('leave-room', (data) => {
    const { roomId } = data;
    handleUserLeaving(socket.id, roomId);
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log(`🔌 User disconnected: ${socket.id}`);
    
    const user = users.get(socket.id);
    if (user && user.currentRoom) {
      handleUserLeaving(socket.id, user.currentRoom);
    }
    
    users.delete(socket.id);
  });

  // Helper function to handle user leaving
  function handleUserLeaving(socketId, roomId) {
    const room = rooms.get(roomId);
    if (!room) return;

    // Find user by socket ID
    let leavingUserId = null;
    let leavingUser = null;
    
    for (const [userId, participant] of room.participants.entries()) {
      if (participant.socketId === socketId) {
        leavingUserId = userId;
        leavingUser = participant;
        break;
      }
    }

    if (leavingUserId) {
      // Remove from room
      room.removeParticipant(leavingUserId);
      
      // Remove raised hand
      if (raisedHands.has(roomId)) {
        raisedHands.get(roomId).delete(leavingUserId);
      }
      
      // Notify others
      socket.to(roomId).emit('user-left', {
        userId: leavingUserId,
        userName: leavingUser.userName
      });

      // Send updated participant list
      const participants = Array.from(room.participants.values()).map(p => ({
        id: p.id,
        userName: p.userName,
        role: p.role,
        isAudioMuted: p.isAudioMuted,
        isVideoMuted: p.isVideoMuted,
        isScreenSharing: p.isScreenSharing
      }));
      
      io.to(roomId).emit('room-participants', participants);

      console.log(`👋 User ${leavingUser.userName} left room ${roomId}. Remaining: ${room.participants.size}`);

      // Update meeting analytics
      const meeting = Array.from(meetings.values()).find(m => m.roomId === roomId);
      if (meeting) {
        meeting.analytics.participantLeaveTimes[leavingUserId] = new Date().toISOString();
        meetings.set(meeting.id, meeting);
      }

      // Handle host transfer if host left and there are other participants
      if (leavingUser.role === USER_ROLES.HOST && room.participants.size > 0) {
        // Transfer host to first co-host or participant
        const newHost = Array.from(room.participants.values())[0];
        newHost.role = USER_ROLES.HOST;
        
        io.to(roomId).emit('host-transferred', {
          newHostId: newHost.id,
          newHostName: newHost.userName
        });
        
        console.log(`👑 Host transferred to ${newHost.userName} in room ${roomId}`);
      }

      // Delete room if empty
      if (room.participants.size === 0) {
        rooms.delete(roomId);
        raisedHands.delete(roomId);
        console.log(`🏠 Empty room deleted: ${roomId}`);
      }
    }
  }
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`
🚀 ALFA MEET Backend Server Running!
📍 Port: ${PORT}
🌐 Environment: ${process.env.NODE_ENV || 'development'}
🏠 Rooms: ${rooms.size}
👥 Users: ${users.size}
📅 Meetings: ${meetings.size}
📋 Templates: ${meetingTemplates.size}
👨‍💼 Admins: ${adminUsers.size}

✅ Features Enabled:
   • Meeting Management API
   • Real-time Socket Communication
   • Admin Authentication
   • Meeting Templates
   • Analytics & Reporting
   • User Management
   • Rewards System
   • Reactions & Chat
   • WebRTC Signaling Support

🔗 Endpoints:
   • GET  /health - Health check
   • GET  /debug - Debug info
   • POST /api/admin/login - Admin login
   • GET  /api/meetings - List meetings
   • POST /api/meetings - Create meeting
   • GET  /api/templates - List templates

Ready for connections! 🎉
  `);
});

module.exports = { app, server, io };
