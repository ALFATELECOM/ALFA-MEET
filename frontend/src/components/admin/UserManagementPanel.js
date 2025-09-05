import React, { useState } from 'react';
import {
  UserIcon,
  ShieldExclamationIcon,
  NoSymbolIcon,
  ClockIcon,
  StarIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

const UserManagementPanel = ({ participants, onBlockUser, onSuspendUser, onAddCoHost, onRemoveCoHost, currentUserId, isHost }) => {
  const [selectedUser, setSelectedUser] = useState(null);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [blockReason, setBlockReason] = useState('');
  const [suspendReason, setSuspendReason] = useState('');
  const [suspendDuration, setSuspendDuration] = useState(15);

  const handleBlockUser = () => {
    if (selectedUser && blockReason.trim()) {
      onBlockUser(selectedUser.id, blockReason);
      setShowBlockModal(false);
      setBlockReason('');
      setSelectedUser(null);
    }
  };

  const handleSuspendUser = () => {
    if (selectedUser && suspendReason.trim()) {
      onSuspendUser(selectedUser.id, suspendDuration, suspendReason);
      setShowSuspendModal(false);
      setSuspendReason('');
      setSuspendDuration(15);
      setSelectedUser(null);
    }
  };

  const getUserEngagementLevel = (participant) => {
    const score = participant.engagementScore || 0;
    if (score >= 80) return { level: 'High', color: 'text-green-600', bg: 'bg-green-100' };
    if (score >= 60) return { level: 'Medium', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    return { level: 'Low', color: 'text-red-600', bg: 'bg-red-100' };
  };

  const getUserRole = (participant) => {
    if (participant.role === 'host') return { role: 'Host', icon: ShieldCheckIcon, color: 'text-blue-600' };
    if (participant.role === 'co-host') return { role: 'Co-Host', icon: StarIcon, color: 'text-purple-600' };
    return { role: 'Participant', icon: UserIcon, color: 'text-gray-600' };
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900">User Management</h3>
        <div className="text-sm text-gray-500">
          {participants.length} participants • Max: 10,000
        </div>
      </div>

      {/* Participants List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {participants.map((participant) => {
          const engagement = getUserEngagementLevel(participant);
          const roleInfo = getUserRole(participant);
          const RoleIcon = roleInfo.icon;
          
          return (
            <div
              key={participant.id}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition duration-200"
            >
              <div className="flex items-center space-x-4">
                {/* Avatar */}
                <div className="relative">
                  <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                    <span className="text-gray-700 font-medium">
                      {(participant.userName || participant.name || 'User').charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center ${roleInfo.color}`}>
                    <RoleIcon className="h-3 w-3" />
                  </div>
                </div>

                {/* User Info */}
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h4 className="text-sm font-semibold text-gray-900">
                      {participant.userName || participant.name || 'Anonymous User'}
                    </h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${engagement.bg} ${engagement.color}`}>
                      {engagement.level}
                    </span>
                  </div>
                  <div className="flex items-center space-x-4 mt-1">
                    <span className="text-xs text-gray-500">
                      Joined: {new Date(participant.joinedAt || Date.now()).toLocaleTimeString()}
                    </span>
                    <span className="text-xs text-gray-500">
                      Device: {participant.device || 'Unknown'}
                    </span>
                    <span className="text-xs text-gray-500">
                      Points: {participant.pointsEarned || 0}
                    </span>
                  </div>
                </div>

                {/* Status Indicators */}
                <div className="flex items-center space-x-2">
                  {participant.isAudioMuted && (
                    <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                      <span className="text-red-600 text-xs">🔇</span>
                    </div>
                  )}
                  {participant.isVideoMuted && (
                    <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                      <span className="text-red-600 text-xs">📹</span>
                    </div>
                  )}
                  {participant.isScreenSharing && (
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 text-xs">🖥️</span>
                    </div>
                  )}
                  {participant.isSuspended && (
                    <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center">
                      <ClockIcon className="h-3 w-3 text-yellow-600" />
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              {isHost && participant.id !== currentUserId && (
                <div className="flex items-center space-x-1 ml-4">
                  {participant.role !== 'co-host' ? (
                    <button
                      onClick={() => onAddCoHost(participant.id)}
                      className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition duration-200"
                      title="Promote to Co-Host"
                    >
                      <StarIcon className="h-4 w-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => onRemoveCoHost(participant.id)}
                      className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition duration-200"
                      title="Remove Co-Host"
                    >
                      <UserIcon className="h-4 w-4" />
                    </button>
                  )}

                  {!participant.isSuspended ? (
                    <button
                      onClick={() => {
                        setSelectedUser(participant);
                        setShowSuspendModal(true);
                      }}
                      className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition duration-200"
                      title="Suspend User"
                    >
                      <ClockIcon className="h-4 w-4" />
                    </button>
                  ) : (
                    <div className="p-2 text-yellow-600" title="User is suspended">
                      <ClockIcon className="h-4 w-4" />
                    </div>
                  )}

                  <button
                    onClick={() => {
                      setSelectedUser(participant);
                      setShowBlockModal(true);
                    }}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition duration-200"
                    title="Block User"
                  >
                    <NoSymbolIcon className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {participants.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <UserIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No participants in this meeting</p>
          </div>
        )}
      </div>

      {/* Block User Modal */}
      {showBlockModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <NoSymbolIcon className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Block User</h3>
                  <p className="text-sm text-gray-500">Block {selectedUser.userName || selectedUser.name}</p>
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for blocking
                </label>
                <textarea
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  placeholder="Enter reason for blocking this user..."
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <div className="flex items-center space-x-2">
                  <ExclamationTriangleIcon className="h-4 w-4 text-red-600" />
                  <span className="text-sm text-red-800 font-medium">Warning</span>
                </div>
                <p className="text-xs text-red-700 mt-1">
                  This user will be permanently removed from the meeting and cannot rejoin.
                </p>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowBlockModal(false);
                    setSelectedUser(null);
                    setBlockReason('');
                  }}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBlockUser}
                  disabled={!blockReason.trim()}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg transition duration-200"
                >
                  Block User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Suspend User Modal */}
      {showSuspendModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                  <ClockIcon className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Suspend User</h3>
                  <p className="text-sm text-gray-500">Temporarily suspend {selectedUser.userName || selectedUser.name}</p>
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Suspension Duration
                </label>
                <select
                  value={suspendDuration}
                  onChange={(e) => setSuspendDuration(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                >
                  <option value={5}>5 minutes</option>
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={60}>1 hour</option>
                  <option value={120}>2 hours</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for suspension
                </label>
                <textarea
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                  placeholder="Enter reason for suspending this user..."
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <div className="flex items-center space-x-2">
                  <ClockIcon className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm text-yellow-800 font-medium">Temporary Action</span>
                </div>
                <p className="text-xs text-yellow-700 mt-1">
                  User will be muted and restricted for {suspendDuration} minutes, then automatically restored.
                </p>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowSuspendModal(false);
                    setSelectedUser(null);
                    setSuspendReason('');
                  }}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSuspendUser}
                  disabled={!suspendReason.trim()}
                  className="flex-1 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-400 text-white rounded-lg transition duration-200"
                >
                  Suspend User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagementPanel;
