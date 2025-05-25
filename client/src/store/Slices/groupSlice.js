import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { url } from '../../url';
// Helper function for API calls with auth
const makeApiCall = async (endpoint, method = 'GET', data = null, isFormData = false) => {
  const url = `http://localhost:5000/api/groups${endpoint}`;
  const token = localStorage.getItem('authToken');
  
  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${token}`
    },
    credentials: 'include',
  };

  if (data) {
    if (isFormData) {
      options.body = data;
    } else {
      options.headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(data);
    }
  }

  const response = await fetch(url, options);
  
  if (response.status === 401) {
    localStorage.removeItem('authToken');
    throw new Error('Session expired. Please login again.');
  }

  const responseData = await response.json();

  if (!response.ok) {
    throw new Error(responseData.message || 'Something went wrong');
  }

  return responseData;
};

// Async Thunks
export const createGroup = createAsyncThunk(
  'groups/create',
  async ({ name, members, avatar }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('members', JSON.stringify(members));
      if (avatar) {
        formData.append('avatar', avatar);
      }
      return await makeApiCall('', 'POST', formData, true);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const fetchUserGroups = createAsyncThunk(
  'groups/fetchUserGroups',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await makeApiCall(`/user/${userId}`);
      // ✅ Save to localStorage
      localStorage.setItem('userGroups', JSON.stringify(response || []));

      return response || [];
    } catch (err) {
      if (err.message.includes('404')) {
        return [];
      }
      return rejectWithValue(err.message);
    }
  }
);

export const fetchGroupDetails = createAsyncThunk(
  'groups/fetchGroupDetails',
  async (groupId, { rejectWithValue }) => {
    try {
      return await makeApiCall(`/${groupId}`);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const addMembersToGroup = createAsyncThunk(
  'groups/addMembers',
  async ({ groupId, memberIds }, { rejectWithValue }) => {
    try {
      const members = Array.isArray(memberIds) ? memberIds : [memberIds];
      const response = await makeApiCall(
        `/${groupId}/members`,
        'POST',
        { members }
      );
      if (response.error) {
        return rejectWithValue(response.error);
      }
      return response;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const fetchGroupMessages = createAsyncThunk(
  'groups/fetchMessages',
  async (groupId, { rejectWithValue }) => {
    try {
      const response = await makeApiCall(`/${groupId}/messages`);
      // Ensure we always return an array
      return Array.isArray(response) ? response : [];
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// --- NEW ASYNC THUNK for Marking Messages Read ---
export const markMessagesRead = createAsyncThunk(
  'groups/markMessagesRead', // Action type prefix
  async (groupId, { rejectWithValue, getState }) => { 
    try {
      const responseData = await makeApiCall(
        `/${groupId}/messages/read`, 
        'PATCH', 
        null,  
        false   
      );
      return { groupId, ...responseData };
    } catch (err) {
      console.error(`[Thunk] Failed to mark messages read for group ${groupId}:`, err);
      return rejectWithValue(err.message || 'Failed to mark messages as read');
    }
  }
);
// --- END NEW THUNK ---

export const removeGroupMember = createAsyncThunk(
  'groups/removeMember',
  async ({ groupId, userId }, { rejectWithValue }) => {
    try {
      return await makeApiCall(
        `/${groupId}/members/${userId}`,
        'DELETE'
      );
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const deleteGroup = createAsyncThunk(
  'groups/delete',
  async (groupId, { rejectWithValue }) => {
    try {
      return await makeApiCall(
        `/${groupId}`,
        'DELETE'
      );
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const leaveGroup = createAsyncThunk(
  'groups/leave',
  async (groupId, { rejectWithValue }) => {
    try {
      return await makeApiCall(
        `/${groupId}/leave`,
        'POST'
      );
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const updateGroupAdmin = createAsyncThunk(
  'groups/updateAdmin',
  async ({ groupId, userId, action }, { rejectWithValue }) => {
    try {
      return await makeApiCall(
        `/${groupId}/admins/${userId}`,
        'PATCH',
        { action }
      );
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const getGroupMembers = createAsyncThunk(
  'groups/getMembers',
  async (groupId, { rejectWithValue }) => {
    try {
      const response = await makeApiCall(`/${groupId}/members`);
      
      const transformedMembers = response.members?.map(member => {
        const photoUrl = member.photo || '/default-avatar.png';
        
        return {
          _id: member._id,
          user: {
            _id: member._id,
            name: member.name || 'Unknown User',
            email: member.email || '',
            photo: photoUrl,
            role: member.userRole || 'member',
            skills: Array.isArray(member.skills) ? member.skills : [],
            location: member.location || ''
          },
          role: member.role || 'member',
          joinDate: member.joinDate || new Date()
        };
      }) || [];

      return { members: transformedMembers };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

const groupSlice = createSlice({
  name: 'groups',
  initialState: {
    groups: [],
    currentGroup: null,
    messages: [],
    unreadCounts: {}, 
    members: [],
    status: 'idle',
    error: null,
    messageStatus: 'idle',
    operationStatus: 'idle',
    membersStatus: 'idle',
    currentGroupStatus: 'idle'
  },
  reducers: {
    setCurrentGroup: (state, action) => {
      const payload = action.payload; // 
      state.currentGroup = payload;

      const groupId = typeof payload === 'string' ? payload: payload?._id;   
      if (groupId && state.unreadCounts[groupId] !== undefined) {
         console.log(`[Reducer] Resetting unread count for ${groupId} via setCurrentGroup`);
         state.unreadCounts[groupId] = 0;
      }
      
    },
    resetGroupState: (state) => {
      state.groups = [];
      state.currentGroup = null;
      state.messages = [];
      state.unreadCounts= {}
      state.members = [];
      state.status = 'idle';
      state.error = null;
      state.operationStatus = 'idle';
      state.membersStatus = 'idle';
      state.currentGroupStatus = 'idle';
    },
    addNewMessage: (state, action) => {
      const incomingMessage = action.payload;
      if (!state.messages) {
        state.messages = [];
      }

      let messageReplaced = false;
      // 1. Try to find and replace the optimistic message using tempId
      if (incomingMessage.tempId && !incomingMessage.isTemp) { // Server confirmed message with tempId
        const optimisticIndex = state.messages.findIndex(
          msg => msg.tempId === incomingMessage.tempId && msg.isTemp
        );
        if (optimisticIndex !== -1) {
          state.messages[optimisticIndex] = { ...incomingMessage, isTemp: false };
          messageReplaced = true;
        }
      }

      // 2. If not replaced (it's a new message from others, or an optimistic one)
      if (!messageReplaced) {
        // Check if it's an optimistic message (has isTemp) or truly new by _id
        const existingIndex = state.messages.findIndex(msg => msg._id === incomingMessage._id);
        if (existingIndex === -1) { // Truly new message
          state.messages.push(incomingMessage); // incomingMessage should have isTemp set by sender
        } else {
          // Message with this _id already exists, update it
          // This handles cases where the server sends an update for an existing message
          state.messages[existingIndex] = incomingMessage;
        }
      }
    },

    clearOperationStatus: (state) => {
      state.operationStatus = 'idle';
      state.error = null;
    },
    clearGroupMembers: (state) => {
      state.members = [];
      state.membersStatus = 'idle';
    },
     // --- ADD REDUCER TO UPDATE UNREAD COUNT (e.g., from WebSocket) ---
     incrementUnreadCount: (state, action) => {
      const { groupId } = action.payload;
      if (state.unreadCounts[groupId] !== undefined) {
          state.unreadCounts[groupId]++;
      } else {
          state.unreadCounts[groupId] = 1;
      }
  },
  resetUnreadCount: (state, action) => {
      const { groupId } = action.payload;
      if (state.unreadCounts[groupId] !== undefined) {
          state.unreadCounts[groupId] = 0;
      }
  }
    
  },

  extraReducers: (builder) => {
    builder
      .addCase(createGroup.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(createGroup.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.groups.push(action.payload);
         // Initialize unread count for new group
         state.unreadCounts[action.payload._id] = 0;
      })
      .addCase(createGroup.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Failed to create group';
      })
      .addCase(fetchUserGroups.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchUserGroups.fulfilled, (state, action) => {
        state.status = 'succeeded';
        const groupsData = Array.isArray(action.payload) ? action.payload : [];
        state.groups = groupsData;

        // --- Populate unreadCounts from fetched groups ---
        const counts = {};
        groupsData.forEach(group => {
          if (group && typeof group.unreadCount === 'number') {
            counts[group._id] = group.unreadCount;
          } else {
             counts[group._id] = 0;
          }
        });
        state.unreadCounts = counts; 
        state.error = null;
      })
      .addCase(fetchUserGroups.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Failed to fetch groups';
        state.groups = []; // Clear groups on failure
        state.unreadCounts = {}; // Clear counts on failure
      })
      .addCase(fetchGroupDetails.pending, (state) => {
        state.currentGroupStatus = 'loading';
      })
      .addCase(fetchGroupDetails.fulfilled, (state, action) => {
        state.currentGroupStatus = 'succeeded';
        state.currentGroup = action.payload;
         // Reset unread count for the fetched group details
         if (action.payload?._id) {
          state.unreadCounts[action.payload._id] = 0;
      }
    })
     
      .addCase(fetchGroupDetails.rejected, (state, action) => {
        state.currentGroupStatus = 'failed';
        state.error = action.payload || 'Failed to fetch group details';
      })
      .addCase(addMembersToGroup.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(addMembersToGroup.fulfilled, (state, action) => {
        state.status = 'succeeded';
        const updatedGroup = action.payload;
        state.groups = state.groups.map(group => 
          group._id === updatedGroup._id ? updatedGroup : group
        );
        if (state.currentGroup?._id === updatedGroup._id) {
          state.currentGroup = updatedGroup;
        }
      })
      .addCase(addMembersToGroup.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Failed to add members';
      })
      .addCase(fetchGroupMessages.pending, (state) => {
        state.messageStatus = 'loading';
      })
      .addCase(fetchGroupMessages.fulfilled, (state, action) => {
        state.messageStatus = 'succeeded';
        const messages = Array.isArray(action.payload) ? action.payload : [];
        state.messages = messages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
         // Reset unread count for this group after fetching messages
         if (state.currentGroup?._id) {
            state.unreadCounts[state.currentGroup._id] = 0;
         }
      })
      .addCase(fetchGroupMessages.rejected, (state, action) => {
        state.messageStatus = 'failed';
        state.error = action.payload || 'Failed to fetch messages';
        state.messages = [];
      })
      .addCase(removeGroupMember.pending, (state) => {
        state.operationStatus = 'loading';
      })
      .addCase(removeGroupMember.fulfilled, (state, action) => {
        state.operationStatus = 'succeeded';
        const { groupId, userId } = action.meta.arg;
        
        if (state.currentGroup?._id === groupId) {
          state.currentGroup.members = state.currentGroup.members.filter(
            member => member.user._id !== userId
          );
        }
        
        state.groups = state.groups.map(group => {
          if (group._id === groupId) {
            return {
              ...group,
              members: group.members.filter(member => member.user._id !== userId)
            };
          }
          return group;
        });
      })
      .addCase(removeGroupMember.rejected, (state, action) => {
        state.operationStatus = 'failed';
        state.error = action.payload || 'Failed to remove member';
      })
      .addCase(deleteGroup.pending, (state) => {
        state.operationStatus = 'loading';
      })
      .addCase(deleteGroup.fulfilled, (state, action) => {
        state.operationStatus = 'succeeded';
        const groupId = action.meta.arg;
        state.groups = state.groups.filter(group => group._id !== groupId);
        // Remove unread count for deleted group
        delete state.unreadCounts[groupId];
        if (state.currentGroup?._id === groupId) {
          state.currentGroup = null;
        }
      })
      .addCase(deleteGroup.rejected, (state, action) => {
        state.operationStatus = 'failed';
        state.error = action.payload || 'Failed to delete group';
      })
      .addCase(leaveGroup.pending, (state) => {
        state.operationStatus = 'loading';
      })
      .addCase(leaveGroup.fulfilled, (state, action) => {
        state.operationStatus = 'succeeded';
        const groupId = action.meta.arg;
        state.groups = state.groups.filter(group => group._id !== groupId);
         // Remove unread count for left group
        delete state.unreadCounts[groupId];
        if (state.currentGroup?._id === groupId) {
          state.currentGroup = null;
        }
      })
      .addCase(leaveGroup.rejected, (state, action) => {
        state.operationStatus = 'failed';
        state.error = action.payload || 'Failed to leave group';
      })
      .addCase(updateGroupAdmin.pending, (state) => {
        state.operationStatus = 'loading';
      })
      .addCase(updateGroupAdmin.fulfilled, (state, action) => {
        state.operationStatus = 'succeeded';
        const { groupId, userId } = action.meta.arg;
        const updatedGroup = action.payload;
        
        if (state.currentGroup?._id === groupId) {
          state.currentGroup = updatedGroup;
        }
        
        state.groups = state.groups.map(group => 
          group._id === updatedGroup._id ? updatedGroup : group
        );
      })
      .addCase(updateGroupAdmin.rejected, (state, action) => {
        state.operationStatus = 'failed';
        state.error = action.payload || 'Failed to update admin status';
      })
      .addCase(getGroupMembers.pending, (state) => {
        state.membersStatus = 'loading';
      })
      .addCase(getGroupMembers.fulfilled, (state, action) => {
        state.membersStatus = 'succeeded';
        state.members = action.payload.members || [];
      })
      .addCase(getGroupMembers.rejected, (state, action) => {
        state.membersStatus = 'failed';
        state.error = action.payload || 'Failed to fetch group members';
      })
          .addCase(markMessagesRead.fulfilled, (state, action) => {
            const { groupId } = action.payload;
            if (groupId && state.unreadCounts[groupId] !== undefined) {
              state.unreadCounts[groupId] = 0;
            }
            state.error = null; 
          })
          .addCase(markMessagesRead.rejected, (state, action) => {
            state.error = action.payload || 'Failed to mark messages as read';
          });
      }
    });
      

export const { 
  setCurrentGroup, 
  resetGroupState, 
  addNewMessage,
  clearOperationStatus,
  incrementUnreadCount, 
  resetUnreadCount,
  clearGroupMembers
} = groupSlice.actions;

export default groupSlice.reducer;