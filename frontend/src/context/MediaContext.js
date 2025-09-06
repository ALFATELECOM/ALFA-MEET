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

  const [selectedAudioInputId, setSelectedAudioInputId] = useState(null);
  const [selectedVideoInputId, setSelectedVideoInputId] = useState(null);
  const [availableAudioInputs, setAvailableAudioInputs] = useState([]);
  const [availableVideoInputs, setAvailableVideoInputs] = useState([]);

  const enumerateDevices = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devices.filter(d => d.kind === 'audioinput');
      const videoInputs = devices.filter(d => d.kind === 'videoinput');
      setAvailableAudioInputs(audioInputs);
      setAvailableVideoInputs(videoInputs);
      if (!selectedAudioInputId && audioInputs[0]) setSelectedAudioInputId(audioInputs[0].deviceId);
      if (!selectedVideoInputId && videoInputs[0]) setSelectedVideoInputId(videoInputs[0].deviceId);
    } catch {}
  }, [selectedAudioInputId, selectedVideoInputId]);

  const startCamera = useCallback(async () => {
    const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
    const isIOS = /iPhone|iPad/i.test(ua);
    const isMobile = /Android|iPhone|iPad|iPod/i.test(ua);

    const buildConstraints = () => {
      const videoConstraints = isVideoEnabled ? {
        deviceId: selectedVideoInputId ? { exact: selectedVideoInputId } : undefined,
        facingMode: selectedVideoInputId ? undefined : 'user',
        width: isIOS ? { ideal: 640, max: 640 } : (isMobile ? { ideal: 1280, max: 1280 } : { ideal: 1280 }),
        height: isIOS ? { ideal: 480, max: 480 } : (isMobile ? { ideal: 720, max: 720 } : { ideal: 720 }),
        frameRate: isIOS ? { ideal: 24, max: 24 } : { ideal: 24, max: 30 }
      } : false;
      const audioConstraints = isAudioEnabled ? {
        deviceId: selectedAudioInputId ? { exact: selectedAudioInputId } : undefined,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        channelCount: 1
      } : false;
      return { video: videoConstraints, audio: audioConstraints };
    };

    try {
      const stream = await navigator.mediaDevices.getUserMedia(buildConstraints());
      setLocalStream(stream);
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      return stream;
    } catch (e) {
      try {
        const fallback = await navigator.mediaDevices.getUserMedia({ video: isVideoEnabled ? { facingMode: 'user' } : false, audio: isAudioEnabled });
        setLocalStream(fallback);
        if (localVideoRef.current) localVideoRef.current.srcObject = fallback;
        return fallback;
      } catch (e2) {
        throw e2;
      }
    }
  }, [isVideoEnabled, isAudioEnabled, selectedAudioInputId, selectedVideoInputId]);

  const stopCamera = useCallback(() => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
      if (localVideoRef.current) localVideoRef.current.srcObject = null;
    }
  }, [localStream]);

  const restartCamera = useCallback(async () => {
    try { if (localStream) { localStream.getTracks().forEach(t => t.stop()); setLocalStream(null); if (localVideoRef.current) localVideoRef.current.srcObject = null; } } catch {}
    await startCamera();
  }, [localStream, startCamera]);

  const toggleVideo = useCallback(() => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        const nextEnabled = !videoTrack.enabled;
        videoTrack.enabled = nextEnabled;
        setIsVideoEnabled(nextEnabled);
        try {
          if (socket && roomContext.roomId && roomContext.userId) {
            socket.emit('toggle-video', { roomId: roomContext.roomId, userId: roomContext.userId, isMuted: !nextEnabled });
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
            socket.emit('toggle-audio', { roomId: roomContext.roomId, userId: roomContext.userId, isMuted: !nextEnabled });
          }
        } catch {}
      }
    }
  }, [localStream, socket, roomContext]);

  const forceMute = useCallback(() => { if (localStream) { const t = localStream.getAudioTracks()[0]; if (t) { t.enabled = false; setIsAudioEnabled(false); } } }, [localStream]);
  const forceUnmute = useCallback(() => { if (localStream) { const t = localStream.getAudioTracks()[0]; if (t) { t.enabled = true; setIsAudioEnabled(true); } } }, [localStream]);

  const startScreenShare = useCallback(async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      });
      setIsScreenSharing(true);
      try {
        if (socket && roomContext.roomId && roomContext.userId) {
          socket.emit('start-screen-share', { roomId: roomContext.roomId, userId: roomContext.userId });
        }
      } catch {}
      return screenStream;
    } catch (error) {
      console.error('Error starting screen share:', error);
      throw error;
    }
  }, [socket, roomContext]);

  const stopScreenShare = useCallback(() => {
    setIsScreenSharing(false);
    try {
      if (socket && roomContext.roomId && roomContext.userId) {
        socket.emit('stop-screen-share', { roomId: roomContext.roomId, userId: roomContext.userId });
      }
    } catch {}
  }, [socket, roomContext]);

  const setRoomContext = useCallback((roomId, userId) => { const v = { roomId: roomId || null, userId: userId || null }; setRoomContextState(v); try { sessionStorage.setItem('roomContext', JSON.stringify(v)); } catch {} }, []);

  const value = {
    localStream,
    isVideoEnabled,
    isAudioEnabled,
    isScreenSharing,
    localVideoRef,
    roomContext,
    selectedAudioInputId,
    selectedVideoInputId,
    availableAudioInputs,
    availableVideoInputs,
    enumerateDevices,
    setAudioInputDevice: async (id) => { setSelectedAudioInputId(id); await restartCamera(); },
    setVideoInputDevice: async (id) => { setSelectedVideoInputId(id); await restartCamera(); },
    restartCamera,
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
