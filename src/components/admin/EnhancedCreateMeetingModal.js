import React, { useState } from 'react';
import {
  XMarkIcon,
  CalendarIcon,
  ClockIcon,
  UsersIcon,
  LockClosedIcon,
  ChatBubbleLeftRightIcon,
  VideoCameraIcon,
  ComputerDesktopIcon,
  DocumentTextIcon,
  ShieldCheckIcon,
  GlobeAltIcon,
  CogIcon
} from '@heroicons/react/24/outline';

const EnhancedCreateMeetingModal = ({ isOpen, onClose, onCreateMeeting }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    duration: 60,
    maxParticipants: 100,
    meetingType: 'meeting',
    template: '',
    timezone: 'GMT+5:30',
    
    // Security & Features
    requirePassword: false,
    password: '',
    waitingRoom: false,
    requireAuth: false,
    allowScreenShare: true,
    enableChat: true,
    enableRecording: false,
    autoRecord: false,
    
    // Advanced Settings
    muteOnEntry: false,
    videoOnEntry: true,
    allowBreakoutRooms: false,
    enableWhiteboard: false,
    enablePolls: false,
    enableReactions: true,
    
    // Webinar specific
    isWebinar: false,
    allowQA: true,
    moderatedQA: true,
    
    // Recurring
    isRecurring: false,
    recurringType: 'weekly',
    recurringEnd: '',
    
    // Invitations
    inviteEmails: '',
    sendInvites: true,
    
    // Meeting ID
    meetingIdType: 'auto', // auto or personal
    personalMeetingId: ''
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onCreateMeeting(formData);
    onClose();
  };

  const templates = [
    { id: '', name: 'Select a template' },
    { id: 'team-meeting', name: 'Team Meeting' },
    { id: 'client-presentation', name: 'Client Presentation' },
    { id: 'webinar', name: 'Webinar' },
    { id: 'training-session', name: 'Training Session' },
    { id: 'interview', name: 'Interview' },
    { id: 'all-hands', name: 'All Hands Meeting' }
  ];

  const timezones = [
    'GMT+5:30 Mumbai, Kolkata, New Delhi',
    'GMT-8:00 Pacific Time (US & Canada)',
    'GMT-5:00 Eastern Time (US & Canada)',
    'GMT+0:00 Greenwich Mean Time',
    'GMT+1:00 Central European Time'
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
              <CalendarIcon className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white">Schedule New Meeting</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition duration-200"
          >
            <XMarkIcon className="h-6 w-6 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="flex">
          {/* Left Sidebar - Navigation */}
          <div className="w-64 bg-gray-50 border-r border-gray-200 p-4">
            <nav className="space-y-2">
              {[
                { id: 'details', name: 'Meeting Details', icon: DocumentTextIcon, color: 'blue' },
                { id: 'settings', name: 'Meeting Settings', icon: CogIcon, color: 'purple' },
                { id: 'security', name: 'Security & Features', icon: ShieldCheckIcon, color: 'green' },
                { id: 'advanced', name: 'Advanced Options', icon: GlobeAltIcon, color: 'orange' }
              ].map((section) => {
                const Icon = section.icon;
                return (
                  <div key={section.id} className="flex items-center space-x-3 p-3 rounded-lg bg-white shadow-sm border border-gray-100">
                    <Icon className={`h-5 w-5 text-${section.color}-600`} />
                    <span className="text-sm font-medium text-gray-700">{section.name}</span>
                  </div>
                );
              })}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-6 overflow-y-auto max-h-[75vh]">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Meeting Details Section */}
              <div className="space-y-6">
                <div className="flex items-center space-x-3 mb-4">
                  <DocumentTextIcon className="h-6 w-6 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Meeting Details</h3>
                </div>

                {/* Meeting Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Meeting Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Enter meeting title"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Meeting description (optional)"
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>

                {/* Date and Time */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        value={formData.date}
                        onChange={(e) => handleInputChange('date', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                      <CalendarIcon className="absolute right-3 top-3 h-5 w-5 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Time <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="time"
                        value={formData.time}
                        onChange={(e) => handleInputChange('time', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                      <ClockIcon className="absolute right-3 top-3 h-5 w-5 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Timezone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Time Zone</label>
                  <select
                    value={formData.timezone}
                    onChange={(e) => handleInputChange('timezone', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {timezones.map((tz, index) => (
                      <option key={index} value={tz}>{tz}</option>
                    ))}
                  </select>
                </div>

                {/* Duration and Participants */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Duration (minutes)</label>
                    <select
                      value={formData.duration}
                      onChange={(e) => handleInputChange('duration', parseInt(e.target.value))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value={30}>30 minutes</option>
                      <option value={60}>1 hour</option>
                      <option value={90}>1 hour 30 minutes</option>
                      <option value={120}>2 hours</option>
                      <option value={180}>3 hours</option>
                      <option value={240}>4 hours</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Max Participants</label>
                    <select
                      value={formData.maxParticipants}
                      onChange={(e) => handleInputChange('maxParticipants', parseInt(e.target.value))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value={10}>10 participants</option>
                      <option value={25}>25 participants</option>
                      <option value={50}>50 participants</option>
                      <option value={100}>100 participants</option>
                      <option value={500}>500 participants</option>
                      <option value={1000}>1,000 participants</option>
                      <option value={10000}>10,000 participants</option>
                    </select>
                  </div>
                </div>

                {/* Meeting Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Meeting Type</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => handleInputChange('meetingType', 'meeting')}
                      className={`p-4 border-2 rounded-xl flex items-center space-x-3 transition duration-200 ${
                        formData.meetingType === 'meeting'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <VideoCameraIcon className="h-6 w-6" />
                      <div className="text-left">
                        <p className="font-medium">Meeting</p>
                        <p className="text-sm text-gray-500">Interactive meeting</p>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInputChange('meetingType', 'webinar')}
                      className={`p-4 border-2 rounded-xl flex items-center space-x-3 transition duration-200 ${
                        formData.meetingType === 'webinar'
                          ? 'border-purple-500 bg-purple-50 text-purple-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <ComputerDesktopIcon className="h-6 w-6" />
                      <div className="text-left">
                        <p className="font-medium">Webinar</p>
                        <p className="text-sm text-gray-500">Presentation mode</p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Template */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Template</label>
                  <select
                    value={formData.template}
                    onChange={(e) => handleInputChange('template', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {templates.map(template => (
                      <option key={template.id} value={template.id}>{template.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Security & Features Section */}
              <div className="border-t border-gray-200 pt-8">
                <div className="flex items-center space-x-3 mb-6">
                  <ShieldCheckIcon className="h-6 w-6 text-green-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Security & Features</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Security Options */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center space-x-3">
                        <LockClosedIcon className="h-5 w-5 text-gray-600" />
                        <div>
                          <p className="font-medium text-gray-900">Require password to join</p>
                          <p className="text-sm text-gray-500">Only users with passcode can join the meeting</p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={formData.requirePassword}
                        onChange={(e) => handleInputChange('requirePassword', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </div>

                    {formData.requirePassword && (
                      <div className="ml-8">
                        <input
                          type="text"
                          value={formData.password}
                          onChange={(e) => handleInputChange('password', e.target.value)}
                          placeholder="Enter passcode"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    )}

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center space-x-3">
                        <UsersIcon className="h-5 w-5 text-gray-600" />
                        <div>
                          <p className="font-medium text-gray-900">Waiting Room</p>
                          <p className="text-sm text-gray-500">Only users admitted by the host can join the meeting</p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={formData.waitingRoom}
                        onChange={(e) => handleInputChange('waitingRoom', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center space-x-3">
                        <ShieldCheckIcon className="h-5 w-5 text-gray-600" />
                        <div>
                          <p className="font-medium text-gray-900">Require authentication to join</p>
                          <p className="text-sm text-gray-500">Only authenticated users can join</p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={formData.requireAuth}
                        onChange={(e) => handleInputChange('requireAuth', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </div>
                  </div>

                  {/* Feature Options */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center space-x-3">
                        <ComputerDesktopIcon className="h-5 w-5 text-gray-600" />
                        <div>
                          <p className="font-medium text-gray-900">Allow screen sharing</p>
                          <p className="text-sm text-gray-500">Participants can share their screen</p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={formData.allowScreenShare}
                        onChange={(e) => handleInputChange('allowScreenShare', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center space-x-3">
                        <ChatBubbleLeftRightIcon className="h-5 w-5 text-gray-600" />
                        <div>
                          <p className="font-medium text-gray-900">Enable chat</p>
                          <p className="text-sm text-gray-500">Allow participants to chat during meeting</p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={formData.enableChat}
                        onChange={(e) => handleInputChange('enableChat', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center space-x-3">
                        <VideoCameraIcon className="h-5 w-5 text-gray-600" />
                        <div>
                          <p className="font-medium text-gray-900">Enable reactions</p>
                          <p className="text-sm text-gray-500">Allow emoji reactions during meeting</p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={formData.enableReactions}
                        onChange={(e) => handleInputChange('enableReactions', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Meeting ID Section */}
              <div className="border-t border-gray-200 pt-8">
                <div className="flex items-center space-x-3 mb-6">
                  <CogIcon className="h-6 w-6 text-orange-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Meeting ID</h3>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <input
                      type="radio"
                      id="auto-id"
                      checked={formData.meetingIdType === 'auto'}
                      onChange={() => handleInputChange('meetingIdType', 'auto')}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <label htmlFor="auto-id" className="flex-1">
                      <div className="font-medium text-gray-900">Generate Automatically</div>
                      <div className="text-sm text-gray-500">System will generate a unique meeting ID</div>
                    </label>
                  </div>

                  <div className="flex items-center space-x-4">
                    <input
                      type="radio"
                      id="personal-id"
                      checked={formData.meetingIdType === 'personal'}
                      onChange={() => handleInputChange('meetingIdType', 'personal')}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <label htmlFor="personal-id" className="flex-1">
                      <div className="font-medium text-gray-900">Personal Meeting ID</div>
                      <div className="text-sm text-gray-500">Use your personal meeting ID: 070 387 7760</div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="border-t border-gray-200 pt-6 flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition duration-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition duration-200 font-semibold shadow-lg"
                >
                  Create Meeting
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedCreateMeetingModal;
