// src/features/reviews/reviewSlice.js
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { url } from '../../url'; // You're already importing this

// Updated helper function using your existing 'url' import
const fetchWithAuth = async (endpoint, options = {}) => {
    const token = localStorage.getItem('authToken');
     console.log(token);
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
  
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  
    const response = await fetch(`${url}${endpoint}`, {
      ...options,
      headers,
      credentials: 'include' // Important for cookies if using them
    });
  
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Request failed');
    }
  
    return response.json();
  };

// Now update your async thunks to use the corrected endpoint paths
export const addReview = createAsyncThunk(
  'reviews/addReview',
  async ({ tutorId, rating, comment }, { rejectWithValue }) => {
    try {
      return await fetchWithAuth(`/api/reviews/${tutorId}/reviews`, {
        method: 'POST',
        body: JSON.stringify({ rating, comment }),
      });
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const getTutorReviews = createAsyncThunk(
  'reviews/getTutorReviews',
  async (tutorId, { rejectWithValue }) => {
    try {
      return await fetchWithAuth(`/api/reviews/${tutorId}/reviews`);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateReview = createAsyncThunk(
  'reviews/updateReview',
  async ({ tutorId, reviewId, rating, comment }, { rejectWithValue }) => {
    try {
      return await fetchWithAuth(`/api/reviews/${tutorId}/reviews/${reviewId}`, {
        method: 'PUT',
        body: JSON.stringify({ rating, comment }),
      });
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteReview = createAsyncThunk(
  'reviews/deleteReview',
  async ({ tutorId, reviewId }, { rejectWithValue }) => {
    try {
      await fetchWithAuth(`/api/reviews/${tutorId}/reviews/${reviewId}`, {
        method: 'DELETE',
      });
      return { tutorId, reviewId };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Initial State
const initialState = {
  reviews: [],
  averageRating: 0,
  totalReviews: 0,
  loading: false,
  error: null,
  currentTutorId: null,
  operationStatus: 'idle'
};

// Slice (same as before)
const reviewSlice = createSlice({
  name: 'reviews',
  initialState,
  reducers: {
    resetReviewState: (state) => initialState,
    clearReviewError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Add Review
      .addCase(addReview.pending, (state) => {
        state.loading = true;
        state.operationStatus = 'loading';
      })
      .addCase(addReview.fulfilled, (state, action) => {
        state.loading = false;
        state.operationStatus = 'succeeded';
        state.reviews.push(action.payload.review);
        state.averageRating = action.payload.averageRating;
        state.totalReviews += 1;
      })
      .addCase(addReview.rejected, (state, action) => {
        state.loading = false;
        state.operationStatus = 'failed';
        state.error = action.payload || 'Failed to add review';
      })

      // Get Tutor Reviews
      .addCase(getTutorReviews.pending, (state) => {
        state.loading = true;
      })
      .addCase(getTutorReviews.fulfilled, (state, action) => {
        state.loading = false;
        state.reviews = action.payload.reviews;
        state.averageRating = action.payload.averageRating;
        state.totalReviews = action.payload.totalReviews;
        state.currentTutorId = action.meta.arg;
      })
      .addCase(getTutorReviews.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch reviews';
      })

      // Update Review
      .addCase(updateReview.pending, (state) => {
        state.loading = true;
        state.operationStatus = 'loading';
      })
      .addCase(updateReview.fulfilled, (state, action) => {
        state.loading = false;
        state.operationStatus = 'succeeded';
        const index = state.reviews.findIndex(
          review => review._id === action.payload.review._id
        );
        if (index !== -1) {
          state.reviews[index] = action.payload.review;
          state.averageRating = action.payload.averageRating;
        }
      })
      .addCase(updateReview.rejected, (state, action) => {
        state.loading = false;
        state.operationStatus = 'failed';
        state.error = action.payload || 'Failed to update review';
      })

      // Delete Review
      .addCase(deleteReview.pending, (state) => {
        state.loading = true;
        state.operationStatus = 'loading';
      })
      .addCase(deleteReview.fulfilled, (state, action) => {
        state.loading = false;
        state.operationStatus = 'succeeded';
        state.reviews = state.reviews.filter(
          review => review._id !== action.payload.reviewId
        );
        state.totalReviews -= 1;
      })
      .addCase(deleteReview.rejected, (state, action) => {
        state.loading = false;
        state.operationStatus = 'failed';
        state.error = action.payload || 'Failed to delete review';
      });
  }
});

// Export actions and reducer
export const { resetReviewState, clearReviewError } = reviewSlice.actions;
export default reviewSlice.reducer;

// Selectors (same as before)
export const selectAllReviews = (state) => state.reviews.reviews;
export const selectAverageRating = (state) => state.reviews.averageRating;
export const selectTotalReviews = (state) => state.reviews.totalReviews;
export const selectReviewsLoading = (state) => state.reviews.loading;
export const selectReviewsError = (state) => state.reviews.error;
export const selectCurrentTutorReviews = (state) => ({
  reviews: state.reviews.reviews,
  averageRating: state.reviews.averageRating,
  totalReviews: state.reviews.totalReviews
});