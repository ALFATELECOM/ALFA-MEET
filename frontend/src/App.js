import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import HomePage from './pages/HomePage';
import RoomPage from './pages/RoomPage';
import JoinPage from './pages/JoinPage';
import { SocketProvider } from './context/SocketContext';
import { MediaProvider } from './context/MediaContext';

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
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#374151',
                  color: '#fff',
                },
              }}
            />
          </MediaProvider>
        </SocketProvider>
      </Router>
    </div>
  );
}

export default App;
