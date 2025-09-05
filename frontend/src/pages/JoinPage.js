import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMedia } from '../context/MediaContext';
import { VideoCameraIcon, MicrophoneIcon } from '@heroicons/react/24/outline';
import { VideoCameraSlashIcon } from '@heroicons/react/24/solid';

const JoinPage = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { localStream, isVideoEnabled, isAudioEnabled, toggleVideo, toggleAudio, startCamera, localVideoRef } = useMedia();
  const [userName, setUserName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    startCamera().catch(console.error);
  }, [startCamera]);

  const joinRoom = async () => {
    if (!userName.trim()) return;
    
    setIsLoading(true);
    try {
      navigate(`/room/${roomId}`, { state: { userName } });
    } catch (error) {
      console.error('Error joining room:', error);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-2xl w-full mx-4">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Join Room</h1>
          <p className="text-gray-600">Room ID: {roomId}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Video Preview */}
          <div className="space-y-4">
            <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video">
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
              {!isVideoEnabled && (
                <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                  <VideoCameraSlashIcon className="h-12 w-12 text-gray-400" />
                </div>
              )}
            </div>

            {/* Media Controls */}
            <div className="flex justify-center space-x-4">
              <button
                onClick={toggleVideo}
                className={`p-3 rounded-full ${
                  isVideoEnabled ? 'bg-gray-200 hover:bg-gray-300' : 'bg-red-500 hover:bg-red-600'
                } transition duration-200`}
              >
                {isVideoEnabled ? (
                  <VideoCameraIcon className="h-6 w-6 text-gray-700" />
                ) : (
                  <VideoCameraSlashIcon className="h-6 w-6 text-white" />
                )}
              </button>
              <button
                onClick={toggleAudio}
                className={`p-3 rounded-full ${
                  isAudioEnabled ? 'bg-gray-200 hover:bg-gray-300' : 'bg-red-500 hover:bg-red-600'
                } transition duration-200`}
              >
                {isAudioEnabled ? (
                  <MicrophoneIcon className="h-6 w-6 text-gray-700" />
                ) : (
                  <MicrophoneIcon className="h-6 w-6 text-white" />
                )}
              </button>
            </div>
          </div>

          {/* Join Form */}
          <div className="space-y-4 flex flex-col justify-center">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Name
              </label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyPress={(e) => e.key === 'Enter' && joinRoom()}
              />
            </div>

            <button
              onClick={joinRoom}
              disabled={!userName.trim() || isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition duration-200"
            >
              {isLoading ? 'Joining...' : 'Join Room'}
            </button>

            <button
              onClick={() => navigate('/')}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 px-4 rounded-lg transition duration-200"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JoinPage;
