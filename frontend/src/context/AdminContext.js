import React, { createContext, useContext, useState, useEffect } from 'react';

const AdminContext = createContext();

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};

export const AdminProvider = ({ children }) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminUser, setAdminUser] = useState(null);
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load admin status from localStorage on mount
  useEffect(() => {
    const savedAdmin = localStorage.getItem('adminUser');
    if (savedAdmin) {
      const adminData = JSON.parse(savedAdmin);
      setIsAdmin(true);
      setAdminUser(adminData);
      loadMeetings();
    }
  }, []);

  const login = async (credentials) => {
    setLoading(true);
    try {
      // Mock admin login - in real app, this would call your backend
      if (credentials.email === 'admin@zoom.com' && credentials.password === 'admin123') {
        const adminData = {
          id: 'admin-1',
          email: credentials.email,
          name: 'Admin User',
          role: 'admin',
          loginTime: new Date().toISOString()
        };
        
        setIsAdmin(true);
        setAdminUser(adminData);
        localStorage.setItem('adminUser', JSON.stringify(adminData));
        loadMeetings();
        return { success: true };
      } else {
        return { success: false, error: 'Invalid credentials' };
      }
    } catch (error) {
      return { success: false, error: 'Login failed' };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setIsAdmin(false);
    setAdminUser(null);
    setMeetings([]);
    localStorage.removeItem('adminUser');
    localStorage.removeItem('adminMeetings');
  };

  const loadMeetings = () => {
    // Load meetings from localStorage or API
    const savedMeetings = localStorage.getItem('adminMeetings');
    if (savedMeetings) {
      setMeetings(JSON.parse(savedMeetings));
    }
  };

  const createMeeting = (meetingData) => {
    const newMeeting = {
      id: `meeting-${Date.now()}`,
      ...meetingData,
      createdBy: adminUser?.name || 'Admin',
      createdAt: new Date().toISOString(),
      status: 'scheduled',
      participants: [],
      roomId: Math.random().toString(36).substring(2, 15)
    };

    const updatedMeetings = [...meetings, newMeeting];
    setMeetings(updatedMeetings);
    localStorage.setItem('adminMeetings', JSON.stringify(updatedMeetings));
    
    return newMeeting;
  };

  const updateMeeting = (meetingId, updates) => {
    const updatedMeetings = meetings.map(meeting => 
      meeting.id === meetingId 
        ? { ...meeting, ...updates, updatedAt: new Date().toISOString() }
        : meeting
    );
    
    setMeetings(updatedMeetings);
    localStorage.setItem('adminMeetings', JSON.stringify(updatedMeetings));
  };

  const deleteMeeting = (meetingId) => {
    const updatedMeetings = meetings.filter(meeting => meeting.id !== meetingId);
    setMeetings(updatedMeetings);
    localStorage.setItem('adminMeetings', JSON.stringify(updatedMeetings));
  };

  const startMeeting = (meetingId) => {
    updateMeeting(meetingId, { 
      status: 'active',
      startedAt: new Date().toISOString()
    });
  };

  const endMeeting = (meetingId) => {
    updateMeeting(meetingId, { 
      status: 'ended',
      endedAt: new Date().toISOString()
    });
  };

  const value = {
    isAdmin,
    adminUser,
    meetings,
    loading,
    login,
    logout,
    createMeeting,
    updateMeeting,
    deleteMeeting,
    startMeeting,
    endMeeting,
    loadMeetings
  };

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
};
