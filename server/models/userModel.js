import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  learner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
  },
  skills: {
    type: [String],
  },
  photo: {
    type: String, // URL to the user's avatar
  },
  role: {
    type: String,
    enum: ['learner', 'tutor', 'admin'],
    default: 'learner',
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true,
    },
    coordinates: {
      type: [Number],
      required: true,
    },
  },
  description: {
    type: String,
    required: true
  },
  swipes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  reviews: [reviewSchema], // Array of review subdocuments
  averageRating: {
    type: Number,
    min: 0,  // Changed from 1 to 0
    max: 5,
    default: 0
  }
}, { timestamps: true });

// Index for geospatial queries
userSchema.index({ location: '2dsphere' });

// Calculate average rating whenever a review is added
userSchema.methods.calculateAverageRating = function() {
  if (this.reviews.length === 0) {
    this.averageRating = 0;
    return;
  }
  
  const sum = this.reviews.reduce((total, review) => total + review.rating, 0);
  this.averageRating = parseFloat((sum / this.reviews.length).toFixed(1));
};

// Update average rating after saving a review
userSchema.post('save', function(doc) {
  if (doc.reviews && doc.reviews.length > 0) {
    doc.calculateAverageRating();
    doc.save();
  }
});

const User = mongoose.model('User', userSchema);

export default User;