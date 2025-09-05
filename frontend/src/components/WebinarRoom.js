import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { useMedia } from '../context/MediaContext';
import {
  MicrophoneIcon,
  VideoCameraIcon,
  ChatBubbleLeftIcon,
  UserGroupIcon,
  PhoneXMarkIcon,
  HandRaisedIcon,
  FaceSmileIcon,
  SpeakerWaveIcon,
  XMarkIcon,
  EyeIcon,
  PresentationChartLineIcon,
  StarIcon
} from '@heroicons/react/24/outline';

const WebinarRoom = () => {
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

  const [userName] = useState(location.state?.userName || 'Attendee');
  const [userId] = useState(`webinar-${Date.now()}-${Math.random()}`);
  const [participants, setParticipants] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isHost, setIsHost] = useState(location.state?.isHost || false);
  const [userRole, setUserRole] = useState(location.state?.isHost ? 'host' : 'attendee');
  
  // Webinar-specific states
  const [showChat, setShowChat] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [handRaised, setHandRaised] = useState(false);
  const [isPresenting, setIsPresenting] = useState(false);
  const [canSpeak, setCanSpeak] = useState(isHost);
  const [chatEnabled, setChatEnabled] = useState(true);
  const [reactionsEnabled, setReactionsEnabled] = useState(true);

  // Webinar permissions based on role
  const permissions = {
    host: {
      canVideo: true,
      canAudio: true,
      canScreenShare: true,
      canChat: true,
      canManageParticipants: true,
      canSeeAllParticipants: true,
      canPromoteUsers: true
    },
    moderator: {
      canVideo: true,
      canAudio: true,
      canScreenShare: true,
      canChat: true,
      canManageParticipants: true,
      canSeeAllParticipants: true,
      canPromoteUsers: false
    },
    panelist: {
      canVideo: true,
      canAudio: true,
      canScreenShare: false,
      canChat: true,
      canManageParticipants: false,
      canSeeAllParticipants: false,
      canPromoteUsers: false
    },
    attendee: {
      canVideo: false,
      canAudio: false,
      canScreenShare: false,
      canChat: chatEnabled,
      canManageParticipants: false,
      canSeeAllParticipants: false,
      canPromoteUsers: false
    }
  };

  const currentPermissions = permissions[userRole] || permissions.attendee;

  useEffect(() => {
    if (!socket) return;

    // Only start camera for hosts and panelists
    if (currentPermissions.canVideo) {
      startCamera().catch(console.error);
    }
    
    socket.emit('join-room', { 
      roomId, 
      userId, 
      userName, 
      userData: { meetingType: 'webinar', role: userRole, isHost } 
    });

    // Socket event listeners
    socket.on('joined-room', (data) => {
      console.log('Joined webinar:', data);
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

    // Webinar-specific events
    socket.on('promoted-to-panelist', () => {
      setUserRole('panelist');
      setCanSpeak(true);
    });

    socket.on('demoted-to-attendee', () => {
      setUserRole('attendee');
      setCanSpeak(false);
    });

    socket.on('chat-enabled', (enabled) => {
      setChatEnabled(enabled);
    });

    socket.on('reactions-enabled', (enabled) => {
      setReactionsEnabled(enabled);
    });

    return () => {
      socket.off('joined-room');
      socket.off('user-joined');
      socket.off('user-left');
      socket.off('new-message');
      socket.off('promoted-to-panelist');
      socket.off('demoted-to-attendee');
      socket.off('chat-enabled');
      socket.off('reactions-enabled');
    };
  }, [socket, roomId, userId, userName, userRole, isHost, currentPermissions.canVideo, startCamera]);

  const sendMessage = () => {
    if (socket && newMessage.trim() && currentPermissions.canChat) {
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

  const raiseHand = () => {
    if (socket && !handRaised) {
      socket.emit('raise-hand', { roomId, userId, userName });
      setHandRaised(true);
    }
  };

  const lowerHand = () => {
    if (socket && handRaised) {
      socket.emit('lower-hand', { roomId, userId });
      setHandRaised(false);
    }
  };

  const leaveRoom = () => {
    if (socket) {
      socket.emit('leave-room', { roomId });
    }
    navigate('/');
  };

  const sendReaction = (emoji) => {
    if (socket && reactionsEnabled) {
      socket.emit('send-reaction', {
        roomId,
        userId,
        userName,
        emoji,
        timestamp: new Date().toISOString()
      });
    }
  };

  // Get presenters (hosts and panelists with video)
  const presenters = participants.filter(p => 
    ['host', 'moderator', 'panelist'].includes(p.role) && !p.isVideoMuted
  );

  // Get attendee count
  const attendeeCount = participants.filter(p => p.role === 'attendee').length;

  return (
    <div className="h-screen bg-gray-900 flex flex-col">
      {/* Webinar Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <PresentationChartLineIcon className="h-6 w-6" />
            <div>
              <h1 className="font-bold text-lg">ALFA MEET Webinar</h1>
              <p className="text-sm text-purple-100">Room: {roomId}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400' : 'bg-red-400'}`}></div>
                <span className="text-sm font-medium">Live</span>
              </div>
              <p className="text-xs text-purple-100">{participants.length + 1} participants</p>
            </div>
            
            {userRole !== 'attendee' && (
              <div className="flex items-center space-x-1">
                <StarIcon className="h-4 w-4 text-yellow-300" />
                <span className="text-sm font-medium capitalize">{userRole}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex">
        {/* Presentation Area */}
        <div className="flex-1 relative bg-black">
          {/* Presenter Videos */}
          {currentPermissions.canVideo || presenters.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 h-full p-4">
              {/* Local Video (if host/panelist) */}
              {currentPermissions.canVideo && (
                <div className="relative bg-gray-800 rounded-lg overflow-hidden">
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
                        <div className="w-20 h-20 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                          <span className="text-white text-2xl font-bold">{userName.charAt(0)}</span>
                        </div>
                        <p className="text-white">{userName}</p>
                        <p className="text-gray-300 text-sm capitalize">{userRole}</p>
                      </div>
                    </div>
                  )}
                  <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded">
                    {userName} ({userRole})
                  </div>
                </div>
              )}

              {/* Presenter Videos */}
              {presenters.slice(0, currentPermissions.canVideo ? 3 : 4).map((presenter, index) => (
                <div key={presenter.id || index} className="relative bg-gray-800 rounded-lg overflow-hidden">
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-800">
                    <div className="text-center">
                      <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-white text-2xl font-bold">
                          {(presenter.userName || presenter.name || 'P').charAt(0)}
                        </span>
                      </div>
                      <p className="text-white">{presenter.userName || presenter.name}</p>
                      <p className="text-gray-300 text-sm capitalize">{presenter.role}</p>
                    </div>
                  </div>
                  <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded">
                    {presenter.userName || presenter.name} ({presenter.role})
                  </div>
                  <div className="absolute top-4 right-4 flex space-x-2">
                    <div className={`p-1 rounded-full ${!presenter.isAudioMuted ? 'bg-green-500' : 'bg-red-500'}`}>
                      <MicrophoneIcon className="h-3 w-3 text-white" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Attendee View - No video
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-white">
                <PresentationChartLineIcon className="h-24 w-24 mx-auto mb-6 text-gray-500" />
                <h2 className="text-2xl font-bold mb-4">Webinar in Progress</h2>
                <p className="text-gray-300 mb-2">You're attending as a participant</p>
                <p className="text-sm text-gray-400">Use chat and reactions to engage with the presentation</p>
                
                {attendeeCount > 0 && (
                  <div className="mt-6 bg-purple-600 bg-opacity-30 rounded-lg p-4 inline-block">
                    <EyeIcon className="h-6 w-6 mx-auto mb-2" />
                    <p className="text-sm">{attendeeCount} other attendees watching</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Webinar Controls */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
            <div className="flex items-center space-x-3 bg-gray-800 bg-opacity-90 rounded-lg p-3">
              {/* Audio Toggle (only for hosts/panelists) */}
              {currentPermissions.canAudio && (
                <button
                  onClick={toggleAudio}
                  className={`p-3 rounded-full transition duration-200 ${
                    isAudioEnabled 
                      ? 'bg-gray-600 hover:bg-gray-700 text-white' 
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  }`}
                >
                  <MicrophoneIcon className="h-5 w-5" />
                </button>
              )}

              {/* Video Toggle (only for hosts/panelists) */}
              {currentPermissions.canVideo && (
                <button
                  onClick={toggleVideo}
                  className={`p-3 rounded-full transition duration-200 ${
                    isVideoEnabled 
                      ? 'bg-gray-600 hover:bg-gray-700 text-white' 
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  }`}
                >
                  <VideoCameraIcon className="h-5 w-5" />
                </button>
              )}

              {/* Raise Hand (for attendees) */}
              {userRole === 'attendee' && (
                <button
                  onClick={handRaised ? lowerHand : raiseHand}
                  className={`p-3 rounded-full transition duration-200 ${
                    handRaised 
                      ? 'bg-yellow-600 hover:bg-yellow-700 text-white' 
                      : 'bg-gray-600 hover:bg-gray-700 text-white'
                  }`}
                >
                  <HandRaisedIcon className="h-5 w-5" />
                </button>
              )}

              {/* Reactions */}
              {reactionsEnabled && (
                <div className="flex space-x-1">
                  {['👍', '👏', '❤️', '😂'].map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => sendReaction(emoji)}
                      className="p-2 bg-gray-600 hover:bg-gray-700 rounded-full transition duration-200 text-lg"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}

              {/* Chat Toggle */}
              {currentPermissions.canChat && (
                <button
                  onClick={() => setShowChat(!showChat)}
                  className={`p-3 rounded-full transition duration-200 ${
                    showChat 
                      ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                      : 'bg-gray-600 hover:bg-gray-700 text-white'
                  }`}
                >
                  <ChatBubbleLeftIcon className="h-5 w-5" />
                  {messages.length > 0 && (
                    <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {messages.length > 9 ? '9+' : messages.length}
                    </div>
                  )}
                </button>
              )}

              {/* Participants (for hosts/moderators) */}
              {currentPermissions.canSeeAllParticipants && (
                <button
                  onClick={() => setShowParticipants(!showParticipants)}
                  className={`p-3 rounded-full transition duration-200 ${
                    showParticipants 
                      ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                      : 'bg-gray-600 hover:bg-gray-700 text-white'
                  }`}
                >
                  <UserGroupIcon className="h-5 w-5" />
                </button>
              )}

              {/* Leave */}
              <button
                onClick={leaveRoom}
                className="p-3 bg-red-600 hover:bg-red-700 text-white rounded-full transition duration-200"
              >
                <PhoneXMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Chat Sidebar */}
        {showChat && currentPermissions.canChat && (
          <div className="w-80 bg-white border-l border-gray-300 flex flex-col">
            <div className="p-4 bg-purple-600 text-white flex justify-between items-center">
              <h3 className="font-semibold">Webinar Chat</h3>
              <button
                onClick={() => setShowChat(false)}
                className="p-1 hover:bg-purple-700 rounded"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((message, index) => (
                <div key={index} className="flex space-x-2">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-semibold text-purple-600">
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
            
            {chatEnabled && (
              <div className="p-4 border-t">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Ask a question..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim()}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 transition duration-200 text-sm"
                  >
                    Send
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Participants Sidebar (Host/Moderator only) */}
        {showParticipants && currentPermissions.canSeeAllParticipants && (
          <div className="w-80 bg-white border-l border-gray-300 flex flex-col">
            <div className="p-4 bg-indigo-600 text-white flex justify-between items-center">
              <h3 className="font-semibold">Participants ({participants.length + 1})</h3>
              <button
                onClick={() => setShowParticipants(false)}
                className="p-1 hover:bg-indigo-700 rounded"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {/* Host/Presenters */}
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Presenters</h4>
                <div className="space-y-2">
                  {participants.filter(p => ['host', 'moderator', 'panelist'].includes(p.role)).map((presenter, index) => (
                    <div key={presenter.id || index} className="flex items-center space-x-3 p-2 bg-blue-50 rounded-lg">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-semibold">
                          {(presenter.userName || presenter.name || 'P').charAt(0)}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold">{presenter.userName || presenter.name}</p>
                        <p className="text-xs text-gray-600 capitalize">{presenter.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Attendees */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">
                  Attendees ({participants.filter(p => p.role === 'attendee').length})
                </h4>
                <div className="space-y-2">
                  {participants.filter(p => p.role === 'attendee').slice(0, 10).map((attendee, index) => (
                    <div key={attendee.id || index} className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-semibold">
                          {(attendee.userName || attendee.name || 'A').charAt(0)}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm">{attendee.userName || attendee.name}</p>
                        {attendee.handRaised && (
                          <div className="flex items-center space-x-1">
                            <HandRaisedIcon className="h-3 w-3 text-yellow-600" />
                            <span className="text-xs text-yellow-600">Hand raised</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {participants.filter(p => p.role === 'attendee').length > 10 && (
                    <p className="text-xs text-gray-500 text-center">
                      +{participants.filter(p => p.role === 'attendee').length - 10} more attendees
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WebinarRoom;
