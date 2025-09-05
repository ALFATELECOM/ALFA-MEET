import React, { createContext, useContext, useState, useEffect } from 'react';

const MeetingFeaturesContext = createContext();

export const useMeetingFeatures = () => {
  const context = useContext(MeetingFeaturesContext);
  if (!context) {
    throw new Error('useMeetingFeatures must be used within a MeetingFeaturesProvider');
  }
  return context;
};

export const MeetingFeaturesProvider = ({ children }) => {
  const [raisedHands, setRaisedHands] = useState([]);
  const [polls, setPolls] = useState([]);
  const [activePoll, setActivePoll] = useState(null);
  const [breakoutRooms, setBreakoutRooms] = useState([]);
  const [meetingMode, setMeetingMode] = useState('meeting'); // 'meeting' or 'webinar'
  const [recordingStatus, setRecordingStatus] = useState('stopped'); // 'recording', 'paused', 'stopped'
  const [meetingNotes, setMeetingNotes] = useState('');
  const [whiteboard, setWhiteboard] = useState({ drawings: [], isActive: false });
  const [backgroundEffects, setBackgroundEffects] = useState({});

  // Raise Hand Management
  const raiseHand = (userId, userName) => {
    const existingHand = raisedHands.find(hand => hand.userId === userId);
    if (existingHand) return; // Already raised

    const handRaise = {
      id: `hand-${Date.now()}`,
      userId,
      userName,
      timestamp: new Date().toISOString(),
      acknowledged: false
    };

    setRaisedHands(prev => [...prev, handRaise]);
    return handRaise;
  };

  const lowerHand = (userId) => {
    setRaisedHands(prev => prev.filter(hand => hand.userId !== userId));
  };

  const acknowledgeHand = (handId) => {
    setRaisedHands(prev => 
      prev.map(hand => 
        hand.id === handId ? { ...hand, acknowledged: true } : hand
      )
    );
  };

  const clearAllHands = () => {
    setRaisedHands([]);
  };

  // Poll Management
  const createPoll = (question, options, duration = 60) => {
    const poll = {
      id: `poll-${Date.now()}`,
      question,
      options: options.map((option, index) => ({
        id: index,
        text: option,
        votes: 0,
        voters: []
      })),
      createdAt: new Date().toISOString(),
      endsAt: new Date(Date.now() + duration * 1000).toISOString(),
      isActive: true,
      totalVotes: 0
    };

    setPolls(prev => [...prev, poll]);
    setActivePoll(poll);
    
    // Auto-close poll after duration
    setTimeout(() => {
      closePoll(poll.id);
    }, duration * 1000);

    return poll;
  };

  const votePoll = (pollId, optionId, userId, userName) => {
    setPolls(prev => 
      prev.map(poll => {
        if (poll.id !== pollId) return poll;
        
        // Check if user already voted
        const hasVoted = poll.options.some(option => 
          option.voters.some(voter => voter.userId === userId)
        );
        
        if (hasVoted) return poll; // User already voted

        return {
          ...poll,
          options: poll.options.map(option => 
            option.id === optionId 
              ? {
                  ...option,
                  votes: option.votes + 1,
                  voters: [...option.voters, { userId, userName }]
                }
              : option
          ),
          totalVotes: poll.totalVotes + 1
        };
      })
    );
  };

  const closePoll = (pollId) => {
    setPolls(prev => 
      prev.map(poll => 
        poll.id === pollId ? { ...poll, isActive: false } : poll
      )
    );
    
    if (activePoll?.id === pollId) {
      setActivePoll(null);
    }
  };

  // Recording Management
  const startRecording = () => {
    setRecordingStatus('recording');
    return {
      status: 'started',
      timestamp: new Date().toISOString()
    };
  };

  const pauseRecording = () => {
    setRecordingStatus('paused');
    return {
      status: 'paused',
      timestamp: new Date().toISOString()
    };
  };

  const stopRecording = () => {
    setRecordingStatus('stopped');
    return {
      status: 'stopped',
      timestamp: new Date().toISOString()
    };
  };

  // Breakout Rooms Management
  const createBreakoutRooms = (roomCount, participants) => {
    const rooms = [];
    const participantsPerRoom = Math.ceil(participants.length / roomCount);
    
    for (let i = 0; i < roomCount; i++) {
      const roomParticipants = participants.slice(
        i * participantsPerRoom,
        (i + 1) * participantsPerRoom
      );
      
      rooms.push({
        id: `room-${i + 1}`,
        name: `Breakout Room ${i + 1}`,
        participants: roomParticipants,
        isActive: false,
        createdAt: new Date().toISOString()
      });
    }
    
    setBreakoutRooms(rooms);
    return rooms;
  };

  const joinBreakoutRoom = (roomId, userId) => {
    setBreakoutRooms(prev =>
      prev.map(room =>
        room.id === roomId
          ? { ...room, isActive: true }
          : room
      )
    );
  };

  const closeBreakoutRooms = () => {
    setBreakoutRooms([]);
  };

  // Webinar Mode
  const enableWebinarMode = () => {
    setMeetingMode('webinar');
  };

  const disableWebinarMode = () => {
    setMeetingMode('meeting');
  };

  // Background Effects
  const setBackgroundEffect = (userId, effectType, effectData) => {
    setBackgroundEffects(prev => ({
      ...prev,
      [userId]: { effectType, effectData, timestamp: Date.now() }
    }));
  };

  const removeBackgroundEffect = (userId) => {
    setBackgroundEffects(prev => {
      const updated = { ...prev };
      delete updated[userId];
      return updated;
    });
  };

  // Meeting Notes
  const updateMeetingNotes = (notes) => {
    setMeetingNotes(notes);
  };

  // Whiteboard
  const updateWhiteboard = (drawingData) => {
    setWhiteboard(prev => ({
      ...prev,
      drawings: [...prev.drawings, drawingData],
      isActive: true
    }));
  };

  const clearWhiteboard = () => {
    setWhiteboard({ drawings: [], isActive: false });
  };

  const value = {
    // Raise Hand
    raisedHands,
    raiseHand,
    lowerHand,
    acknowledgeHand,
    clearAllHands,
    
    // Polls
    polls,
    activePoll,
    createPoll,
    votePoll,
    closePoll,
    
    // Recording
    recordingStatus,
    startRecording,
    pauseRecording,
    stopRecording,
    
    // Breakout Rooms
    breakoutRooms,
    createBreakoutRooms,
    joinBreakoutRoom,
    closeBreakoutRooms,
    
    // Meeting Mode
    meetingMode,
    enableWebinarMode,
    disableWebinarMode,
    
    // Background Effects
    backgroundEffects,
    setBackgroundEffect,
    removeBackgroundEffect,
    
    // Meeting Notes
    meetingNotes,
    updateMeetingNotes,
    
    // Whiteboard
    whiteboard,
    updateWhiteboard,
    clearWhiteboard
  };

  return (
    <MeetingFeaturesContext.Provider value={value}>
      {children}
    </MeetingFeaturesContext.Provider>
  );
};
