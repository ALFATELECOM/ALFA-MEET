import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import { useSocket } from './SocketContext';

const MediaContext = createContext();

export const useMedia = () => {
  const context = useContext(MediaContext);
  if (!context) {
    throw new Error('useMedia must be used within a MediaProvider');
  }
  return context;
};

export const MediaProvider = ({ children }) => {
  const { socket } = useSocket();
  const [localStream, setLocalStream] = useState(null);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const localVideoRef = useRef(null);
  const [roomContext, setRoomContextState] = useState({ roomId: null, userId: null });

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: isVideoEnabled,
        audio: isAudioEnabled
      });
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      return stream;
    } catch (error) {
      console.error('Error accessing camera:', error);
      throw error;
    }
  }, [isVideoEnabled, isAudioEnabled]);

  const stopCamera = useCallback(() => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = null;
      }
    }
  }, [localStream]);

  const toggleVideo = useCallback(() => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        const nextEnabled = !videoTrack.enabled;
        videoTrack.enabled = nextEnabled;
        setIsVideoEnabled(nextEnabled);
        try {
          if (socket && roomContext.roomId && roomContext.userId) {
            socket.emit('toggle-video', {
              roomId: roomContext.roomId,
              userId: roomContext.userId,
              isMuted: !nextEnabled
            });
          }
        } catch {}
      }
    }
  }, [localStream, socket, roomContext]);

  const toggleAudio = useCallback(() => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        const nextEnabled = !audioTrack.enabled;
        audioTrack.enabled = nextEnabled;
        setIsAudioEnabled(nextEnabled);
        try {
          if (socket && roomContext.roomId && roomContext.userId) {
            socket.emit('toggle-audio', {
              roomId: roomContext.roomId,
              userId: roomContext.userId,
              isMuted: !nextEnabled
            });
          }
        } catch {}
      }
    }
  }, [localStream, socket, roomContext]);

  // Force mute/unmute for admin actions
  const forceMute = useCallback(() => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = false;
        setIsAudioEnabled(false);
      }
    }
  }, [localStream]);

  const forceUnmute = useCallback(() => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = true;
        setIsAudioEnabled(true);
      }
    }
  }, [localStream]);

  const startScreenShare = useCallback(async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      });
      setIsScreenSharing(true);
      return screenStream;
    } catch (error) {
      console.error('Error starting screen share:', error);
      throw error;
    }
  }, []);

  const stopScreenShare = useCallback(() => {
    setIsScreenSharing(false);
  }, []);

  // Store the current room context for components that need it (e.g., WebRTC signaling helpers)
  const setRoomContext = useCallback((roomId, userId) => {
    const contextValue = { roomId: roomId || null, userId: userId || null };
    setRoomContextState(contextValue);
    try {
      sessionStorage.setItem('roomContext', JSON.stringify(contextValue));
    } catch (e) {
      // Ignore storage errors (e.g., Safari private mode)
    }
  }, []);

  const value = {
    localStream,
    isVideoEnabled,
    isAudioEnabled,
    isScreenSharing,
    localVideoRef,
    roomContext,
    startCamera,
    stopCamera,
    toggleVideo,
    toggleAudio,
    forceMute,
    forceUnmute,
    startScreenShare,
    stopScreenShare,
    setRoomContext
  };

  return (
    <MediaContext.Provider value={value}>
      {children}
    </MediaContext.Provider>
  );
};
