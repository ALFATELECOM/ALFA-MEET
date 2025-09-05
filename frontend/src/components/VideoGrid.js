import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  MicrophoneSlashIcon,
  VideoCameraSlashIcon,
  UserIcon
} from '@heroicons/react/24/outline';

const VideoTile = ({ participant, stream, isLocal = false, className = "" }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const getGridItemClass = (count) => {
    if (count === 1) return "col-span-2 row-span-2";
    if (count === 2) return "col-span-1 row-span-2";
    if (count <= 4) return "col-span-1 row-span-1";
    return "col-span-1 row-span-1";
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className={`video-container relative ${className}`}
    >
      {/* Video Element */}
      {stream && !participant?.isVideoMuted ? (
        <video
          ref={videoRef}
          autoPlay
          muted={isLocal}
          playsInline
          className="participant-video"
        />
      ) : (
        <div className="w-full h-full bg-gray-800 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mb-3">
              {participant?.name ? (
                <span className="text-2xl font-semibold text-white">
                  {participant.name.charAt(0).toUpperCase()}
                </span>
              ) : (
                <UserIcon className="w-8 h-8 text-gray-400" />
              )}
            </div>
            <p className="text-gray-300 text-sm">Camera is off</p>
          </div>
        </div>
      )}

      {/* Overlay Information */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-white font-medium text-sm">
              {participant?.name || 'Unknown'} {isLocal && '(You)'}
            </span>
            {participant?.role === 'host' && (
              <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded">
                Host
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-1">
            {participant?.isAudioMuted && (
              <div className="p-1 bg-red-600 rounded-full">
                <MicrophoneSlashIcon className="w-3 h-3 text-white" />
              </div>
            )}
            {participant?.isVideoMuted && (
              <div className="p-1 bg-red-600 rounded-full">
                <VideoCameraSlashIcon className="w-3 h-3 text-white" />
              </div>
            )}
            {participant?.isScreenSharing && (
              <div className="px-2 py-1 bg-green-600 text-white text-xs rounded">
                Sharing
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Speaking Indicator */}
      {participant?.isSpeaking && (
        <div className="absolute inset-0 border-4 border-green-400 rounded-lg pointer-events-none animate-pulse"></div>
      )}
    </motion.div>
  );
};

const VideoGrid = ({ participants, currentUserId, localStream, remoteStreams }) => {
  const totalParticipants = participants.length;
  const currentUser = participants.find(p => p.id === currentUserId);

  // Calculate grid layout
  const getGridClass = (count) => {
    if (count === 1) return "grid-cols-1 grid-rows-1";
    if (count === 2) return "grid-cols-2 grid-rows-1";
    if (count <= 4) return "grid-cols-2 grid-rows-2";
    if (count <= 6) return "grid-cols-3 grid-rows-2";
    if (count <= 9) return "grid-cols-3 grid-rows-3";
    return "grid-cols-4 grid-rows-3";
  };

  return (
    <div className="h-full p-4">
      <div className={`grid gap-4 h-full ${getGridClass(totalParticipants)}`}>
        {participants.map((participant) => {
          const isLocal = participant.id === currentUserId;
          const stream = isLocal ? localStream : remoteStreams.get(participant.id);
          
          return (
            <VideoTile
              key={participant.id}
              participant={participant}
              stream={stream}
              isLocal={isLocal}
              className="min-h-0"
            />
          );
        })}
      </div>

      {/* No participants message */}
      {totalParticipants === 0 && (
        <div className="h-full flex items-center justify-center">
          <div className="text-center">
            <UserIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">
              Waiting for participants
            </h3>
            <p className="text-gray-500">
              Share the room link to invite others
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoGrid;
