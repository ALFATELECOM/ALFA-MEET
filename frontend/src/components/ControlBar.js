import React from 'react';
import { useMedia } from '../context/MediaContext';
import {
  MicrophoneIcon,
  VideoCameraIcon,
  ComputerDesktopIcon,
  ChatBubbleLeftIcon,
  UserGroupIcon,
  PhoneXMarkIcon,
  HandRaisedIcon,
  FaceSmileIcon
} from '@heroicons/react/24/outline';
import { VideoCameraSlashIcon } from '@heroicons/react/24/solid';

const ControlBar = ({ onToggleChat, onToggleParticipants, onLeaveRoom }) => {
  const { 
    isVideoEnabled, 
    isAudioEnabled, 
    isScreenSharing,
    toggleVideo, 
    toggleAudio, 
    startScreenShare,
    stopScreenShare,
    availableAudioInputs,
    availableVideoInputs,
    enumerateDevices,
    setAudioInputDevice,
    setVideoInputDevice
  } = useMedia();

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

  React.useEffect(() => {
    enumerateDevices?.();
  }, [enumerateDevices]);

  const [showAudioMenu, setShowAudioMenu] = React.useState(false);
  const [showVideoMenu, setShowVideoMenu] = React.useState(false);
  const [showInfoMenu, setShowInfoMenu] = React.useState(false);

  const controlButtons = [
    {
      icon: MicrophoneIcon,
      onClick: toggleAudio,
      active: isAudioEnabled,
      label: isAudioEnabled ? 'Mute' : 'Unmute'
    },
    {
      icon: isVideoEnabled ? VideoCameraIcon : VideoCameraSlashIcon,
      onClick: toggleVideo,
      active: isVideoEnabled,
      label: isVideoEnabled ? 'Stop Video' : 'Start Video'
    },
    {
      icon: ComputerDesktopIcon,
      onClick: handleScreenShare,
      active: isScreenSharing,
      label: isScreenSharing ? 'Stop Share' : 'Share Screen'
    },
    {
      icon: ChatBubbleLeftIcon,
      onClick: onToggleChat,
      active: false,
      label: 'Chat'
    },
    {
      icon: UserGroupIcon,
      onClick: onToggleParticipants,
      active: false,
      label: 'Participants'
    },
    {
      icon: HandRaisedIcon,
      onClick: () => console.log('Raise hand (UI only)') ,
      active: false,
      label: 'Raise Hand'
    },
    {
      icon: FaceSmileIcon,
      onClick: () => console.log('Open reactions (UI only)'),
      active: false,
      label: 'Reactions'
    }
  ];

  return (
    <div className="flex items-center bg-gray-800 rounded-lg p-2 space-x-2 sm:space-x-2">
      {controlButtons.map((button, index) => {
        const Icon = button.icon;
        return (
          <button
            key={index}
            onClick={button.onClick}
            className={`p-3 rounded-lg transition duration-200 touch-target ${
              button.active === false 
                ? 'bg-gray-700 hover:bg-gray-600 text-white'
                : button.active
                ? 'bg-gray-700 hover:bg-gray-600 text-white'
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
            title={button.label}
          >
            <Icon className="h-5 w-5" />
          </button>
        );
      })}
      
      {/* Audio dropdown */}
      <div className="relative">
        <button onClick={() => setShowAudioMenu(v => !v)} className="px-2 text-xs text-gray-300">^</button>
        {showAudioMenu && (
          <div className="absolute bottom-12 left-0 bg-white rounded shadow-lg p-2 w-56 z-50">
            <div className="text-xs font-semibold text-gray-700 px-2 py-1">Select a microphone</div>
            <div className="max-h-48 overflow-auto text-sm">
              {availableAudioInputs?.map((d) => (
                <button key={d.deviceId} onClick={() => { setAudioInputDevice?.(d.deviceId); setShowAudioMenu(false); }} className="w-full text-left px-2 py-1 hover:bg-gray-100">
                  {d.label || 'Microphone'}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Video dropdown */}
      <div className="relative">
        <button onClick={() => setShowVideoMenu(v => !v)} className="px-2 text-xs text-gray-300">^</button>
        {showVideoMenu && (
          <div className="absolute bottom-12 left-0 bg-white rounded shadow-lg p-2 w-56 z-50">
            <div className="text-xs font-semibold text-gray-700 px-2 py-1">Select a camera</div>
            <div className="max-h-48 overflow-auto text-sm">
              {availableVideoInputs?.map((d) => (
                <button key={d.deviceId} onClick={() => { setVideoInputDevice?.(d.deviceId); setShowVideoMenu(false); }} className="w-full text-left px-2 py-1 hover:bg-gray-100">
                  {d.label || 'Camera'}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Device selectors */}
      <div className="ml-2 flex items-center space-x-2">
        {availableVideoInputs && availableVideoInputs.length > 0 && (
          <select
            onChange={(e) => setVideoInputDevice?.(e.target.value)}
            className="bg-gray-700 text-white text-xs rounded p-1"
            title="Select Camera"
          >
            {availableVideoInputs.map(d => (
              <option key={d.deviceId} value={d.deviceId}>{d.label || 'Camera'}</option>
            ))}
          </select>
        )}
        {availableAudioInputs && availableAudioInputs.length > 0 && (
          <select
            onChange={(e) => setAudioInputDevice?.(e.target.value)}
            className="bg-gray-700 text-white text-xs rounded p-1"
            title="Select Microphone"
          >
            {availableAudioInputs.map(d => (
              <option key={d.deviceId} value={d.deviceId}>{d.label || 'Microphone'}</option>
            ))}
          </select>
        )}
      </div>

      {/* Leave Room Button */}
      <div className="ml-4 border-l border-gray-600 pl-4 hidden xs:block sm:block">
        <button
          onClick={onLeaveRoom}
          className="p-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition duration-200"
          title="Leave Room"
        >
          <PhoneXMarkIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

export default ControlBar;
