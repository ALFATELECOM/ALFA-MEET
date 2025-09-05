import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { SocketProvider } from './context/SocketContext';
import { MediaProvider } from './context/MediaContext';
import { AdminProvider } from './context/AdminContext';
import { RewardsProvider } from './context/RewardsContext';
import { ReactionsProvider } from './context/ReactionsContext';
import { MeetingFeaturesProvider } from './context/MeetingFeaturesContext';
import { SimpleMeetingProvider } from './context/SimpleMeetingContext';
import HomePage from './pages/HomePage';
import ZoomHomePage from './pages/ZoomHomePage';
import JoinPage from './pages/JoinPage';
import RoomPage from './pages/RoomPage';
import MobileOptimizedRoom from './components/MobileOptimizedRoom';
import WebinarRoom from './components/WebinarRoom';
import SmartRoomRouter from './components/SmartRoomRouter';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import SimpleMeetingDashboard from './pages/SimpleMeetingDashboard';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <div className="App">
      <Router>
        <AdminProvider>
          <SimpleMeetingProvider>
            <RewardsProvider>
              <ReactionsProvider>
                <MeetingFeaturesProvider>
                  <SocketProvider>
                    <MediaProvider>
                    <Routes>
                      <Route path="/" element={<ZoomHomePage />} />
                      <Route path="/classic" element={<HomePage />} />
                      <Route path="/join/:roomId" element={<JoinPage />} />
                      <Route path="/room/:roomId" element={<SmartRoomRouter />} />
                      <Route path="/mobile/:roomId" element={<MobileOptimizedRoom />} />
                      <Route path="/webinar/:roomId" element={<WebinarRoom />} />
                      <Route path="/admin/login" element={<AdminLogin />} />
                      <Route 
                        path="/admin/dashboard" 
                        element={
                          <ProtectedRoute>
                            <AdminDashboard />
                          </ProtectedRoute>
                        } 
                      />
                      <Route path="/simple" element={<SimpleMeetingDashboard />} />
                    </Routes>
                  </MediaProvider>
                </SocketProvider>
              </MeetingFeaturesProvider>
            </ReactionsProvider>
          </RewardsProvider>
        </SimpleMeetingProvider>
      </AdminProvider>
      </Router>
    </div>
  );
}

export default App;
