import mongoose from 'mongoose';

const mediaSchema = new mongoose.Schema({
  url: { type: String, required: true },
  type: { type: String, enum: ['image', 'video', 'pdf', 'audio', 'file'], required: true },
  public_id: String, // For Cloudinary
  filename: String,
  size: Number, // Bytes
  width: Number, // For images/videos
  height: Number, // For images/videos
  duration: Number, // For audio/video
  mimetype: String
}, { _id: false });

const messageSchema = new mongoose.Schema({
  group: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Group', 
    required: true 
  },
  sender: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  content: {
    text: String,
    media: [mediaSchema] // Changed to array of mediaSchema
  },
  readBy: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }],
  pinned: Boolean
}, { 
  timestamps: true 
});

// Indexes
messageSchema.index({ group: 1, createdAt: -1 }); // Optimized for group chat queries
messageSchema.index({ 'content.media.url': 1 }); // For faster media queries

export default mongoose.model('Message', messageSchema);