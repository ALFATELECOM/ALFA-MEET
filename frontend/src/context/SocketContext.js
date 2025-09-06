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
    const configuredUrl = process.env.REACT_APP_SERVER_URL || 'https://alfa-meet.onrender.com';

    const connect = (url) => {
      try {
        const newSocket = io(url, {
          transports: ['websocket', 'polling'],
          upgrade: true,
          rememberUpgrade: true,
          timeout: 20000,
          forceNew: true,
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000
        });

        newSocket.on('connect', () => {
          setConnected(true);
          setConnectionError(null);
        });

        newSocket.on('disconnect', (reason) => {
          setConnected(false);
        });

        newSocket.on('connect_error', (error) => {
          setConnectionError(`Connection failed: ${error.message}`);
          setConnected(false);
        });

        newSocket.on('reconnect', () => {
          setConnected(true);
          setConnectionError(null);
        });

        newSocket.on('reconnect_error', (error) => {
          setConnectionError(`Reconnection failed: ${error.message}`);
        });

        newSocket.on('connection-confirmed', () => {});

        setSocket(newSocket);
      } catch (e) {
        setConnectionError(`Failed to initialize socket: ${e.message}`);
      }
    };

    connect(configuredUrl);

    return () => {
      if (socket) {
        try { socket.close(); } catch {}
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
