import React, { useState } from 'react';
import { useSimpleMeeting } from '../context/SimpleMeetingContext';
import {
  XMarkIcon,
  CalendarIcon,
  ClockIcon,
  VideoCameraIcon,
  ComputerDesktopIcon
} from '@heroicons/react/24/outline';

const SimpleMeetingForm = ({ isOpen, onClose }) => {
  const { createMeeting, loading } = useSimpleMeeting();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    time: '12:00',
    duration: 60,
    maxParticipants: 100,
    meetingType: 'meeting',
    requirePassword: false,
    password: '',
    waitingRoom: false,
    allowScreenShare: true,
    enableChat: true,
    enableReactions: true
  });

  const [showSuccess, setShowSuccess] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.title.trim()) {
      alert('Please enter a meeting title');
      return;
    }
    
    if (!formData.date) {
      alert('Please select a date');
      return;
    }
    
    if (!formData.time) {
      alert('Please select a time');
      return;
    }

    try {
      const newMeeting = createMeeting(formData);
      console.log('🎉 Meeting created in form:', newMeeting);
      
      // Show success message
      setShowSuccess(true);
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        time: '12:00',
        duration: 60,
        maxParticipants: 100,
        meetingType: 'meeting',
        requirePassword: false,
        password: '',
        waitingRoom: false,
        allowScreenShare: true,
        enableChat: true,
        enableReactions: true
      });
      
      // Close modal after 2 seconds
      setTimeout(() => {
        setShowSuccess(false);
        onClose();
      }, 2000);
      
    } catch (error) {
      console.error('Error creating meeting:', error);
      alert('Failed to create meeting. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
              <CalendarIcon className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white">Create New Meeting</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition duration-200"
          >
            <XMarkIcon className="h-6 w-6 text-white" />
          </button>
        </div>

        {/* Success Message */}
        {showSuccess && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 m-6 rounded-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">
                  Meeting created successfully! Closing...
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
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
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
              required
              autoFocus
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
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Time <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                value={formData.time}
                onChange={(e) => handleInputChange('time', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          {/* Duration and Participants */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Duration</label>
              <select
                value={formData.duration}
                onChange={(e) => handleInputChange('duration', parseInt(e.target.value))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={30}>30 minutes</option>
                <option value={60}>1 hour</option>
                <option value={90}>1 hour 30 minutes</option>
                <option value={120}>2 hours</option>
                <option value={180}>3 hours</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Max Participants</label>
              <select
                value={formData.maxParticipants}
                onChange={(e) => handleInputChange('maxParticipants', parseInt(e.target.value))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={10}>10 participants</option>
                <option value={25}>25 participants</option>
                <option value={50}>50 participants</option>
                <option value={100}>100 participants</option>
                <option value={500}>500 participants</option>
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
                className={`p-4 border-2 rounded-lg flex items-center space-x-3 transition duration-200 ${
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
                className={`p-4 border-2 rounded-lg flex items-center space-x-3 transition duration-200 ${
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

          {/* Security Options */}
          <div className="border-t border-gray-200 pt-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Security & Features</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium">Require password</span>
                <input
                  type="checkbox"
                  checked={formData.requirePassword}
                  onChange={(e) => handleInputChange('requirePassword', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium">Waiting room</span>
                <input
                  type="checkbox"
                  checked={formData.waitingRoom}
                  onChange={(e) => handleInputChange('waitingRoom', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium">Allow screen sharing</span>
                <input
                  type="checkbox"
                  checked={formData.allowScreenShare}
                  onChange={(e) => handleInputChange('allowScreenShare', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium">Enable chat</span>
                <input
                  type="checkbox"
                  checked={formData.enableChat}
                  onChange={(e) => handleInputChange('enableChat', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
            </div>

            {/* Password field */}
            {formData.requirePassword && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <input
                  type="text"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="Enter meeting password"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition duration-200 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition duration-200 font-semibold shadow-lg disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Meeting'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SimpleMeetingForm;

