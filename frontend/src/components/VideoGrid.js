import React from 'react';
import { useMedia } from '../context/MediaContext';
import { VideoCameraSlashIcon, UserIcon } from '@heroicons/react/24/outline';

const VideoGrid = ({ participants }) => {
  const { localVideoRef, isVideoEnabled } = useMedia();

  const getGridClass = () => {
    const totalParticipants = participants.length + 1; // +1 for local user
    if (totalParticipants === 1) return 'grid-cols-1';
    if (totalParticipants === 2) return 'grid-cols-2';
    if (totalParticipants <= 4) return 'grid-cols-2 grid-rows-2';
    if (totalParticipants <= 6) return 'grid-cols-3 grid-rows-2';
    return 'grid-cols-3 grid-rows-3';
  };

  return (
    <div className="h-full p-4">
      <div className={`grid ${getGridClass()} gap-4 h-full`}>
        {/* Local Video */}
        <div className="relative bg-gray-800 rounded-lg overflow-hidden">
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover"
          />
          {!isVideoEnabled && (
            <div className="absolute inset-0 bg-gray-700 flex items-center justify-center">
              <UserIcon className="h-16 w-16 text-gray-400" />
            </div>
          )}
          <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
            You
          </div>
        </div>

        {/* Remote Videos */}
        {participants.map((participant, index) => (
          <div key={participant.id || index} className="relative bg-gray-800 rounded-lg overflow-hidden">
            <div className="w-full h-full flex items-center justify-center">
              <UserIcon className="h-16 w-16 text-gray-400" />
            </div>
            <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
              {participant.userName || `User ${index + 1}`}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VideoGrid;
