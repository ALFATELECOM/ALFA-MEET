import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '../../context/AdminContext';
import {
  CalendarIcon,
  ClockIcon,
  UsersIcon,
  PlayIcon,
  StopIcon,
  TrashIcon,
  EyeIcon,
  LinkIcon
} from '@heroicons/react/24/outline';

const MeetingList = ({ meetings, showActions = true }) => {
  const { startMeeting, endMeeting, deleteMeeting, updateMeeting } = useAdmin();
  const navigate = useNavigate();

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  const getStatusBadge = (status) => {
    const badges = {
      scheduled: 'bg-blue-100 text-blue-800',
      active: 'bg-green-100 text-green-800',
      ended: 'bg-gray-100 text-gray-800'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badges[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const handleJoinMeeting = (meeting) => {
    navigate(`/join/${meeting.roomId}`);
  };

  const handleStartMeeting = (meetingId) => {
    startMeeting(meetingId);
  };

  const handleEndMeeting = (meetingId) => {
    endMeeting(meetingId);
  };

  const handleDeleteMeeting = (meetingId) => {
    if (window.confirm('Are you sure you want to delete this meeting?')) {
      deleteMeeting(meetingId);
    }
  };

  const handleEditMeeting = (meeting) => {
    const title = window.prompt('Update meeting title:', meeting.title);
    if (title === null) return;
    const description = window.prompt('Update description (optional):', meeting.description || '');
    if (description === null) return;
    const durationStr = window.prompt('Update duration (minutes):', String(meeting.duration || 60));
    const duration = parseInt(durationStr || '60');
    if (!Number.isFinite(duration) || duration <= 0) return alert('Invalid duration');
    updateMeeting(meeting.id, { title, description, duration });
  };

  const copyRoomLink = (roomId) => {
    const link = `${window.location.origin}/join/${roomId}`;
    navigator.clipboard.writeText(link);
    // You could add a toast notification here
    alert('Room link copied to clipboard!');
  };

  if (meetings.length === 0) {
    return (
      <div className="text-center py-12">
        <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No meetings found</h3>
        <p className="text-gray-500">Create your first meeting to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {meetings.map((meeting) => {
        const { date, time } = formatDateTime(meeting.scheduledFor);
        
        return (
          <div key={meeting.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition duration-200">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">{meeting.title}</h3>
                  {getStatusBadge(meeting.status)}
                </div>
                
                {meeting.description && (
                  <p className="text-gray-600 mb-3">{meeting.description}</p>
                )}
                
                <div className="flex items-center space-x-6 text-sm text-gray-500">
                  <div className="flex items-center space-x-1">
                    <CalendarIcon className="h-4 w-4" />
                    <span>{date}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <ClockIcon className="h-4 w-4" />
                    <span>{time} ({meeting.duration} min)</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <UsersIcon className="h-4 w-4" />
                    <span>Max {meeting.maxParticipants} participants</span>
                  </div>
                </div>

                <div className="mt-3 flex items-center space-x-4 text-xs text-gray-400">
                  <span>Room ID: {meeting.roomId}</span>
                  <span>Created by: {meeting.createdBy}</span>
                  <span>Created: {formatDateTime(meeting.createdAt).date}</span>
                </div>
              </div>

              {showActions && (
                <div className="flex items-center space-x-2 ml-4">
                  {meeting.status === 'scheduled' && (
                    <>
                      <button
                        onClick={() => handleStartMeeting(meeting.id)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition duration-200"
                        title="Start Meeting"
                      >
                        <PlayIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => copyRoomLink(meeting.roomId)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition duration-200"
                        title="Copy Room Link"
                      >
                        <LinkIcon className="h-5 w-5" />
                      </button>
                    </>
                  )}
                  
                  {meeting.status === 'active' && (
                    <>
                      <button
                        onClick={() => handleJoinMeeting(meeting)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition duration-200"
                        title="Join Meeting"
                      >
                        <EyeIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleEndMeeting(meeting.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition duration-200"
                        title="End Meeting"
                      >
                        <StopIcon className="h-5 w-5" />
                      </button>
                    </>
                  )}
                  
                  {meeting.status === 'ended' && (
                    <button
                      onClick={() => copyRoomLink(meeting.roomId)}
                      className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition duration-200"
                      title="Copy Room Link"
                    >
                      <LinkIcon className="h-5 w-5" />
                    </button>
                  )}

                  {/* Edit (always visible) */}
                  <button
                    onClick={() => handleEditMeeting(meeting)}
                    className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition duration-200"
                    title="Edit Meeting"
                  >
                    ✎
                  </button>
                  
                  <button
                    onClick={() => handleDeleteMeeting(meeting.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition duration-200"
                    title="Delete Meeting"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              )}
            </div>

            {/* Meeting Features */}
            <div className="mt-4 flex items-center space-x-4 text-xs">
              {meeting.requirePassword && (
                <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                  Password Protected
                </span>
              )}
              {meeting.allowScreenShare && (
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                  Screen Share
                </span>
              )}
              {meeting.allowChat && (
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  Chat Enabled
                </span>
              )}
              {meeting.isRecurring && (
                <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">
                  Recurring
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MeetingList;
