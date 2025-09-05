import React, { useState } from 'react';
import {
  PlayIcon,
  PauseIcon,
  StopIcon,
  MicrophoneIcon,
  VideoCameraIcon,
  ComputerDesktopIcon,
  ChatBubbleLeftIcon,
  UserGroupIcon,
  HandRaisedIcon,
  ShieldCheckIcon,
  CogIcon,
  ClockIcon,
  SignalIcon,
  EyeIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  LockClosedIcon,
  LockOpenIcon,
  BoltIcon,
  DocumentTextIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

const EnhancedMeetingControls = ({ 
  meeting, 
  participants = [], 
  onStartMeeting,
  onEndMeeting,
  onMuteAll,
  onUnmuteAll,
  onLockMeeting,
  onUnlockMeeting,
  onToggleRecording,
  onToggleWaitingRoom,
  onToggleChat,
  onToggleReactions,
  onGenerateReport
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [waitingRoomEnabled, setWaitingRoomEnabled] = useState(true);
  const [chatEnabled, setChatEnabled] = useState(true);
  const [reactionsEnabled, setReactionsEnabled] = useState(true);
  const [selectedParticipants, setSelectedParticipants] = useState([]);

  const meetingStats = {
    duration: '45:32',
    totalParticipants: participants.length,
    activeParticipants: participants.filter(p => p.status === 'active').length,
    mutedParticipants: participants.filter(p => p.isAudioMuted).length,
    handsRaised: participants.filter(p => p.handRaised).length,
    chatMessages: 127,
    reactions: 89,
    screenShares: participants.filter(p => p.isScreenSharing).length
  };

  const handleToggleRecording = () => {
    setIsRecording(!isRecording);
    onToggleRecording?.(!isRecording);
  };

  const handleLockMeeting = () => {
    setIsLocked(!isLocked);
    if (isLocked) {
      onUnlockMeeting?.();
    } else {
      onLockMeeting?.();
    }
  };

  const controlSections = [
    {
      title: 'Meeting Control',
      controls: [
        {
          icon: isRecording ? PauseIcon : PlayIcon,
          label: isRecording ? 'Stop Recording' : 'Start Recording',
          color: isRecording ? 'red' : 'green',
          action: handleToggleRecording,
          status: isRecording ? 'Recording...' : 'Not Recording'
        },
        {
          icon: isLocked ? LockClosedIcon : LockOpenIcon,
          label: isLocked ? 'Unlock Meeting' : 'Lock Meeting',
          color: isLocked ? 'red' : 'blue',
          action: handleLockMeeting,
          status: isLocked ? 'Locked' : 'Open'
        },
        {
          icon: StopIcon,
          label: 'End Meeting',
          color: 'red',
          action: onEndMeeting,
          status: 'Active',
          dangerous: true
        }
      ]
    },
    {
      title: 'Audio & Video',
      controls: [
        {
          icon: SpeakerXMarkIcon,
          label: 'Mute All',
          color: 'orange',
          action: onMuteAll,
          status: `${meetingStats.mutedParticipants}/${meetingStats.totalParticipants} muted`
        },
        {
          icon: SpeakerWaveIcon,
          label: 'Unmute All',
          color: 'green',
          action: onUnmuteAll,
          status: 'Allow unmute'
        },
        {
          icon: VideoCameraIcon,
          label: 'Video Settings',
          color: 'blue',
          action: () => console.log('Video settings'),
          status: 'HD Quality'
        }
      ]
    },
    {
      title: 'Features',
      controls: [
        {
          icon: ChatBubbleLeftIcon,
          label: chatEnabled ? 'Disable Chat' : 'Enable Chat',
          color: chatEnabled ? 'red' : 'green',
          action: () => {
            setChatEnabled(!chatEnabled);
            onToggleChat?.(!chatEnabled);
          },
          status: chatEnabled ? 'Enabled' : 'Disabled'
        },
        {
          icon: HandRaisedIcon,
          label: 'Raised Hands',
          color: 'yellow',
          action: () => console.log('Handle raised hands'),
          status: `${meetingStats.handsRaised} raised`,
          badge: meetingStats.handsRaised > 0 ? meetingStats.handsRaised : null
        },
        {
          icon: BoltIcon,
          label: reactionsEnabled ? 'Disable Reactions' : 'Enable Reactions',
          color: reactionsEnabled ? 'red' : 'green',
          action: () => {
            setReactionsEnabled(!reactionsEnabled);
            onToggleReactions?.(!reactionsEnabled);
          },
          status: reactionsEnabled ? 'Enabled' : 'Disabled'
        }
      ]
    },
    {
      title: 'Advanced',
      controls: [
        {
          icon: UserGroupIcon,
          label: 'Waiting Room',
          color: waitingRoomEnabled ? 'blue' : 'gray',
          action: () => {
            setWaitingRoomEnabled(!waitingRoomEnabled);
            onToggleWaitingRoom?.(!waitingRoomEnabled);
          },
          status: waitingRoomEnabled ? 'Enabled' : 'Disabled'
        },
        {
          icon: ComputerDesktopIcon,
          label: 'Screen Share',
          color: 'purple',
          action: () => console.log('Screen share settings'),
          status: `${meetingStats.screenShares} sharing`
        },
        {
          icon: ChartBarIcon,
          label: 'Generate Report',
          color: 'indigo',
          action: onGenerateReport,
          status: 'Export data'
        }
      ]
    }
  ];

  return (
    <div className="space-y-6">
      {/* Meeting Status Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg p-6 text-white">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">{meeting?.title || 'Live Meeting'}</h2>
            <p className="text-blue-100 mt-1">Meeting ID: {meeting?.id || 'MIKROTIK CONFIGURATION'}</p>
          </div>
          <div className="text-right">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-lg font-semibold">Live</span>
            </div>
            <p className="text-blue-100">Duration: {meetingStats.duration}</p>
          </div>
        </div>
        
        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-4 mt-6">
          <div className="bg-white bg-opacity-20 rounded-lg p-3 text-center">
            <UserGroupIcon className="h-6 w-6 mx-auto mb-1" />
            <p className="text-2xl font-bold">{meetingStats.totalParticipants}</p>
            <p className="text-xs text-blue-100">Participants</p>
          </div>
          <div className="bg-white bg-opacity-20 rounded-lg p-3 text-center">
            <ChatBubbleLeftIcon className="h-6 w-6 mx-auto mb-1" />
            <p className="text-2xl font-bold">{meetingStats.chatMessages}</p>
            <p className="text-xs text-blue-100">Messages</p>
          </div>
          <div className="bg-white bg-opacity-20 rounded-lg p-3 text-center">
            <HandRaisedIcon className="h-6 w-6 mx-auto mb-1" />
            <p className="text-2xl font-bold">{meetingStats.handsRaised}</p>
            <p className="text-xs text-blue-100">Hands Raised</p>
          </div>
          <div className="bg-white bg-opacity-20 rounded-lg p-3 text-center">
            <SignalIcon className="h-6 w-6 mx-auto mb-1" />
            <p className="text-2xl font-bold">{meetingStats.activeParticipants}</p>
            <p className="text-xs text-blue-100">Active</p>
          </div>
        </div>
      </div>

      {/* Control Sections */}
      {controlSections.map((section, sectionIndex) => (
        <div key={sectionIndex} className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <CogIcon className="h-5 w-5" />
            <span>{section.title}</span>
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {section.controls.map((control, controlIndex) => {
              const Icon = control.icon;
              return (
                <div key={controlIndex} className="relative">
                  <button
                    onClick={control.action}
                    className={`w-full p-4 rounded-lg border-2 transition duration-200 hover:shadow-md ${
                      control.dangerous
                        ? 'border-red-200 hover:border-red-300 bg-red-50 hover:bg-red-100'
                        : `border-${control.color}-200 hover:border-${control.color}-300 bg-${control.color}-50 hover:bg-${control.color}-100`
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${
                        control.dangerous
                          ? 'bg-red-100'
                          : `bg-${control.color}-100`
                      }`}>
                        <Icon className={`h-5 w-5 ${
                          control.dangerous
                            ? 'text-red-600'
                            : `text-${control.color}-600`
                        }`} />
                      </div>
                      <div className="flex-1 text-left">
                        <p className={`font-medium ${
                          control.dangerous
                            ? 'text-red-900'
                            : 'text-gray-900'
                        }`}>
                          {control.label}
                        </p>
                        <p className={`text-sm ${
                          control.dangerous
                            ? 'text-red-600'
                            : 'text-gray-600'
                        }`}>
                          {control.status}
                        </p>
                      </div>
                    </div>
                  </button>
                  
                  {control.badge && (
                    <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center">
                      {control.badge}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Participant Management */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
          <UserGroupIcon className="h-5 w-5" />
          <span>Participant Management</span>
        </h3>
        
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {participants.slice(0, 10).map((participant, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition duration-200">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                  {(participant.name || 'U').charAt(0)}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{participant.name || 'Unknown User'}</p>
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    {participant.isHost && <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">Host</span>}
                    {participant.isCoHost && <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full">Co-Host</span>}
                    {participant.handRaised && <HandRaisedIcon className="h-4 w-4 text-yellow-500" />}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <div className={`p-1 rounded ${participant.isAudioMuted ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                  <MicrophoneIcon className="h-4 w-4" />
                </div>
                <div className={`p-1 rounded ${participant.isVideoMuted ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                  <VideoCameraIcon className="h-4 w-4" />
                </div>
                {participant.isScreenSharing && (
                  <div className="p-1 rounded bg-blue-100 text-blue-600">
                    <ComputerDesktopIcon className="h-4 w-4" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {participants.length > 10 && (
          <div className="text-center mt-4">
            <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              View all {participants.length} participants
            </button>
          </div>
        )}
      </div>

      {/* Meeting Settings */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
          <CogIcon className="h-5 w-5" />
          <span>Meeting Settings</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Auto-admit participants</span>
              <button className={`relative inline-flex h-6 w-11 items-center rounded-full ${waitingRoomEnabled ? 'bg-blue-600' : 'bg-gray-300'}`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${waitingRoomEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Allow chat</span>
              <button className={`relative inline-flex h-6 w-11 items-center rounded-full ${chatEnabled ? 'bg-blue-600' : 'bg-gray-300'}`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${chatEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Allow reactions</span>
              <button className={`relative inline-flex h-6 w-11 items-center rounded-full ${reactionsEnabled ? 'bg-blue-600' : 'bg-gray-300'}`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${reactionsEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Recording quality</span>
              <select className="text-sm border border-gray-300 rounded px-2 py-1">
                <option>HD (720p)</option>
                <option>Full HD (1080p)</option>
                <option>4K</option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Max participants</span>
              <span className="text-sm font-medium text-gray-900">10,000</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Meeting duration</span>
              <span className="text-sm font-medium text-gray-900">Unlimited</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedMeetingControls;
