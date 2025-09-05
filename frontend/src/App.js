import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { SocketProvider } from './context/SocketContext';
import { MediaProvider } from './context/MediaContext';
import HomePage from './pages/HomePage';
import JoinPage from './pages/JoinPage';
import RoomPage from './pages/RoomPage';

function App() {
  return (
    <div className="App">
      <Router>
        <SocketProvider>
          <MediaProvider>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/join/:roomId" element={<JoinPage />} />
              <Route path="/room/:roomId" element={<RoomPage />} />
            </Routes>
          </MediaProvider>
        </SocketProvider>
      </Router>
    </div>
  );
}

export default App;
