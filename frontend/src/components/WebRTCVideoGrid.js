import React, { useRef, useEffect, useState } from 'react';
import { useMedia } from '../context/MediaContext';
import { useSocket } from '../context/SocketContext';
import { UserIcon, MicrophoneIcon, VideoCameraIcon } from '@heroicons/react/24/outline';

const WebRTCVideoGrid = ({ participants = [], roomId, userId, userName }) => {
  const { localVideoRef, isVideoEnabled, isAudioEnabled, localStream } = useMedia();
  const { socket } = useSocket();
  
  // Store peer connections and remote streams
  const [peerConnections, setPeerConnections] = useState(new Map());
  const [remoteStreams, setRemoteStreams] = useState(new Map());
  const remoteVideoRefs = useRef(new Map());

  // ICE servers configuration
  const iceServers = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ]
  };

  // Initialize WebRTC connections when participants change
  useEffect(() => {
    if (!socket || !localStream) return;

    participants.forEach(participant => {
      const participantId = participant.id || participant.userId;
      if (participantId && participantId !== userId && !peerConnections.has(participantId)) {
        createPeerConnection(participantId);
      }
    });

    // Clean up connections for participants who left
    peerConnections.forEach((pc, participantId) => {
      const stillPresent = participants.some(p => (p.id || p.userId) === participantId);
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
  }, [participants, socket, localStream, userId, peerConnections]);

  // Create peer connection for a participant
  const createPeerConnection = async (participantId) => {
    try {
      const pc = new RTCPeerConnection(iceServers);
      
      // Add local stream to peer connection
      if (localStream) {
        localStream.getTracks().forEach(track => {
          pc.addTrack(track, localStream);
        });
      }

      // Handle remote stream
      pc.ontrack = (event) => {
        console.log(`📺 Received remote stream from ${participantId}`);
        const [remoteStream] = event.streams;
        setRemoteStreams(prev => new Map(prev.set(participantId, remoteStream)));
        
        // Assign to video element
        const videoElement = remoteVideoRefs.current.get(participantId);
        if (videoElement && remoteStream) {
          videoElement.srcObject = remoteStream;
          videoElement.play().catch(console.error);
        }
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
          // Attempt to reconnect
          setTimeout(() => createPeerConnection(participantId), 2000);
        }
      };

      setPeerConnections(prev => new Map(prev.set(participantId, pc)));

      // Create and send offer
      const offer = await pc.createOffer();
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
              pc.addTrack(track, localStream);
            });
          }

          // Handle remote stream
          pc.ontrack = (event) => {
            console.log(`📺 Received remote stream from ${fromId}`);
            const [remoteStream] = event.streams;
            setRemoteStreams(prev => new Map(prev.set(fromId, remoteStream)));
            
            const videoElement = remoteVideoRefs.current.get(fromId);
            if (videoElement && remoteStream) {
              videoElement.srcObject = remoteStream;
              videoElement.play().catch(console.error);
            }
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
        const answer = await pc.createAnswer();
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
        element.srcObject = stream;
        element.play().catch(console.error);
      }
    };
  };

  const getGridClass = () => {
    const totalParticipants = participants.length + 1;
    if (totalParticipants === 1) return 'grid-cols-1';
    if (totalParticipants === 2) return 'grid-cols-2';
    if (totalParticipants <= 4) return 'grid-cols-2 grid-rows-2';
    if (totalParticipants <= 6) return 'grid-cols-3 grid-rows-2';
    return 'grid-cols-3 grid-rows-3';
  };

  return (
    <div className="h-full p-4">
      <div className={`grid ${getGridClass()} gap-4 h-full`}>
        {/* Local Video */}
        <div className="relative bg-gray-800 rounded-lg overflow-hidden group">
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
        {participants.map((participant, index) => {
          const participantName = participant.userName || participant.name || `User ${index + 1}`;
          const participantId = participant.id || participant.userId || `participant-${index}`;
          const isHost = participant.role === 'host';
          const isCoHost = participant.role === 'co-host' || participant.isCoHost;
          const hasRemoteStream = remoteStreams.has(participantId);
          const isVideoMuted = participant.isVideoMuted !== false; // Default to muted if not specified
          const isAudioMuted = participant.isAudioMuted !== false;
          
          return (
            <div key={participantId} className="relative bg-gray-800 rounded-lg overflow-hidden group">
              {/* Remote Video Stream */}
              <video
                ref={getVideoRef(participantId)}
                autoPlay
                playsInline
                className={`w-full h-full object-cover ${!hasRemoteStream || isVideoMuted ? 'hidden' : ''}`}
              />
              
              {/* Placeholder when no video */}
              {(!hasRemoteStream || isVideoMuted) && (
                <div className="absolute inset-0 bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-2">
                      <span className="text-white text-xl font-bold">
                        {participantName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <p className="text-white text-sm font-medium">{participantName}</p>
                    <p className="text-gray-300 text-xs">
                      {!hasRemoteStream ? 'Connecting...' : 'Camera Off'}
                    </p>
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
              <div className="absolute top-2 right-2 flex space-x-1">
                <div className={`p-1 rounded-full ${!isAudioMuted ? 'bg-green-600' : 'bg-red-600'}`}>
                  <MicrophoneIcon className={`w-3 h-3 text-white ${isAudioMuted ? 'opacity-50' : ''}`} />
                </div>
                <div className={`p-1 rounded-full ${!isVideoMuted && hasRemoteStream ? 'bg-green-600' : 'bg-red-600'}`}>
                  <VideoCameraIcon className={`w-3 h-3 text-white ${isVideoMuted || !hasRemoteStream ? 'opacity-50' : ''}`} />
                </div>
              </div>
              
              {/* Connection status */}
              <div className="absolute top-2 left-2">
                {hasRemoteStream ? (
                  <div className="bg-green-600 text-white px-2 py-1 rounded text-xs font-medium">
                    Connected
                  </div>
                ) : (
                  <div className="bg-yellow-600 text-white px-2 py-1 rounded text-xs font-medium animate-pulse">
                    Connecting...
                  </div>
                )}
              </div>
              
              {/* Screen sharing indicator */}
              {participant.isScreenSharing && (
                <div className="absolute bottom-2 right-2 bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium">
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
