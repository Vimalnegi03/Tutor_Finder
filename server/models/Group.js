// models/Group.js
import mongoose from 'mongoose';

const memberSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, enum: ['admin', 'member'], default: 'member' },
  joinedAt: { type: Date, default: Date.now }
}, { _id: false });

const groupSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  avatar: {
    url: String,
    public_id: String  // For Cloudinary deletion
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members: [memberSchema],
  settings: {
    sendMessages: { type: Boolean, default: true },
    mediaVisibility: { type: Boolean, default: true }
  }
}, { timestamps: true });

export default mongoose.model('Group', groupSchema);