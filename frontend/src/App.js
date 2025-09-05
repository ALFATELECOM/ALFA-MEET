import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { SocketProvider } from './context/SocketContext';
import { MediaProvider } from './context/MediaContext';
import { AdminProvider } from './context/AdminContext';
import { RewardsProvider } from './context/RewardsContext';
import { ReactionsProvider } from './context/ReactionsContext';
import { MeetingFeaturesProvider } from './context/MeetingFeaturesContext';
import HomePage from './pages/HomePage';
import JoinPage from './pages/JoinPage';
import RoomPage from './pages/RoomPage';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <div className="App">
      <Router>
        <AdminProvider>
          <RewardsProvider>
            <ReactionsProvider>
              <MeetingFeaturesProvider>
                <SocketProvider>
                  <MediaProvider>
                    <Routes>
                      <Route path="/" element={<HomePage />} />
                      <Route path="/join/:roomId" element={<JoinPage />} />
                      <Route path="/room/:roomId" element={<RoomPage />} />
                      <Route path="/admin/login" element={<AdminLogin />} />
                      <Route 
                        path="/admin/dashboard" 
                        element={
                          <ProtectedRoute>
                            <AdminDashboard />
                          </ProtectedRoute>
                        } 
                      />
                    </Routes>
                  </MediaProvider>
                </SocketProvider>
              </MeetingFeaturesProvider>
            </ReactionsProvider>
          </RewardsProvider>
        </AdminProvider>
      </Router>
    </div>
  );
}

export default App;
