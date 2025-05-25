import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

const API_BASE_URL = 'https://major-project-1m4u.onrender.com';

// Helper function for API calls
const makeApiCall = async (endpoint, method = 'GET', body = null, isFormData = false) => {
  const headers = {};
  
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  const token = localStorage.getItem('authToken');
  console.log('Current token:', token); // Debug log
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    method,
    headers,
  };

  if (body) {
    config.body = isFormData ? body : JSON.stringify(body);
  }

  try {
    console.log('Making API call to:', `${API_BASE_URL}${endpoint}`);
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Something went wrong');
    }

    return data;
  } catch (err) {
    console.error('API call failed:', err);
    throw err;
  }
};

// Async Thunks
export const sendMessage = createAsyncThunk(
    'messages/send',
    async ({ groupId, text, files, tempId:clientTempId }, { rejectWithValue, getState }) => {
      try {
        // Generate a unique temp ID for optimistic update
        const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // Prepare form data
        const formData = new FormData();
        formData.append('groupId', groupId);
        if (text) formData.append('text', text || ''); // Ensure text is not undefined
        if (clientTempId) { // <<< ADD tempId TO FORMDATA
          formData.append('tempId', clientTempId);
        }
        
        if (files?.length) {
          files.forEach(file => formData.append('files', file));
        }
  
        // Get current user from state to include in optimistic update
        const { user } = getState().auth;
        
        // Create optimistic payload
        const optimisticPayload = {
          _id: tempId,
          group: groupId,
          sender: {
            _id: user._id,
            name: user.name,
            avatar: user.avatar
          },
          content: {
            text: text || '',
            media: files?.map(file => ({
              url: URL.createObjectURL(file),
              type: file.type.split('/')[0],
              originalName: file.name,
              isUploading: true
            })) || []
          },
          createdAt: new Date().toISOString(),
          tempId,
          isOptimistic: true
        };
  
        // Make API call
        const response = await makeApiCall('/api/messages', 'POST', formData, true);
        
        // Return both the server response and tempId for reconciliation
        return {
          ...response,
          tempId: clientTempId, // Include the tempId to match with optimistic update
          isOptimistic: false
        };
  
      } catch (err) {
        return rejectWithValue({
          error: err.message,
          tempId: clientTempId,
          details: err.response?.data
        });
      }
    }
  );

export const fetchGroupMessages = createAsyncThunk(
  'messages/fetchGroupMessages',
  async (groupId, { rejectWithValue }) => {
    try {
      const response = await makeApiCall(`/api/messages/group/${groupId}`);
      return {
        groupId,
        messages: response
      };
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to fetch messages');
    }
  }
);

const messageSlice = createSlice({
  name: 'messages',
  initialState: {
    messagesByGroup: {},
    status: 'idle',
    error: null,
    sendingStatus: 'idle',
    lastFetched: {}
  },
  reducers: {
     // This reducer is for the optimistic UI update in GroupDetailPage
     addOptimisticGroupMessage: (state, action) => {
      const { groupId, tempMessage } = action.payload;
      if (!state.messagesByGroup[groupId]) {
        state.messagesByGroup[groupId] = [];
      }
      // Add to the end, assuming chronological order
      state.messagesByGroup[groupId].push(tempMessage);
    },
    addLocalMessage: (state, action) => {
      const { groupId, tempMessage } = action.payload;
      if (!state.messagesByGroup[groupId]) {
        state.messagesByGroup[groupId] = [];
      }
      state.messagesByGroup[groupId].unshift(tempMessage);
    },
    updateMessageStatus: (state, action) => {
      const { groupId, tempId, serverMessage } = action.payload;
      const groupMessages = state.messagesByGroup[groupId];
      if (groupMessages) {
        const index = groupMessages.findIndex(msg => msg._id === tempId);
        if (index !== -1) {
          groupMessages[index] = serverMessage;
        }
      }
    },
    resetMessages: (state) => {
      state.messagesByGroup = {};
      state.status = 'idle';
      state.error = null;
      state.sendingStatus = 'idle';
    }
  },
  extraReducers: (builder) => {
    builder
      // Send Message
      .addCase(sendMessage.pending, (state) => {
        console.log('Message send pending...'); // Debug log
        state.sendingStatus = 'loading';
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        console.log('Message send fulfilled:', action.payload); // Debug log
        state.sendingStatus = 'succeeded';
        const { group, ...message } = action.payload;
        
        if (!state.messagesByGroup[group]) {
          state.messagesByGroup[group] = [];
        }
        
        const index = state.messagesByGroup[group].findIndex(
          msg => msg._id === message.tempId
        );
        
        if (index !== -1) {
          state.messagesByGroup[group][index] = message;
        } else {
          state.messagesByGroup[group].unshift(message);
        }
      })
      .addCase(sendMessage.rejected, (state, action) => {
        console.log('Message send rejected:', action.payload); // Debug log
        state.sendingStatus = 'failed';
        state.error = action.payload;
      })
      
      // Fetch Messages
      .addCase(fetchGroupMessages.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchGroupMessages.fulfilled, (state, action) => {
        state.status = 'succeeded';
        const { groupId, messages } = action.payload;
        state.messagesByGroup[groupId] = messages;
        state.lastFetched[groupId] = Date.now();
      })
      .addCase(fetchGroupMessages.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
  }
});

export const { 
  addLocalMessage, 
  updateMessageStatus, 
  resetMessages 
} = messageSlice.actions;

export default messageSlice.reducer;
