import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);

  useEffect(() => {
    // Use the confirmed working backend URL
    const serverUrl = process.env.REACT_APP_SERVER_URL || 'https://alfa-meet.onrender.com';
    
    // Backup URLs in case primary fails
    const possibleUrls = [
      serverUrl,
      'https://alfa-meet.onrender.com', // Your confirmed working URL
      'https://alfa-meet-backend.onrender.com', 
      'https://alfameet.onrender.com',
      'http://localhost:5000'
    ].filter(Boolean);

    console.log('🔌 Trying to connect to backend...');
    console.log('🌍 Environment:', process.env.NODE_ENV);
    console.log('🔗 Possible URLs:', possibleUrls);

    let workingUrl = null;

    // Test each URL to find working backend
    const testUrls = async () => {
      for (const url of possibleUrls) {
        try {
          console.log(`🧪 Testing: ${url}/health`);
          const response = await fetch(`${url}/health`, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            console.log(`✅ Found working backend: ${url}`, data);
            workingUrl = url;
            setConnectionError(null);
            break;
          }
        } catch (error) {
          console.log(`❌ ${url} - Failed: ${error.message}`);
        }
      }

      if (!workingUrl) {
        console.error('❌ No working backend URL found');
        setConnectionError('No working backend found. Please check your Render deployment.');
        return;
      }

      return workingUrl;
    };

    testUrls().then(serverUrl => {
      if (!serverUrl) return;

      console.log(`🚀 Connecting to: ${serverUrl}`);

      const newSocket = io(serverUrl, {
        transports: ['websocket', 'polling'],
        upgrade: true,
        rememberUpgrade: true,
        timeout: 20000,
        forceNew: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
      });

    // Enhanced connection event handlers
    newSocket.on('connect', () => {
      console.log('🟢 Connected to server:', newSocket.id);
      setConnected(true);
      setConnectionError(null);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('🔴 Disconnected from server:', reason);
      setConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('🚫 Connection error:', error);
      setConnectionError(`Connection failed: ${error.message}`);
      setConnected(false);
    });

    newSocket.on('reconnect', (attemptNumber) => {
      console.log('🔄 Reconnected after', attemptNumber, 'attempts');
      setConnected(true);
      setConnectionError(null);
    });

    newSocket.on('reconnect_error', (error) => {
      console.error('🔄❌ Reconnection failed:', error);
      setConnectionError(`Reconnection failed: ${error.message}`);
    });

    // Listen for backend confirmation
    newSocket.on('connection-confirmed', (data) => {
      console.log('✅ Connection confirmed by backend:', data);
    });

      setSocket(newSocket);
    });

    return () => {
      console.log('🔌 Cleaning up socket connection');
      if (socket) {
        socket.close();
      }
    };
  }, []);

  const value = {
    socket,
    connected,
    connectionError
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
