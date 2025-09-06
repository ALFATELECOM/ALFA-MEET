import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { SocketProvider } from './context/SocketContext';
import { MediaProvider } from './context/MediaContext';
import { AdminProvider } from './context/AdminContext';
import HomePage from './pages/HomePage';
import ZoomHomePage from './pages/ZoomHomePage';
import JoinPage from './pages/JoinPage';
import RoomPage from './pages/RoomPage';
import MobileOptimizedRoom from './components/MobileOptimizedRoom';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import SimpleMeetingDashboard from './pages/SimpleMeetingDashboard';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <div className="App">
      <Router>
        <SocketProvider>
          <MediaProvider>
            <Routes>
              <Route path="/" element={<ZoomHomePage />} />
              <Route path="/join/:roomId" element={<JoinPage />} />
              <Route path="/room/:roomId" element={<RoomPage />} />
              <Route path="/mobile/:roomId" element={<MobileOptimizedRoom />} />
            </Routes>
          </MediaProvider>
        </SocketProvider>
      </Router>
    </div>
  );
}

export default App;
