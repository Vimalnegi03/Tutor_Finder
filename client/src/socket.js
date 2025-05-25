import { io } from 'socket.io-client';
import { socketMessageReceived } from './store/Slices/messageSlice'
const socket = io('http://localhost:5000', {
  withCredentials: true,
  autoConnect: true
});

// Join user's room on login
socket.emit('joinRoom', currentUserId);

socket.on('newMessage', (message) => {
  store.dispatch(socketMessageReceived(message));
});