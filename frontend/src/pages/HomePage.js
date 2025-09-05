import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { VideoCameraIcon, UserGroupIcon } from '@heroicons/react/24/outline';

const HomePage = () => {
  const [roomId, setRoomId] = useState('');
  const navigate = useNavigate();

  const createRoom = () => {
    const newRoomId = Math.random().toString(36).substring(2, 15);
    navigate(`/join/${newRoomId}`);
  };

  const joinRoom = () => {
    if (roomId.trim()) {
      navigate(`/join/${roomId}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
        <div className="text-center mb-8">
          <VideoCameraIcon className="h-16 w-16 text-blue-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Zoom Clone</h1>
          <p className="text-gray-600">Connect with friends and colleagues</p>
        </div>

        <div className="space-y-4">
          <button
            onClick={createRoom}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center space-x-2"
          >
            <VideoCameraIcon className="h-5 w-5" />
            <span>Create New Room</span>
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">or</span>
            </div>
          </div>

          <div className="space-y-2">
            <input
              type="text"
              placeholder="Enter Room ID"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyPress={(e) => e.key === 'Enter' && joinRoom()}
            />
            <button
              onClick={joinRoom}
              disabled={!roomId.trim()}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center space-x-2"
            >
              <UserGroupIcon className="h-5 w-5" />
              <span>Join Room</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
