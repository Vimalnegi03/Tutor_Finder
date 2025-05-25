import { io } from 'socket.io-client';
import { socketMessageReceived } from './store/Slices/messageSlice'
const socket = io('https://major-project-1m4u.onrender.com', {
  withCredentials: true,
  autoConnect: true
});

// Join user's room on login
socket.emit('joinRoom', currentUserId);

socket.on('newMessage', (message) => {
  store.dispatch(socketMessageReceived(message));
});
