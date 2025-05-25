import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema({
  senderId: { 
    type: mongoose.Schema.Types.ObjectId, 
    required: true,
    ref: 'User' 
  },
  receiverId: { 
    type: mongoose.Schema.Types.ObjectId, 
    required: true,
    ref: 'User' 
  },
  message: { 
    type: String,
    default: ''
  },
  media: [{
    public_id: String,
    url: String,
    resource_type: String, // 'image' or 'video'
    format: String,       // 'jpg', 'png', 'mp4', etc.
    filename: String,
    mimetype: String,
    size: Number,         // File size in bytes
    width: Number,        // For images/videos
    height: Number,       // For images/videos
    duration: Number      // For videos
  }],
  isRead: { 
    type: Boolean, 
    default: false 
  },
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read'],
    default: 'sent'
  }
}, { timestamps: true });

export default mongoose.model('Chat', chatSchema);