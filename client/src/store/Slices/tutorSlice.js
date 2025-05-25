import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { getDistance } from 'geolib';
import { url } from '../../url';

// Helper function to get place name
const getPlaceName = async (latitude, longitude) => {
  try {
    const response = await axios.get(
      `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
    );
    return response?.data?.display_name || 'Location not found';
  } catch (error) {
    console.error('Error fetching place name:', error);
    return 'Location not found';
  }
};

// Async thunk to fetch tutors
export const fetchTutors = createAsyncThunk(
  'tutors/fetchTutors',
  async ({ userSkills, userLocation, userId }, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${url}/api/users/users`);
      const allUsers = response?.data || [];

      const tutorsList = allUsers.filter(
        (user) => user.role === 'tutor' && user?.location?.coordinates?.length === 2
      );

      const matchingTutors = await Promise.all(
        tutorsList.map(async (tutor) => {
          function extractSkills(skillString) {
            return skillString
              .replace(/[\[\]"]+/g, '')      // Remove brackets and quotes
              .split(',')                    // Split by comma
              .map(skill => skill.trim().toLowerCase()); // Clean and normalize
          }
                  const normalizedUserSkills = userSkills?.[0]
          ? extractSkills(userSkills[0])
          : [];

        const normalizedTutorSkills = tutor.skills?.[0]
          ? extractSkills(tutor.skills[0])
          : [];
          const hasMatchingSkills = normalizedUserSkills.length > 0
          ? normalizedTutorSkills.some(skill => normalizedUserSkills.includes(skill))
          : true;

          const tutorLocation = tutor.location?.coordinates || [0, 0];
          const distance = getDistance(
            { latitude: userLocation?.coordinates[1], longitude: userLocation?.coordinates[0] },
            { latitude: tutorLocation[1], longitude: tutorLocation[0] }
          );

          if (hasMatchingSkills && distance <= 10000) {
            const placeName = await getPlaceName(tutorLocation[1], tutorLocation[0]);
            return { ...tutor, placeName };
          }
          return null;
        })
      );

      const validTutors = matchingTutors.filter((tutor) => tutor !== null);

      // Fetch unread counts for each tutor
      const unreadCounts = {};
      await Promise.all(
        validTutors.map(async (tutor) => {
          try {
            const unreadResponse = await axios.get(
              `${url}/api/chats/unread/${userId}/${tutor._id}`
            );
            unreadCounts[tutor._id] = unreadResponse.data.unreadCount || 0;
          } catch (err) {
            console.error(`Error fetching unread count for tutor ${tutor._id}:`, err);
            unreadCounts[tutor._id] = 0;
          }
        })
      );

      return { tutors: validTutors, unreadCounts };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch tutors');
    }
  }
);

// Async thunk to connect with tutor
export const connectWithTutor = createAsyncThunk(
  'tutors/connectWithTutor',
  async ({ learnerId, tutorId}, { rejectWithValue }) => {
    try {
      await axios.post(`${url}/api/users/connect`, {
        learnerId,
        tutorId,
      });
      return tutorId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to connect with tutor');
    }
  }
);

const initialState = {
  tutors: [],
  unreadCounts: {},
  connectedTutors: [],
  loading: false,
  error: null,
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
};

const tutorSlice = createSlice({
  name: 'tutors',
  initialState,
  reducers: {
    resetTutorsState: () => initialState,
    clearError: (state) => {
      state.error = null;
    },
    // Action to manually add a tutor to connected list (for optimistic updates)
    addConnectedTutor: (state, action) => {
      if (!state.connectedTutors.includes(action.payload)) {
        state.connectedTutors.push(action.payload);
      }
    },
    // Action to update unread counts
    updateUnreadCount: (state, action) => {
      const { tutorId, count } = action.payload;
      state.unreadCounts[tutorId] = count;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch tutors cases
      .addCase(fetchTutors.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.status = 'loading';
      })
      .addCase(fetchTutors.fulfilled, (state, action) => {
        state.loading = false;
        state.tutors = action.payload.tutors;
        state.unreadCounts = action.payload.unreadCounts;
        state.status = 'succeeded';
      })
      .addCase(fetchTutors.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.status = 'failed';
      })
      
      // Connect with tutor cases
      .addCase(connectWithTutor.pending, (state) => {
        state.loading = true;
      })
      .addCase(connectWithTutor.fulfilled, (state, action) => {
        state.loading = false;
        if (!state.connectedTutors.includes(action.payload)) {
          state.connectedTutors.push(action.payload);
        }
      })
      .addCase(connectWithTutor.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { 
  resetTutorsState, 
  clearError, 
  addConnectedTutor, 
  updateUnreadCount 
} = tutorSlice.actions;

export default tutorSlice.reducer;