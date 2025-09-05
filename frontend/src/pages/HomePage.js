import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { 
  VideoCameraIcon, 
  UserGroupIcon, 
  PresentationChartBarIcon,
  ArrowRightIcon,
  PlayIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';

const HomePage = () => {
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [roomType, setRoomType] = useState('meeting');
  const [hostName, setHostName] = useState('');
  const [joinRoomId, setJoinRoomId] = useState('');

  const serverUrl = process.env.REACT_APP_SERVER_URL || 'http://localhost:5000';

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    
    if (!roomName.trim() || !hostName.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsCreating(true);

    try {
      const response = await axios.post(`${serverUrl}/api/rooms`, {
        name: roomName.trim(),
        type: roomType,
        hostId: `host_${Date.now()}`,
        hostName: hostName.trim()
      });

      const { roomId } = response.data;
      
      toast.success('Room created successfully!');
      
      // Navigate to join page first to set up media
      navigate(`/join/${roomId}`, { 
        state: { 
          isHost: true, 
          userName: hostName.trim(),
          roomName: roomName.trim(),
          roomType 
        } 
      });
    } catch (error) {
      console.error('Error creating room:', error);
      toast.error('Failed to create room. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinRoom = () => {
    if (!joinRoomId.trim()) {
      toast.error('Please enter a room ID');
      return;
    }

    navigate(`/join/${joinRoomId.trim()}`);
  };

  const features = [
    {
      icon: VideoCameraIcon,
      title: 'HD Video Calling',
      description: 'Crystal clear video quality with adaptive bitrate'
    },
    {
      icon: UserGroupIcon,
      title: 'Meeting Mode',
      description: 'Interactive meetings with up to 100 participants'
    },
    {
      icon: PresentationChartBarIcon,
      title: 'Webinar Mode',
      description: 'Host webinars with audience management'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-blue-950">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl font-bold text-white mb-4">
            Video Conferencing
            <span className="text-blue-400"> Platform</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Professional video conferencing with meeting and webinar modes. 
            Connect, collaborate, and communicate seamlessly.
          </p>
        </motion.div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {/* Create Room Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-800"
          >
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <VideoCameraIcon className="w-8 h-8 text-blue-400 mr-3" />
              Create New Room
            </h2>

            <form onSubmit={handleCreateRoom} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Your Name *
                </label>
                <input
                  type="text"
                  value={hostName}
                  onChange={(e) => setHostName(e.target.value)}
                  className="input-field w-full"
                  placeholder="Enter your name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Room Name *
                </label>
                <input
                  type="text"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  className="input-field w-full"
                  placeholder="Enter room name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Room Type
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      value="meeting"
                      checked={roomType === 'meeting'}
                      onChange={(e) => setRoomType(e.target.value)}
                      className="text-blue-600"
                    />
                    <div className="flex items-center">
                      <UserGroupIcon className="w-5 h-5 text-gray-400 mr-2" />
                      <span className="text-white">Meeting</span>
                    </div>
                  </label>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      value="webinar"
                      checked={roomType === 'webinar'}
                      onChange={(e) => setRoomType(e.target.value)}
                      className="text-blue-600"
                    />
                    <div className="flex items-center">
                      <PresentationChartBarIcon className="w-5 h-5 text-gray-400 mr-2" />
                      <span className="text-white">Webinar</span>
                    </div>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={isCreating}
                className="btn-primary w-full flex items-center justify-center space-x-2 py-3"
              >
                {isCreating ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    <PlayIcon className="w-5 h-5" />
                    <span>Create Room</span>
                  </>
                )}
              </button>
            </form>
          </motion.div>

          {/* Join Room */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-8"
          >
            {/* Join Form */}
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-800">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                <ArrowRightIcon className="w-8 h-8 text-green-400 mr-3" />
                Join Existing Room
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Room ID
                  </label>
                  <input
                    type="text"
                    value={joinRoomId}
                    onChange={(e) => setJoinRoomId(e.target.value)}
                    className="input-field w-full"
                    placeholder="Enter room ID"
                  />
                </div>

                <button
                  onClick={handleJoinRoom}
                  className="btn-secondary w-full flex items-center justify-center space-x-2 py-3"
                >
                  <ArrowRightIcon className="w-5 h-5" />
                  <span>Join Room</span>
                </button>
              </div>
            </div>

            {/* Features */}
            <div className="space-y-4">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  className="bg-gray-900/30 backdrop-blur-sm rounded-lg p-4 border border-gray-800/50"
                >
                  <div className="flex items-start space-x-3">
                    <feature.icon className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold text-white mb-1">{feature.title}</h3>
                      <p className="text-sm text-gray-400">{feature.description}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
