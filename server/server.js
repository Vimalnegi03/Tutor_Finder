import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import connectDB from './connectToDb/db.js';
import userRoutes from './routes/userRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import cors from 'cors';
import Chat from './models/chat.js';
import emailRoutes from './routes/emailRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import groupRoutes from './routes/groupRoutes.js';
import messageRoutes from './routes/messageRoutes.js'
import authRoutes from './routes/authRoutes.js'
const app = express();
const httpServer = createServer(app);

// CORS Middleware (must come before routes)
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Initialize Socket.IO
export const io = new Server(httpServer, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Connect to database
connectDB();

// Routes (should be outside socket connection)
app.use('/api/users', userRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/auth',authRoutes);
// Socket.IO Logic
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('joinGroup', (groupId) => {
    socket.join(groupId);
    console.log(`Socket ${socket.id} joined group room ${groupId}`);
  });
  
  socket.on('leaveGroup', (groupId) => {
    socket.leave(groupId);
    console.log(`Socket ${socket.id} left group room ${groupId}`);
  });

  // Join room based on user ID
  socket.on('joinRoom', (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined their room`);
  });

  // Handle sending messages
  socket.on('sendMessage', async ({ senderId, receiverId, message, file }) => {
    try {
      const newMessage = new Chat({
        senderId,
        receiverId,
        message,
        ...(file && { media: file }) // Add media if exists
      });

      const savedMessage = await newMessage.save();
console.log(savedMessage);
      // Emit to sender (for confirmation)
      io.to(senderId).emit('messageSent', savedMessage);
      console.log('Emitting message to receiver:', receiverId);
      
      // Emit to receiver
      io.to(receiverId).emit('newMessage', savedMessage);

    } catch (error) {
      console.error('Error saving message:', error);
      socket.emit('messageError', { error: 'Failed to send message' });
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});