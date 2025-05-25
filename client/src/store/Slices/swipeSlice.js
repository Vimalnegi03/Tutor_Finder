import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { url } from '../../url';

export const fetchSwipedLearners = createAsyncThunk(
  'swipes/fetchSwipedLearners',
  async (tutorId, { rejectWithValue }) => {
    try {
      console.log('Fetching learners for tutor:', tutorId); // Debug
      const response = await axios.get(`${url}/api/users/swipes/${tutorId}`);
      console.log('Response data:', response.data); // Debug
      return response.data.learners || [];
    } catch (error) {
      console.error('Fetch error:', error); // Debug
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch swiped learners');
    }
  }
);

export const connectWithLearner = createAsyncThunk(
  'swipes/connectWithLearner',
  async ({ userId, learnerId }, { rejectWithValue }) => {
    try {
      await axios.post(`${url}/api/users/connect_learner`, { userId, learnerId });
      return learnerId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to connect with learner');
    }
  }
);

export const fetchUnreadCounts = createAsyncThunk(
  'swipes/fetchUnreadCounts',
  async ({ userId, learnerIds }, { rejectWithValue }) => {
    try {
      const counts = await Promise.all(
        learnerIds.map(async (learnerId) => {
          const response = await axios.get(`${url}/api/chats/unread/${userId}/${learnerId}`);
          return { learnerId, count: response.data.unreadCount || 0 };
        })
      );
      return counts;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch unread counts');
    }
  }
);

const swipeSlice = createSlice({
  name: 'swipes',
  initialState: {
    learners: [],
    unreadCounts: {},
    loading: false,
    error: null,
    connecting: false
  },
  reducers: {
    resetSwipesState: (state) => {
      state.loading = false;
      state.error = null;
    },
    clearUnreadCount: (state, action) => {
      const learnerId = action.payload;
      state.unreadCounts[learnerId] = 0;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch swiped learners
      .addCase(fetchSwipedLearners.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSwipedLearners.fulfilled, (state, action) => {
        state.loading = false;
        state.learners = action.payload;
        console.log('Updated learners in state:', action.payload); // Debug
      })
      .addCase(fetchSwipedLearners.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Connect with learner
      .addCase(connectWithLearner.pending, (state) => {
        state.connecting = true;
      })
      .addCase(connectWithLearner.fulfilled, (state, action) => {
        state.connecting = false;
        state.learners = state.learners.map(learner => 
          learner._id === action.payload ? { ...learner, hasConnected: true } : learner
        );
      })
      .addCase(connectWithLearner.rejected, (state, action) => {
        state.connecting = false;
        state.error = action.payload;
      })
      
      // Fetch unread counts
      .addCase(fetchUnreadCounts.fulfilled, (state, action) => {
        action.payload.forEach(({ learnerId, count }) => {
          state.unreadCounts[learnerId] = count;
        });
      });
  }
});

export const { resetSwipesState, clearUnreadCount } = swipeSlice.actions;
export default swipeSlice.reducer;