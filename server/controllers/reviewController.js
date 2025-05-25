import User from '../models/userModel.js';

// @desc    Add a review to a tutor
// @route   POST /api/tutors/:tutorId/reviews
// @access  Private (learner only)
const addReview = async (req, res) => {
    try {
        const { tutorId } = req.params;
        const { rating, comment } = req.body;
        
        // Verify authentication and get complete user info
        if (!req.user || !req.user._id || !req.user.name) {
            console.log('Invalid user data in request:', req.user);
            return res.status(401).json({ message: 'Authentication required' });
        }

        // Validate input
        if (!rating || !comment) {
            return res.status(400).json({ message: 'Rating and comment are required' });
        }

        // Find tutor and verify
        const tutor = await User.findById(tutorId);
        if (!tutor || tutor.role !== 'tutor') {
            return res.status(404).json({ message: 'Tutor not found' });
        }

        // Check for existing review
        const hasReviewed = tutor.reviews.some(review => 
            review.learner && review.learner._id.toString() === req.user._id.toString()
        );

        if (hasReviewed) {
            return res.status(400).json({ message: 'You have already reviewed this tutor' });
        }

        // Add review with complete learner info
        tutor.reviews.push({
            learner: {
                _id: req.user._id,  // Ensure proper ObjectId
                name: req.user.name // Include name directly
            },
            rating,
            comment
        });

        await tutor.save();

        res.status(201).json({
            message: 'Review added successfully',
            review: tutor.reviews[tutor.reviews.length - 1],
            averageRating: tutor.averageRating
        });

    } catch (error) {
        console.error('Error adding review:', error);
        res.status(500).json({ 
            message: 'Server error while adding review',
            error: error.message 
        });
    }
};

// @desc    Get all reviews for a tutor
// @route   GET /api/tutors/:tutorId/reviews
// @access  Public
const getTutorReviews = async (req, res) => {
  try {
    const { tutorId } = req.params;

    const tutor = await User.findById(tutorId)
      .select('reviews averageRating')
      .populate({
        path: 'reviews.learner',
        select: 'name photo'
      });

    if (!tutor) {
      return res.status(404).json({ message: 'Tutor not found' });
    }

    res.status(200).json({
      reviews: tutor.reviews,
      averageRating: tutor.averageRating,
      totalReviews: tutor.reviews.length
    });

  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ message: 'Server error while fetching reviews' });
  }
};

// @desc    Update a review
// @route   PUT /api/tutors/:tutorId/reviews/:reviewId
// @access  Private (only the learner who wrote the review)
const updateReview = async (req, res) => {
  try {
    const { tutorId, reviewId } = req.params;
    const { rating, comment } = req.body;
    const learnerId = req.user._id;

    // Find the tutor
    const tutor = await User.findById(tutorId);
    if (!tutor) {
      return res.status(404).json({ message: 'Tutor not found' });
    }

    // Find the review
    const reviewIndex = tutor.reviews.findIndex(
      review => review._id.toString() === reviewId && 
               review.learner.toString() === learnerId.toString()
    );

    if (reviewIndex === -1) {
      return res.status(404).json({ message: 'Review not found or unauthorized' });
    }

    // Update the review
    if (rating) tutor.reviews[reviewIndex].rating = rating;
    if (comment) tutor.reviews[reviewIndex].comment = comment;

    await tutor.save();

    res.status(200).json({
      message: 'Review updated successfully',
      review: tutor.reviews[reviewIndex],
      averageRating: tutor.averageRating
    });

  } catch (error) {
    console.error('Error updating review:', error);
    res.status(500).json({ message: 'Server error while updating review' });
  }
};

// @desc    Delete a review
// @route   DELETE /api/tutors/:tutorId/reviews/:reviewId
// @access  Private (only the learner who wrote the review or admin)
const deleteReview = async (req, res) => {
  try {
    const { tutorId, reviewId } = req.params;
    const userId = req.user._id;
    const isAdmin = req.user.role === 'admin';

    // Find the tutor
    const tutor = await User.findById(tutorId);
    if (!tutor) {
      return res.status(404).json({ message: 'Tutor not found' });
    }

    // Find the review index
    const reviewIndex = tutor.reviews.findIndex(
      review => review._id.toString() === reviewId
    );

    if (reviewIndex === -1) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Check permissions (either the review author or admin)
    const isAuthor = tutor.reviews[reviewIndex].learner.toString() === userId.toString();
    if (!isAuthor && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to delete this review' });
    }

    // Remove the review
    tutor.reviews.splice(reviewIndex, 1);
    await tutor.save();

    res.status(200).json({
      message: 'Review deleted successfully',
      averageRating: tutor.averageRating
    });

  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({ message: 'Server error while deleting review' });
  }
};

export {
  addReview,
  getTutorReviews,
  updateReview,
  deleteReview
};