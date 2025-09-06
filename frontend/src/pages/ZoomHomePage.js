import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  VideoCameraIcon,
  CalendarIcon,
  ComputerDesktopIcon,
  PhoneIcon,
  UserGroupIcon,
  CogIcon,
  PlayIcon,
  ClockIcon,
  GlobeAltIcon,
  DevicePhoneMobileIcon,
  ChatBubbleLeftRightIcon,
  PresentationChartLineIcon,
  ShieldCheckIcon,
  PlusIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';

const ZoomHomePage = () => {
  const [roomId, setRoomId] = useState('');
  const [meetingType, setMeetingType] = useState('meeting');
  const navigate = useNavigate();

  const createMeeting = (type = 'meeting') => {
    const newRoomId = Math.random().toString(36).substring(2, 15);
    navigate(`/join/${newRoomId}`, { 
      state: { 
        meetingType: type,
        isHost: true 
      } 
    });
  };

  const joinMeeting = () => {
    if (roomId.trim()) {
      navigate(`/join/${roomId}`);
    }
  };

  const scheduleMeeting = () => {
    navigate('/admin/login', { state: { action: 'schedule' } });
  };

  const quickActions = [
    {
      icon: VideoCameraIcon,
      title: 'New Meeting',
      description: 'Start an instant meeting',
      color: 'orange',
      action: () => createMeeting('meeting'),
      mobile: true
    },
    {
      icon: PresentationChartLineIcon,
      title: 'New Webinar',
      description: 'Host a webinar session',
      color: 'purple',
      action: () => createMeeting('webinar'),
      mobile: true
    },
    {
      icon: CalendarIcon,
      title: 'Schedule',
      description: 'Schedule a future meeting',
      color: 'blue',
      action: scheduleMeeting,
      mobile: true
    },
    {
      icon: ComputerDesktopIcon,
      title: 'Screen Share',
      description: 'Share your screen only',
      color: 'green',
      action: () => createMeeting('screen-share'),
      mobile: false
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile-First Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3 sm:py-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <VideoCameraIcon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">ALFA MEET</h1>
                <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">Professional Video Conferencing</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/admin/login')}
              className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50 transition duration-200"
            >
              <ShieldCheckIcon className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Welcome Section */}
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-4">
            One platform to{' '}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              connect
            </span>
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
            Bring teams together with HD video, crystal-clear audio, and seamless screen sharing
          </p>
          
          {/* Mobile Browser Notice */}
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200 max-w-md mx-auto">
            <div className="flex items-center justify-center space-x-2">
              <DevicePhoneMobileIcon className="h-5 w-5 text-blue-600" />
              <GlobeAltIcon className="h-5 w-5 text-blue-600" />
            </div>
            <p className="text-sm text-blue-800 mt-1">
              <strong>Mobile Optimized:</strong> Join from any browser, no app needed!
            </p>
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8 sm:mb-12">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            // Hide desktop-only actions on mobile
            if (!action.mobile && window.innerWidth < 768) return null;
            
            return (
              <button
                key={index}
                onClick={action.action}
                className={`p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition duration-300 border-2 border-transparent hover:border-${action.color}-200 group`}
              >
                <div className={`w-12 h-12 bg-${action.color}-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-${action.color}-200 transition duration-300`}>
                  <Icon className={`h-6 w-6 text-${action.color}-600`} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{action.title}</h3>
                <p className="text-sm text-gray-600">{action.description}</p>
                <ArrowRightIcon className={`h-4 w-4 text-${action.color}-600 mt-3 group-hover:translate-x-1 transition duration-300`} />
              </button>
            );
          })}
        </div>

        {/* Join Meeting Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8 mb-8">
          <div className="text-center mb-6">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Join a Meeting</h3>
            <p className="text-gray-600">Enter a Meeting ID to join an existing meeting</p>
          </div>
          
          <div className="max-w-md mx-auto space-y-4">
            <input
              type="text"
              placeholder="Enter Meeting ID"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onKeyPress={(e) => e.key === 'Enter' && joinMeeting()}
            />
            <button
              onClick={joinMeeting}
              disabled={!roomId.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 flex items-center justify-center space-x-2 text-lg"
            >
              <UserGroupIcon className="h-5 w-5" />
              <span>Join Meeting</span>
            </button>
          </div>
        </div>

        {/* Features Grid - Mobile Optimized */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl">
            <VideoCameraIcon className="h-8 w-8 text-blue-600 mb-3" />
            <h4 className="font-semibold text-gray-900 mb-2">HD Video & Audio</h4>
            <p className="text-sm text-gray-600">Crystal clear video calls with advanced audio processing</p>
          </div>
          
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl">
            <ComputerDesktopIcon className="h-8 w-8 text-purple-600 mb-3" />
            <h4 className="font-semibold text-gray-900 mb-2">Screen Sharing</h4>
            <p className="text-sm text-gray-600">Share your screen with participants seamlessly</p>
          </div>
          
          <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl sm:col-span-2 lg:col-span-1">
            <ChatBubbleLeftRightIcon className="h-8 w-8 text-green-600 mb-3" />
            <h4 className="font-semibold text-gray-900 mb-2">Interactive Chat</h4>
            <p className="text-sm text-gray-600">Real-time messaging with emoji reactions</p>
          </div>
        </div>

        {/* Mobile-Specific Features */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-6 sm:p-8 text-white">
          <div className="flex items-center space-x-3 mb-4">
            <DevicePhoneMobileIcon className="h-8 w-8" />
            <h3 className="text-xl sm:text-2xl font-bold">Mobile Optimized Experience</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm sm:text-base">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <span>Touch-friendly controls</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <span>Responsive video layouts</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <span>Battery optimized</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <span>Works in any browser</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-sm text-gray-500">
            <p>&copy; 2024 ALFA MEET. Professional Video Conferencing Platform.</p>
            <p className="mt-1">Optimized for mobile browsers • No app required</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ZoomHomePage;

