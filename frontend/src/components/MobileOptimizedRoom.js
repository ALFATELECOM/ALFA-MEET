import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { useMedia } from '../context/MediaContext';
import { useMeetingFeatures } from '../context/MeetingFeaturesContext';
import { useReactions } from '../context/ReactionsContext';
import {
  MicrophoneIcon,
  VideoCameraIcon,
  PhoneXMarkIcon,
  ChatBubbleLeftIcon,
  UserGroupIcon,
  FaceSmileIcon,
  HandRaisedIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { VideoCameraSlashIcon } from '@heroicons/react/24/solid';
import '../styles/mobile.css';

const MobileOptimizedRoom = () => {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { socket } = useSocket();
  const { startCamera, toggleVideo, toggleAudio, isVideoEnabled, isAudioEnabled, localVideoRef } = useMedia();
  const { raiseHand, lowerHand, raisedHands } = useMeetingFeatures();
  const { sendReaction, availableReactions } = useReactions();

  const [userName] = useState(location.state?.userName || 'Mobile User');
  const [userId] = useState(`mobile-user-${Date.now()}-${Math.random()}`);
  const [participants, setParticipants] = useState([]);
  const [messages, setMessages] = useState([]);
  const [showChat, setShowChat] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [deviceInfo, setDeviceInfo] = useState({});

  // Mobile-specific states
  const [orientation, setOrientation] = useState('portrait');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [batteryLevel, setBatteryLevel] = useState(null);
  const [networkType, setNetworkType] = useState('unknown');

  useEffect(() => {
    detectDeviceInfo();
    handleOrientationChange();
    window.addEventListener('orientationchange', handleOrientationChange);
    
    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  useEffect(() => {
    if (!socket) return;

    startCamera().catch(console.error);
    socket.emit('join-room', { roomId, userName, userId });

    // Mobile-optimized socket events
    socket.on('joined-room', (data) => {
      setParticipants(data.participants || []);
      setMessages(data.chatHistory || []);
      if (data.participants && data.participants.length <= 1) {
        setIsHost(true);
      }
      setConnectionStatus('connected');
    });

    socket.on('user-joined', (data) => {
      setParticipants(prev => {
        const existing = prev.find(p => p.id === data.userId);
        if (existing) return prev;
        return [...prev, data.userData || data];
      });
    });

    socket.on('user-left', (data) => {
      setParticipants(prev => prev.filter(p => p.id !== data.userId));
    });

    socket.on('new-message', (message) => {
      setMessages(prev => [...prev, message]);
    });

    socket.on('connect', () => setConnectionStatus('connected'));
    socket.on('disconnect', () => setConnectionStatus('disconnected'));

    return () => {
      socket.off('joined-room');
      socket.off('user-joined');
      socket.off('user-left');
      socket.off('new-message');
      socket.off('connect');
      socket.off('disconnect');
    };
  }, [socket, roomId, userName, userId, startCamera]);

  const detectDeviceInfo = () => {
    const info = {
      isMobile: /iPhone|iPad|iPod|Android/i.test(navigator.userAgent),
      isIOS: /iPad|iPhone|iPod/.test(navigator.userAgent),
      isAndroid: /Android/.test(navigator.userAgent),
      isTouchDevice: 'ontouchstart' in window,
      screenSize: `${window.screen.width}x${window.screen.height}`,
      devicePixelRatio: window.devicePixelRatio || 1
    };

    setDeviceInfo(info);

    // Get network information if available
    if ('connection' in navigator) {
      setNetworkType(navigator.connection.effectiveType || 'unknown');
    }

    // Get battery information if available
    if ('getBattery' in navigator) {
      navigator.getBattery().then(battery => {
        setBatteryLevel(Math.round(battery.level * 100));
      });
    }
  };

  const handleOrientationChange = () => {
    setTimeout(() => {
      const isLandscape = window.innerWidth > window.innerHeight;
      setOrientation(isLandscape ? 'landscape' : 'portrait');
    }, 100);
  };

  const handleRaiseHand = () => {
    const isHandRaised = raisedHands.some(hand => hand.userId === userId);
    if (isHandRaised) {
      lowerHand(userId);
    } else {
      raiseHand(userId, userName);
    }
  };

  const handleReaction = (reactionId) => {
    const reaction = availableReactions.find(r => r.id === reactionId);
    if (reaction) {
      sendReaction(reactionId, userId, userName);
    }
    setShowReactions(false);
  };

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

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const getGridClass = () => {
    const total = participants.length + 1;
    if (orientation === 'landscape') {
      if (total <= 2) return 'grid-cols-2 grid-rows-1';
      if (total <= 4) return 'grid-cols-2 grid-rows-2';
      return 'grid-cols-3 grid-rows-2';
    } else {
      if (total === 1) return 'grid-cols-1';
      if (total <= 4) return 'grid-cols-1 grid-rows-4';
      return 'grid-cols-2 grid-rows-3';
    }
  };

  const isHandRaised = raisedHands.some(hand => hand.userId === userId);

  return (
    <div className={`h-screen bg-gray-900 flex flex-col relative ${orientation === 'landscape' ? 'landscape' : 'portrait'}`}>
      {/* Mobile Status Bar */}
      <div className="mobile-status-bar mobile-safe-top">
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${
            connectionStatus === 'connected' ? 'bg-green-500' : 
            connectionStatus === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
          }`} />
          <span className="text-xs">Room: {roomId}</span>
          {isHost && <span className="text-xs bg-blue-600 px-2 py-1 rounded">Host</span>}
        </div>
        <div className="flex items-center space-x-2 text-xs">
          {batteryLevel && <span>{batteryLevel}%</span>}
          <span>{networkType}</span>
          <span>{participants.length + 1}</span>
          <button onClick={() => setShowMenu(!showMenu)} className="touch-target">
            <Bars3Icon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Video Grid */}
      <div className={`mobile-video-grid flex-1 ${orientation === 'landscape' ? 'p-2' : 'p-4'}`}>
        <div className={`grid ${getGridClass()} gap-2 h-full`}>
          {/* Local Video */}
          <div className="mobile-video-tile">
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
            />
            {!isVideoEnabled && (
              <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {userName.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
            )}
            <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
              You {isHost && '(Host)'}
            </div>
            {!isAudioEnabled && (
              <div className="absolute top-2 right-2 bg-red-600 rounded-full p-1">
                <MicrophoneIcon className="h-3 w-3 text-white" />
              </div>
            )}
            {isHandRaised && (
              <div className="absolute top-2 left-2 bg-yellow-500 rounded-full p-1">
                <HandRaisedIcon className="h-3 w-3 text-white" />
              </div>
            )}
          </div>

          {/* Remote Videos */}
          {participants.map((participant, index) => (
            <div key={participant.id || index} className="mobile-video-tile">
              <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {(participant.userName || participant.name || 'User').charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                {participant.userName || participant.name || `User ${index + 1}`}
              </div>
            </div>
          ))}

          {/* Empty state */}
          {participants.length === 0 && (
            <div className="mobile-video-tile flex items-center justify-center">
              <div className="text-center text-gray-400">
                <UserGroupIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Waiting for others...</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Controls */}
      <div className="mobile-meeting-controls mobile-safe-bottom">
        <button
          onClick={toggleAudio}
          className={`touch-target ${
            isAudioEnabled ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600 hover:bg-red-700'
          } text-white rounded-full transition duration-200`}
        >
          <MicrophoneIcon className={`h-5 w-5 ${!isAudioEnabled ? 'opacity-50' : ''}`} />
        </button>

        <button
          onClick={toggleVideo}
          className={`touch-target ${
            isVideoEnabled ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600 hover:bg-red-700'
          } text-white rounded-full transition duration-200`}
        >
          {isVideoEnabled ? (
            <VideoCameraIcon className="h-5 w-5" />
          ) : (
            <VideoCameraSlashIcon className="h-5 w-5" />
          )}
        </button>

        <button
          onClick={handleRaiseHand}
          className={`touch-target ${
            isHandRaised ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-gray-700 hover:bg-gray-600'
          } text-white rounded-full transition duration-200`}
        >
          <HandRaisedIcon className="h-5 w-5" />
        </button>

        <button
          onClick={() => setShowReactions(!showReactions)}
          className="touch-target bg-gray-700 hover:bg-gray-600 text-white rounded-full transition duration-200"
        >
          <FaceSmileIcon className="h-5 w-5" />
        </button>

        <button
          onClick={() => setShowChat(!showChat)}
          className="touch-target bg-gray-700 hover:bg-gray-600 text-white rounded-full transition duration-200"
        >
          <ChatBubbleLeftIcon className="h-5 w-5" />
        </button>

        <button
          onClick={() => setShowParticipants(!showParticipants)}
          className="touch-target bg-gray-700 hover:bg-gray-600 text-white rounded-full transition duration-200"
        >
          <UserGroupIcon className="h-5 w-5" />
        </button>

        <button
          onClick={leaveRoom}
          className="touch-target bg-red-600 hover:bg-red-700 text-white rounded-full transition duration-200"
        >
          <PhoneXMarkIcon className="h-5 w-5" />
        </button>
      </div>

      {/* Reactions Panel */}
      {showReactions && (
        <div className="mobile-reactions-panel">
          {availableReactions.slice(0, 6).map((reaction) => (
            <button
              key={reaction.id}
              onClick={() => handleReaction(reaction.id)}
              className="mobile-reaction-btn"
            >
              {reaction.emoji}
            </button>
          ))}
        </div>
      )}

      {/* Mobile Chat */}
      <div className={`mobile-chat ${showChat ? 'open' : ''}`}>
        <div className="mobile-chat-header">
          <h3 className="text-lg font-semibold">Chat</h3>
          <button
            onClick={() => setShowChat(false)}
            className="touch-target p-2 hover:bg-gray-100 rounded-lg"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        <div className="mobile-chat-messages">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 mt-8">
              <p>No messages yet</p>
              <p className="text-sm">Start the conversation!</p>
            </div>
          ) : (
            messages.map((message, index) => (
              <div key={index} className="mb-4">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="font-medium text-sm text-gray-700">
                    {message.userName}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div className="bg-gray-100 rounded-lg p-3">
                  <p className="text-gray-800">{message.message}</p>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="mobile-chat-input">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const input = e.target.message;
              if (input.value.trim()) {
                sendMessage(input.value);
                input.value = '';
              }
            }}
            className="flex space-x-2"
          >
            <input
              name="message"
              type="text"
              placeholder="Type a message..."
              className="flex-1 mobile-form-input"
            />
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg touch-target"
            >
              Send
            </button>
          </form>
        </div>
      </div>

      {/* Mobile Participants */}
      <div className={`mobile-participants ${showParticipants ? 'open' : ''}`}>
        <div className="mobile-chat-header">
          <h3 className="text-lg font-semibold">
            Participants ({participants.length + 1})
          </h3>
          <button
            onClick={() => setShowParticipants(false)}
            className="touch-target p-2 hover:bg-gray-100 rounded-lg"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        <div className="p-4 space-y-3">
          {/* Current User */}
          <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white font-medium">{userName.charAt(0).toUpperCase()}</span>
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-800">You</p>
              <p className="text-sm text-gray-500">{isHost ? 'Host' : 'Participant'}</p>
            </div>
          </div>

          {/* Other Participants */}
          {participants.map((participant, index) => (
            <div key={participant.id || index} className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg">
              <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
                <span className="text-white font-medium">
                  {(participant.userName || participant.name || 'User').charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-800">
                  {participant.userName || participant.name || `User ${index + 1}`}
                </p>
                <p className="text-sm text-gray-500">Participant</p>
              </div>
            </div>
          ))}

          {participants.length === 0 && (
            <div className="text-center text-gray-500 mt-8">
              <UserGroupIcon className="h-12 w-12 text-gray-300 mx-auto mb-2" />
              <p>No other participants</p>
              <p className="text-sm">Share the room ID to invite others</p>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {showMenu && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-lg p-4 mobile-safe-bottom">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Meeting Options</h3>
              <button
                onClick={() => setShowMenu(false)}
                className="touch-target p-2 hover:bg-gray-100 rounded-lg"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3">
              <button
                onClick={toggleFullscreen}
                className="w-full text-left p-3 hover:bg-gray-100 rounded-lg"
              >
                {isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
              </button>
              <button
                onClick={() => navigator.clipboard.writeText(`${window.location.origin}/join/${roomId}`)}
                className="w-full text-left p-3 hover:bg-gray-100 rounded-lg"
              >
                Copy Room Link
              </button>
              <button
                onClick={() => {
                  setShowMenu(false);
                  leaveRoom();
                }}
                className="w-full text-left p-3 hover:bg-red-100 text-red-600 rounded-lg"
              >
                Leave Meeting
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileOptimizedRoom;
