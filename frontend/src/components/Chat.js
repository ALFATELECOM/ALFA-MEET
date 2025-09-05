import React, { useState, useRef, useEffect } from 'react';
import { XMarkIcon, PaperAirplaneIcon, GiftIcon, StarIcon, TrophyIcon } from '@heroicons/react/24/outline';
import { useRewards } from '../context/RewardsContext';

const Chat = ({ messages, onSendMessage, onClose, currentUserId, currentUserName, roomId }) => {
  const [newMessage, setNewMessage] = useState('');
  const [showRewards, setShowRewards] = useState(false);
  const messagesEndRef = useRef(null);
  const { awardPoints, getUserPoints, getTopUsers } = useRewards();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim()) {
      onSendMessage(newMessage);
      
      // Award points for sending message
      if (currentUserId && currentUserName) {
        awardPoints(currentUserId, currentUserName, 20, 'Chat message', roomId);
      }
      
      setNewMessage('');
    }
  };

  const handleRewardMessage = (messageUserId, messageUserName) => {
    if (messageUserId && messageUserId !== currentUserId) {
      awardPoints(messageUserId, messageUserName, 50, 'Message reward', roomId);
      // You could add a toast notification here
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <h3 className="text-lg font-semibold text-gray-800">Chat</h3>
          <button
            onClick={() => setShowRewards(!showRewards)}
            className="p-1 hover:bg-gray-100 rounded-lg transition duration-200"
            title="Toggle Rewards"
          >
            <TrophyIcon className="h-5 w-5 text-yellow-500" />
          </button>
        </div>
        <div className="flex items-center space-x-2">
          {currentUserId && (
            <div className="flex items-center space-x-1 text-sm text-gray-600">
              <StarIcon className="h-4 w-4 text-yellow-500" />
              <span>{getUserPoints(currentUserId)} pts</span>
            </div>
          )}
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition duration-200"
          >
            <XMarkIcon className="h-5 w-5 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Rewards Panel */}
      {showRewards && (
        <div className="p-4 border-b border-gray-200 bg-yellow-50">
          <h4 className="text-sm font-semibold text-gray-800 mb-2">🏆 Top Contributors</h4>
          <div className="space-y-1">
            {getTopUsers(3).map((user, index) => (
              <div key={user.userId} className="flex items-center justify-between text-xs">
                <span className="flex items-center space-x-1">
                  <span className={index === 0 ? 'text-yellow-600' : index === 1 ? 'text-gray-600' : 'text-orange-600'}>
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                  </span>
                  <span>{user.userName}</span>
                </span>
                <span className="font-medium">{user.points} pts</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <p>No messages yet</p>
            <p className="text-sm">Start the conversation and earn 20 points per message!</p>
          </div>
        ) : (
          messages.map((message, index) => (
            <div key={index} className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-sm text-gray-700">
                    {message.userName}
                  </span>
                  <span className="text-xs text-gray-400">
                    {formatTime(message.timestamp)}
                  </span>
                  {message.userId && getUserPoints(message.userId) > 0 && (
                    <span className="text-xs text-yellow-600 flex items-center space-x-1">
                      <StarIcon className="h-3 w-3" />
                      <span>{getUserPoints(message.userId)}</span>
                    </span>
                  )}
                </div>
                {message.userId && message.userId !== currentUserId && (
                  <button
                    onClick={() => handleRewardMessage(message.userId, message.userName)}
                    className="p-1 hover:bg-yellow-100 rounded transition duration-200"
                    title="Reward this message (+50 points)"
                  >
                    <GiftIcon className="h-4 w-4 text-yellow-500" />
                  </button>
                )}
              </div>
              <div className="bg-gray-100 rounded-lg p-3 relative">
                <p className="text-gray-800">{message.message}</p>
                {message.isRewarded && (
                  <div className="absolute top-1 right-1">
                    <StarIcon className="h-3 w-3 text-yellow-500" />
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-gray-200">
        <form onSubmit={handleSendMessage} className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition duration-200"
          >
            <PaperAirplaneIcon className="h-5 w-5" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chat;
