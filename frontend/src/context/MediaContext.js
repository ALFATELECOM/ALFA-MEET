import React, { createContext, useContext, useState, useRef, useCallback } from 'react';

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
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [screenStream, setScreenStream] = useState(null);
  const localVideoRef = useRef(null);
  const screenShareRef = useRef(null);

  // WebRTC configuration
  const rtcConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ],
  };

  const startCamera = useCallback(async (video = true, audio = true) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: video ? { width: 1280, height: 720 } : false,
        audio: audio
      });

      setLocalStream(stream);
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Set initial mute states
      if (stream.getAudioTracks().length > 0) {
        stream.getAudioTracks()[0].enabled = !audio;
        setIsAudioMuted(!audio);
      }
      
      if (stream.getVideoTracks().length > 0) {
        stream.getVideoTracks()[0].enabled = video;
        setIsVideoMuted(!video);
      }

      return stream;
    } catch (error) {
      console.error('Error accessing camera/microphone:', error);
      throw error;
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
  }, [localStream]);

  const toggleAudio = useCallback(() => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioMuted(!audioTrack.enabled);
      }
    }
  }, [localStream]);

  const toggleVideo = useCallback(() => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoMuted(!videoTrack.enabled);
      }
    }
  }, [localStream]);

  const startScreenShare = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      });

      setScreenStream(stream);
      setIsScreenSharing(true);

      if (screenShareRef.current) {
        screenShareRef.current.srcObject = stream;
      }

      // Handle screen share ending
      stream.getVideoTracks()[0].onended = () => {
        stopScreenShare();
      };

      return stream;
    } catch (error) {
      console.error('Error starting screen share:', error);
      throw error;
    }
  }, []);

  const stopScreenShare = useCallback(() => {
    if (screenStream) {
      screenStream.getTracks().forEach(track => track.stop());
      setScreenStream(null);
      setIsScreenSharing(false);
    }

    if (screenShareRef.current) {
      screenShareRef.current.srcObject = null;
    }
  }, [screenStream]);

  const createPeerConnection = useCallback((onIceCandidate, onTrack) => {
    const peerConnection = new RTCPeerConnection(rtcConfiguration);

    peerConnection.onicecandidate = (event) => {
      if (event.candidate && onIceCandidate) {
        onIceCandidate(event.candidate);
      }
    };

    peerConnection.ontrack = (event) => {
      if (onTrack) {
        onTrack(event.streams[0]);
      }
    };

    // Add local stream tracks
    if (localStream) {
      localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream);
      });
    }

    // Add screen share tracks if sharing
    if (screenStream) {
      screenStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, screenStream);
      });
    }

    return peerConnection;
  }, [localStream, screenStream]);

  const value = {
    localStream,
    isAudioMuted,
    isVideoMuted,
    isScreenSharing,
    screenStream,
    localVideoRef,
    screenShareRef,
    rtcConfiguration,
    startCamera,
    stopCamera,
    toggleAudio,
    toggleVideo,
    startScreenShare,
    stopScreenShare,
    createPeerConnection
  };

  return (
    <MediaContext.Provider value={value}>
      {children}
    </MediaContext.Provider>
  );
};
