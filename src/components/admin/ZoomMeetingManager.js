import React, { useState } from 'react';
import { useAdmin } from '../../context/AdminContext';
import {
  CalendarIcon,
  ClockIcon,
  UserGroupIcon,
  VideoCameraIcon,
  ComputerDesktopIcon,
  LinkIcon,
  CogIcon,
  PlusIcon,
  PlayIcon,
  PencilIcon,
  TrashIcon,
  DocumentDuplicateIcon,
  ShareIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

const ZoomMeetingManager = ({ onCreateMeeting }) => {
  const { adminUser, meetings, createMeeting, deleteMeeting, startMeeting } = useAdmin();
  const [activeTab, setActiveTab] = useState('upcoming');
  const [dateRange, setDateRange] = useState({
    start: new Date().toISOString().split('T')[0],
    end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });

  // Personal Room Configuration
  const personalRoom = {
    id: '070 387 7760',
    name: `${adminUser?.name || 'Admin'}'s Personal Meeting Room`,
    url: `https://alfa-meet.vercel.app/room/070-387-7760`,
    passcode: '••••••',
    waitingRoom: true,
    hostVideo: true,
    participantVideo: true,
    joinAnytime: true
  };

  const tabs = [
    { id: 'upcoming', name: 'Upcoming', count: meetings.filter(m => m.status === 'scheduled').length },
    { id: 'previous', name: 'Previous', count: meetings.filter(m => m.status === 'ended').length },
    { id: 'personal', name: 'Personal Room', count: 1 },
    { id: 'templates', name: 'Meeting Templates', count: 6 },
    { id: 'agendas', name: 'Meeting Agendas', count: 0 }
  ];

  const meetingTemplates = [
    {
      id: 'team-meeting',
      name: 'Team Meeting',
      description: 'Regular team sync with video, chat, and screen sharing',
      duration: 60,
      features: ['Video', 'Audio', 'Chat', 'Screen Share']
    },
    {
      id: 'client-presentation',
      name: 'Client Presentation',
      description: 'Professional presentation with waiting room and recording',
      duration: 90,
      features: ['Video', 'Audio', 'Screen Share', 'Recording', 'Waiting Room']
    },
    {
      id: 'webinar',
      name: 'Webinar',
      description: 'Large audience webinar with Q&A and polls',
      duration: 120,
      features: ['Webinar Mode', 'Q&A', 'Polls', 'Registration']
    },
    {
      id: 'training',
      name: 'Training Session',
      description: 'Interactive training with breakout rooms and whiteboard',
      duration: 180,
      features: ['Video', 'Audio', 'Breakout Rooms', 'Whiteboard', 'Recording']
    },
    {
      id: 'interview',
      name: 'Interview',
      description: 'One-on-one interview with recording and waiting room',
      duration: 45,
      features: ['Video', 'Audio', 'Recording', 'Waiting Room', 'Private Chat']
    },
    {
      id: 'all-hands',
      name: 'All Hands Meeting',
      description: 'Company-wide meeting with live streaming',
      duration: 90,
      features: ['Webinar Mode', 'Live Stream', 'Q&A', 'Recording']
    }
  ];

  const upcomingMeetings = meetings.filter(m => m.status === 'scheduled');
  const previousMeetings = meetings.filter(m => m.status === 'ended');

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
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  const renderUpcoming = () => (
    <div className="space-y-4">
      {upcomingMeetings.length === 0 ? (
        <div className="text-center py-12">
          <CalendarIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No upcoming meetings</h3>
          <p className="text-gray-500 mb-4">Schedule new and manage existing meetings all in one place.</p>
          <button
            onClick={onCreateMeeting}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition duration-200"
          >
            Schedule a Meeting
          </button>
        </div>
      ) : (
        upcomingMeetings.map((meeting) => (
          <div key={meeting.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition duration-200">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">{meeting.title}</h3>
                  {meeting.meetingType === 'webinar' && (
                    <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium">
                      Webinar
                    </span>
                  )}
                  {meeting.isRecurring && (
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                      Recurring
                    </span>
                  )}
                </div>
                
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

                {meeting.description && (
                  <p className="text-gray-600 text-sm mb-4">{meeting.description}</p>
                )}

                <div className="flex items-center space-x-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">Meeting ID:</span>
                    <span className="font-mono bg-gray-100 px-2 py-1 rounded">{meeting.roomId}</span>
                    <button
                      onClick={() => copyToClipboard(meeting.roomId)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <DocumentDuplicateIcon className="h-4 w-4" />
                    </button>
                  </div>
                  {meeting.requirePassword && (
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">Passcode:</span>
                      <span className="font-mono bg-gray-100 px-2 py-1 rounded">••••••</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2 ml-4">
                <button
                  onClick={() => startMeeting(meeting.id)}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition duration-200 flex items-center space-x-2"
                >
                  <PlayIcon className="h-4 w-4" />
                  <span>Start</span>
                </button>
                <button
                  onClick={() => copyToClipboard(`Join my meeting: https://alfa-meet.vercel.app/join/${meeting.roomId}`)}
                  className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition duration-200 flex items-center space-x-2"
                >
                  <DocumentDuplicateIcon className="h-4 w-4" />
                  <span>Copy Invitation</span>
                </button>
                <button className="text-gray-400 hover:text-gray-600 p-2">
                  <PencilIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => deleteMeeting(meeting.id)}
                  className="text-red-400 hover:text-red-600 p-2"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );

  const renderPersonalRoom = () => (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{personalRoom.name}</h3>
          <p className="text-gray-600">Use this personal room for instant meetings</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => window.open(`/join/${personalRoom.id.replace(/\s/g, '-')}`, '_blank')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition duration-200 flex items-center space-x-2"
          >
            <PlayIcon className="h-4 w-4" />
            <span>Start</span>
          </button>
          <button className="text-gray-400 hover:text-gray-600 p-2">
            <CogIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Topic</label>
            <p className="text-gray-900">{personalRoom.name}</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Meeting ID</label>
            <div className="flex items-center space-x-2">
              <span className="font-mono text-lg">{personalRoom.id}</span>
              <button
                onClick={() => copyToClipboard(personalRoom.id)}
                className="text-blue-600 hover:text-blue-800"
              >
                <DocumentDuplicateIcon className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Security</label>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Passcode</span>
                <div className="flex items-center space-x-2">
                  <span className="font-mono">{personalRoom.passcode}</span>
                  <button className="text-blue-600 hover:text-blue-800 text-sm">Show</button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Everyone goes into the waiting room</span>
                <input
                  type="checkbox"
                  checked={personalRoom.waitingRoom}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  readOnly
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Invite Link</label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={personalRoom.url}
                readOnly
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
              />
              <button
                onClick={() => copyToClipboard(personalRoom.url)}
                className="text-blue-600 hover:text-blue-800"
              >
                <DocumentDuplicateIcon className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Add to</label>
            <div className="flex space-x-2">
              <button className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 transition duration-200">
                Google Calendar
              </button>
              <button className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition duration-200">
                Outlook Calendar
              </button>
              <button className="bg-purple-500 text-white px-3 py-1 rounded text-sm hover:bg-purple-600 transition duration-200">
                Yahoo Calendar
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Video</label>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Host</span>
                <span className="text-sm text-green-600">on</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Participant</span>
                <span className="text-sm text-green-600">on</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Options</label>
            <p className="text-sm text-gray-600">Allow participants to join anytime</p>
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition duration-200">
          Start
        </button>
        <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition duration-200 flex items-center space-x-2">
          <DocumentDuplicateIcon className="h-4 w-4" />
          <span>Copy Invitation</span>
        </button>
        <button className="text-gray-600 hover:text-gray-800 px-4 py-2">
          Edit
        </button>
      </div>
    </div>
  );

  const renderTemplates = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {meetingTemplates.map((template) => (
        <div key={template.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition duration-200">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
            <ComputerDesktopIcon className="h-6 w-6 text-blue-600" />
          </div>
          
          <p className="text-gray-600 text-sm mb-4">{template.description}</p>
          
          <div className="flex items-center space-x-2 text-sm text-gray-500 mb-4">
            <ClockIcon className="h-4 w-4" />
            <span>{template.duration} minutes</span>
          </div>

          <div className="flex flex-wrap gap-1 mb-4">
            {template.features.map((feature) => (
              <span
                key={feature}
                className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium"
              >
                {feature}
              </span>
            ))}
          </div>

          <button className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition duration-200">
            Use Template
          </button>
        </div>
      ))}
    </div>
  );

  const renderPrevious = () => (
    <div className="space-y-4">
      {previousMeetings.length === 0 ? (
        <div className="text-center py-12">
          <ClockIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No previous meetings</h3>
          <p className="text-gray-500">Your completed meetings will appear here</p>
        </div>
      ) : (
        previousMeetings.map((meeting) => (
          <div key={meeting.id} className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{meeting.title}</h3>
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
                    <span>{meeting.participants?.length || 0} participants</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2 ml-4">
                <button className="text-gray-600 hover:text-gray-800 px-3 py-1 text-sm">
                  View Details
                </button>
                <button className="text-blue-600 hover:text-blue-800 px-3 py-1 text-sm">
                  Download Recording
                </button>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );

  return (
    <div className="bg-white rounded-lg shadow-sm">
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Meetings</h2>
          <button
            onClick={onCreateMeeting}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition duration-200 flex items-center space-x-2"
          >
            <PlusIcon className="h-4 w-4" />
            <span>Schedule a Meeting</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition duration-200 ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.name}
              {tab.count > 0 && (
                <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Date Range Filter (for Previous tab) */}
      {activeTab === 'previous' && (
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="px-3 py-1 border border-gray-300 rounded text-sm"
              />
              <span className="text-gray-500">to</span>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="px-3 py-1 border border-gray-300 rounded text-sm"
              />
            </div>
            <button className="text-blue-600 hover:text-blue-800 text-sm">
              Apply Filter
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-6">
        {activeTab === 'upcoming' && renderUpcoming()}
        {activeTab === 'previous' && renderPrevious()}
        {activeTab === 'personal' && renderPersonalRoom()}
        {activeTab === 'templates' && renderTemplates()}
        {activeTab === 'agendas' && (
          <div className="text-center py-12">
            <DocumentDuplicateIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Meeting Agendas</h3>
            <p className="text-gray-500">Create and manage meeting agendas</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ZoomMeetingManager;
