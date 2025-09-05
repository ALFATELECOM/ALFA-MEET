import React, { useState } from 'react';
import { useAdmin } from '../../context/AdminContext';
import {
  PlayIcon,
  StopIcon,
  PauseIcon,
  MicrophoneIcon,
  VideoCameraIcon,
  ComputerDesktopIcon,
  ChatBubbleLeftIcon,
  UserGroupIcon,
  BoltIcon,
  ChartBarIcon,
  CogIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon
} from '@heroicons/react/24/outline';

const AdvancedMeetingControls = ({ meeting, onUpdate }) => {
  const [isControlling, setIsControlling] = useState(false);
  const [aiModeEnabled, setAiModeEnabled] = useState(false);
  const [autoModerationEnabled, setAutoModerationEnabled] = useState(false);
  const { updateMeeting } = useAdmin();

  const handleStartMeeting = async () => {
    setIsControlling(true);
    try {
      const updates = {
        status: 'active',
        startedAt: new Date().toISOString(),
        actualStartTime: new Date().toISOString()
      };
      
      updateMeeting(meeting.id, updates);
      onUpdate?.(updates);
      
      // Emit socket event to notify all participants
      if (window.socket) {
        window.socket.emit('meeting-started', {
          meetingId: meeting.id,
          roomId: meeting.roomId
        });
      }
    } catch (error) {
      console.error('Error starting meeting:', error);
    } finally {
      setIsControlling(false);
    }
  };

  const handleStopMeeting = async () => {
    setIsControlling(true);
    try {
      const updates = {
        status: 'ended',
        endedAt: new Date().toISOString(),
        actualEndTime: new Date().toISOString()
      };
      
      updateMeeting(meeting.id, updates);
      onUpdate?.(updates);
      
      // Emit socket event to notify all participants
      if (window.socket) {
        window.socket.emit('meeting-ended', {
          meetingId: meeting.id,
          roomId: meeting.roomId
        });
      }
    } catch (error) {
      console.error('Error stopping meeting:', error);
    } finally {
      setIsControlling(false);
    }
  };

  const handleToggleWebinarMode = () => {
    const updates = {
      isWebinarMode: !meeting.isWebinarMode,
      modeChangedAt: new Date().toISOString()
    };
    
    updateMeeting(meeting.id, updates);
    onUpdate?.(updates);
    
    // Emit socket event
    if (window.socket) {
      window.socket.emit('webinar-mode-toggled', {
        meetingId: meeting.id,
        roomId: meeting.roomId,
        enabled: updates.isWebinarMode
      });
    }
  };

  const handleToggleAiMode = () => {
    setAiModeEnabled(!aiModeEnabled);
    const updates = {
      aiModeEnabled: !aiModeEnabled,
      aiModeChangedAt: new Date().toISOString(),
      features: {
        ...meeting.features,
        aiTranscription: !aiModeEnabled,
        aiSummary: !aiModeEnabled,
        aiModerationEnabled: !aiModeEnabled && autoModerationEnabled
      }
    };
    
    updateMeeting(meeting.id, updates);
    onUpdate?.(updates);
  };

  const handleBulkMuteAll = () => {
    if (window.socket) {
      window.socket.emit('bulk-mute-all', {
        meetingId: meeting.id,
        roomId: meeting.roomId
      });
    }
  };

  const handleBulkUnmuteAll = () => {
    if (window.socket) {
      window.socket.emit('bulk-unmute-all', {
        meetingId: meeting.id,
        roomId: meeting.roomId
      });
    }
  };

  const handleToggleChat = () => {
    const updates = {
      chatEnabled: !meeting.chatEnabled,
      chatToggledAt: new Date().toISOString()
    };
    
    updateMeeting(meeting.id, updates);
    onUpdate?.(updates);
    
    if (window.socket) {
      window.socket.emit('chat-toggled', {
        meetingId: meeting.id,
        roomId: meeting.roomId,
        enabled: updates.chatEnabled
      });
    }
  };

  const handleLockMeeting = () => {
    const updates = {
      isLocked: !meeting.isLocked,
      lockedAt: new Date().toISOString()
    };
    
    updateMeeting(meeting.id, updates);
    onUpdate?.(updates);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900">Advanced Meeting Controls</h3>
        <div className="flex items-center space-x-2">
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
            meeting.status === 'active' ? 'bg-green-100 text-green-800' :
            meeting.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {meeting.status?.toUpperCase() || 'SCHEDULED'}
          </div>
        </div>
      </div>

      {/* Main Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Start/Stop Meeting */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Meeting Control</label>
          <div className="flex space-x-2">
            {meeting.status !== 'active' ? (
              <button
                onClick={handleStartMeeting}
                disabled={isControlling}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-3 py-2 rounded-lg flex items-center justify-center space-x-1 transition duration-200"
              >
                <PlayIcon className="h-4 w-4" />
                <span className="text-xs">Start</span>
              </button>
            ) : (
              <button
                onClick={handleStopMeeting}
                disabled={isControlling}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-3 py-2 rounded-lg flex items-center justify-center space-x-1 transition duration-200"
              >
                <StopIcon className="h-4 w-4" />
                <span className="text-xs">End</span>
              </button>
            )}
          </div>
        </div>

        {/* Webinar Mode */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Mode Control</label>
          <button
            onClick={handleToggleWebinarMode}
            className={`w-full px-3 py-2 rounded-lg flex items-center justify-center space-x-1 transition duration-200 ${
              meeting.isWebinarMode 
                ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
            }`}
          >
            <ComputerDesktopIcon className="h-4 w-4" />
            <span className="text-xs">{meeting.isWebinarMode ? 'Webinar' : 'Meeting'}</span>
          </button>
        </div>

        {/* AI Mode */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">AI Features</label>
          <button
            onClick={handleToggleAiMode}
            className={`w-full px-3 py-2 rounded-lg flex items-center justify-center space-x-1 transition duration-200 ${
              aiModeEnabled 
                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
            }`}
          >
            <BoltIcon className="h-4 w-4" />
            <span className="text-xs">AI Mode</span>
          </button>
        </div>

        {/* Security */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Security</label>
          <button
            onClick={handleLockMeeting}
            className={`w-full px-3 py-2 rounded-lg flex items-center justify-center space-x-1 transition duration-200 ${
              meeting.isLocked 
                ? 'bg-red-600 hover:bg-red-700 text-white' 
                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
            }`}
          >
            <CogIcon className="h-4 w-4" />
            <span className="text-xs">{meeting.isLocked ? 'Locked' : 'Open'}</span>
          </button>
        </div>
      </div>

      {/* Participant Controls */}
      <div className="border-t pt-4 mb-6">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Participant Controls</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <button
            onClick={handleBulkMuteAll}
            className="bg-red-100 hover:bg-red-200 text-red-700 px-3 py-2 rounded-lg flex items-center justify-center space-x-1 transition duration-200"
          >
            <MicrophoneIcon className="h-4 w-4 opacity-50" />
            <span className="text-xs">Mute All</span>
          </button>
          <button
            onClick={handleBulkUnmuteAll}
            className="bg-green-100 hover:bg-green-200 text-green-700 px-3 py-2 rounded-lg flex items-center justify-center space-x-1 transition duration-200"
          >
            <MicrophoneIcon className="h-4 w-4" />
            <span className="text-xs">Unmute All</span>
          </button>
          <button
            onClick={handleToggleChat}
            className={`px-3 py-2 rounded-lg flex items-center justify-center space-x-1 transition duration-200 ${
              meeting.chatEnabled !== false
                ? 'bg-blue-100 hover:bg-blue-200 text-blue-700'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            <ChatBubbleLeftIcon className="h-4 w-4" />
            <span className="text-xs">Chat</span>
          </button>
          <button
            className="bg-purple-100 hover:bg-purple-200 text-purple-700 px-3 py-2 rounded-lg flex items-center justify-center space-x-1 transition duration-200"
            onClick={() => window.open(`/admin/reports/${meeting.id}`, '_blank')}
          >
            <ChartBarIcon className="h-4 w-4" />
            <span className="text-xs">Reports</span>
          </button>
        </div>
      </div>

      {/* AI Features Panel */}
      {aiModeEnabled && (
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3">AI Features Active</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="flex items-center space-x-2">
                <BoltIcon className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">Live Transcription</span>
              </div>
              <p className="text-xs text-blue-700 mt-1">Real-time speech-to-text</p>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="flex items-center space-x-2">
                <ChartBarIcon className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-900">Auto Summary</span>
              </div>
              <p className="text-xs text-green-700 mt-1">Meeting highlights & action items</p>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg">
              <div className="flex items-center space-x-2">
                <CogIcon className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium text-purple-900">Smart Moderation</span>
              </div>
              <p className="text-xs text-purple-700 mt-1">Auto-manage interruptions</p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="border-t pt-4 mt-4">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => window.open(`/room/${meeting.roomId}`, '_blank')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition duration-200"
          >
            Join Meeting
          </button>
          <button
            onClick={() => navigator.clipboard.writeText(`${window.location.origin}/join/${meeting.roomId}`)}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm transition duration-200"
          >
            Copy Link
          </button>
          <button
            onClick={() => window.open(`/admin/analytics/${meeting.id}`, '_blank')}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm transition duration-200"
          >
            View Analytics
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdvancedMeetingControls;
