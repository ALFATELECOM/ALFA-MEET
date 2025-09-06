import React, { useRef, useEffect, useState } from 'react';
import { useMedia } from '../context/MediaContext';
import { useSocket } from '../context/SocketContext';
import { UserIcon, MicrophoneIcon, VideoCameraIcon } from '@heroicons/react/24/outline';

const WebRTCVideoGrid = ({ participants = [], roomId, userId, userName, isMobile = false }) => {
  const { localVideoRef, isVideoEnabled, isAudioEnabled, localStream, restartCamera, isForcedMuted } = useMedia();
  const { socket } = useSocket();
  
  // Store peer connections and remote streams
  const [peerConnections, setPeerConnections] = useState(new Map());
  const [remoteStreams, setRemoteStreams] = useState(new Map());
  const remoteVideoRefs = useRef(new Map());
  const playedVideos = useRef(new Set());

  // Determine webinar role and filter participants when attendee
  const myRole = (() => {
    const self = participants.find(p => (p.id || p.userId) === userId);
    return self?.role;
  })();
  const isWebinar = participants.some(p => p.role === 'host' || p.role === 'co-host');
  const filteredParticipants = (isWebinar && myRole !== 'host' && myRole !== 'co-host')
    ? participants.filter(p => p.role === 'host' || p.role === 'co-host')
    : participants;
  // Do not render/connect to self in the remote tiles
  const remoteParticipants = filteredParticipants.filter(p => (p.id || p.userId) !== userId);

  // Viewport responsiveness for grid sizing
  const [viewportWidth, setViewportWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1200
  );
  useEffect(() => {
    const handleResize = () => setViewportWidth(window.innerWidth);
    const unlockPlay = () => {
      // Attempt to play streams that were blocked until user gesture
      try {
        const elements = Array.from(document.querySelectorAll('video'));
        elements.forEach(v => v.play().catch(() => {}));
      } catch {}
    };
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    window.addEventListener('touchstart', unlockPlay, { once: true });
    window.addEventListener('click', unlockPlay, { once: true });
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      window.removeEventListener('touchstart', unlockPlay);
      window.removeEventListener('click', unlockPlay);
    };
  }, []);

  // ICE servers configuration
  const iceServers = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ]
  };
  // Limit bitrate on mobile to reduce flicker/CPU spikes
  const isMobileUA = typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  // Helper to attach stream and safely play avoiding duplicate play() calls
  const attachStreamToVideo = (element, stream, id) => {
    if (!element || !stream) return;
    if (element.srcObject !== stream) {
      element.srcObject = stream;
    }
    const key = id || element;
    const tryPlay = () => {
      if (playedVideos.current.has(key)) return;
      element.play().then(() => {
        playedVideos.current.add(key);
      }).catch(() => {});
    };
    if (element.readyState >= 2) {
      tryPlay();
    } else {
      element.onloadedmetadata = tryPlay;
    }
  };

  // Initialize WebRTC connections when participants change
  useEffect(() => {
    if (!socket || !localStream) return;

    remoteParticipants.forEach(participant => {
      const participantId = participant.id || participant.userId;
      if (participantId && participantId !== userId && !peerConnections.has(participantId)) {
        createPeerConnection(participantId);
      }
    });

    // Clean up connections for participants who left
    peerConnections.forEach((pc, participantId) => {
      const stillPresent = remoteParticipants.some(p => (p.id || p.userId) === participantId);
      if (!stillPresent) {
        pc.close();
        setPeerConnections(prev => {
          const newMap = new Map(prev);
          newMap.delete(participantId);
          return newMap;
        });
        setRemoteStreams(prev => {
          const newMap = new Map(prev);
          newMap.delete(participantId);
          return newMap;
        });
      }
    });
  }, [remoteParticipants, socket, localStream, userId, peerConnections]);

  // Create peer connection for a participant
  const createPeerConnection = async (participantId) => {
    try {
      const pc = new RTCPeerConnection(iceServers);
      
      // Add local stream to peer connection
      if (localStream) {
        localStream.getTracks().forEach(track => {
          const sender = pc.addTrack(track, localStream);
          if (isMobileUA && sender && track.kind === 'video' && sender.setParameters) {
            const params = sender.getParameters();
            params.encodings = [{ maxBitrate: 300000 }];
            sender.setParameters(params).catch(() => {});
          }
        });
      }

      // Handle remote stream
      pc.ontrack = (event) => {
        console.log(`📺 Received remote stream from ${participantId}`);
        const [remoteStream] = event.streams;
        setRemoteStreams(prev => new Map(prev.set(participantId, remoteStream)));
        
        // Assign to video element
        const videoElement = remoteVideoRefs.current.get(participantId);
        attachStreamToVideo(videoElement, remoteStream, participantId);
      };

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('ice-candidate', {
            roomId,
            targetId: participantId,
            candidate: event.candidate
          });
        }
      };

      // Handle connection state changes
      pc.onconnectionstatechange = () => {
        console.log(`🔗 Connection state with ${participantId}:`, pc.connectionState);
        if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
          // Attempt to ICE restart
          try {
            pc.restartIce?.();
          } catch {}
          setTimeout(() => {
            // Only try to renegotiate if still present
            if (peerConnections.get(participantId) === pc) {
              (async () => {
                try {
                  const newOffer = await pc.createOffer({ iceRestart: true });
                  await pc.setLocalDescription(newOffer);
                  socket.emit('webrtc-offer', { roomId, targetId: participantId, offer: newOffer });
                } catch {}
              })();
            }
          }, 1500);
        }
      };

      setPeerConnections(prev => new Map(prev.set(participantId, pc)));

      // Create and send offer with constrained SDP for stability
      const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
      await pc.setLocalDescription(offer);
      
      socket.emit('webrtc-offer', {
        roomId,
        targetId: participantId,
        offer: offer
      });

    } catch (error) {
      console.error(`❌ Error creating peer connection for ${participantId}:`, error);
    }
  };

  // Socket event handlers for WebRTC signaling
  useEffect(() => {
    if (!socket) return;

    const handleWebRTCOffer = async (data) => {
      const { fromId, offer } = data;
      console.log(`📞 Received offer from ${fromId}`);
      
      try {
        let pc = peerConnections.get(fromId);
        if (!pc) {
          pc = new RTCPeerConnection(iceServers);
          
          // Add local stream
          if (localStream) {
            localStream.getTracks().forEach(track => {
              const sender = pc.addTrack(track, localStream);
              if (isMobileUA && sender && track.kind === 'video' && sender.setParameters) {
                const params = sender.getParameters();
                params.encodings = [{ maxBitrate: 300000 }];
                sender.setParameters(params).catch(() => {});
              }
            });
          }

          // Handle remote stream
          pc.ontrack = (event) => {
            console.log(`📺 Received remote stream from ${fromId}`);
            const [remoteStream] = event.streams;
            setRemoteStreams(prev => new Map(prev.set(fromId, remoteStream)));
            
            const videoElement = remoteVideoRefs.current.get(fromId);
            attachStreamToVideo(videoElement, remoteStream, fromId);
          };

          // Handle ICE candidates
          pc.onicecandidate = (event) => {
            if (event.candidate) {
              socket.emit('ice-candidate', {
                roomId,
                targetId: fromId,
                candidate: event.candidate
              });
            }
          };

          setPeerConnections(prev => new Map(prev.set(fromId, pc)));
        }

        await pc.setRemoteDescription(offer);
        const answer = await pc.createAnswer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
        await pc.setLocalDescription(answer);
        
        socket.emit('webrtc-answer', {
          roomId,
          targetId: fromId,
          answer: answer
        });

      } catch (error) {
        console.error(`❌ Error handling offer from ${fromId}:`, error);
      }
    };

    const handleWebRTCAnswer = async (data) => {
      const { fromId, answer } = data;
      console.log(`📞 Received answer from ${fromId}`);
      
      const pc = peerConnections.get(fromId);
      if (pc) {
        try {
          await pc.setRemoteDescription(answer);
        } catch (error) {
          console.error(`❌ Error handling answer from ${fromId}:`, error);
        }
      }
    };

    const handleICECandidate = async (data) => {
      const { fromId, candidate } = data;
      console.log(`🧊 Received ICE candidate from ${fromId}`);
      
      const pc = peerConnections.get(fromId);
      if (pc) {
        try {
          await pc.addIceCandidate(candidate);
        } catch (error) {
          console.error(`❌ Error adding ICE candidate from ${fromId}:`, error);
        }
      }
    };

    socket.on('webrtc-offer', handleWebRTCOffer);
    socket.on('webrtc-answer', handleWebRTCAnswer);
    socket.on('ice-candidate', handleICECandidate);

    return () => {
      socket.off('webrtc-offer', handleWebRTCOffer);
      socket.off('webrtc-answer', handleWebRTCAnswer);
      socket.off('ice-candidate', handleICECandidate);
    };
  }, [socket, roomId, peerConnections, localStream]);

  // Get video element ref for a participant
  const getVideoRef = (participantId) => {
    if (!remoteVideoRefs.current.has(participantId)) {
      remoteVideoRefs.current.set(participantId, null);
    }
    return (element) => {
      remoteVideoRefs.current.set(participantId, element);
      const stream = remoteStreams.get(participantId);
      if (element && stream) {
        attachStreamToVideo(element, stream, participantId);
      }
    };
  };

  // Keep audio sending state in sync with local track without detaching sender (more robust across devices)
  useEffect(() => {
    if (!localStream) return;
    const audioTrack = localStream.getAudioTracks()[0];
    peerConnections.forEach((pc) => {
      try {
        const audioSender = pc.getSenders && pc.getSenders().find(s => s.track && s.track.kind === 'audio');
        if (!audioSender) return;
        if (audioTrack) {
          // Ensure sender is bound to the current track
          if (audioSender.track !== audioTrack) {
            audioSender.replaceTrack(audioTrack).catch(() => {});
          }
          // If force-muted by admin, ensure audio is not sent regardless of local UI
          audioTrack.enabled = isForcedMuted ? false : isAudioEnabled;
        }
      } catch {}
    });
  }, [isAudioEnabled, isForcedMuted, localStream, peerConnections]);

  // Screen share handling: if local stream changes (e.g., to display media), update senders' video track
  useEffect(() => {
    if (!localStream) return;
    const vTrack = localStream.getVideoTracks()[0];
    peerConnections.forEach((pc) => {
      try {
        const videoSender = pc.getSenders && pc.getSenders().find(s => s.track && s.track.kind === 'video');
        if (!videoSender) return;
        if (vTrack && videoSender.track !== vTrack) {
          videoSender.replaceTrack(vTrack).catch(() => {});
        }
      } catch {}
    });
  }, [localStream, peerConnections]);

  // Ensure remote peers stop receiving video when camera is disabled; restore cleanly when enabled
  useEffect(() => {
    if (!localStream) return;
    peerConnections.forEach((pc) => {
      try {
        const videoSender = pc.getSenders && pc.getSenders().find(s => s.track && s.track.kind === 'video');
        if (!videoSender) return;
        if (!isVideoEnabled) {
          videoSender.replaceTrack(null).catch(() => {});
        } else {
          const videoTrack = localStream.getVideoTracks()[0];
          if (videoTrack) {
            videoSender.replaceTrack(videoTrack).catch(() => {});
          } else {
            // If the video track is missing/ended, attempt a lightweight restart
            (async () => {
              try {
                await restartCamera?.();
                const vt = localStream && localStream.getVideoTracks()[0];
                if (vt) videoSender.replaceTrack(vt).catch(() => {});
              } catch {}
            })();
          }
        }
      } catch {}
    });
  }, [isVideoEnabled, localStream, peerConnections, restartCamera]);

  const getGridClass = () => {
    const total = remoteParticipants.length + 1;
    const isSmall = viewportWidth <= 640 || isMobile;
    const isMedium = viewportWidth > 640 && viewportWidth <= 1024;

    if (isSmall) {
      // Portrait mobile: 1 column scroll; Landscape small: 2 columns
      return 'grid-cols-1 auto-rows-[minmax(180px,_auto)] sm:grid-cols-2';
    }

    if (isMedium) {
      if (total <= 2) return 'grid-cols-2';
      if (total <= 4) return 'grid-cols-2 grid-rows-2';
      if (total <= 6) return 'grid-cols-3 grid-rows-2';
      return 'grid-cols-3 grid-rows-3';
    }

    if (total <= 2) return 'grid-cols-2';
    if (total <= 4) return 'grid-cols-2 grid-rows-2';
    if (total <= 6) return 'grid-cols-3 grid-rows-2';
    return 'grid-cols-4 grid-rows-3';
  };

  const sharingParticipantId = (() => {
    const sharer = filteredParticipants.find(p => p.isScreenSharing);
    return sharer ? (sharer.id || sharer.userId) : null;
  })();

  return (
    <div className="h-full p-2 sm:p-4">
      <div className={`grid ${getGridClass()} gap-2 sm:gap-4 h-full`}>
        {/* Local Video */}
        <div className="relative bg-gray-800 rounded-lg overflow-hidden group aspect-video">
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className={`w-full h-full object-cover ${!isVideoEnabled || !localStream ? 'hidden' : ''}`}
          />
          {(!isVideoEnabled || !localStream) && (
            <div className="absolute inset-0 bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-white text-xl font-bold">
                    {userName ? userName.charAt(0).toUpperCase() : 'Y'}
                  </span>
                </div>
                <p className="text-white text-sm font-medium">{userName || 'You'}</p>
                <p className="text-gray-300 text-xs">Camera Off</p>
              </div>
            </div>
          )}
          
          {/* Local user label */}
          <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-sm font-medium">
            You (Host)
          </div>
          
          {/* Audio/Video indicators */}
          <div className="absolute top-2 right-2 flex space-x-1">
            <div className={`p-1 rounded-full ${isAudioEnabled ? 'bg-green-600' : 'bg-red-600'}`}>
              <MicrophoneIcon className={`w-3 h-3 text-white ${!isAudioEnabled ? 'opacity-50' : ''}`} />
            </div>
            <div className={`p-1 rounded-full ${isVideoEnabled ? 'bg-green-600' : 'bg-red-600'}`}>
              <VideoCameraIcon className={`w-3 h-3 text-white ${!isVideoEnabled ? 'opacity-50' : ''}`} />
            </div>
          </div>
        </div>

        {/* Remote Videos */}
        {remoteParticipants.map((participant, index) => {
          const participantName = participant.userName || participant.name || `User ${index + 1}`;
          const participantId = participant.id || participant.userId || `participant-${index}`;
          const isHost = participant.role === 'host';
          const isCoHost = participant.role === 'co-host' || participant.isCoHost;
          const hasRemoteStream = remoteStreams.has(participantId);
          // Default to NOT muted unless explicitly true
          const isVideoMuted = participant.isVideoMuted === true;
          const isAudioMuted = participant.isAudioMuted === true;
          const isSharing = !!participant.isScreenSharing;
          
          return (
            <div 
              key={participantId}
              className={`relative bg-gray-800 rounded-lg overflow-hidden group aspect-video ${
                sharingParticipantId && participantId === sharingParticipantId ? 'col-span-full' : ''
              }`}
            >
              {/* Remote Video Stream */}
              <video
                ref={getVideoRef(participantId)}
                autoPlay
                playsInline
                className={`w-full h-full object-cover ${!hasRemoteStream || isVideoMuted ? 'hidden' : ''}`}
              />
              
              {/* Placeholder when no video */}
              {(!hasRemoteStream || isVideoMuted) && (
                <div className="absolute inset-0 bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center p-2">
                  <div className="text-center">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-2">
                      <span className="text-white text-xl font-bold">
                        {participantName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <p className="text-white text-xs sm:text-sm font-medium truncate max-w-[90%] mx-auto">{participantName}</p>
                    <p className="text-gray-300 text-xs">{!hasRemoteStream ? 'Connecting...' : 'Camera Off'}</p>
                  </div>
                </div>
              )}
              
              {/* Participant info */}
              <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-sm flex items-center space-x-1">
                <span className="font-medium">{participantName}</span>
                {isHost && <span className="bg-blue-600 px-1 rounded text-xs font-bold">HOST</span>}
                {isCoHost && <span className="bg-purple-600 px-1 rounded text-xs font-bold">CO-HOST</span>}
              </div>
              
              {/* Audio/Video indicators */}
              <div className="absolute top-1 right-1 sm:top-2 sm:right-2 flex space-x-1">
                <div className={`p-1 rounded-full ${!isAudioMuted ? 'bg-green-600' : 'bg-red-600'}`}>
                  <MicrophoneIcon className={`w-3 h-3 text-white ${isAudioMuted ? 'opacity-50' : ''}`} />
                </div>
                <div className={`p-1 rounded-full ${!isVideoMuted && hasRemoteStream ? 'bg-green-600' : 'bg-red-600'}`}>
                  <VideoCameraIcon className={`w-3 h-3 text-white ${isVideoMuted || !hasRemoteStream ? 'opacity-50' : ''}`} />
                </div>
              </div>
              
              {/* Connection / Sharing status */}
              <div className="absolute top-1 left-1 sm:top-2 sm:left-2 flex items-center space-x-1 sm:space-x-2">
                {isSharing && (
                  <div className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium">
                    Sharing Screen
                  </div>
                )}
                {!hasRemoteStream && (
                  <div className="bg-yellow-600 text-white px-2 py-1 rounded text-xs font-medium animate-pulse">
                    Connecting...
                  </div>
                )}
              </div>
              
              {/* Screen sharing indicator */}
              {participant.isScreenSharing && (
                <div className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium">
                  📺 Sharing Screen
                </div>
              )}
            </div>
          );
        })}

        {/* Waiting message when no participants */}
        {participants.length === 0 && (
          <div className="col-span-full flex items-center justify-center text-gray-400 text-lg">
            <div className="text-center p-8">
              <UserIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-semibold mb-2">Waiting for others to join...</h3>
              <p className="text-gray-500">Share the room ID to invite participants</p>
              <div className="mt-4 bg-gray-800 text-white px-4 py-2 rounded-lg font-mono text-sm">
                Room ID: {roomId}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* WebRTC Debug Info (only in development) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 bg-black bg-opacity-80 text-white p-2 rounded text-xs max-w-xs">
          <div>Peers: {peerConnections.size}</div>
          <div>Remote Streams: {remoteStreams.size}</div>
          <div>Local Stream: {localStream ? 'Active' : 'None'}</div>
        </div>
      )}
    </div>
  );
};

export default WebRTCVideoGrid;
