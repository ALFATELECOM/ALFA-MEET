# Video Conferencing Platform

A professional video conferencing platform similar to Zoom, built with React, Node.js, Socket.io, and WebRTC. Features both meeting and webinar modes with comprehensive participant management.

## 🚀 Features

### Core Features
- **HD Video Calling**: Crystal clear video quality with adaptive bitrate
- **Real-time Audio**: High-quality audio communication
- **Screen Sharing**: Share your screen with all participants
- **Chat System**: Real-time messaging during calls
- **Recording**: Host can record meetings (UI ready, backend integration needed)

### Meeting Mode
- Interactive meetings with up to 100 participants
- All participants can unmute and share video
- Equal participation rights
- Collaborative environment

### Webinar Mode
- Host-controlled environment
- Attendees join muted by default
- Host can mute/unmute specific participants
- Host can remove participants
- Ideal for presentations and large audiences

### Host Controls
- Mute/unmute participants
- Remove participants from room
- Start/stop recording
- End room for all participants
- Comprehensive participant management

### Additional Features
- Responsive design for all devices
- Modern, intuitive UI with dark theme
- Real-time participant list
- Room link sharing
- Cross-browser compatibility
- Mobile-friendly interface

## 🛠️ Technology Stack

### Frontend
- **React 18**: Modern React with hooks
- **Tailwind CSS**: Utility-first CSS framework
- **Framer Motion**: Smooth animations and transitions
- **Socket.io Client**: Real-time communication
- **React Router**: Client-side routing
- **Heroicons**: Beautiful SVG icons

### Backend
- **Node.js**: JavaScript runtime
- **Express.js**: Web application framework
- **Socket.io**: Real-time bidirectional communication
- **WebRTC**: Peer-to-peer video/audio communication
- **UUID**: Unique identifier generation

### Deployment
- **Frontend**: Vercel (configured)
- **Backend**: Render (configured)
- **GitHub**: Version control and deployment source

## 📦 Installation & Setup

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Modern web browser with WebRTC support

### Local Development

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd zoom-clone
   ```

2. **Install dependencies**
   ```bash
   npm run install-all
   ```

3. **Set up environment variables**
   
   Backend (`backend/.env`):
   ```env
   PORT=5000
   FRONTEND_URL=http://localhost:3000
   NODE_ENV=development
   ```
   
   Frontend (`frontend/.env.local`):
   ```env
   REACT_APP_SERVER_URL=http://localhost:5000
   ```

4. **Start development servers**
   ```bash
   npm run dev
   ```

   This will start both frontend (port 3000) and backend (port 5000) simultaneously.

5. **Access the application**
   - Open http://localhost:3000 in your browser
   - Create a room or join an existing one

## 🚀 Deployment

### Deploy to Vercel (Frontend)

1. **Connect to Vercel**
   - Push your code to GitHub
   - Connect your GitHub repository to Vercel
   - Vercel will automatically detect the React app in the `frontend` folder

2. **Environment Variables**
   Set the following environment variable in Vercel:
   ```
   REACT_APP_SERVER_URL=https://your-backend-url.onrender.com
   ```

3. **Build Settings**
   - Build Command: `cd frontend && npm run build`
   - Output Directory: `frontend/build`

### Deploy to Render (Backend)

1. **Connect to Render**
   - Push your code to GitHub
   - Create a new Web Service on Render
   - Connect your GitHub repository

2. **Build Settings**
   - Build Command: `cd backend && npm install`
   - Start Command: `cd backend && npm start`
   - Environment: Node

3. **Environment Variables**
   Set the following environment variables in Render:
   ```
   NODE_ENV=production
   PORT=5000
   FRONTEND_URL=https://your-frontend-url.vercel.app
   ```

## 📱 Usage

### Creating a Room
1. Enter your name and room name
2. Choose between Meeting or Webinar mode
3. Click "Create Room"
4. Set up your camera and microphone
5. Click "Start Room"

### Joining a Room
1. Enter the room ID or use a shared link
2. Enter your name
3. Set up your camera and microphone
4. Click "Join Room"

### During a Call
- **Mute/Unmute**: Toggle your microphone
- **Camera On/Off**: Toggle your camera
- **Screen Share**: Share your screen with participants
- **Chat**: Send messages to all participants
- **Participants**: View and manage participants (host only)

### Host Controls (Meeting & Webinar Mode)
- Mute specific participants
- Remove participants from the room
- Start/stop recording
- End the room for all participants
- Copy room link for sharing

## 🔧 Configuration

### WebRTC Configuration
The application uses Google's STUN servers by default. For production, consider using your own TURN servers:

```javascript
const rtcConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    // Add your TURN servers here
    {
      urls: 'turn:your-turn-server.com:3478',
      username: 'your-username',
      credential: 'your-password'
    }
  ],
};
```

### Room Types
- **Meeting**: Interactive mode where all participants can speak and share video
- **Webinar**: Host-controlled mode where attendees are muted by default

## 🐛 Troubleshooting

### Common Issues

1. **Camera/Microphone not working**
   - Ensure browser has permission to access camera/microphone
   - Check if other applications are using the camera
   - Try refreshing the page

2. **Can't connect to other participants**
   - Check firewall settings
   - Ensure WebRTC is supported in your browser
   - Try using a different network

3. **Audio echo or feedback**
   - Use headphones
   - Ensure participants are not too close to each other
   - Check microphone sensitivity settings

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- WebRTC for peer-to-peer communication
- Socket.io for real-time messaging
- Tailwind CSS for beautiful styling
- Heroicons for the icon set
- Framer Motion for smooth animations

## 📞 Support

If you have any questions or need help, please open an issue on GitHub or contact the development team.

---

Built with ❤️ for seamless video communication
