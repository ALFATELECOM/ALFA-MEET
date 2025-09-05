import React, { createContext, useContext, useState, useEffect } from 'react';

const RewardsContext = createContext();

export const useRewards = () => {
  const context = useContext(RewardsContext);
  if (!context) {
    throw new Error('useRewards must be used within a RewardsProvider');
  }
  return context;
};

export const RewardsProvider = ({ children }) => {
  const [userPoints, setUserPoints] = useState({});
  const [rewardHistory, setRewardHistory] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);

  // Load rewards data from localStorage
  useEffect(() => {
    const savedPoints = localStorage.getItem('userRewardPoints');
    const savedHistory = localStorage.getItem('rewardHistory');
    
    if (savedPoints) {
      setUserPoints(JSON.parse(savedPoints));
    }
    if (savedHistory) {
      setRewardHistory(JSON.parse(savedHistory));
    }
  }, []);

  // Save to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem('userRewardPoints', JSON.stringify(userPoints));
  }, [userPoints]);

  useEffect(() => {
    localStorage.setItem('rewardHistory', JSON.stringify(rewardHistory));
  }, [rewardHistory]);

  // Update leaderboard when points change
  useEffect(() => {
    const sortedUsers = Object.entries(userPoints)
      .map(([userId, data]) => ({ userId, ...data }))
      .sort((a, b) => b.points - a.points)
      .slice(0, 10); // Top 10
    
    setLeaderboard(sortedUsers);
  }, [userPoints]);

  const awardPoints = (userId, userName, points, reason, roomId) => {
    const timestamp = new Date().toISOString();
    
    // Update user points
    setUserPoints(prev => ({
      ...prev,
      [userId]: {
        userName: userName,
        points: (prev[userId]?.points || 0) + points,
        lastActive: timestamp
      }
    }));

    // Add to reward history
    const rewardEntry = {
      id: `reward-${Date.now()}`,
      userId,
      userName,
      points,
      reason,
      roomId,
      timestamp
    };

    setRewardHistory(prev => [rewardEntry, ...prev.slice(0, 99)]); // Keep last 100 entries

    return rewardEntry;
  };

  const getUserPoints = (userId) => {
    return userPoints[userId]?.points || 0;
  };

  const getUserRank = (userId) => {
    const userIndex = leaderboard.findIndex(user => user.userId === userId);
    return userIndex >= 0 ? userIndex + 1 : null;
  };

  const resetUserPoints = (userId) => {
    setUserPoints(prev => {
      const updated = { ...prev };
      delete updated[userId];
      return updated;
    });
  };

  const getTopUsers = (limit = 5) => {
    return leaderboard.slice(0, limit);
  };

  const value = {
    userPoints,
    rewardHistory,
    leaderboard,
    awardPoints,
    getUserPoints,
    getUserRank,
    resetUserPoints,
    getTopUsers
  };

  return (
    <RewardsContext.Provider value={value}>
      {children}
    </RewardsContext.Provider>
  );
};
