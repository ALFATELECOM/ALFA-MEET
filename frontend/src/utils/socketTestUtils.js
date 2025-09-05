// Socket connection testing utilities

export const testSocketConnection = (serverUrl = 'http://localhost:5000') => {
  return new Promise((resolve, reject) => {
    console.log('🔌 Testing socket connection to:', serverUrl);
    
    try {
      // Test basic HTTP connection first
      fetch(`${serverUrl}/health`)
        .then(response => response.json())
        .then(data => {
          console.log('✅ HTTP connection successful:', data);
          resolve({ http: true, data });
        })
        .catch(error => {
          console.error('❌ HTTP connection failed:', error);
          reject({ http: false, error: error.message });
        });
    } catch (error) {
      console.error('❌ Connection test failed:', error);
      reject({ http: false, error: error.message });
    }
  });
};

export const createTestRoom = () => {
  const roomId = Math.random().toString(36).substring(2, 15);
  const testUsers = [
    { id: `user-1-${Date.now()}`, name: 'Test User 1', role: 'host' },
    { id: `user-2-${Date.now()}`, name: 'Test User 2', role: 'participant' },
    { id: `user-3-${Date.now()}`, name: 'Test User 3', role: 'participant' }
  ];
  
  console.log('🧪 Created test room:', roomId);
  console.log('👥 Test users:', testUsers);
  
  return { roomId, testUsers };
};

export const simulateMultipleUsers = (socket, roomId, testUsers) => {
  console.log('🎭 Simulating multiple users joining room:', roomId);
  
  testUsers.forEach((user, index) => {
    setTimeout(() => {
      console.log(`👤 Simulating user ${user.name} joining...`);
      socket.emit('join-room', {
        roomId,
        userId: user.id,
        userName: user.name,
        userData: { role: user.role }
      });
    }, index * 1000); // Stagger joins by 1 second
  });
};

export const debugSocketEvents = (socket) => {
  const events = [
    'connect',
    'disconnect',
    'joined-room',
    'user-joined',
    'user-left',
    'room-participants',
    'new-message',
    'error'
  ];
  
  events.forEach(event => {
    socket.on(event, (data) => {
      console.log(`🔔 Socket Event [${event}]:`, data);
    });
  });
  
  console.log('🐛 Debug listeners attached for events:', events);
};



