import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { useMedia } from '../context/MediaContext';
import VideoGrid from '../components/VideoGrid';
import ControlBar from '../components/ControlBar';
import Chat from '../components/Chat';
import ParticipantsList from '../components/ParticipantsList';

const RoomPage = () => {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { socket } = useSocket();
  const { startCamera } = useMedia();
  
  const [userName] = useState(location.state?.userName || 'Anonymous');
  const [participants, setParticipants] = useState([]);
  const [messages, setMessages] = useState([]);
  const [showChat, setShowChat] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);

  useEffect(() => {
    if (!socket) return;

    // Initialize camera
    startCamera().catch(console.error);

    // Join room
    socket.emit('join-room', { roomId, userName });

    // Socket event listeners
    socket.on('user-joined', (data) => {
      setParticipants(prev => [...prev, data]);
    });

    socket.on('user-left', (data) => {
      setParticipants(prev => prev.filter(p => p.id !== data.id));
    });

    socket.on('room-participants', (data) => {
      setParticipants(data);
    });

    socket.on('new-message', (message) => {
      setMessages(prev => [...prev, message]);
    });

    socket.on('room-ended', () => {
      navigate('/');
    });

    return () => {
      socket.off('user-joined');
      socket.off('user-left');
      socket.off('room-participants');
      socket.off('new-message');
      socket.off('room-ended');
    };
  }, [socket, roomId, userName, navigate, startCamera]);

  const sendMessage = (message) => {
    if (socket && message.trim()) {
      socket.emit('send-message', {
        roomId,
        message: message.trim(),
        userName
      });
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
          <h1 className="text-lg font-semibold">Room: {roomId}</h1>
          <p className="text-sm text-gray-300">{participants.length} participants</p>
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
          
          {/* Control Bar */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
            <ControlBar
              onToggleChat={() => setShowChat(!showChat)}
              onToggleParticipants={() => setShowParticipants(!showParticipants)}
              onLeaveRoom={leaveRoom}
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
