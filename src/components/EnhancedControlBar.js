import React, { useState } from 'react';
import { useMedia } from '../context/MediaContext';
import { useReactions } from '../context/ReactionsContext';
import { useMeetingFeatures } from '../context/MeetingFeaturesContext';
import {
  MicrophoneIcon,
  VideoCameraIcon,
  ComputerDesktopIcon,
  ChatBubbleLeftIcon,
  UserGroupIcon,
  PhoneXMarkIcon,
  HandRaisedIcon,
  FaceSmileIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  CameraIcon,
  PencilSquareIcon,
  ChartBarIcon,
  PlayCircleIcon,
  StopIcon,
  PauseIcon
} from '@heroicons/react/24/outline';
import { VideoCameraSlashIcon } from '@heroicons/react/24/solid';

const EnhancedControlBar = ({ 
  onToggleChat, 
  onToggleParticipants, 
  onLeaveRoom,
  currentUserId,
  currentUserName,
  isHost = false 
}) => {
  const [showReactions, setShowReactions] = useState(false);
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  
  const { 
    isVideoEnabled, 
    isAudioEnabled, 
    isScreenSharing,
    toggleVideo, 
    toggleAudio, 
    startScreenShare,
    stopScreenShare 
  } = useMedia();

  const { availableReactions, sendReaction } = useReactions();
  
  const {
    raisedHands,
    raiseHand,
    lowerHand,
    recordingStatus,
    startRecording,
    pauseRecording,
    stopRecording,
    meetingMode,
    enableWebinarMode,
    disableWebinarMode
  } = useMeetingFeatures();

  const handleScreenShare = async () => {
    try {
      if (isScreenSharing) {
        stopScreenShare();
      } else {
        await startScreenShare();
      }
    } catch (error) {
      console.error('Screen share error:', error);
    }
  };

  const handleRaiseHand = () => {
    const isHandRaised = raisedHands.some(hand => hand.userId === currentUserId);
    if (isHandRaised) {
      lowerHand(currentUserId);
    } else {
      raiseHand(currentUserId, currentUserName);
    }
  };

  const handleReaction = (reactionId) => {
    sendReaction(reactionId, currentUserId, currentUserName);
    setShowReactions(false);
  };

  const handleRecording = () => {
    if (recordingStatus === 'stopped') {
      startRecording();
    } else if (recordingStatus === 'recording') {
      pauseRecording();
    } else {
      stopRecording();
    }
  };

  const isHandRaised = raisedHands.some(hand => hand.userId === currentUserId);

  const mainControls = [
    {
      icon: MicrophoneIcon,
      onClick: toggleAudio,
      active: isAudioEnabled,
      label: isAudioEnabled ? 'Mute' : 'Unmute',
      color: isAudioEnabled ? 'hover:bg-gray-600' : 'bg-red-600 hover:bg-red-700'
    },
    {
      icon: isVideoEnabled ? VideoCameraIcon : VideoCameraSlashIcon,
      onClick: toggleVideo,
      active: isVideoEnabled,
      label: isVideoEnabled ? 'Stop Video' : 'Start Video',
      color: isVideoEnabled ? 'hover:bg-gray-600' : 'bg-red-600 hover:bg-red-700'
    },
    {
      icon: ComputerDesktopIcon,
      onClick: handleScreenShare,
      active: isScreenSharing,
      label: isScreenSharing ? 'Stop Share' : 'Share Screen',
      color: isScreenSharing ? 'bg-blue-600 hover:bg-blue-700' : 'hover:bg-gray-600'
    }
  ];

  const secondaryControls = [
    {
      icon: HandRaisedIcon,
      onClick: handleRaiseHand,
      active: isHandRaised,
      label: isHandRaised ? 'Lower Hand' : 'Raise Hand',
      color: isHandRaised ? 'bg-yellow-600 hover:bg-yellow-700' : 'hover:bg-gray-600'
    },
    {
      icon: FaceSmileIcon,
      onClick: () => setShowReactions(!showReactions),
      active: showReactions,
      label: 'Reactions',
      color: 'hover:bg-gray-600'
    },
    {
      icon: ChatBubbleLeftIcon,
      onClick: onToggleChat,
      active: false,
      label: 'Chat',
      color: 'hover:bg-gray-600'
    },
    {
      icon: UserGroupIcon,
      onClick: onToggleParticipants,
      active: false,
      label: 'Participants',
      color: 'hover:bg-gray-600'
    }
  ];

  const hostControls = [
    {
      icon: recordingStatus === 'recording' ? PauseIcon : recordingStatus === 'paused' ? PlayCircleIcon : PlayCircleIcon,
      onClick: handleRecording,
      active: recordingStatus !== 'stopped',
      label: recordingStatus === 'recording' ? 'Pause Recording' : recordingStatus === 'paused' ? 'Resume Recording' : 'Start Recording',
      color: recordingStatus === 'recording' ? 'bg-red-600 hover:bg-red-700' : recordingStatus === 'paused' ? 'bg-yellow-600 hover:bg-yellow-700' : 'hover:bg-gray-600'
    },
    {
      icon: ChartBarIcon,
      onClick: () => setShowMoreOptions(!showMoreOptions),
      active: false,
      label: 'More Options',
      color: 'hover:bg-gray-600'
    }
  ];

  return (
    <div className="relative">
      {/* Reactions Panel */}
      {showReactions && (
        <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg p-3 border">
          <div className="grid grid-cols-5 gap-2">
            {availableReactions.map((reaction) => (
              <button
                key={reaction.id}
                onClick={() => handleReaction(reaction.id)}
                className="p-2 hover:bg-gray-100 rounded-lg transition duration-200 text-2xl"
                title={reaction.label}
              >
                {reaction.emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* More Options Panel */}
      {showMoreOptions && isHost && (
        <div className="absolute bottom-16 right-0 bg-white rounded-lg shadow-lg p-4 border min-w-48">
          <div className="space-y-2">
            <button
              onClick={() => meetingMode === 'meeting' ? enableWebinarMode() : disableWebinarMode()}
              className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-lg transition duration-200"
            >
              {meetingMode === 'meeting' ? 'Enable Webinar Mode' : 'Disable Webinar Mode'}
            </button>
            <button
              onClick={() => {/* Add whiteboard functionality */}}
              className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-lg transition duration-200"
            >
              <PencilSquareIcon className="h-4 w-4 inline mr-2" />
              Whiteboard
            </button>
            <button
              onClick={() => {/* Add polls functionality */}}
              className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-lg transition duration-200"
            >
              <ChartBarIcon className="h-4 w-4 inline mr-2" />
              Create Poll
            </button>
            <button
              onClick={() => {/* Add breakout rooms functionality */}}
              className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-lg transition duration-200"
            >
              <UserGroupIcon className="h-4 w-4 inline mr-2" />
              Breakout Rooms
            </button>
          </div>
        </div>
      )}

      {/* Main Control Bar */}
      <div className="flex items-center space-x-2 bg-gray-800 rounded-lg p-2">
        {/* Main Controls */}
        {mainControls.map((button, index) => {
          const Icon = button.icon;
          return (
            <button
              key={index}
              onClick={button.onClick}
              className={`p-3 rounded-lg transition duration-200 text-white ${button.color || 'hover:bg-gray-600'}`}
              title={button.label}
            >
              <Icon className="h-5 w-5" />
            </button>
          );
        })}

        <div className="w-px h-8 bg-gray-600 mx-2"></div>

        {/* Secondary Controls */}
        {secondaryControls.map((button, index) => {
          const Icon = button.icon;
          return (
            <button
              key={index}
              onClick={button.onClick}
              className={`p-3 rounded-lg transition duration-200 text-white ${button.color || 'hover:bg-gray-600'}`}
              title={button.label}
            >
              <Icon className="h-5 w-5" />
            </button>
          );
        })}

        {/* Host Controls */}
        {isHost && (
          <>
            <div className="w-px h-8 bg-gray-600 mx-2"></div>
            {hostControls.map((button, index) => {
              const Icon = button.icon;
              return (
                <button
                  key={index}
                  onClick={button.onClick}
                  className={`p-3 rounded-lg transition duration-200 text-white ${button.color || 'hover:bg-gray-600'}`}
                  title={button.label}
                >
                  <Icon className="h-5 w-5" />
                </button>
              );
            })}
          </>
        )}

        {/* Leave Room Button */}
        <div className="ml-4 border-l border-gray-600 pl-4">
          <button
            onClick={onLeaveRoom}
            className="p-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition duration-200"
            title="Leave Room"
          >
            <PhoneXMarkIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Recording Indicator */}
      {recordingStatus === 'recording' && (
        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-3 py-1 rounded-full text-sm flex items-center space-x-1">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          <span>Recording</span>
        </div>
      )}

      {/* Webinar Mode Indicator */}
      {meetingMode === 'webinar' && (
        <div className="absolute -top-8 right-0 bg-purple-600 text-white px-3 py-1 rounded-full text-sm">
          Webinar Mode
        </div>
      )}
    </div>
  );
};

export default EnhancedControlBar;
