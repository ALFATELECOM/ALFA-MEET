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
      const serverUrl = process.env.REACT_APP_SERVER_URL || 'https://alfa-meet.onrender.com';
      
      const response = await fetch(`${serverUrl}/api/admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials)
      });

      if (response.ok) {
        const result = await response.json();
        
        if (result.success) {
          const adminData = {
            ...result.user,
            loginTime: new Date().toISOString()
          };
          
          setIsAdmin(true);
          setAdminUser(adminData);
          localStorage.setItem('adminUser', JSON.stringify(adminData));
          loadMeetings();
          return { success: true };
        } else {
          return { success: false, error: result.error || 'Invalid credentials' };
        }
      } else {
        throw new Error('Network error');
      }
    } catch (error) {
      console.error('Login error:', error);
      
      // Fallback to local authentication if backend is unavailable
      if (credentials.email === 'admin@zoom.com' && credentials.password === 'admin123') {
        const adminData = {
          id: 'admin-1',
          email: credentials.email,
          name: 'Admin User',
          role: 'admin',
          loginTime: new Date().toISOString(),
          personalMeetingId: '070-387-7760'
        };
        
        setIsAdmin(true);
        setAdminUser(adminData);
        localStorage.setItem('adminUser', JSON.stringify(adminData));
        loadMeetings();
        return { success: true };
      } else {
        return { success: false, error: 'Invalid credentials' };
      }
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

  const createMeeting = async (meetingData) => {
    try {
      const serverUrl = process.env.REACT_APP_SERVER_URL || 'https://alfa-meet.onrender.com';
      
      const response = await fetch(`${serverUrl}/api/meetings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(meetingData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        const newMeeting = result.meeting;
        
        // Update local state
        const updatedMeetings = [...meetings, newMeeting];
        setMeetings(updatedMeetings);
        localStorage.setItem('adminMeetings', JSON.stringify(updatedMeetings));
        
        console.log('✅ Meeting created successfully:', newMeeting);
        return newMeeting;
      } else {
        throw new Error(result.error || 'Failed to create meeting');
      }
    } catch (error) {
      console.error('❌ Error creating meeting:', error);
      
      // Fallback to local storage if backend is unavailable
      const newMeeting = {
        id: `meeting-${Date.now()}`,
        ...meetingData,
        createdBy: adminUser?.name || 'Admin',
        createdAt: new Date().toISOString(),
        status: 'scheduled',
        participants: [],
        roomId: meetingData.meetingIdType === 'personal' 
          ? '070-387-7760' 
          : Math.random().toString(36).substring(2, 15)
      };

      const updatedMeetings = [...meetings, newMeeting];
      setMeetings(updatedMeetings);
      localStorage.setItem('adminMeetings', JSON.stringify(updatedMeetings));
      
      return newMeeting;
    }
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

  const startMeeting = async (meetingId) => {
    try {
      const serverUrl = process.env.REACT_APP_SERVER_URL || 'https://alfa-meet.onrender.com';
      
      const response = await fetch(`${serverUrl}/api/meetings/${meetingId}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const result = await response.json();
        
        if (result.success) {
          // Update local state
          updateMeeting(meetingId, { 
            status: 'active',
            startedAt: new Date().toISOString()
          });
          
          console.log('✅ Meeting started successfully:', result.meeting);
          return result;
        }
      }
    } catch (error) {
      console.error('❌ Error starting meeting:', error);
    }
    
    // Fallback to local update
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
