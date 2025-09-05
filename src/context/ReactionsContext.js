import React, { createContext, useContext, useState, useEffect } from 'react';

const ReactionsContext = createContext();

export const useReactions = () => {
  const context = useContext(ReactionsContext);
  if (!context) {
    throw new Error('useReactions must be used within a ReactionsProvider');
  }
  return context;
};

export const ReactionsProvider = ({ children }) => {
  const [activeReactions, setActiveReactions] = useState([]);
  const [reactionCounts, setReactionCounts] = useState({});
  const [userReactions, setUserReactions] = useState({});

  // Available reactions
  const availableReactions = [
    { id: 'like', emoji: '👍', label: 'Like', color: 'text-blue-500' },
    { id: 'love', emoji: '❤️', label: 'Love', color: 'text-red-500' },
    { id: 'laugh', emoji: '😂', label: 'Laugh', color: 'text-yellow-500' },
    { id: 'wow', emoji: '😮', label: 'Wow', color: 'text-purple-500' },
    { id: 'sad', emoji: '😢', label: 'Sad', color: 'text-blue-400' },
    { id: 'angry', emoji: '😠', label: 'Angry', color: 'text-red-600' },
    { id: 'clap', emoji: '👏', label: 'Clap', color: 'text-green-500' },
    { id: 'fire', emoji: '🔥', label: 'Fire', color: 'text-orange-500' },
    { id: 'party', emoji: '🎉', label: 'Party', color: 'text-pink-500' },
    { id: 'thinking', emoji: '🤔', label: 'Thinking', color: 'text-gray-500' }
  ];

  // Clean up expired reactions
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setActiveReactions(prev => 
        prev.filter(reaction => now - reaction.timestamp < 5000) // Remove after 5 seconds
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const sendReaction = (reactionId, userId, userName) => {
    const reaction = availableReactions.find(r => r.id === reactionId);
    if (!reaction) return;

    const newReaction = {
      id: `reaction-${Date.now()}-${Math.random()}`,
      reactionId,
      emoji: reaction.emoji,
      userId,
      userName,
      timestamp: Date.now(),
      x: Math.random() * 80 + 10, // Random position (10-90%)
      y: Math.random() * 80 + 10
    };

    // Add to active reactions (for floating animation)
    setActiveReactions(prev => [...prev, newReaction]);

    // Update reaction counts
    setReactionCounts(prev => ({
      ...prev,
      [reactionId]: (prev[reactionId] || 0) + 1
    }));

    // Track user's reaction
    setUserReactions(prev => ({
      ...prev,
      [userId]: reactionId
    }));

    return newReaction;
  };

  const clearReactions = () => {
    setActiveReactions([]);
    setReactionCounts({});
    setUserReactions({});
  };

  const getUserReaction = (userId) => {
    return userReactions[userId];
  };

  const getReactionCount = (reactionId) => {
    return reactionCounts[reactionId] || 0;
  };

  const getTotalReactions = () => {
    return Object.values(reactionCounts).reduce((sum, count) => sum + count, 0);
  };

  const getTopReactions = (limit = 3) => {
    return Object.entries(reactionCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([reactionId, count]) => ({
        ...availableReactions.find(r => r.id === reactionId),
        count
      }));
  };

  const value = {
    activeReactions,
    reactionCounts,
    userReactions,
    availableReactions,
    sendReaction,
    clearReactions,
    getUserReaction,
    getReactionCount,
    getTotalReactions,
    getTopReactions
  };

  return (
    <ReactionsContext.Provider value={value}>
      {children}
    </ReactionsContext.Provider>
  );
};
