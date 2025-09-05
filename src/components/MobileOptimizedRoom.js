import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { useMedia } from '../context/MediaContext';
import {
  MicrophoneIcon,
  VideoCameraIcon,
  ComputerDesktopIcon,
  ChatBubbleLeftIcon,
  UserGroupIcon,
  PhoneXMarkIcon,
  HandRaisedIcon,
  FaceSmileIcon,
  SpeakerWaveIcon,
  Bars3Icon,
  XMarkIcon,
  CogIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon
} from '@heroicons/react/24/outline';

const MobileOptimizedRoom = () => {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { socket, connected } = useSocket();
  const { 
    localVideoRef, 
    isVideoEnabled, 
    isAudioEnabled, 
    toggleVideo, 
    toggleAudio, 
    startCamera 
  } = useMedia();

  const [userName] = useState(location.state?.userName || 'Mobile User');
  const [userId] = useState(`mobile-${Date.now()}-${Math.random()}`);
  const [participants, setParticipants] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isHost, setIsHost] = useState(location.state?.isHost || false);
  const [meetingType] = useState(location.state?.meetingType || 'meeting');
  
  // Mobile-specific states
  const [showControls, setShowControls] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [orientation, setOrientation] = useState('portrait');

  // Handle device orientation
  useEffect(() => {
    const handleOrientationChange = () => {
      setOrientation(window.innerHeight > window.innerWidth ? 'portrait' : 'landscape');
    };

    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleOrientationChange);
    handleOrientationChange();

    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('resize', handleOrientationChange);
    };
  }, []);

  // Initialize camera and socket
  useEffect(() => {
    if (!socket) return;

    startCamera().catch(console.error);
    
    socket.emit('join-room', { 
      roomId, 
      userId, 
      userName, 
      userData: { meetingType, isHost, isMobile: true } 
    });

    // Socket event listeners
    socket.on('joined-room', (data) => {
      console.log('Joined room:', data);
      setParticipants(data.participants || []);
      setMessages(data.chatHistory || []);
    });

    socket.on('user-joined', (data) => {
      setParticipants(prev => [...prev.filter(p => p.id !== data.userId), data.userData]);
    });

    socket.on('user-left', (data) => {
      setParticipants(prev => prev.filter(p => p.id !== data.userId));
    });

    socket.on('new-message', (message) => {
      setMessages(prev => [...prev, message]);
    });

    return () => {
      socket.off('joined-room');
      socket.off('user-joined');
      socket.off('user-left');
      socket.off('new-message');
    };
  }, [socket, roomId, userId, userName, meetingType, isHost, startCamera]);

  // Auto-hide controls after 5 seconds of inactivity
  useEffect(() => {
    let timeout;
    if (showControls) {
      timeout = setTimeout(() => setShowControls(false), 5000);
    }
    return () => clearTimeout(timeout);
  }, [showControls]);

  const sendMessage = () => {
    if (socket && newMessage.trim()) {
      socket.emit('send-message', {
        roomId,
        userId,
        userName,
        message: newMessage.trim(),
        timestamp: new Date().toISOString()
      });
      setNewMessage('');
    }
  };

  const leaveRoom = () => {
    if (socket) {
      socket.emit('leave-room', { roomId });
    }
    navigate('/');
  };

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    setIsFullscreen(!isFullscreen);
  };

  const getVideoGridClass = () => {
    const totalParticipants = participants.length + 1;
    if (orientation === 'landscape') {
      if (totalParticipants === 1) return 'grid-cols-1';
      if (totalParticipants === 2) return 'grid-cols-2';
      if (totalParticipants <= 4) return 'grid-cols-2 grid-rows-2';
      return 'grid-cols-3 grid-rows-2';
    } else {
      if (totalParticipants === 1) return 'grid-cols-1';
      if (totalParticipants <= 4) return 'grid-cols-1 grid-rows-4';
      return 'grid-cols-2 grid-rows-3';
    }
  };

  return (
    <div 
      className={`h-screen bg-gray-900 flex flex-col relative overflow-hidden ${
        orientation === 'landscape' ? 'landscape' : 'portrait'
      }`}
      onClick={() => setShowControls(true)}
    >
      {/* Header - Mobile Optimized */}
      <div className={`bg-gray-800 text-white px-4 py-2 flex justify-between items-center transition-transform duration-300 ${
        !showControls && !showChat && !showParticipants ? '-translate-y-full' : 'translate-y-0'
      }`}>
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-sm font-medium">{roomId}</span>
          {meetingType === 'webinar' && (
            <span className="bg-purple-600 px-2 py-1 rounded-full text-xs">Webinar</span>
          )}
          {isHost && (
            <span className="bg-blue-600 px-2 py-1 rounded-full text-xs">Host</span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-xs">{participants.length + 1}</span>
          <button
            onClick={toggleFullscreen}
            className="p-2 hover:bg-gray-700 rounded-lg transition duration-200"
          >
            {isFullscreen ? 
              <ArrowsPointingInIcon className="h-4 w-4" /> : 
              <ArrowsPointingOutIcon className="h-4 w-4" />
            }
          </button>
        </div>
      </div>

      {/* Video Grid - Mobile Optimized */}
      <div className="flex-1 relative">
        <div className={`grid ${getVideoGridClass()} gap-1 h-full p-2`}>
          {/* Local Video */}
          <div className="relative bg-gray-800 rounded-lg overflow-hidden touch-manipulation">
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className={`w-full h-full object-cover ${!isVideoEnabled ? 'hidden' : ''}`}
            />
            {!isVideoEnabled && (
              <div className="absolute inset-0 bg-gray-700 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-white font-semibold">{userName.charAt(0)}</span>
                  </div>
                  <span className="text-white text-xs">Camera Off</span>
                </div>
              </div>
            )}
            <div className="absolute bottom-1 left-1 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
              You
            </div>
            <div className="absolute top-1 right-1 flex space-x-1">
              <div className={`w-2 h-2 rounded-full ${isAudioEnabled ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <div className={`w-2 h-2 rounded-full ${isVideoEnabled ? 'bg-green-500' : 'bg-red-500'}`}></div>
            </div>
          </div>

          {/* Remote Videos */}
          {participants.map((participant, index) => (
            <div key={participant.id || index} className="relative bg-gray-800 rounded-lg overflow-hidden">
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-800">
                <div className="text-center">
                  <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-white font-semibold">
                      {(participant.userName || participant.name || 'U').charAt(0)}
                    </span>
                  </div>
                  <span className="text-white text-xs">Camera Off</span>
                </div>
              </div>
              <div className="absolute bottom-1 left-1 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                {participant.userName || participant.name}
              </div>
              <div className="absolute top-1 right-1 flex space-x-1">
                <div className={`w-2 h-2 rounded-full ${!participant.isAudioMuted ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <div className={`w-2 h-2 rounded-full ${!participant.isVideoMuted ? 'bg-green-500' : 'bg-red-500'}`}></div>
              </div>
            </div>
          ))}
        </div>

        {/* Mobile Control Bar */}
        <div className={`absolute bottom-0 left-0 right-0 bg-gray-800 bg-opacity-95 p-4 transition-transform duration-300 ${
          !showControls ? 'translate-y-full' : 'translate-y-0'
        }`}>
          <div className="flex justify-center space-x-4">
            {/* Audio Toggle */}
            <button
              onClick={toggleAudio}
              className={`p-3 rounded-full transition duration-200 ${
                isAudioEnabled 
                  ? 'bg-gray-600 hover:bg-gray-700 text-white' 
                  : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
            >
              <MicrophoneIcon className="h-6 w-6" />
            </button>

            {/* Video Toggle */}
            <button
              onClick={toggleVideo}
              className={`p-3 rounded-full transition duration-200 ${
                isVideoEnabled 
                  ? 'bg-gray-600 hover:bg-gray-700 text-white' 
                  : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
            >
              <VideoCameraIcon className="h-6 w-6" />
            </button>

            {/* Chat Toggle */}
            <button
              onClick={() => {
                setShowChat(!showChat);
                setShowParticipants(false);
              }}
              className={`p-3 rounded-full transition duration-200 ${
                showChat 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                  : 'bg-gray-600 hover:bg-gray-700 text-white'
              }`}
            >
              <ChatBubbleLeftIcon className="h-6 w-6" />
              {messages.length > 0 && (
                <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {messages.length > 9 ? '9+' : messages.length}
                </div>
              )}
            </button>

            {/* Participants Toggle */}
            <button
              onClick={() => {
                setShowParticipants(!showParticipants);
                setShowChat(false);
              }}
              className={`p-3 rounded-full transition duration-200 ${
                showParticipants 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                  : 'bg-gray-600 hover:bg-gray-700 text-white'
              }`}
            >
              <UserGroupIcon className="h-6 w-6" />
            </button>

            {/* Leave Button */}
            <button
              onClick={leaveRoom}
              className="p-3 bg-red-600 hover:bg-red-700 text-white rounded-full transition duration-200"
            >
              <PhoneXMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Chat Sidebar - Mobile Optimized */}
      {showChat && (
        <div className="absolute inset-y-0 right-0 w-full sm:w-80 bg-white shadow-lg z-50 flex flex-col">
          <div className="p-4 bg-blue-600 text-white flex justify-between items-center">
            <h3 className="font-semibold">Chat</h3>
            <button
              onClick={() => setShowChat(false)}
              className="p-1 hover:bg-blue-700 rounded"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((message, index) => (
              <div key={index} className="flex space-x-2">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-semibold text-blue-600">
                    {(message.userName || 'U').charAt(0)}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-sm font-semibold">{message.userName}</span>
                    <span className="text-xs text-gray-500">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-800">{message.message}</p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="p-4 border-t">
            <div className="flex space-x-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Type a message..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              <button
                onClick={sendMessage}
                disabled={!newMessage.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition duration-200 text-sm"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Participants Sidebar - Mobile Optimized */}
      {showParticipants && (
        <div className="absolute inset-y-0 right-0 w-full sm:w-80 bg-white shadow-lg z-50 flex flex-col">
          <div className="p-4 bg-purple-600 text-white flex justify-between items-center">
            <h3 className="font-semibold">Participants ({participants.length + 1})</h3>
            <button
              onClick={() => setShowParticipants(false)}
              className="p-1 hover:bg-purple-700 rounded"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {/* Current User */}
            <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold">{userName.charAt(0)}</span>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">{userName} (You)</p>
                {isHost && <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">Host</span>}
              </div>
              <div className="flex space-x-1">
                <div className={`w-3 h-3 rounded-full ${isAudioEnabled ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <div className={`w-3 h-3 rounded-full ${isVideoEnabled ? 'bg-green-500' : 'bg-red-500'}`}></div>
              </div>
            </div>

            {/* Other Participants */}
            {participants.map((participant, index) => (
              <div key={participant.id || index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold">
                    {(participant.userName || participant.name || 'U').charAt(0)}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{participant.userName || participant.name}</p>
                  {participant.role === 'host' && <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">Host</span>}
                  {participant.role === 'co-host' && <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">Co-Host</span>}
                </div>
                <div className="flex space-x-1">
                  <div className={`w-3 h-3 rounded-full ${!participant.isAudioMuted ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <div className={`w-3 h-3 rounded-full ${!participant.isVideoMuted ? 'bg-green-500' : 'bg-red-500'}`}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileOptimizedRoom;