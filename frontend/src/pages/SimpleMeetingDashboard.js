import React, { useState } from 'react';
import { useSimpleMeeting } from '../context/SimpleMeetingContext';
import SimpleMeetingForm from '../components/SimpleMeetingForm';
import SimpleMeetingList from '../components/SimpleMeetingList';
import {
  PlusIcon,
  VideoCameraIcon,
  CalendarIcon,
  UserGroupIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

const SimpleMeetingDashboard = () => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const { meetings } = useSimpleMeeting();

  const activeMeetings = meetings.filter(m => m.status === 'active').length;
  const scheduledMeetings = meetings.filter(m => m.status === 'scheduled').length;
  const totalMeetings = meetings.length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Simple Meeting Manager</h1>
              <p className="text-gray-600 mt-1">Create and manage meetings easily</p>
            </div>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition duration-200 flex items-center space-x-2 shadow-lg"
            >
              <PlusIcon className="h-5 w-5" />
              <span className="font-semibold">Create Meeting</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <CalendarIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Meetings</p>
                <p className="text-2xl font-bold text-gray-900">{totalMeetings}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <VideoCameraIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Now</p>
                <p className="text-2xl font-bold text-gray-900">{activeMeetings}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <ClockIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Scheduled</p>
                <p className="text-2xl font-bold text-gray-900">{scheduledMeetings}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-orange-100 rounded-lg">
                <UserGroupIcon className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Max Capacity</p>
                <p className="text-2xl font-bold text-gray-900">
                  {meetings.reduce((sum, m) => sum + m.maxParticipants, 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => setShowCreateForm(true)}
              className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition duration-200 text-center"
            >
              <PlusIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="font-medium text-gray-900">Create New Meeting</p>
              <p className="text-sm text-gray-500">Schedule a meeting or webinar</p>
            </button>
            
            <button
              onClick={() => {
                const roomId = `instant-${Date.now()}`;
                window.open(`/join/${roomId}`, '_blank');
              }}
              className="p-4 border-2 border-green-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition duration-200 text-center bg-green-25"
            >
              <VideoCameraIcon className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="font-medium text-gray-900">Start Instant Meeting</p>
              <p className="text-sm text-gray-500">No scheduling required</p>
            </button>
            
            <button
              onClick={() => {
                const meetingId = prompt('Enter Meeting ID to join:');
                if (meetingId) {
                  window.open(`/join/${meetingId}`, '_blank');
                }
              }}
              className="p-4 border-2 border-blue-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition duration-200 text-center"
            >
              <UserGroupIcon className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <p className="font-medium text-gray-900">Join Meeting</p>
              <p className="text-sm text-gray-500">Enter meeting ID</p>
            </button>
          </div>
        </div>

        {/* Meeting List */}
        <SimpleMeetingList />
      </div>

      {/* Create Meeting Form */}
      <SimpleMeetingForm 
        isOpen={showCreateForm} 
        onClose={() => setShowCreateForm(false)} 
      />
    </div>
  );
};

export default SimpleMeetingDashboard;
