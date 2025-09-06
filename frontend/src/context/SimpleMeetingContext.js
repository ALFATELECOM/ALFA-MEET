import React, { createContext, useContext, useState, useEffect } from 'react';

const SimpleMeetingContext = createContext();

export const useSimpleMeeting = () => {
  const context = useContext(SimpleMeetingContext);
  if (!context) {
    throw new Error('useSimpleMeeting must be used within a SimpleMeetingProvider');
  }
  return context;
};

export const SimpleMeetingProvider = ({ children }) => {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load meetings from localStorage on mount
  useEffect(() => {
    const savedMeetings = localStorage.getItem('simpleMeetings');
    if (savedMeetings) {
      try {
        const parsedMeetings = JSON.parse(savedMeetings);
        setMeetings(parsedMeetings);
        console.log('📅 Loaded meetings from localStorage:', parsedMeetings);
      } catch (error) {
        console.error('Error parsing saved meetings:', error);
        localStorage.removeItem('simpleMeetings');
      }
    }
  }, []);

  // Save meetings to localStorage whenever meetings change
  useEffect(() => {
    if (meetings.length > 0) {
      localStorage.setItem('simpleMeetings', JSON.stringify(meetings));
      console.log('💾 Saved meetings to localStorage:', meetings);
    }
  }, [meetings]);

  const createMeeting = (meetingData) => {
    setLoading(true);
    
    try {
      // Generate unique IDs
      const meetingId = `meeting-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const roomId = `room-${Math.random().toString(36).substr(2, 9)}`;
      
      // Create meeting object
      const newMeeting = {
        id: meetingId,
        roomId: roomId,
        title: meetingData.title || 'Untitled Meeting',
        description: meetingData.description || '',
        date: meetingData.date || new Date().toISOString().split('T')[0],
        time: meetingData.time || '12:00',
        duration: meetingData.duration || 60,
        maxParticipants: meetingData.maxParticipants || 100,
        meetingType: meetingData.meetingType || 'meeting',
        
        // Status and metadata
        status: 'scheduled',
        createdAt: new Date().toISOString(),
        createdBy: 'Admin User',
        
        // Settings
        requirePassword: meetingData.requirePassword || false,
        password: meetingData.password || null,
        waitingRoom: meetingData.waitingRoom || false,
        allowScreenShare: meetingData.allowScreenShare !== false,
        enableChat: meetingData.enableChat !== false,
        enableReactions: meetingData.enableReactions !== false,
        
        // Runtime data
        participants: [],
        startedAt: null,
        endedAt: null
      };

      // Add to meetings array
      const updatedMeetings = [...meetings, newMeeting];
      setMeetings(updatedMeetings);

      console.log('✅ Meeting created successfully:', newMeeting);
      return newMeeting;
      
    } catch (error) {
      console.error('❌ Error creating meeting:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getMeetings = () => {
    return meetings;
  };

  const getMeetingById = (id) => {
    return meetings.find(meeting => meeting.id === id);
  };

  const updateMeeting = (id, updates) => {
    const updatedMeetings = meetings.map(meeting => 
      meeting.id === id 
        ? { ...meeting, ...updates, updatedAt: new Date().toISOString() }
        : meeting
    );
    setMeetings(updatedMeetings);
    console.log('📝 Meeting updated:', id, updates);
  };

  const deleteMeeting = (id) => {
    const updatedMeetings = meetings.filter(meeting => meeting.id !== id);
    setMeetings(updatedMeetings);
    console.log('🗑️ Meeting deleted:', id);
  };

  const startMeeting = (id) => {
    updateMeeting(id, {
      status: 'active',
      startedAt: new Date().toISOString()
    });
    console.log('▶️ Meeting started:', id);
  };

  const endMeeting = (id) => {
    updateMeeting(id, {
      status: 'ended',
      endedAt: new Date().toISOString()
    });
    console.log('⏹️ Meeting ended:', id);
  };

  const clearAllMeetings = () => {
    setMeetings([]);
    localStorage.removeItem('simpleMeetings');
    console.log('🧹 All meetings cleared');
  };

  const value = {
    meetings,
    loading,
    createMeeting,
    getMeetings,
    getMeetingById,
    updateMeeting,
    deleteMeeting,
    startMeeting,
    endMeeting,
    clearAllMeetings
  };

  return (
    <SimpleMeetingContext.Provider value={value}>
      {children}
    </SimpleMeetingContext.Provider>
  );
};

export default SimpleMeetingProvider;

