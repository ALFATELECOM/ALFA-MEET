import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '../../context/AdminContext';
import MeetingList from '../../components/admin/MeetingList';
import CreateMeetingModal from '../../components/admin/CreateMeetingModal';
import EnhancedCreateMeetingModal from '../../components/admin/EnhancedCreateMeetingModal';
import MeetingStats from '../../components/admin/MeetingStats';
import AdvancedMeetingControls from '../../components/admin/AdvancedMeetingControls';
import EnhancedMeetingControls from '../../components/admin/EnhancedMeetingControls';
import MeetingReports from '../../components/admin/MeetingReports';
import UserManagementPanel from '../../components/admin/UserManagementPanel';
import AdvancedAnalytics from '../../components/admin/AdvancedAnalytics';
import MeetingImageUpload from '../../components/admin/MeetingImageUpload';
import RoleManagement from '../../components/admin/RoleManagement';
import {
  PlusIcon,
  CalendarIcon,
  UsersIcon,
  ClockIcon,
  ArrowRightOnRectangleIcon,
  CogIcon,
  ChartBarIcon,
  BoltIcon,
  ComputerDesktopIcon,
  HomeIcon,
  VideoCameraIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  AdjustmentsHorizontalIcon
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
    { id: 'meetings', name: 'Meetings', icon: ComputerDesktopIcon },
    { id: 'controls', name: 'Live Controls', icon: CogIcon },
    { id: 'users', name: 'User Management', icon: UsersIcon },
    { id: 'roles', name: 'Role Management', icon: BoltIcon },
    { id: 'reports', name: 'Reports', icon: ChartBarIcon },
    { id: 'analytics', name: 'AI Analytics', icon: BoltIcon },
    { id: 'settings', name: 'Settings', icon: ClockIcon }
  ];

  const activeMeetings = meetings.filter(m => m.status === 'active').length;
  const scheduledMeetings = meetings.filter(m => m.status === 'scheduled').length;
  const totalMeetings = meetings.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex">
      {/* Professional Sidebar Navigation */}
      <div className="w-64 bg-white shadow-xl border-r border-gray-200 flex flex-col">
        {/* Logo Section */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <ComputerDesktopIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                ALFA MEET
              </h1>
              <p className="text-xs text-gray-500">Admin Panel</p>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-4 space-y-2">
          {[
            { id: 'dashboard', name: 'Dashboard', icon: HomeIcon, color: 'blue' },
            { id: 'meetings', name: 'Meetings', icon: VideoCameraIcon, color: 'green' },
            { id: 'users', name: 'User Management', icon: UserGroupIcon, color: 'purple' },
            { id: 'analytics', name: 'Analytics', icon: ChartBarIcon, color: 'orange' },
            { id: 'controls', name: 'Live Controls', icon: CogIcon, color: 'red' },
            { id: 'roles', name: 'Role Management', icon: ShieldCheckIcon, color: 'indigo' },
            { id: 'settings', name: 'Settings', icon: AdjustmentsHorizontalIcon, color: 'pink' }
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition duration-200 text-left ${
                  isActive 
                    ? `bg-gradient-to-r from-${item.color}-100 to-${item.color}-50 text-${item.color}-700 shadow-md border border-${item.color}-200` 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? `text-${item.color}-600` : 'text-gray-400'}`} />
                <span className="font-medium">{item.name}</span>
                {isActive && (
                  <div className={`ml-auto w-2 h-2 bg-${item.color}-500 rounded-full`}></div>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Profile Section */}
        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-sm">
                {(adminUser?.name || 'Admin').charAt(0)}
              </span>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900 text-sm">{adminUser?.name || 'Admin User'}</p>
              <p className="text-xs text-gray-500">Administrator</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition duration-200"
              title="Logout"
            >
              <ArrowRightOnRectangleIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Header Bar */}
        <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 capitalize">
                {activeTab === 'dashboard' ? 'Dashboard Overview' : 
                 activeTab === 'meetings' ? 'Meeting Management' :
                 activeTab === 'users' ? 'User Management' :
                 activeTab === 'analytics' ? 'Analytics & Reports' :
                 activeTab === 'controls' ? 'Live Meeting Controls' :
                 activeTab === 'roles' ? 'Role & Permissions' : 'Settings'}
              </h2>
              <p className="text-gray-600 text-sm">
                {activeTab === 'dashboard' ? 'Monitor your platform performance' :
                 activeTab === 'meetings' ? 'Create and manage meetings & webinars' :
                 activeTab === 'users' ? 'Manage users and their permissions' :
                 activeTab === 'analytics' ? 'View detailed analytics and generate reports' :
                 activeTab === 'controls' ? 'Control active meetings in real-time' :
                 activeTab === 'roles' ? 'Configure roles and permission levels' : 'Platform configuration'}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-green-100 to-emerald-100 px-4 py-2 rounded-full border border-green-200">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-green-700 text-sm font-medium">System Online</span>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-2.5 rounded-xl flex items-center space-x-2 transition duration-200 shadow-lg hover:shadow-xl"
              >
                <PlusIcon className="h-5 w-5" />
                <span className="font-semibold">New Meeting</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          {/* Dashboard Stats Cards */}
          {(activeTab === 'dashboard' || activeTab === 'overview') && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl shadow-xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm font-medium">Active Meetings</p>
                    <p className="text-3xl font-bold">{activeMeetings}</p>
                    <p className="text-blue-200 text-xs mt-1">Currently running</p>
                  </div>
                  <div className="p-3 bg-white bg-opacity-20 rounded-xl">
                    <BoltIcon className="h-8 w-8" />
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl shadow-xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm font-medium">Scheduled</p>
                    <p className="text-3xl font-bold">{scheduledMeetings}</p>
                    <p className="text-green-200 text-xs mt-1">Upcoming sessions</p>
                  </div>
                  <div className="p-3 bg-white bg-opacity-20 rounded-xl">
                    <CalendarIcon className="h-8 w-8" />
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-2xl shadow-xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm font-medium">Total Meetings</p>
                    <p className="text-3xl font-bold">{totalMeetings}</p>
                    <p className="text-purple-200 text-xs mt-1">All time</p>
                  </div>
                  <div className="p-3 bg-white bg-opacity-20 rounded-xl">
                    <ClockIcon className="h-8 w-8" />
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl shadow-xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm font-medium">Total Users</p>
                    <p className="text-3xl font-bold">1,247</p>
                    <p className="text-orange-200 text-xs mt-1">+8% growth</p>
                  </div>
                  <div className="p-3 bg-white bg-opacity-20 rounded-xl">
                    <UsersIcon className="h-8 w-8" />
                  </div>
                </div>
              </div>
            </div>
          )}

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
                      <EnhancedMeetingControls
                        key={meeting.id}
                        meeting={meeting}
                        participants={[
                          // Mock participants for demo
                          { name: 'John Smith', isAudioMuted: false, isVideoMuted: false, isHost: true, handRaised: false },
                          { name: 'Sarah Johnson', isAudioMuted: true, isVideoMuted: false, isCoHost: true, handRaised: true },
                          { name: 'Mike Wilson', isAudioMuted: false, isVideoMuted: true, handRaised: false, isScreenSharing: true },
                          { name: 'Lisa Chen', isAudioMuted: true, isVideoMuted: true, handRaised: false }
                        ]}
                        onStartMeeting={() => console.log('Start meeting:', meeting.id)}
                        onEndMeeting={() => console.log('End meeting:', meeting.id)}
                        onMuteAll={() => console.log('Mute all:', meeting.id)}
                        onUnmuteAll={() => console.log('Unmute all:', meeting.id)}
                        onLockMeeting={() => console.log('Lock meeting:', meeting.id)}
                        onUnlockMeeting={() => console.log('Unlock meeting:', meeting.id)}
                        onToggleRecording={() => console.log('Toggle recording:', meeting.id)}
                        onToggleWaitingRoom={() => console.log('Toggle waiting room:', meeting.id)}
                        onToggleChat={() => console.log('Toggle chat:', meeting.id)}
                        onToggleReactions={() => console.log('Toggle reactions:', meeting.id)}
                        onGenerateReport={() => console.log('Generate report:', meeting.id)}
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

            {activeTab === 'roles' && (
              <div>
                <RoleManagement />
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
          <EnhancedCreateMeetingModal
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            onCreateMeeting={(meetingData) => {
              console.log('Creating meeting:', meetingData);
              setShowCreateModal(false);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
