import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { useMedia } from '../context/MediaContext';
import { useMeetingFeatures } from '../context/MeetingFeaturesContext';
import VideoGrid from '../components/VideoGrid';
import EnhancedControlBar from '../components/EnhancedControlBar';
import Chat from '../components/Chat';
import ParticipantsList from '../components/ParticipantsList';
import FloatingReactions from '../components/FloatingReactions';
import RaiseHandIndicator from '../components/RaiseHandIndicator';

const RoomPage = () => {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { socket } = useSocket();
  const { startCamera } = useMedia();
  
  const [userName] = useState(location.state?.userName || 'Anonymous');
  const [userId] = useState(`user-${Date.now()}-${Math.random()}`);
  const [participants, setParticipants] = useState([]);
  const [messages, setMessages] = useState([]);
  const [showChat, setShowChat] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  
  const { meetingMode } = useMeetingFeatures();

  useEffect(() => {
    if (!socket) return;

    // Initialize camera
    startCamera().catch(console.error);

    // Join room
    socket.emit('join-room', { roomId, userName, userId });
    
    // Check if user is host (first to join)
    if (participants.length === 0) {
      setIsHost(true);
    }

    // Socket connection status
    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
      setSocketConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
      setSocketConnected(false);
    });

    // Enhanced socket event listeners
    socket.on('joined-room', (data) => {
      console.log('✅ Joined room successfully:', data);
      console.log('📊 Participants received:', data.participants);
      
      if (data.success && data.participants) {
        setParticipants(data.participants);
        setMessages(data.chatHistory || []);
        
        // Check if user is host based on backend response
        const currentUser = data.participants.find(p => p.id === userId || p.userId === userId);
        if (currentUser && currentUser.role === 'host') {
          setIsHost(true);
          console.log('🎯 Set as host based on backend role');
        }
      }
    });

    socket.on('user-joined', (data) => {
      console.log('👥 New user joined:', data);
      if (data.userData) {
        setParticipants(prev => {
          const existing = prev.find(p => p.id === data.userId || p.userId === data.userId);
          if (!existing) {
            console.log('Adding new participant:', data.userData);
            return [...prev, data.userData];
          }
          return prev;
        });
      }
    });

    socket.on('user-left', (data) => {
      console.log('👋 User left:', data);
      setParticipants(prev => {
        const filtered = prev.filter(p => 
          p.id !== data.userId && p.userId !== data.userId
        );
        console.log('Participants after user left:', filtered);
        return filtered;
      });
    });

    socket.on('room-participants', (data) => {
      console.log('📊 Room participants updated:', data);
      if (data.participants) {
        setParticipants(data.participants);
        console.log('Updated participants list:', data.participants);
      }
    });

    // Handle join rejection (blocked users)
    socket.on('join-rejected', (data) => {
      console.error('❌ Join rejected:', data.reason);
      alert(`Cannot join room: ${data.reason}`);
      navigate('/');
    });

    // Handle host transfer
    socket.on('host-transferred', (data) => {
      console.log('👑 Host transferred to:', data.newHostName);
      if (data.newHostId === userId) {
        setIsHost(true);
        console.log('🎯 You are now the host');
      }
    });

    socket.on('new-message', (message) => {
      console.log('New message:', message);
      setMessages(prev => {
        // Avoid duplicate messages
        const exists = prev.find(m => m.id === message.id || 
          (m.timestamp === message.timestamp && m.message === message.message && m.userId === message.userId));
        if (exists) return prev;
        return [...prev, message];
      });
    });

    socket.on('room-ended', () => {
      navigate('/');
    });

    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    return () => {
      socket.off('joined-room');
      socket.off('user-joined');
      socket.off('user-left');
      socket.off('room-participants');
      socket.off('new-message');
      socket.off('room-ended');
      socket.off('error');
      socket.off('join-rejected');
      socket.off('host-transferred');
      socket.off('connect');
      socket.off('disconnect');
    };
  }, [socket, roomId, userName, navigate, startCamera]);

  const sendMessage = (message) => {
    if (socket && message.trim()) {
      const messageData = {
        roomId,
        message: message.trim(),
        userName,
        userId,
        timestamp: new Date().toISOString()
      };
      
      console.log('Sending message:', messageData);
      socket.emit('send-message', messageData);
      
      // Don't add to local state immediately - wait for server confirmation
      // This prevents duplicate messages
    }
  };

  const leaveRoom = () => {
    if (socket) {
      socket.emit('leave-room', { roomId });
    }
    navigate('/');
  };

  return (
    <div className="h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 text-white p-4 flex justify-between items-center">
        <div>
          <h1 className="text-lg font-semibold flex items-center space-x-2">
            <span>Room: {roomId}</span>
            <div className={`w-2 h-2 rounded-full ${socketConnected ? 'bg-green-500' : 'bg-red-500'}`} 
                 title={socketConnected ? 'Connected' : 'Disconnected'}></div>
            {meetingMode === 'webinar' && (
              <span className="bg-purple-600 px-2 py-1 rounded-full text-xs">Webinar</span>
            )}
            {isHost && (
              <span className="bg-blue-600 px-2 py-1 rounded-full text-xs">Host</span>
            )}
          </h1>
          <p className="text-sm text-gray-300">
            {participants.length + 1} participants 
            {!socketConnected && <span className="text-red-400 ml-2">(Connecting...)</span>}
          </p>
        </div>
        <button
          onClick={leaveRoom}
          className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition duration-200"
        >
          Leave Room
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Video Area */}
        <div className="flex-1 relative">
          <VideoGrid participants={participants} />
          
          {/* Floating Reactions */}
          <FloatingReactions />
          
          {/* Raise Hand Indicator */}
          <RaiseHandIndicator isHost={isHost} />
          
          {/* Control Bar */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
            <EnhancedControlBar
              onToggleChat={() => setShowChat(!showChat)}
              onToggleParticipants={() => setShowParticipants(!showParticipants)}
              onLeaveRoom={leaveRoom}
              currentUserId={userId}
              currentUserName={userName}
              isHost={isHost}
            />
          </div>
        </div>

        {/* Chat Sidebar */}
        {showChat && (
          <div className="w-80 bg-white border-l border-gray-300">
            <Chat
              messages={messages}
              onSendMessage={sendMessage}
              onClose={() => setShowChat(false)}
              currentUserId={userId}
              currentUserName={userName}
              roomId={roomId}
            />
          </div>
        )}

        {/* Participants Sidebar */}
        {showParticipants && (
          <div className="w-80 bg-white border-l border-gray-300">
            <ParticipantsList
              participants={participants}
              onClose={() => setShowParticipants(false)}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default RoomPage;
