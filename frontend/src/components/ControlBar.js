import React, { useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  MicrophoneIcon,
  MicrophoneSlashIcon,
  VideoCameraIcon,
  VideoCameraSlashIcon,
  ComputerDesktopIcon,
  StopIcon,
  PhoneXMarkIcon,
  EllipsisHorizontalIcon,
  ClipboardDocumentIcon,
  VideoCameraSlashIcon as RecordIcon
} from '@heroicons/react/24/outline';
import { useMedia } from '../context/MediaContext';

const ControlBar = ({ 
  roomId, 
  userId, 
  userName, 
  isHost, 
  roomType, 
  socket, 
  isRecording, 
  onLeaveRoom 
}) => {
  const {
    isAudioMuted,
    isVideoMuted,
    isScreenSharing,
    toggleAudio,
    toggleVideo,
    startScreenShare,
    stopScreenShare
  } = useMedia();

  const [showMoreOptions, setShowMoreOptions] = useState(false);

  const handleToggleAudio = () => {
    toggleAudio();
    socket.emit('toggle-audio', {
      roomId,
      userId,
      isMuted: !isAudioMuted
    });
  };

  const handleToggleVideo = () => {
    toggleVideo();
    socket.emit('toggle-video', {
      roomId,
      userId,
      isMuted: !isVideoMuted
    });
  };

  const handleScreenShare = async () => {
    try {
      if (isScreenSharing) {
        stopScreenShare();
        socket.emit('stop-screen-share', { roomId, userId });
        toast.success('Screen sharing stopped');
      } else {
        await startScreenShare();
        socket.emit('start-screen-share', { roomId, userId });
        toast.success('Screen sharing started');
      }
    } catch (error) {
      console.error('Screen share error:', error);
      toast.error('Failed to start screen sharing');
    }
  };

  const handleToggleRecording = () => {
    if (isRecording) {
      socket.emit('stop-recording', { roomId, hostId: userId });
      toast.success('Recording stopped');
    } else {
      socket.emit('start-recording', { roomId, hostId: userId });
      toast.success('Recording started');
    }
  };

  const copyRoomLink = () => {
    const roomLink = `${window.location.origin}/join/${roomId}`;
    navigator.clipboard.writeText(roomLink).then(() => {
      toast.success('Room link copied to clipboard!');
    }).catch(() => {
      toast.error('Failed to copy room link');
    });
  };

  const handleEndRoom = () => {
    if (window.confirm('Are you sure you want to end the room for everyone?')) {
      socket.emit('end-room', { roomId, hostId: userId });
      onLeaveRoom();
    }
  };

  return (
    <div className="bg-gray-900 border-t border-gray-800 px-6 py-4">
      <div className="flex items-center justify-center space-x-4">
        {/* Audio Control */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleToggleAudio}
          className={`control-button ${isAudioMuted ? 'active' : 'inactive'}`}
          title={isAudioMuted ? 'Unmute' : 'Mute'}
        >
          {isAudioMuted ? (
            <MicrophoneSlashIcon className="w-6 h-6" />
          ) : (
            <MicrophoneIcon className="w-6 h-6" />
          )}
        </motion.button>

        {/* Video Control */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleToggleVideo}
          className={`control-button ${isVideoMuted ? 'active' : 'inactive'}`}
          title={isVideoMuted ? 'Turn on camera' : 'Turn off camera'}
        >
          {isVideoMuted ? (
            <VideoCameraSlashIcon className="w-6 h-6" />
          ) : (
            <VideoCameraIcon className="w-6 h-6" />
          )}
        </motion.button>

        {/* Screen Share Control */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleScreenShare}
          className={`control-button ${isScreenSharing ? 'active' : 'inactive'}`}
          title={isScreenSharing ? 'Stop sharing' : 'Share screen'}
        >
          {isScreenSharing ? (
            <StopIcon className="w-6 h-6" />
          ) : (
            <ComputerDesktopIcon className="w-6 h-6" />
          )}
        </motion.button>

        {/* Recording Control (Host only) */}
        {isHost && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleToggleRecording}
            className={`control-button ${isRecording ? 'active' : 'inactive'}`}
            title={isRecording ? 'Stop recording' : 'Start recording'}
          >
            <RecordIcon className="w-6 h-6" />
          </motion.button>
        )}

        {/* More Options */}
        <div className="relative">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowMoreOptions(!showMoreOptions)}
            className="control-button inactive"
            title="More options"
          >
            <EllipsisHorizontalIcon className="w-6 h-6" />
          </motion.button>

          {/* More Options Menu */}
          {showMoreOptions && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-full mb-2 right-0 bg-gray-800 rounded-lg shadow-xl border border-gray-700 py-2 min-w-48"
            >
              <button
                onClick={() => {
                  copyRoomLink();
                  setShowMoreOptions(false);
                }}
                className="w-full px-4 py-2 text-left text-white hover:bg-gray-700 flex items-center space-x-2"
              >
                <ClipboardDocumentIcon className="w-4 h-4" />
                <span>Copy room link</span>
              </button>

              {isHost && (
                <>
                  <hr className="border-gray-700 my-1" />
                  <button
                    onClick={() => {
                      handleEndRoom();
                      setShowMoreOptions(false);
                    }}
                    className="w-full px-4 py-2 text-left text-red-400 hover:bg-gray-700 flex items-center space-x-2"
                  >
                    <PhoneXMarkIcon className="w-4 h-4" />
                    <span>End room for all</span>
                  </button>
                </>
              )}
            </motion.div>
          )}
        </div>

        {/* Leave Room */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onLeaveRoom}
          className="control-button bg-red-600 hover:bg-red-700"
          title="Leave room"
        >
          <PhoneXMarkIcon className="w-6 h-6" />
        </motion.button>
      </div>

      {/* Room Info */}
      <div className="flex items-center justify-center mt-3 space-x-4 text-sm text-gray-400">
        <span>Room ID: {roomId.slice(-8)}</span>
        {roomType === 'webinar' && !isHost && (
          <span className="px-2 py-1 bg-blue-600 text-white rounded text-xs">
            Attendee
          </span>
        )}
        {isRecording && (
          <span className="px-2 py-1 bg-red-600 text-white rounded text-xs animate-pulse">
            Recording
          </span>
        )}
      </div>
    </div>
  );
};

export default ControlBar;
