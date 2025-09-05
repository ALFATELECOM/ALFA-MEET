import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useSocket } from '../context/SocketContext';
import { useMedia } from '../context/MediaContext';
import VideoGrid from '../components/VideoGrid';
import ControlBar from '../components/ControlBar';
import ParticipantsList from '../components/ParticipantsList';
import Chat from '../components/Chat';
import ScreenShareView from '../components/ScreenShareView';
import {
  PhoneXMarkIcon,
  UsersIcon,
  ChatBubbleLeftIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';

const RoomPage = () => {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { socket, connected } = useSocket();
  const { 
    localStream, 
    screenStream, 
    createPeerConnection,
    startCamera,
    stopCamera
  } = useMedia();

  // State management
  const [participants, setParticipants] = useState([]);
  const [roomInfo, setRoomInfo] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [screenShareUser, setScreenShareUser] = useState(null);
  
  // User info from navigation
  const userName = location.state?.userName || 'Anonymous';
  const isHost = location.state?.isHost || false;
  const userId = useRef(`user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  
  // WebRTC connections
  const peerConnections = useRef(new Map());
  const remoteStreams = useRef(new Map());

  useEffect(() => {
    if (!socket || !connected) return;

    // Initialize camera if not already started
    if (!localStream) {
      startCamera(true, true);
    }

    // Join room
    socket.emit('join-room', {
      roomId,
      userId: userId.current,
      userData: {
        name: userName,
        isHost
      }
    });

    // Socket event listeners
    socket.on('joined-room', handleJoinedRoom);
    socket.on('user-joined', handleUserJoined);
    socket.on('user-left', handleUserLeft);
    socket.on('offer', handleOffer);
    socket.on('answer', handleAnswer);
    socket.on('ice-candidate', handleIceCandidate);
    socket.on('new-message', handleNewMessage);
    socket.on('user-audio-toggled', handleUserAudioToggled);
    socket.on('user-video-toggled', handleUserVideoToggled);
    socket.on('user-screen-share-started', handleScreenShareStarted);
    socket.on('user-screen-share-stopped', handleScreenShareStopped);
    socket.on('recording-started', () => setIsRecording(true));
    socket.on('recording-stopped', () => setIsRecording(false));
    socket.on('room-ended', handleRoomEnded);
    socket.on('removed-from-room', handleRemovedFromRoom);
    socket.on('force-mute', handleForceMute);
    socket.on('error', (error) => {
      toast.error(error.message);
    });

    return () => {
      // Cleanup socket listeners
      socket.off('joined-room');
      socket.off('user-joined');
      socket.off('user-left');
      socket.off('offer');
      socket.off('answer');
      socket.off('ice-candidate');
      socket.off('new-message');
      socket.off('user-audio-toggled');
      socket.off('user-video-toggled');
      socket.off('user-screen-share-started');
      socket.off('user-screen-share-stopped');
      socket.off('recording-started');
      socket.off('recording-stopped');
      socket.off('room-ended');
      socket.off('removed-from-room');
      socket.off('force-mute');
      socket.off('error');
      
      // Close all peer connections
      peerConnections.current.forEach(pc => pc.close());
      peerConnections.current.clear();
      remoteStreams.current.clear();
    };
  }, [socket, connected, localStream]);

  const handleJoinedRoom = (data) => {
    setRoomInfo({
      id: data.roomId,
      name: data.roomName,
      type: data.roomType,
      settings: data.settings
    });
    setParticipants(data.participants);
    setChatMessages(data.chatHistory);
    
    toast.success(`Joined ${data.roomName}`);
    
    // Create peer connections for existing participants
    data.participants.forEach(participant => {
      if (participant.id !== userId.current) {
        createPeerConnectionForUser(participant.id, participant.socketId);
      }
    });
  };

  const handleUserJoined = (data) => {
    setParticipants(prev => [...prev, data.userData]);
    toast.success(`${data.userData.name} joined the room`);
    
    // Create peer connection for new user
    createPeerConnectionForUser(data.userId, data.userData.socketId);
  };

  const handleUserLeft = (data) => {
    setParticipants(prev => prev.filter(p => p.id !== data.userId));
    
    // Clean up peer connection
    const pc = peerConnections.current.get(data.userId);
    if (pc) {
      pc.close();
      peerConnections.current.delete(data.userId);
    }
    remoteStreams.current.delete(data.userId);
    
    // Check if it was screen share user
    if (screenShareUser === data.userId) {
      setScreenShareUser(null);
    }
  };

  const createPeerConnectionForUser = useCallback(async (userId, socketId) => {
    if (peerConnections.current.has(userId)) return;

    const peerConnection = createPeerConnection(
      (candidate) => {
        socket.emit('ice-candidate', {
          to: socketId,
          candidate
        });
      },
      (stream) => {
        remoteStreams.current.set(userId, stream);
        setParticipants(prev => prev.map(p => 
          p.id === userId ? { ...p, stream } : p
        ));
      }
    );

    peerConnections.current.set(userId, peerConnection);

    // Create and send offer
    try {
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      
      socket.emit('offer', {
        to: socketId,
        offer
      });
    } catch (error) {
      console.error('Error creating offer:', error);
    }
  }, [socket, createPeerConnection]);

  const handleOffer = async (data) => {
    const { from, offer } = data;
    
    // Find the user by socket ID
    const user = participants.find(p => p.socketId === from);
    if (!user) return;

    let peerConnection = peerConnections.current.get(user.id);
    
    if (!peerConnection) {
      peerConnection = createPeerConnection(
        (candidate) => {
          socket.emit('ice-candidate', {
            to: from,
            candidate
          });
        },
        (stream) => {
          remoteStreams.current.set(user.id, stream);
          setParticipants(prev => prev.map(p => 
            p.id === user.id ? { ...p, stream } : p
          ));
        }
      );
      
      peerConnections.current.set(user.id, peerConnection);
    }

    try {
      await peerConnection.setRemoteDescription(offer);
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      
      socket.emit('answer', {
        to: from,
        answer
      });
    } catch (error) {
      console.error('Error handling offer:', error);
    }
  };

  const handleAnswer = async (data) => {
    const { from, answer } = data;
    
    // Find the user by socket ID
    const user = participants.find(p => p.socketId === from);
    if (!user) return;

    const peerConnection = peerConnections.current.get(user.id);
    if (peerConnection) {
      try {
        await peerConnection.setRemoteDescription(answer);
      } catch (error) {
        console.error('Error handling answer:', error);
      }
    }
  };

  const handleIceCandidate = async (data) => {
    const { from, candidate } = data;
    
    // Find the user by socket ID
    const user = participants.find(p => p.socketId === from);
    if (!user) return;

    const peerConnection = peerConnections.current.get(user.id);
    if (peerConnection) {
      try {
        await peerConnection.addIceCandidate(candidate);
      } catch (error) {
        console.error('Error adding ice candidate:', error);
      }
    }
  };

  const handleNewMessage = (message) => {
    setChatMessages(prev => [...prev, message]);
    if (!showChat) {
      toast.success(`New message from ${message.userName}`);
    }
  };

  const handleUserAudioToggled = (data) => {
    setParticipants(prev => prev.map(p => 
      p.id === data.userId ? { ...p, isAudioMuted: data.isMuted } : p
    ));
  };

  const handleUserVideoToggled = (data) => {
    setParticipants(prev => prev.map(p => 
      p.id === data.userId ? { ...p, isVideoMuted: data.isMuted } : p
    ));
  };

  const handleScreenShareStarted = (data) => {
    setScreenShareUser(data.userId);
  };

  const handleScreenShareStopped = (data) => {
    if (screenShareUser === data.userId) {
      setScreenShareUser(null);
    }
  };

  const handleRoomEnded = () => {
    toast.error('Room has been ended by the host');
    navigate('/');
  };

  const handleRemovedFromRoom = () => {
    toast.error('You have been removed from the room');
    navigate('/');
  };

  const handleForceMute = () => {
    toast.info('You have been muted by the host');
  };

  const leaveRoom = () => {
    stopCamera();
    navigate('/');
  };

  const sendMessage = (message) => {
    socket.emit('send-message', {
      roomId,
      userId: userId.current,
      userName,
      message
    });
  };

  if (!roomInfo) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-300">Joining room...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-950 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-lg font-semibold text-white">{roomInfo.name}</h1>
          <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded-full capitalize">
            {roomInfo.type}
          </span>
          {isRecording && (
            <span className="px-2 py-1 bg-red-600 text-white text-xs rounded-full animate-pulse">
              Recording
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowParticipants(!showParticipants)}
            className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-colors"
            title="Participants"
          >
            <UsersIcon className="w-5 h-5" />
            <span className="ml-1 text-sm">{participants.length}</span>
          </button>
          
          <button
            onClick={() => setShowChat(!showChat)}
            className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-colors"
            title="Chat"
          >
            <ChatBubbleLeftIcon className="w-5 h-5" />
          </button>
          
          <button
            onClick={leaveRoom}
            className="p-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors"
            title="Leave Room"
          >
            <PhoneXMarkIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video Area */}
        <div className="flex-1 relative">
          {screenShareUser ? (
            <ScreenShareView 
              screenShareUser={screenShareUser}
              participants={participants}
              currentUserId={userId.current}
            />
          ) : (
            <VideoGrid 
              participants={participants}
              currentUserId={userId.current}
              localStream={localStream}
              remoteStreams={remoteStreams.current}
            />
          )}
        </div>

        {/* Side Panels */}
        <AnimatePresence>
          {showParticipants && (
            <motion.div
              initial={{ x: 320 }}
              animate={{ x: 0 }}
              exit={{ x: 320 }}
              className="w-80 bg-gray-900 border-l border-gray-800"
            >
              <ParticipantsList 
                participants={participants}
                currentUserId={userId.current}
                isHost={isHost}
                roomId={roomId}
                socket={socket}
              />
            </motion.div>
          )}
          
          {showChat && (
            <motion.div
              initial={{ x: 320 }}
              animate={{ x: 0 }}
              exit={{ x: 320 }}
              className="w-80 bg-gray-900 border-l border-gray-800"
            >
              <Chat 
                messages={chatMessages}
                onSendMessage={sendMessage}
                currentUserId={userId.current}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Control Bar */}
      <ControlBar 
        roomId={roomId}
        userId={userId.current}
        userName={userName}
        isHost={isHost}
        roomType={roomInfo.type}
        socket={socket}
        isRecording={isRecording}
        onLeaveRoom={leaveRoom}
      />
    </div>
  );
};

export default RoomPage;
