import React from 'react';
import { useMedia } from '../context/MediaContext';
import { VideoCameraSlashIcon, UserIcon } from '@heroicons/react/24/outline';

const VideoGrid = ({ participants = [] }) => {
  const { localVideoRef, isVideoEnabled, localStream } = useMedia();

  console.log('VideoGrid participants:', participants);
  console.log('Local stream:', localStream);
  console.log('Video enabled:', isVideoEnabled);

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
            className={`w-full h-full object-cover ${!isVideoEnabled || !localStream ? 'hidden' : ''}`}
          />
          {(!isVideoEnabled || !localStream) && (
            <div className="absolute inset-0 bg-gray-700 flex items-center justify-center">
              <UserIcon className="h-20 w-20 text-gray-400" />
            </div>
          )}
          <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
            You {!isVideoEnabled && '(Video Off)'}
          </div>
          {/* Audio indicator */}
          <div className="absolute top-2 right-2 flex space-x-1">
            <div className={`p-1 rounded-full ${!isVideoEnabled ? 'bg-red-600' : 'bg-green-600'}`}>
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8 5a1 1 0 011-1h2a1 1 0 011 1v10a1 1 0 01-1 1H9a1 1 0 01-1-1V5z"/>
              </svg>
            </div>
          </div>
        </div>

        {/* Remote Videos */}
        {participants.map((participant, index) => {
          const participantName = participant.userName || participant.name || `User ${index + 1}`;
          const participantId = participant.id || participant.userId || `participant-${index}`;
          const isHost = participant.role === 'host';
          const isCoHost = participant.role === 'co-host';
          
          return (
            <div key={participantId} className="relative bg-gray-800 rounded-lg overflow-hidden">
              {/* Placeholder for remote video - in real app, this would be WebRTC video */}
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-800">
                <div className="text-center">
                  <UserIcon className="h-20 w-20 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-300 text-sm">Camera Off</p>
                </div>
              </div>
              
              {/* Participant Name and Role */}
              <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-sm flex items-center space-x-1">
                <span>{participantName}</span>
                {isHost && <span className="bg-blue-600 px-1 rounded text-xs">HOST</span>}
                {isCoHost && <span className="bg-purple-600 px-1 rounded text-xs">CO-HOST</span>}
              </div>
              
              {/* Status Indicators */}
              <div className="absolute top-2 right-2 flex space-x-1">
                {/* Audio Status */}
                <div className={`p-1 rounded-full ${participant.isAudioMuted ? 'bg-red-600' : 'bg-green-600'}`}>
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    {participant.isAudioMuted ? (
                      <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    ) : (
                      <path d="M8 5a1 1 0 011-1h2a1 1 0 011 1v10a1 1 0 01-1 1H9a1 1 0 01-1-1V5z"/>
                    )}
                  </svg>
                </div>
                
                {/* Video Status */}
                <div className={`p-1 rounded-full ${participant.isVideoMuted ? 'bg-red-600' : 'bg-green-600'}`}>
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    {participant.isVideoMuted ? (
                      <path fillRule="evenodd" d="M1 8a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 018.07 3h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0016.07 6H17a2 2 0 012 2v7a2 2 0 01-2 2H3a2 2 0 01-2-2V8zm13.5 3a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM10 14a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                    ) : (
                      <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                    )}
                  </svg>
                </div>
              </div>
              
              {/* Screen Sharing Indicator */}
              {participant.isScreenSharing && (
                <div className="absolute top-2 left-2 bg-blue-600 text-white px-2 py-1 rounded text-xs">
                  Sharing Screen
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
