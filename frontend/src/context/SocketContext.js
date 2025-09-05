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
    const serverUrl = process.env.REACT_APP_SERVER_URL || 'https://alfa-meet.onrender.com';
    console.log('🔌 Connecting to server:', serverUrl);
    console.log('🌍 Environment:', process.env.NODE_ENV);
    
    // Test HTTP connection first
    fetch(`${serverUrl}/health`)
      .then(response => response.json())
      .then(data => {
        console.log('✅ Backend server is running:', data);
        setConnectionError(null);
      })
      .catch(error => {
        console.error('❌ Backend server not reachable:', error);
        console.log('💡 Make sure backend server is running');
        setConnectionError(`Backend not reachable: ${error.message}`);
      });

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

    return () => {
      console.log('🔌 Cleaning up socket connection');
      newSocket.close();
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
