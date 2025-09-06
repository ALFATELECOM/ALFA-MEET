import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { useMedia } from '../context/MediaContext';
import WebRTCVideoGrid from '../components/WebRTCVideoGrid';
import ControlBar from '../components/ControlBar';
import MobileOptimizedRoom from '../components/MobileOptimizedRoom';
import Chat from '../components/Chat';
import ParticipantsList from '../components/ParticipantsList';
import FloatingReactions from '../components/FloatingReactions';

const RoomPage = () => {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { socket } = useSocket();
  const { startCamera, setRoomContext, forceMute, forceUnmute } = useMedia();
  
  const [userName] = useState(location.state?.userName || 'Anonymous');
  const [userId] = useState(`user-${Date.now()}-${Math.random()}`);
  const [participants, setParticipants] = useState([]);
  const [messages, setMessages] = useState([]);
  const [showChat, setShowChat] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  
  // Detect mobile/tablet to render a dedicated mobile experience
  const [isMobileView, setIsMobileView] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia('(pointer: coarse), (max-width: 820px)');
    const update = () => setIsMobileView(mql.matches);
    update();
    mql.addEventListener?.('change', update);
    window.addEventListener('orientationchange', update);
    return () => {
      mql.removeEventListener?.('change', update);
      window.removeEventListener('orientationchange', update);
    };
  }, []);

  useEffect(() => {
    if (!socket) return;

    // Initialize camera
    startCamera().catch(console.error);

    // Set room context for WebRTC
    setRoomContext(roomId, userId);

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
      setParticipants(prev => prev.filter(p => p.id !== data.userId && p.userId !== data.userId));
    });

    socket.on('room-participants', (data) => {
      if (data.participants) {
        setParticipants(data.participants);
      }
    });

    socket.on('join-rejected', (data) => {
      console.error('❌ Join rejected:', data.reason);
      alert(`Cannot join room: ${data.reason}`);
      navigate('/');
    });

    socket.on('new-message', (message) => {
      setMessages(prev => {
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

    // Admin forces
    socket.on('force-mute', () => {
      try { forceMute(); } catch (e) { console.error(e); }
    });
    socket.on('force-unmute', () => {
      try { forceUnmute(); } catch (e) { console.error(e); }
    });

    // Reflect toggles in UI
    socket.on('user-audio-toggled', ({ userId: targetId, isMuted }) => {
      setParticipants(prev => prev.map(p => {
        const pid = p.id || p.userId;
        if (pid === targetId) { return { ...p, isAudioMuted: isMuted }; }
        return p;
      }));
      if (targetId === userId) {
        try { isMuted ? forceMute() : forceUnmute(); } catch (e) { console.error(e); }
      }
    });

    socket.on('user-video-toggled', ({ userId: targetId, isMuted }) => {
      setParticipants(prev => prev.map(p => {
        const pid = p.id || p.userId;
        if (pid === targetId) { return { ...p, isVideoMuted: isMuted }; }
        return p;
      }));
    });

    return () => {
      socket.off('joined-room');
      socket.off('user-joined');
      socket.off('user-left');
      socket.off('room-participants');
      socket.off('new-message');
      socket.off('room-ended');
      socket.off('error');
      socket.off('force-mute');
      socket.off('force-unmute');
      socket.off('user-audio-toggled');
      socket.off('user-video-toggled');
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
      socket.emit('send-message', messageData);
    }
  };

  const leaveRoom = () => {
    if (socket) {
      socket.emit('leave-room', { roomId });
    }
    navigate('/');
  };

  if (isMobileView) {
    return <MobileOptimizedRoom />;
  }

  return (
    <div className="app-height bg-gray-900 flex flex-col">
      <div className="bg-gray-800 text-white p-4 flex justify-between items-center">
        <div>
          <h1 className="text-lg font-semibold flex items-center space-x-2">
            <span>Room: {roomId}</span>
            <div className={`w-2 h-2 rounded-full ${socketConnected ? 'bg-green-500' : 'bg-red-500'}`} 
                 title={socketConnected ? 'Connected' : 'Disconnected'}></div>
            {isHost && (<span className="bg-blue-600 px-2 py-1 rounded-full text-xs">Host</span>)}
          </h1>
          <p className="text-sm text-gray-300">
            {participants.length + 1} participants 
            {!socketConnected && <span className="text-red-400 ml-2">(Connecting...)</span>}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={leaveRoom}
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition duration-200"
          >
            Leave Room
          </button>
        </div>
      </div>

      <div className="flex-1 flex">
        <div className="flex-1 relative">
          <WebRTCVideoGrid 
            participants={participants} 
            roomId={roomId}
            userId={userId}
            userName={userName}
          />

          <FloatingReactions />

          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
            <ControlBar
              onToggleChat={() => setShowChat(!showChat)}
              onToggleParticipants={() => setShowParticipants(!showParticipants)}
              onLeaveRoom={leaveRoom}
            />
          </div>
        </div>

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
