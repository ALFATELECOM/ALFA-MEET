import React, { useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import RoomPage from '../pages/RoomPage';
import MobileOptimizedRoom from './MobileOptimizedRoom';
import WebinarRoom from './WebinarRoom';

const SmartRoomRouter = () => {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const meetingType = location.state?.meetingType || 'meeting';
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                     window.innerWidth <= 768;
    
    // Route based on meeting type and device
    if (meetingType === 'webinar') {
      navigate(`/webinar/${roomId}`, { 
        state: location.state,
        replace: true 
      });
    } else if (isMobile) {
      navigate(`/mobile/${roomId}`, { 
        state: location.state,
        replace: true 
      });
    }
    // Otherwise stay on regular room page
  }, [roomId, location.state, navigate]);

  // Default to regular room page for desktop meetings
  return <RoomPage />;
};

export default SmartRoomRouter;
