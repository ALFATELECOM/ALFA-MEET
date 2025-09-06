import React from 'react';
import { XMarkIcon, UserIcon, MicrophoneIcon } from '@heroicons/react/24/outline';
import { useSocket } from '../context/SocketContext';

const ParticipantsList = ({ participants = [], onClose, roomId, isHost = false }) => {
  const { socket } = useSocket();
  const handleAdminToggle = (participant) => {
    if (!socket || !roomId || !isHost) return;
    const targetId = participant.id || participant.userId;
    if (!targetId) return;
    if (participant.isAudioMuted) {
      socket.emit('unmute-participant', { roomId, targetUserId: targetId });
    } else {
      socket.emit('mute-participant', { roomId, targetUserId: targetId });
    }
  };
  console.log('ParticipantsList participants:', participants);
  
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800">
          Participants ({participants.length + 1})
        </h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 rounded-lg transition duration-200"
        >
          <XMarkIcon className="h-5 w-5 text-gray-500" />
        </button>
      </div>

      {/* Participants List */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-3">
          {/* Current User */}
          <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
            <div className="flex-shrink-0">
              <UserIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-800">You</p>
              <p className="text-sm text-gray-500">Host</p>
            </div>
            <div className="flex items-center space-x-2">
              <MicrophoneIcon className="h-4 w-4 text-green-600" />
            </div>
          </div>

          {/* Other Participants */}
          {/* De-duplicate by stable user id */}
          {Array.from(new Map(participants.map(p => [(p.id || p.userId), p])).values()).map((participant, index) => {
            const participantName = participant.userName || participant.name || `User ${index + 1}`;
            const participantId = participant.id || participant.userId || `participant-${index}`;
            const isAudioMuted = participant.isAudioMuted !== undefined ? participant.isAudioMuted : false;
            
            return (
              <div key={participantId} className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg">
                <div className="flex-shrink-0">
                  <UserIcon className="h-8 w-8 text-gray-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-800">
                    {participantName}
                  </p>
                  <p className="text-sm text-gray-500">
                    {participant.role === 'host' ? 'Host' : 'Participant'}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <MicrophoneIcon className={`h-4 w-4 ${!isAudioMuted ? 'text-green-600' : 'text-red-600'}`} />
                  {isHost && (
                    <button
                      onClick={() => handleAdminToggle(participant)}
                      className={`px-2 py-1 text-xs rounded ${isAudioMuted ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}
                    >
                      {isAudioMuted ? 'Unmute' : 'Mute'}
                    </button>
                  )}
                  {isHost && participant.role !== 'host' && (
                    <>
                      {participant.role === 'co-host' ? (
                        <button
                          onClick={() => socket?.emit('remove-cohost', { roomId, targetUserId: participantId })}
                          className="px-2 py-1 text-xs rounded bg-gray-600 text-white"
                        >
                          Remove Co‑Host
                        </button>
                      ) : (
                        <button
                          onClick={() => socket?.emit('add-cohost', { roomId, targetUserId: participantId })}
                          className="px-2 py-1 text-xs rounded bg-purple-600 text-white"
                        >
                          Make Co‑Host
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}

          {participants.length === 0 && (
            <div className="text-center text-gray-500 mt-8">
              <UserIcon className="h-12 w-12 text-gray-300 mx-auto mb-2" />
              <p>No other participants</p>
              <p className="text-sm">Share the room ID to invite others</p>
            </div>
          )}
        </div>
      </div>

      {/* Room Info */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-2">Share this room ID:</p>
          <div className="bg-white border border-gray-300 rounded-lg p-2">
            <code className="text-sm font-mono text-gray-800">
              {window.location.pathname.split('/').pop()}
            </code>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParticipantsList;
