import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UsersIcon,
  MicrophoneIcon,
  MicrophoneSlashIcon,
  VideoCameraIcon,
  VideoCameraSlashIcon,
  EllipsisHorizontalIcon,
  UserMinusIcon,
  SpeakerXMarkIcon,
  CrownIcon
} from '@heroicons/react/24/outline';

const ParticipantItem = ({ participant, isHost, canControl, onMuteParticipant, onRemoveParticipant }) => {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex items-center justify-between p-3 hover:bg-gray-800 rounded-lg transition-colors"
    >
      <div className="flex items-center space-x-3">
        {/* Avatar */}
        <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
          <span className="text-white font-medium">
            {participant.name.charAt(0).toUpperCase()}
          </span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <p className="text-white font-medium truncate">
              {participant.name}
            </p>
            {participant.role === 'host' && (
              <CrownIcon className="w-4 h-4 text-yellow-500" title="Host" />
            )}
          </div>
          <div className="flex items-center space-x-1 mt-1">
            {participant.isAudioMuted ? (
              <MicrophoneSlashIcon className="w-3 h-3 text-red-400" />
            ) : (
              <MicrophoneIcon className="w-3 h-3 text-green-400" />
            )}
            {participant.isVideoMuted ? (
              <VideoCameraSlashIcon className="w-3 h-3 text-red-400" />
            ) : (
              <VideoCameraIcon className="w-3 h-3 text-green-400" />
            )}
            {participant.isScreenSharing && (
              <span className="text-xs bg-green-600 text-white px-1 rounded">
                Sharing
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Controls for host */}
      {canControl && participant.role !== 'host' && (
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 text-gray-400 hover:text-white rounded"
          >
            <EllipsisHorizontalIcon className="w-5 h-5" />
          </button>

          {showMenu && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute right-0 top-full mt-1 bg-gray-800 rounded-lg shadow-xl border border-gray-700 py-1 min-w-32 z-10"
            >
              <button
                onClick={() => {
                  onMuteParticipant(participant.id);
                  setShowMenu(false);
                }}
                className="w-full px-3 py-2 text-left text-white hover:bg-gray-700 flex items-center space-x-2"
              >
                <SpeakerXMarkIcon className="w-4 h-4" />
                <span>Mute</span>
              </button>
              <button
                onClick={() => {
                  onRemoveParticipant(participant.id);
                  setShowMenu(false);
                }}
                className="w-full px-3 py-2 text-left text-red-400 hover:bg-gray-700 flex items-center space-x-2"
              >
                <UserMinusIcon className="w-4 h-4" />
                <span>Remove</span>
              </button>
            </motion.div>
          )}
        </div>
      )}
    </motion.div>
  );
};

const ParticipantsList = ({ participants, currentUserId, isHost, roomId, socket }) => {
  const canControl = isHost;

  const handleMuteParticipant = (targetUserId) => {
    socket.emit('mute-participant', {
      roomId,
      targetUserId,
      hostId: currentUserId
    });
  };

  const handleRemoveParticipant = (targetUserId) => {
    const participant = participants.find(p => p.id === targetUserId);
    if (participant && window.confirm(`Remove ${participant.name} from the room?`)) {
      socket.emit('remove-participant', {
        roomId,
        targetUserId,
        hostId: currentUserId
      });
    }
  };

  // Sort participants: host first, then by join time
  const sortedParticipants = [...participants].sort((a, b) => {
    if (a.role === 'host' && b.role !== 'host') return -1;
    if (b.role === 'host' && a.role !== 'host') return 1;
    return new Date(a.joinedAt) - new Date(b.joinedAt);
  });

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 px-4 py-3 border-b border-gray-700">
        <h3 className="text-lg font-semibold text-white flex items-center">
          <UsersIcon className="w-5 h-5 mr-2" />
          Participants ({participants.length})
        </h3>
      </div>

      {/* Participants List */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence>
          {sortedParticipants.map((participant) => (
            <ParticipantItem
              key={participant.id}
              participant={participant}
              isHost={participant.role === 'host'}
              canControl={canControl && participant.id !== currentUserId}
              onMuteParticipant={handleMuteParticipant}
              onRemoveParticipant={handleRemoveParticipant}
            />
          ))}
        </AnimatePresence>

        {participants.length === 0 && (
          <div className="text-center text-gray-500 mt-8 px-4">
            <UsersIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No participants yet</p>
            <p className="text-sm">Share the room link to invite others</p>
          </div>
        )}
      </div>

      {/* Footer Info */}
      {isHost && (
        <div className="bg-gray-800 px-4 py-3 border-t border-gray-700">
          <p className="text-xs text-gray-400 text-center">
            As host, you can mute and remove participants
          </p>
        </div>
      )}
    </div>
  );
};

export default ParticipantsList;
