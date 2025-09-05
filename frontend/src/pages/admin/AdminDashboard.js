import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '../../context/AdminContext';
import MeetingList from '../../components/admin/MeetingList';
import CreateMeetingModal from '../../components/admin/CreateMeetingModal';
import MeetingStats from '../../components/admin/MeetingStats';
import AdvancedMeetingControls from '../../components/admin/AdvancedMeetingControls';
import MeetingReports from '../../components/admin/MeetingReports';
import UserManagementPanel from '../../components/admin/UserManagementPanel';
import AdvancedAnalytics from '../../components/admin/AdvancedAnalytics';
import MeetingImageUpload from '../../components/admin/MeetingImageUpload';
import {
  PlusIcon,
  CalendarIcon,
  UsersIcon,
  ClockIcon,
  ArrowRightOnRectangleIcon,
  CogIcon,
  ChartBarIcon,
  BoltIcon,
  ComputerDesktopIcon
} from '@heroicons/react/24/outline';

const AdminDashboard = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const { adminUser, logout, meetings } = useAdmin();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: CalendarIcon },
    { id: 'meetings', name: 'Meetings', icon: UsersIcon },
    { id: 'controls', name: 'Live Controls', icon: CogIcon },
    { id: 'users', name: 'User Management', icon: UsersIcon },
    { id: 'reports', name: 'Reports', icon: ChartBarIcon },
    { id: 'analytics', name: 'AI Analytics', icon: BoltIcon },
    { id: 'settings', name: 'Settings', icon: ClockIcon }
  ];

  const activeMeetings = meetings.filter(m => m.status === 'active').length;
  const scheduledMeetings = meetings.filter(m => m.status === 'scheduled').length;
  const totalMeetings = meetings.length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <span className="text-sm text-gray-500">
                Welcome, {adminUser?.name}
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition duration-200"
              >
                <PlusIcon className="h-5 w-5" />
                <span>Create Meeting</span>
              </button>
              <button
                onClick={handleLogout}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition duration-200"
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <UsersIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Meetings</p>
                <p className="text-2xl font-bold text-gray-900">{activeMeetings}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <CalendarIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Scheduled</p>
                <p className="text-2xl font-bold text-gray-900">{scheduledMeetings}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <ClockIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Meetings</p>
                <p className="text-2xl font-bold text-gray-900">{totalMeetings}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                      activeTab === tab.id
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{tab.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <MeetingStats meetings={meetings} />
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Meetings</h3>
                  <MeetingList meetings={meetings.slice(0, 5)} showActions={false} />
                </div>
              </div>
            )}
            
            {activeTab === 'meetings' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">All Meetings</h3>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded text-sm flex items-center space-x-1"
                  >
                    <PlusIcon className="h-4 w-4" />
                    <span>New</span>
                  </button>
                </div>
                <MeetingList meetings={meetings} showActions={true} />
              </div>
            )}
            
            {activeTab === 'controls' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">Live Meeting Controls</h3>
                  <div className="flex items-center space-x-2">
                    <BoltIcon className="h-5 w-5 text-blue-600" />
                    <span className="text-sm text-blue-600 font-medium">AI Enhanced</span>
                  </div>
                </div>
                
                {meetings.filter(m => m.status === 'active').length > 0 ? (
                  <div className="space-y-6">
                    {meetings.filter(m => m.status === 'active').map(meeting => (
                      <AdvancedMeetingControls 
                        key={meeting.id} 
                        meeting={meeting}
                        onUpdate={(updates) => {
                          // Handle meeting updates
                          console.log('Meeting updated:', updates);
                        }}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <ComputerDesktopIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Meetings</h3>
                    <p className="text-gray-500 mb-4">Start a meeting to access live controls</p>
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                    >
                      Create Meeting
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'reports' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">Meeting Reports & Analytics</h3>
                </div>
                
                {meetings.length > 0 ? (
                  <div className="space-y-6">
                    {meetings.slice(0, 3).map(meeting => (
                      <div key={meeting.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900">{meeting.title}</h4>
                            <p className="text-sm text-gray-500">
                              {new Date(meeting.scheduledFor).toLocaleDateString()} • 
                              {meeting.status.charAt(0).toUpperCase() + meeting.status.slice(1)}
                            </p>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => window.open(`/admin/reports/${meeting.id}`, '_blank')}
                              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                            >
                              View Full Report
                            </button>
                          </div>
                        </div>
                        <MeetingReports meetingId={meeting.id} meetingData={meeting} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Reports Available</h3>
                    <p className="text-gray-500">Create and conduct meetings to generate reports</p>
                  </div>
                )}
              </div>
            )}
            
            {activeTab === 'users' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">User Management & Moderation</h3>
                  <div className="text-sm text-gray-500">
                    Advanced user controls and moderation tools
                  </div>
                </div>
                
                {meetings.filter(m => m.status === 'active').length > 0 ? (
                  <div className="space-y-6">
                    {meetings.filter(m => m.status === 'active').map(meeting => (
                      <UserManagementPanel
                        key={meeting.id}
                        participants={[]} // This will be populated from real-time data
                        onBlockUser={(userId, reason) => console.log('Block user:', userId, reason)}
                        onSuspendUser={(userId, duration, reason) => console.log('Suspend user:', userId, duration, reason)}
                        onAddCoHost={(userId) => console.log('Add co-host:', userId)}
                        onRemoveCoHost={(userId) => console.log('Remove co-host:', userId)}
                        currentUserId={adminUser?.id}
                        isHost={true}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <UsersIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Meetings</h3>
                    <p className="text-gray-500">User management tools will appear when meetings are active</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'analytics' && (
              <div>
                <AdvancedAnalytics meetings={meetings} />
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Meeting Configuration</h3>
                  <MeetingImageUpload
                    meeting={meetings[0]}
                    onImageUpdate={(imageData) => console.log('Image updated:', imageData)}
                  />
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Global Settings</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="text-sm font-medium text-gray-900">Admin-Only Meeting Start</h5>
                        <p className="text-xs text-gray-500">Only admins can start meetings and webinars</p>
                      </div>
                      <button className="bg-blue-600 text-white px-3 py-1 rounded text-sm">
                        Enabled
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="text-sm font-medium text-gray-900">Maximum Participants</h5>
                        <p className="text-xs text-gray-500">Global limit for all meetings</p>
                      </div>
                      <span className="text-sm font-medium text-gray-900">10,000</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="text-sm font-medium text-gray-900">AI Features</h5>
                        <p className="text-xs text-gray-500">Transcription, summary, and moderation</p>
                      </div>
                      <button className="bg-green-600 text-white px-3 py-1 rounded text-sm">
                        Active
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="text-sm font-medium text-gray-900">Mobile Optimization</h5>
                        <p className="text-xs text-gray-500">Touch-optimized interface for mobile browsers</p>
                      </div>
                      <button className="bg-green-600 text-white px-3 py-1 rounded text-sm">
                        Enabled
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Meeting Modal */}
      {showCreateModal && (
        <CreateMeetingModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => setShowCreateModal(false)}
        />
      )}
    </div>
  );
};

export default AdminDashboard;
