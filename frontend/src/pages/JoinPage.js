import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  MicrophoneIcon,
  VideoCameraIcon,
  ArrowRightIcon,
  CogIcon
} from '@heroicons/react/24/outline';
import {
  MicrophoneIcon as MicrophoneSlashIcon,
  VideoCameraIcon as VideoCameraSlashIcon
} from '@heroicons/react/24/solid';
import { useMedia } from '../context/MediaContext';
import axios from 'axios';

const JoinPage = () => {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { 
    startCamera, 
    stopCamera, 
    toggleAudio, 
    toggleVideo, 
    isAudioMuted, 
    isVideoMuted,
    localVideoRef 
  } = useMedia();

  const [userName, setUserName] = useState('');
  const [roomInfo, setRoomInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [mediaReady, setMediaReady] = useState(false);

  const serverUrl = 'https://alfa-meet.onrender.com';
  
  // Get data from navigation state
  const isHost = location.state?.isHost || false;
  const initialUserName = location.state?.userName || '';
  const roomName = location.state?.roomName || '';
  const roomType = location.state?.roomType || '';

  useEffect(() => {
    setUserName(initialUserName);
    fetchRoomInfo();
  }, [roomId]);

  useEffect(() => {
    // Start camera when component mounts
    initializeMedia();
    
    return () => {
      stopCamera();
    };
  }, []);

  const fetchRoomInfo = async () => {
    try {
      const response = await axios.get(`${serverUrl}/api/rooms/${roomId}`);
      setRoomInfo(response.data);
    } catch (error) {
      console.error('Error fetching room info:', error);
      if (error.response?.status === 404) {
        toast.error('Room not found');
        navigate('/');
      } else {
        toast.error('Failed to load room information');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const initializeMedia = async () => {
    try {
      await startCamera(true, true);
      setMediaReady(true);
    } catch (error) {
      console.error('Error initializing media:', error);
      toast.error('Could not access camera/microphone');
      setMediaReady(true); // Allow joining without media
    }
  };

  const handleJoinRoom = async () => {
    if (!userName.trim()) {
      toast.error('Please enter your name');
      return;
    }

    setIsJoining(true);

    try {
      // Navigate to room with user data
      navigate(`/room/${roomId}`, {
        state: {
          userName: userName.trim(),
          isHost,
          roomInfo: roomInfo || { name: roomName, type: roomType }
        }
      });
    } catch (error) {
      console.error('Error joining room:', error);
      toast.error('Failed to join room');
      setIsJoining(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-blue-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading room information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-blue-950">
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              {isHost ? 'Start Your Room' : 'Join Room'}
            </h1>
            <p className="text-gray-300">
              {roomInfo ? roomInfo.name : roomName || `Room ${roomId}`}
              {roomInfo && (
                <span className="ml-2 px-2 py-1 bg-blue-600 text-white text-xs rounded-full">
                  {roomInfo.type}
                </span>
              )}
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Video Preview */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-800"
            >
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                <VideoCameraIcon className="w-6 h-6 text-blue-400 mr-2" />
                Video Preview
              </h2>

              <div className="video-container aspect-video mb-4">
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="participant-video"
                />
                {isVideoMuted && (
                  <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                    <div className="text-center">
                      <VideoCameraSlashIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-400">Camera is off</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Media Controls */}
              <div className="flex justify-center space-x-4">
                <button
                  onClick={toggleAudio}
                  className={`control-button ${isAudioMuted ? 'active' : 'inactive'}`}
                  title={isAudioMuted ? 'Unmute' : 'Mute'}
                >
                  {isAudioMuted ? (
                    <MicrophoneSlashIcon className="w-6 h-6" />
                  ) : (
                    <MicrophoneIcon className="w-6 h-6" />
                  )}
                </button>

                <button
                  onClick={toggleVideo}
                  className={`control-button ${isVideoMuted ? 'active' : 'inactive'}`}
                  title={isVideoMuted ? 'Turn on camera' : 'Turn off camera'}
                >
                  {isVideoMuted ? (
                    <VideoCameraSlashIcon className="w-6 h-6" />
                  ) : (
                    <VideoCameraIcon className="w-6 h-6" />
                  )}
                </button>
              </div>
            </motion.div>

            {/* Join Form */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-800"
            >
              <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
                <CogIcon className="w-6 h-6 text-green-400 mr-2" />
                Join Settings
              </h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="input-field w-full"
                    placeholder="Enter your name"
                    required
                  />
                </div>

                {roomInfo && (
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <h3 className="font-medium text-white mb-3">Room Information</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Room Type:</span>
                        <span className="text-white capitalize">{roomInfo.type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Participants:</span>
                        <span className="text-white">{roomInfo.participantCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Created:</span>
                        <span className="text-white">
                          {new Date(roomInfo.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-4">
                  <h4 className="font-medium text-blue-400 mb-2">Before you join:</h4>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>• Make sure your camera and microphone are working</li>
                    <li>• Check your internet connection</li>
                    <li>• Find a quiet, well-lit space</li>
                    {roomInfo?.type === 'webinar' && !isHost && (
                      <li>• You'll join as an attendee (audio/video may be muted)</li>
                    )}
                  </ul>
                </div>

                <button
                  onClick={handleJoinRoom}
                  disabled={isJoining || !mediaReady}
                  className="btn-primary w-full flex items-center justify-center space-x-2 py-3"
                >
                  {isJoining ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <ArrowRightIcon className="w-5 h-5" />
                      <span>{isHost ? 'Start Room' : 'Join Room'}</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default JoinPage;
