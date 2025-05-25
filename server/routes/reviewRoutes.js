import express from 'express';
import {
  addReview,
  getTutorReviews,
  updateReview,
  deleteReview
} from '../controllers/reviewController.js';
import { authMiddleware, checkRole } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply authMiddleware to all review routes
router.use(authMiddleware);

// POST /api/tutors/:tutorId/reviews - Add review (learner only)
router.post('/:tutorId/reviews', addReview);

// GET /api/tutors/:tutorId/reviews - Get reviews (public)
router.get('/:tutorId/reviews', getTutorReviews);

// PUT /api/tutors/:tutorId/reviews/:reviewId - Update review (review author only)
router.put('/:tutorId/reviews/:reviewId', updateReview);

// DELETE /api/tutors/:tutorId/reviews/:reviewId - Delete review (author or admin)
router.delete('/:tutorId/reviews/:reviewId', deleteReview);

export default router;