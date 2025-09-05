import React from 'react';
import { useMedia } from '../context/MediaContext';
import { VideoCameraSlashIcon, UserIcon } from '@heroicons/react/24/outline';

const VideoGrid = ({ participants = [] }) => {
  const { localVideoRef, isVideoEnabled } = useMedia();

  console.log('VideoGrid participants:', participants);

  const getGridClass = () => {
    const totalParticipants = participants.length + 1; // +1 for local user
    console.log('Total participants for grid:', totalParticipants);
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
        {participants.map((participant, index) => {
          const participantName = participant.userName || participant.name || `User ${index + 1}`;
          const participantId = participant.id || participant.userId || `participant-${index}`;
          
          return (
            <div key={participantId} className="relative bg-gray-800 rounded-lg overflow-hidden">
              <div className="w-full h-full flex items-center justify-center">
                <UserIcon className="h-16 w-16 text-gray-400" />
              </div>
              <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                {participantName}
              </div>
              {participant.isAudioMuted && (
                <div className="absolute top-2 right-2 bg-red-600 rounded-full p-1">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
          );
        })}

        {/* Show message if no participants */}
        {participants.length === 0 && (
          <div className="col-span-full flex items-center justify-center text-gray-400 text-lg">
            <div className="text-center">
              <UserIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Waiting for others to join...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoGrid;
