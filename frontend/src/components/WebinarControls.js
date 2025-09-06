import React, { useState } from 'react';
import {
  MicrophoneIcon,
  VideoCameraIcon,
  UserGroupIcon,
  HandRaisedIcon,
  NoSymbolIcon,
  ShieldExclamationIcon,
  StarIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';

const WebinarControls = ({ 
  participants = [], 
  isHost = false, 
  currentUserId,
  onMuteParticipant,
  onUnmuteParticipant,
  onRemoveParticipant,
  onBlockUser,
  onSuspendUser,
  onMakeCoHost,
  onRemoveCoHost
}) => {
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [showSuspendDialog, setShowSuspendDialog] = useState(false);
  const [suspendDuration, setSuspendDuration] = useState(5);
  const [suspendReason, setSuspendReason] = useState('');

  if (!isHost) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold mb-4">Participants ({participants.length})</h3>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {participants.map((participant) => (
            <div key={participant.id || participant.userId} 
                 className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                  {(participant.userName || participant.name || 'U').charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium">{participant.userName || participant.name}</p>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    {participant.role === 'host' && <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">Host</span>}
                    {participant.role === 'co-host' && <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs">Co-Host</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`p-1 rounded-full ${participant.isAudioMuted ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                  <MicrophoneIcon className="h-4 w-4" />
                </div>
                <div className={`p-1 rounded-full ${participant.isVideoMuted ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                  <VideoCameraIcon className="h-4 w-4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b">
        <h3 className="text-lg font-semibold flex items-center space-x-2">
          <UserGroupIcon className="h-5 w-5" />
          <span>Webinar Controls ({participants.length} participants)</span>
        </h3>
      </div>

      <div className="p-4 space-y-4">
        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => participants.forEach(p => onMuteParticipant(p.id || p.userId))}
            className="flex items-center justify-center space-x-2 p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition duration-200"
          >
            <SpeakerXMarkIcon className="h-4 w-4" />
            <span className="text-sm">Mute All</span>
          </button>
          <button
            onClick={() => participants.forEach(p => onUnmuteParticipant(p.id || p.userId))}
            className="flex items-center justify-center space-x-2 p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition duration-200"
          >
            <SpeakerWaveIcon className="h-4 w-4" />
            <span className="text-sm">Unmute All</span>
          </button>
        </div>

        {/* Roles legend */}
        <div className="text-xs text-gray-600">
          <span className="mr-2">Roles:</span>
          <span className="mr-2">Host/Co-Host: full control</span>
          <span className="mr-2">Panelist: can present</span>
          <span>Attendee: view-only (unless allowed)</span>
        </div>

        {/* Participants List */}
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {participants.map((participant) => {
            const participantId = participant.id || participant.userId;
            const isCurrentUser = participantId === currentUserId;
            
            return (
              <div key={participantId} 
                   className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition duration-200">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {(participant.userName || participant.name || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium flex items-center space-x-2">
                      <span>{participant.userName || participant.name}</span>
                      {isCurrentUser && <span className="text-xs text-gray-500">(You)</span>}
                    </p>
                    <div className="flex items-center space-x-2 text-sm">
                      {participant.role === 'host' && 
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">Host</span>
                      }
                      {participant.role === 'co-host' && 
                        <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs">Co-Host</span>
                      }
                      {participant.isSuspended && 
                        <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs">Suspended</span>
                      }
                    </div>
                  </div>
                </div>

                {!isCurrentUser && (
                  <div className="flex items-center space-x-1">
                    {/* Audio/Video Status */}
                    <div className="flex items-center space-x-1 mr-2">
                      <button
                        onClick={() => participant.isAudioMuted ? onUnmuteParticipant(participantId) : onMuteParticipant(participantId)}
                        className={`p-1 rounded ${participant.isAudioMuted ? 'bg-red-100 text-red-600 hover:bg-red-200' : 'bg-green-100 text-green-600 hover:bg-green-200'}`}
                        title={participant.isAudioMuted ? 'Unmute' : 'Mute'}
                      >
                        <MicrophoneIcon className="h-4 w-4" />
                      </button>
                      <div className={`p-1 rounded ${participant.isVideoMuted ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                        {participant.isVideoMuted ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                      </div>
                    </div>

                    {/* Admin Actions */}
                    <div className="flex items-center space-x-1">
                      {participant.role !== 'co-host' && (
                        <button
                          onClick={() => onMakeCoHost(participantId)}
                          className="p-1 text-purple-600 hover:bg-purple-100 rounded"
                          title="Make Co-Host"
                        >
                          <StarIcon className="h-4 w-4" />
                        </button>
                      )}
                      
                      {participant.role === 'co-host' && (
                        <button
                          onClick={() => onRemoveCoHost(participantId)}
                          className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                          title="Remove Co-Host"
                        >
                          <StarIcon className="h-4 w-4 opacity-50" />
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setSelectedParticipant(participant);
                          setShowSuspendDialog(true);
                        }}
                        className="p-1 text-orange-600 hover:bg-orange-100 rounded"
                        title="Suspend User"
                      >
                        <ShieldExclamationIcon className="h-4 w-4" />
                      </button>

                      <button
                        onClick={() => onBlockUser(participantId, 'Blocked by admin')}
                        className="p-1 text-red-600 hover:bg-red-100 rounded"
                        title="Block User"
                      >
                        <NoSymbolIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {participants.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <UserGroupIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No participants in the webinar yet</p>
          </div>
        )}
      </div>

      {/* Suspend Dialog */}
      {showSuspendDialog && selectedParticipant && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Suspend User</h3>
            <p className="text-gray-600 mb-4">
              Suspend <strong>{selectedParticipant.userName || selectedParticipant.name}</strong> from the webinar?
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duration (minutes)
                </label>
                <select
                  value={suspendDuration}
                  onChange={(e) => setSuspendDuration(parseInt(e.target.value))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value={5}>5 minutes</option>
                  <option value={10}>10 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={60}>1 hour</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason (optional)
                </label>
                <input
                  type="text"
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                  placeholder="Enter reason for suspension"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowSuspendDialog(false);
                  setSelectedParticipant(null);
                  setSuspendReason('');
                }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition duration-200"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onSuspendUser(
                    selectedParticipant.id || selectedParticipant.userId, 
                    suspendDuration, 
                    suspendReason || 'Suspended by admin'
                  );
                  setShowSuspendDialog(false);
                  setSelectedParticipant(null);
                  setSuspendReason('');
                }}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition duration-200"
              >
                Suspend User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WebinarControls;

