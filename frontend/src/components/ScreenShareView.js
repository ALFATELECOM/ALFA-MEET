import React from 'react';
import { motion } from 'framer-motion';
import {
  ComputerDesktopIcon,
  UserIcon
} from '@heroicons/react/24/outline';

const ScreenShareView = ({ screenShareUser, participants, currentUserId }) => {
  const sharingParticipant = participants.find(p => p.id === screenShareUser);
  const otherParticipants = participants.filter(p => p.id !== screenShareUser);

  return (
    <div className="h-full flex">
      {/* Main Screen Share Area */}
      <div className="flex-1 bg-gray-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full h-full bg-gray-800 rounded-lg flex items-center justify-center"
        >
          {sharingParticipant ? (
            <div className="text-center">
              <ComputerDesktopIcon className="w-16 h-16 text-blue-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                {sharingParticipant.name} is sharing their screen
              </h3>
              <p className="text-gray-400">
                Screen sharing content will appear here
              </p>
            </div>
          ) : (
            <div className="text-center">
              <ComputerDesktopIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-400 mb-2">
                No screen sharing active
              </h3>
            </div>
          )}
        </motion.div>
      </div>

      {/* Participants Sidebar */}
      <div className="w-64 bg-gray-900 border-l border-gray-800 p-4">
        <h4 className="text-white font-semibold mb-4">Participants</h4>
        
        <div className="space-y-3">
          {otherParticipants.map((participant) => {
            const isLocal = participant.id === currentUserId;
            
            return (
              <motion.div
                key={participant.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-gray-800 rounded-lg p-3"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
                    {participant.name ? (
                      <span className="text-white font-medium">
                        {participant.name.charAt(0).toUpperCase()}
                      </span>
                    ) : (
                      <UserIcon className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">
                      {participant.name} {isLocal && '(You)'}
                    </p>
                    <div className="flex items-center space-x-1 mt-1">
                      {participant.role === 'host' && (
                        <span className="text-xs bg-blue-600 text-white px-1 rounded">
                          Host
                        </span>
                      )}
                      {participant.isAudioMuted && (
                        <span className="text-xs bg-red-600 text-white px-1 rounded">
                          Muted
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}

          {/* Screen Sharing Participant */}
          {sharingParticipant && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-green-900/30 border border-green-600 rounded-lg p-3"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                  <ComputerDesktopIcon className="w-5 h-5 text-white" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">
                    {sharingParticipant.name}
                    {sharingParticipant.id === currentUserId && ' (You)'}
                  </p>
                  <p className="text-green-400 text-xs">Sharing screen</p>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {otherParticipants.length === 0 && !sharingParticipant && (
          <div className="text-center text-gray-500 mt-8">
            <UserIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No other participants</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScreenShareView;
