import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
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
  const [localStream, setLocalStream] = useState(null);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [currentRoomId, setCurrentRoomId] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const localVideoRef = useRef(null);
  const { socket } = useSocket();

  const startCamera = useCallback(async () => {
    try {
      console.log('🎥 Starting camera...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true
        }
      });
      
      console.log('✅ Camera stream obtained:', stream);
      setLocalStream(stream);
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        console.log('✅ Video element updated');
      }
      
      // Set initial states based on stream
      const videoTrack = stream.getVideoTracks()[0];
      const audioTrack = stream.getAudioTracks()[0];
      
      if (videoTrack) {
        setIsVideoEnabled(videoTrack.enabled);
      }
      if (audioTrack) {
        setIsAudioEnabled(audioTrack.enabled);
      }
      
      return stream;
    } catch (error) {
      console.error('❌ Error accessing camera:', error);
      // Fallback - try audio only
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setLocalStream(audioStream);
        setIsVideoEnabled(false);
        return audioStream;
      } catch (audioError) {
        console.error('❌ Error accessing microphone:', audioError);
        throw error;
      }
    }
  }, []);

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
    console.log('🎥 Toggling video, current state:', isVideoEnabled);
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
        console.log('✅ Video toggled to:', videoTrack.enabled);
        
        // Notify backend about video toggle
        if (socket && currentRoomId && currentUserId) {
          socket.emit('toggle-video', {
            roomId: currentRoomId,
            userId: currentUserId,
            isVideoEnabled: videoTrack.enabled
          });
        }
      }
    } else {
      console.log('❌ No local stream available');
    }
  }, [localStream, isVideoEnabled, socket, currentRoomId, currentUserId]);

  const toggleAudio = useCallback(() => {
    console.log('🎤 Toggling audio, current state:', isAudioEnabled);
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
        console.log('✅ Audio toggled to:', audioTrack.enabled);
        
        // Notify backend about audio toggle
        if (socket && currentRoomId && currentUserId) {
          socket.emit('toggle-audio', {
            roomId: currentRoomId,
            userId: currentUserId,
            isAudioEnabled: audioTrack.enabled
          });
        }
      }
    } else {
      console.log('❌ No local stream available');
    }
  }, [localStream, isAudioEnabled, socket, currentRoomId, currentUserId]);

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

  // Function to set room context for WebRTC signaling
  const setRoomContext = useCallback((roomId, userId) => {
    setCurrentRoomId(roomId);
    setCurrentUserId(userId);
    console.log('🏠 Room context set:', { roomId, userId });
  }, []);

  const value = {
    localStream,
    isVideoEnabled,
    isAudioEnabled,
    isScreenSharing,
    localVideoRef,
    currentRoomId,
    currentUserId,
    startCamera,
    stopCamera,
    toggleVideo,
    toggleAudio,
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
