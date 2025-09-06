import React from 'react';
import { useSimpleMeeting } from '../context/SimpleMeetingContext';
import {
  CalendarIcon,
  ClockIcon,
  UserGroupIcon,
  PlayIcon,
  PencilIcon,
  TrashIcon,
  DocumentDuplicateIcon,
  VideoCameraIcon,
  ComputerDesktopIcon
} from '@heroicons/react/24/outline';

const SimpleMeetingList = () => {
  const { meetings, startMeeting, deleteMeeting, clearAllMeetings } = useSimpleMeeting();

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    return new Date(`1970-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('Copied to clipboard!');
    });
  };

  const handleStartMeeting = (meeting) => {
    startMeeting(meeting.id);
    // Open meeting room in new tab
    const joinUrl = `/join/${meeting.roomId}`;
    window.open(joinUrl, '_blank');
  };

  const handleDeleteMeeting = (meeting) => {
    if (window.confirm(`Are you sure you want to delete "${meeting.title}"?`)) {
      deleteMeeting(meeting.id);
    }
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to delete ALL meetings? This cannot be undone.')) {
      clearAllMeetings();
    }
  };

  if (meetings.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8">
        <div className="text-center">
          <CalendarIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No meetings yet</h3>
          <p className="text-gray-500 mb-4">Create your first meeting to get started.</p>
          <div className="text-sm text-gray-400">
            <p>💡 Meetings will appear here once created</p>
            <p>📅 All meetings are saved automatically</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with actions */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Your Meetings ({meetings.length})</h2>
          <p className="text-gray-600 text-sm">All meetings are saved locally</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => window.location.reload()}
            className="px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition duration-200 text-sm"
          >
            🔄 Refresh
          </button>
          <button
            onClick={handleClearAll}
            className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition duration-200 text-sm"
          >
            🗑️ Clear All
          </button>
        </div>
      </div>

      {/* Meetings List */}
      <div className="space-y-4">
        {meetings.map((meeting) => (
          <div
            key={meeting.id}
            className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition duration-200"
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">{meeting.title}</h3>
                  <div className="flex items-center space-x-2">
                    {meeting.meetingType === 'webinar' ? (
                      <ComputerDesktopIcon className="h-5 w-5 text-purple-600" />
                    ) : (
                      <VideoCameraIcon className="h-5 w-5 text-blue-600" />
                    )}
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      meeting.meetingType === 'webinar'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {meeting.meetingType === 'webinar' ? 'Webinar' : 'Meeting'}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      meeting.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : meeting.status === 'ended'
                        ? 'bg-gray-100 text-gray-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {meeting.status}
                    </span>
                  </div>
                </div>
                
                {meeting.description && (
                  <p className="text-gray-600 text-sm mb-4">{meeting.description}</p>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-4">
                  <div className="flex items-center space-x-2">
                    <CalendarIcon className="h-4 w-4" />
                    <span>{formatDate(meeting.date)}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <ClockIcon className="h-4 w-4" />
                    <span>{formatTime(meeting.time)} ({meeting.duration} min)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <UserGroupIcon className="h-4 w-4" />
                    <span>Up to {meeting.maxParticipants} participants</span>
                  </div>
                </div>

                <div className="flex items-center space-x-6 text-sm">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">Meeting ID:</span>
                    <span className="font-mono bg-gray-100 px-2 py-1 rounded">{meeting.roomId}</span>
                    <button
                      onClick={() => copyToClipboard(meeting.roomId)}
                      className="text-blue-600 hover:text-blue-800 p-1"
                      title="Copy Meeting ID"
                    >
                      <DocumentDuplicateIcon className="h-4 w-4" />
                    </button>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">Join URL:</span>
                    <button
                      onClick={() => copyToClipboard(`${window.location.origin}/join/${meeting.roomId}`)}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Copy Link
                    </button>
                  </div>
                </div>

                {/* Meeting Features */}
                <div className="mt-4 flex flex-wrap gap-2">
                  {meeting.requirePassword && (
                    <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs">
                      🔒 Password Protected
                    </span>
                  )}
                  {meeting.waitingRoom && (
                    <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs">
                      ⏳ Waiting Room
                    </span>
                  )}
                  {meeting.allowScreenShare && (
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                      📺 Screen Share
                    </span>
                  )}
                  {meeting.enableChat && (
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                      💬 Chat
                    </span>
                  )}
                  {meeting.enableReactions && (
                    <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs">
                      😀 Reactions
                    </span>
                  )}
                </div>

                {/* Timestamps */}
                <div className="mt-4 text-xs text-gray-500">
                  <p>Created: {new Date(meeting.createdAt).toLocaleString()}</p>
                  {meeting.startedAt && (
                    <p>Started: {new Date(meeting.startedAt).toLocaleString()}</p>
                  )}
                  {meeting.endedAt && (
                    <p>Ended: {new Date(meeting.endedAt).toLocaleString()}</p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2 ml-4">
                <button
                  onClick={() => handleStartMeeting(meeting)}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition duration-200 flex items-center space-x-2"
                >
                  <PlayIcon className="h-4 w-4" />
                  <span>Start</span>
                </button>
                
                <button
                  onClick={() => copyToClipboard(`Join my meeting: ${window.location.origin}/join/${meeting.roomId}\nMeeting ID: ${meeting.roomId}`)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition duration-200 flex items-center space-x-2"
                >
                  <DocumentDuplicateIcon className="h-4 w-4" />
                  <span>Copy Invite</span>
                </button>
                
                <button
                  onClick={() => handleDeleteMeeting(meeting)}
                  className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition duration-200"
                  title="Delete Meeting"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Debug Info */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-semibold text-gray-900 mb-2">Debug Info:</h4>
        <div className="text-sm text-gray-600 space-y-1">
          <p>• Total meetings: {meetings.length}</p>
          <p>• Active meetings: {meetings.filter(m => m.status === 'active').length}</p>
          <p>• Scheduled meetings: {meetings.filter(m => m.status === 'scheduled').length}</p>
          <p>• Storage: localStorage (automatic save)</p>
          <p>• Last update: {new Date().toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
};

export default SimpleMeetingList;

