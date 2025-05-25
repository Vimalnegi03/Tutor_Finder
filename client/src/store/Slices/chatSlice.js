import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { url } from '../../url';
import io from 'socket.io-client';
import {
  addNewMessage as addGroupMessage, 
  incrementUnreadCount  as incrementGroupUnreadCount
} from './groupSlice';

// Initialize socket outside of the slice (module scope)
let socket = null;

const initialState = {
  messages: [],
  currentChat: {
    tutorId: null,
    learnerId: null,
    tutorName: '',
    tutorPhoto: '',
    learnerName: '',
    learnerPhoto: ''
  },
  loading: false,
  error: null,
  onlineUsers: [],
  unreadCount: 0,
  // unreadCountsByPartner: {},
  uploadProgress: 0,
  isConnected: false
};

// Async Thunks
export const fetchChatHistory = createAsyncThunk(
  'chat/fetchChatHistory',
  async ({ learnerId, tutorId }, { rejectWithValue, dispatch, getState }) => {
    try {
      // Step 1: Fetch the history
      const response = await axios.get(`${url}/api/chats/${learnerId}/${tutorId}`);
      const chatHistoryData = response.data;

      // Step 2: After history is fetched, dispatch markMessagesAsRead
      // We need to know who the currently logged-in user is to do this correctly.
      const loggedInUser = getState().auth.user;
      const loggedInUserId = loggedInUser?.id; // Assuming 'id' is the key

      if (loggedInUserId && chatHistoryData && chatHistoryData.length > 0) {
        // Determine who the 'other user' is in this chat context
        let otherUserIdInChat;
        if (loggedInUserId === learnerId) {
          otherUserIdInChat = tutorId;
        } else if (loggedInUserId === tutorId) {
          otherUserIdInChat = learnerId;
        } else {
          // This case means the loggedInUser is not part of the chat they are fetching.
          // This shouldn't happen if UI logic is correct.
          console.error("[fetchChatHistory] Logged-in user is not part of the fetched chat. Cannot mark messages as read.");
          // Proceed without marking read or throw an error if this is unexpected.
          return chatHistoryData;
        }

        // Dispatch markMessagesAsRead:
        // - 'senderId' is the ID of the person whose messages are being marked (the other user).
        // - 'receiverId' is the ID of the person who is doing the reading (the logged-in user).
        console.log(`[fetchChatHistory] Dispatching markMessagesAsRead. Other user (sender): ${otherUserIdInChat}, Logged-in user (receiver): ${loggedInUserId}`);
        dispatch(markMessagesAsRead({ senderId: otherUserIdInChat, receiverId: loggedInUserId }));
      } else if (!loggedInUserId) {
        console.warn("[fetchChatHistory] Cannot mark messages as read: loggedInUserId is undefined.");
      }

      return chatHistoryData; // Return the fetched history
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch chat history');
    }
  }
);


export const sendNewMessage = createAsyncThunk(
  'chat/sendNewMessage',
  async ({ senderId, receiverId, message, files = [], tempId }, { rejectWithValue, dispatch }) => {
    try {
      const formData = new FormData();
      formData.append('senderId', senderId);
      formData.append('receiverId', receiverId);
      formData.append('tempId', tempId);
      if (message) formData.append('message', message);
      
      files.forEach((file) => {
        formData.append('files', file, file.name);
      });

      const response = await axios.post(`${url}/api/chats`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round(
            (progressEvent.loaded * 100) / (progressEvent.total || 1)
          );
          dispatch(updateUploadProgress(progress));
        }
      });

      return { ...response.data, tempId };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to send message');
    }
  }
);

export const markMessagesAsRead = createAsyncThunk(
  'chat/markMessagesAsRead',
  // senderId: ID of the person WHO SENT the messages (the other user)
  // receiverId: ID of the person WHO IS READING the messages (the current logged-in user)
  async ({ senderId, receiverId }, { rejectWithValue, dispatch }) => {
    try {
     
      console.log(`[Thunk markMessagesAsRead] Calling API: /mark-read/${senderId}/${receiverId}`);
      await axios.put(`${url}/api/chats/mark-read/${senderId}/${receiverId}`); // <<< CORRECTED ORDER

      dispatch(chatSlice.actions.resetCurrentChatUnreadCount());
      return { senderId, receiverId };
    } catch (error) {
      console.error(`[Thunk markMessagesAsRead] API call failed for sender ${senderId}, receiver ${receiverId}:`, error.response?.data || error.message);
      return rejectWithValue(error.response?.data?.message || 'Failed to mark messages as read');
    }
  }
);

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    addLocalMessage: (state, action) => {
      const existingMessage = state.messages.find(
        m => m.tempId === action.payload.tempId
      );
      if (!existingMessage) {
        state.messages.push({
          ...action.payload,
          _id: action.payload.tempId || `temp-${Date.now()}`,
          isLocal: true,
          createdAt: new Date().toISOString(),
          status: 'sending'
        });
      }
    },

    receiveSocketMessage: (state, action) => {
      const msg = action.payload;
      const existingIndex = state.messages.findIndex(m =>
        (m._id === msg._id) ||
        (m.tempId && m.tempId === msg.tempId)
      );
     
      if (existingIndex >= 0) {
        state.messages[existingIndex] = {
          ...msg,
          isLocal: state.messages[existingIndex].isLocal
        };
      } else {
        state.messages.push(msg);
      }
    },
    addNewMessage: (state, action) => {
      const newMessage = action.payload;
      const exists = state.messages.some(
        msg => msg._id === newMessage._id || msg.tempId === newMessage.tempId
      );
      
      if (!exists) {
        state.messages.push(newMessage);
        
        
      }
    },
    setCurrentChat: (state, action) => {
      state.currentChat = {
        ...state.currentChat,
        ...action.payload
      };
      state.messages = []; // Clear messages for the new chat
      state.unreadCount = 0; // <<< RESET UNREAD COUNT HERE
      state.loading = true; // To trigger fetching history
  
    },
    updateOnlineUsers: (state, action) => {
      state.onlineUsers = action.payload;
    },
    resetChatState: () => {
      Object.assign(state, initialState);
    },
    updateUploadProgress: (state, action) => {
      state.uploadProgress = action.payload;
    },
    updateMessageStatus: (state, action) => {
      const { messageId, status, tempId } = action.payload;
      const messageIndex = state.messages.findIndex(m => 
        m._id === messageId || (tempId && m.tempId === tempId)
      );
      if (messageIndex !== -1) {
        state.messages[messageIndex].status = status;
      }
    },
    updateSocketConnection: (state, action) => {
      state.isConnected = action.payload;
    },
    resetCurrentChatUnreadCount: (state) => {
      state.unreadCount = 0;
  },
  incrementUnreadCount: (state) => {
    state.unreadCount++;
        console.log(`[ChatSlice Reducer] incrementUnreadCount. New unreadCount: ${state.unreadCount}`);
  },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchChatHistory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchChatHistory.fulfilled, (state, action) => {
        state.loading = false;
        state.messages = action.payload.map(msg => ({
          ...msg,
          createdAt: msg.createdAt || new Date().toISOString(),
          formattedTime: msg.formattedTime || new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          formattedDate: msg.formattedDate || new Date(msg.createdAt).toLocaleDateString()
        }));
      })
      .addCase(fetchChatHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(sendNewMessage.pending, (state) => {
        state.uploadProgress = 0;
      })
      .addCase(sendNewMessage.fulfilled, (state) => {
        state.uploadProgress = 100;
      })
      .addCase(sendNewMessage.rejected, (state, action) => {
        state.uploadProgress = 0;
        if (action.meta.arg.tempId) {
          const messageIndex = state.messages.findIndex(m => m.tempId === action.meta.arg.tempId);
          if (messageIndex !== -1) {
            state.messages[messageIndex].status = 'failed';
          }
        }
      })
      .addCase(markMessagesAsRead.fulfilled, (state, action) => {
        const { senderId, receiverId } = action.payload;
        state.messages.forEach(msg => {
          if (msg.senderId === senderId && msg.receiverId === receiverId) {
            msg.status = 'read';
          }
        });
      });
  }
});

export const setupSocketListeners = (userId) => (dispatch, getState) => {
  if (socket && socket.connected) {
    // Already connected
    return;
  }

  
  if (!socket || socket.disconnected) {
    socket = io(url, {
      autoConnect: true,
      withCredentials: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      transports: ['websocket'],
      auth: { userId }
    });

    const handleConnect = () => {
      dispatch(updateSocketConnection(true));
      socket.emit('joinRoom', userId);
    };

    const handleDisconnect = (reason) => {
      dispatch(updateSocketConnection(false));
      if (reason === 'io server disconnect') {
        setTimeout(() => socket.connect(), 1000);
      }
    };

    const handleNewMessage = (message) => {
      console.log('[Socket Global Listener] Received newMessage event:', message);
      const loggedInUser = getState().auth.user;
      const loggedInUserId = loggedInUser?.id;

      if (!loggedInUserId) {
          console.warn("[Socket Global Listener] No loggedInUserId found, cannot process message.");
          return;
      }

      // --- GROUP MESSAGE ---
      if (message.group && message.sender) {
        console.log(`[Socket Global Listener] Detected GROUP message for group ${message.group._id || message.group}`);
        dispatch(addGroupMessage(message)); // To groupSlice

        const currentGroupInDetailView = getState().groups.currentGroup;
        if (message.sender._id !== loggedInUserId &&
            currentGroupInDetailView?._id !== (message.group._id || message.group)) {
          console.log(`[Socket Global Listener] Incrementing unread count for group ${message.group._id || message.group}`);
          dispatch(incrementGroupUnreadCount({ groupId: (message.group._id || message.group) }));
        }
      }
      // --- ONE-ON-ONE MESSAGE ---
      else if (message.receiverId && message.senderId) {
        console.log(`[Socket Global Listener] Detected 1-ON-1 message. For receiver: ${message.receiverId}, My ID: ${loggedInUserId}`);

        // Only process further if the message is FOR the logged-in user
        if (message.receiverId === loggedInUserId) {
            console.log(`[Socket Global Listener] 1-on-1 message is FOR ME.`);
            // Add the message to the local state (e.g., to the messages array for the active chat if open)
            // This dispatch will add it to state.messages if currentChat matches, or just hold it if not.
            // The addNewMessage reducer should be robust enough to handle this.
            dispatch(chatSlice.actions.addNewMessage(message));

            const { currentChat } = getState().chat;
            console.log('[Socket handleNewMessage] Current Chat State (for 1-on-1):', JSON.stringify(currentChat));
            console.log('[Socket handleNewMessage] Incoming Message Sender/Receiver:', message.senderId, message.receiverId);

            // Check if the incoming message belongs to the currently ACTIVE 1-on-1 chat
            const isForCurrentActiveChat = currentChat &&
                currentChat.learnerId && // Ensure currentChat is populated
                currentChat.tutorId &&
                message.senderId !== loggedInUserId && // Message is from the other person
                (
                  (message.senderId === currentChat.tutorId && message.receiverId === currentChat.learnerId) ||
                  (message.senderId === currentChat.learnerId && message.receiverId === currentChat.tutorId)
                );

            console.log(`[Socket Listener] isForCurrentActiveChat = ${isForCurrentActiveChat}`);

            if (isForCurrentActiveChat) {
                // Message is for the currently active chat, mark it as read
                console.log("[Socket Global Listener] 1-on-1 message IS for CURRENTLY ACTIVE chat. Dispatching markMessagesAsRead THUNK.");
                dispatch(markMessagesAsRead({
                    senderId: message.senderId,    // The ID of the person who sent the message
                    receiverId: loggedInUserId     // The ID of me (the current user reading it)
                }));
                // The markMessagesAsRead thunk will also dispatch resetCurrentChatUnreadCount
            }
            // --- >>> CORRECTED PLACEMENT FOR NON-ACTIVE CHAT UNREAD COUNT <<< ---
            else if (message.senderId !== loggedInUserId) {
                // This 'else if' means:
                // 1. The message IS for me (checked by the outer 'if (message.receiverId === loggedInUserId)')
                // 2. It's NOT from myself (message.senderId !== loggedInUserId)
                // 3. AND it's NOT for the currently active chat (because 'isForCurrentActiveChat' was false)
                console.log(`[Socket Listener] 1-on-1 message for NON-ACTIVE chat from ${message.senderId}. Message ID: ${message._id}. Dispatching incrementUnreadForPartner.`);
                dispatch(chatSlice.actions.incrementUnreadCount({ partnerId: message.senderId }));
            }
            // --- >>> END CORRECTION <<< ---
        } else {
            console.log(`[Socket Listener] 1-on-1 message NOT for me. Receiver: ${message.receiverId}, MyID: ${loggedInUserId}. Ignoring for this client's active chat logic.`);
        }
      }
      // --- UNKNOWN MESSAGE TYPE ---
      else {
        console.warn('[Socket Global Listener] Received message of unknown type (not group, not 1-on-1 with receiverId/senderId):', message);
      }
    };

    const handleMessageStatusUpdate = ({ messageId, status, tempId }) => {
      dispatch(updateMessageStatus({ messageId, status, tempId }));
    };

    const handleOnlineUsers = (users) => {
      dispatch(updateOnlineUsers(users));
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err);
      dispatch(updateSocketConnection(false));
    });
    socket.on('newMessage', handleNewMessage);
    socket.on('messageStatusUpdate', handleMessageStatusUpdate);
    socket.on('onlineUsers', handleOnlineUsers);
    socket.on('ping', () => socket.emit('pong'));

    socket.connect();
  }

  return () => {
    if (socket) {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
      socket.off('newMessage');
      socket.off('messageStatusUpdate');
      socket.off('onlineUsers');
      socket.off('ping');
    }
  };
};

export const getSocket = () => socket;

export const { 
  addLocalMessage,
  receiveSocketMessage,
  addNewMessage,
  setCurrentChat,
  updateOnlineUsers,
  resetChatState,
  updateUploadProgress,
  updateMessageStatus,
  updateSocketConnection,
  resetCurrentChatUnreadCount,
  incrementUnreadCount
} = chatSlice.actions;

export default chatSlice.reducer;