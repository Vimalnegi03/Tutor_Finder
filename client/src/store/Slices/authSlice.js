import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { url } from '../../url';

// Register User Thunk
export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      
      // Append basic user data
      formData.append('name', userData.name);
      formData.append('email', userData.email);
      formData.append('password', userData.password);
      formData.append('gender', userData.gender);
      formData.append('skills', JSON.stringify(userData.skills.split(',')));
      formData.append('role', userData.role);
      formData.append('photo', userData.photo);
      formData.append('description', userData.description);
      formData.append('useCurrentLocation', userData.useCurrentLocation);

      // Handle location data
      if (userData.useCurrentLocation && userData.coordinates) {
        formData.append('coordinates', JSON.stringify(userData.coordinates));
        formData.append('location', `Current Location (${userData.coordinates[1]}, ${userData.coordinates[0]})`);
      } else {
        formData.append('location', userData.location || '');
      }

      const response = await axios.post(`${url}/api/users/register`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 
                         error.response?.data?.error || 
                         error.message || 
                         'Registration failed';
      return rejectWithValue(errorMessage);
    }
  }
);

// Login User Thunk
export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${url}/api/users/login`, credentials);
      
      if (response.data.token) {
        localStorage.setItem('authToken', response.data.token);
        localStorage.setItem('userData', JSON.stringify(response.data.user));
      }
      
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Login failed');
    }
  }
);

// Logout User Thunk
export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('authToken');
      await axios.post(
        `${url}/api/users/logout`, 
        {}, 
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
      
      return { success: true };
    } catch (error) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
      return rejectWithValue(error.response?.data?.error || 'Logout failed');
    }
  }
);

// Update Profile Thunk
export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (formData, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('authToken');
      
      // Validate we have a token
      if (!token) {
        return rejectWithValue('Authentication required');
      }

      // Create headers object
      const headers = {
        Authorization: `Bearer ${token}`
      };

      // Only set multipart if we have file data
      let payload = formData;
      if (formData instanceof FormData) {
        headers['Content-Type'] = 'multipart/form-data';
      } else {
        // Convert regular objects to JSON
        headers['Content-Type'] = 'application/json';
        payload = JSON.stringify(formData);
      }

      const response = await axios.patch(
        `${url}/api/users/update-profile`,
        payload,
        { headers }
      );

      // Update local storage if needed
      if (response.data.user) {
        localStorage.setItem('userData', JSON.stringify(response.data.user));
      }
      
      // Update token if changed (e.g., after email update)
      if (response.data.token) {
        localStorage.setItem('authToken', response.data.token);
      }

      return response.data;

    } catch (error) {
      // Enhanced error handling
      let errorMessage = 'Profile update failed';
      
      if (error.response) {
        // Server responded with error status
        errorMessage = error.response.data?.message || 
                      error.response.data?.error || 
                      error.response.statusText;
        
        // Handle specific status codes
        if (error.response.status === 401) {
          errorMessage = 'Session expired. Please login again.';
        } else if (error.response.status === 413) {
          errorMessage = 'File size too large';
        }
      } else if (error.request) {
        // Request was made but no response
        errorMessage = 'Network error - please check your connection';
      }

      return rejectWithValue(errorMessage);
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: (() => {
      try {
        const userData = localStorage.getItem('userData');
        return userData ? JSON.parse(userData) : {} ;
      } catch (e) {
        console.error('Failed to parse user data:', e);
        return null;
      }
    })(),
    loading: false,
    error: null,
    success: false,
    isAuthenticated: !!localStorage.getItem('authToken'),
  },
  reducers: {
    resetAuthState: (state) => {
      state.loading = false;
      state.error = null;
      state.success = false;
    },
    resetAuthError: (state) => {
      state.error = null;
    },
    logout: (state) => {
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
      state.user = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.error = null;
      state.success = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // Register User Cases
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.user = action.payload.user;
        state.isAuthenticated = true;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Login User Cases
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user || action.payload;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Logout User Cases
      .addCase(logoutUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.success = true;
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
        state.user = null;
      })
      
      // Update Profile Cases
      .addCase(updateProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.user = action.payload.user || state.user;
        state.isAuthenticated = true;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { resetAuthState, resetAuthError, logout } = authSlice.actions;
export default authSlice.reducer;