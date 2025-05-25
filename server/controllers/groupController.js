// controllers/groupController.js
import Group from '../models/Group.js';
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import fs from 'fs';
import Message from '../models/Message.js'
dotenv.config();

cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET 
});

export const createGroup = async (req, res) => {
    try {
      const { name, members } = req.body;
      let avatar = null;
  
      // Handle file upload if exists
      if (req.file) {
        try {
          const result = await cloudinary.uploader.upload(req.file.path, {
            folder: 'group-avatars',
          });
          avatar = {
            url: result.secure_url,
            public_id: result.public_id
          };
        } catch (uploadError) {
          console.error('Cloudinary upload error:', uploadError);
          return res.status(500).json({ error: 'Failed to upload avatar' });
        }
      }
  
      // Validate members
      let membersArray = [];
      try {
        membersArray = Array.isArray(members) ? members : JSON.parse(members || '[]');
      } catch (parseError) {
        return res.status(400).json({ error: 'Invalid members format' });
      }
  
      // Create group
      const newGroup = await Group.create({
        name,
        avatar,
        createdBy: req.user._id,
        members: [
          ...membersArray.map(member => ({ user: member, role: 'member' })),
          { user: req.user._id, role: 'admin' }
        ]
      });
  
      // Populate and return
      const populatedGroup = await Group.populate(newGroup, {
        path: 'members.user',
        select: 'name email photo'
      });
  
      res.status(201).json(populatedGroup);
  
    } catch (error) {
      console.error('Group creation error:', error);
      res.status(500).json({ 
        error: error.message,
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
      });
    }
  };

// controllers/groupController.js
// export const getUserGroups = async (req, res) => {
//     try {
//       const groups = await Group.find({
//         'members.user': req.params.userId
//       })
//       .populate({
//         path: 'members.user',
//         select: 'name photo'
//       })
//       .populate('createdBy', 'name photo')
//       .sort({ createdAt: -1 });
  
//       // Return empty array if no groups found
//       res.json(groups || []);
//     } catch (error) {
//       // Return empty array on error
//       res.json([]);
//     }
//   };


export const getUserGroups = async (req, res) => {
  try {
    const userId = req.params.userId; // The ID of the user requesting their groups

    // 1. Find all groups the user is a member of
    const groups = await Group.find({ 'members.user': userId })
      .populate({
        path: 'members.user',
        select: 'name photo' // Keep population minimal for list view
      })
      .populate('createdBy', 'name photo')
      .sort({ createdAt: -1 })
      .lean(); // Use .lean() to get plain JS objects

    if (!groups || groups.length === 0) {
      return res.json([]); // Return empty array if no groups found
    }

    // 2. For each group, count unread messages for this user
    const groupsWithUnreadCounts = await Promise.all(
      groups.map(async (group) => {
        try {
          const unreadCount = await Message.countDocuments({
            group: group._id,                 // Messages in this group
            sender: { $ne: userId },          // Messages NOT sent by the current user
            readBy: { $nin: [userId] }        // Where the current user's ID is NOT in the readBy array
          });

          // Add the unreadCount to the group object
          return {
            ...group, // Spread the existing group properties
            unreadCount: unreadCount || 0 // Add the count, default to 0
          };
        } catch (countError) {
          console.error(`Error counting unread messages for group ${group._id}:`, countError);
          // Return the group without the count if error occurs
          return { ...group, unreadCount: 0 };
        }
      })
    );

    res.json(groupsWithUnreadCounts); // Send the modified groups array

  } catch (error) {
    console.error('Error fetching user groups:', error);
    // Send empty array or an error status on failure
    res.status(500).json({ message: "Failed to fetch groups", error: error.message });
  }
};
  export const addGroupMembers = async (req, res) => {
    try {
      const { groupId } = req.params;
      const { members } = req.body;
  
      // Basic input validation
      if (!Array.isArray(members)) {
        return res.status(400).json({ error: 'Members should be an array' });
      }
      
      if (members.length === 0) {
        return res.status(400).json({ error: 'At least one member ID required' });
      }
  
      // Check if group exists
      const existingGroup = await Group.findById(groupId);
      if (!existingGroup) {
        return res.status(404).json({ error: 'Group not found' });
      }
  
      // Filter out existing members
      const existingMemberIds = existingGroup.members.map(m => m.user.toString());
      const newMembers = members
        .filter(memberId => !existingMemberIds.includes(memberId.toString()))
        .map(memberId => ({ user: memberId, role: 'member' }));
  
      if (newMembers.length === 0) {
        return res.status(200).json({ 
          message: 'All members already exist in group',
          group: existingGroup 
        });
      }
  
      // Update group
      const group = await Group.findByIdAndUpdate(
        groupId,
        { $addToSet: { members: { $each: newMembers } } },
        { new: true }
      ).populate({
        path: 'members.user',
        select: 'name photo'
      });
  
      res.json(group);
    } catch (error) {
      console.error('Error adding group members:', error);
      res.status(500).json({ error: 'Server error while adding members' });
    }
  };

  export const getGroupMessages = async (req, res) => {
    try {
      const messages = await Message.find({ group: req.params.groupId })
        .sort({ createdAt: -1 })
        .populate({
          path: 'sender',
          select: 'name photo',
          transform: (doc) => ({
            _id: doc._id,
            name: doc.name,
            photo: doc.photo ? { url: doc.photo } : { url: '/default-avatar.png' }
          })
        })
        .populate('group', 'name');
  
      res.json(Array.isArray(messages) ? messages : []);
    } catch (error) {
      console.error('Error fetching messages:', error);
      res.status(500).json([]);
    }
  };

export const sendGroupMessage = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { content } = req.body;
    let file = null;

    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'group-messages',
      });
      file = {
        url: result.secure_url,
        public_id: result.public_id,
        fileType: req.file.mimetype.split('/')[0] // 'image', 'video', etc.
      };
    }

    const newMessage = await Message.create({
      group: groupId,
      sender: req.user._id,
      content,
      file
    });

    // Populate sender info
    await newMessage.populate('sender', 'name photo');

    res.status(201).json(newMessage);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// --- NEW CONTROLLER FUNCTION ---
export const markMessagesAsRead = async (req, res) => {
  console.log(`[MarkRead] Request received for group: ${req.params.groupId}`); // Debug log
  try {
      const { groupId } = req.params;
      // --- IMPORTANT: Ensure your auth middleware adds user info to req.user ---
      const userId = req.user?._id;

      // Validate inputs
      if (!userId) {
          console.error('[MarkRead] Error: User ID not found in request. Is authMiddleware running?');
          // Typically authMiddleware should handle this, but double-check
          return res.status(401).json({ message: 'Authentication required.' });
      }
      if (!groupId) {
          console.error('[MarkRead] Error: Group ID missing from request parameters.');
          return res.status(400).json({ message: 'Group ID is required.' });
      }

      // Perform the update operation
      // Find messages in the group, not sent by the user, and not already read by the user
      const updateResult = await Message.updateMany(
          {
              group: groupId,             // Match the group
              sender: { $ne: userId },    // Message NOT sent by this user
              readBy: { $nin: [userId] }  // User's ID is NOT already in the readBy array
          },
          {
              $addToSet: { readBy: userId } // Add the user's ID to the readBy array (avoids duplicates)
          }
      );

      console.log(`[MarkRead] Update complete for user ${userId} in group ${groupId}. Matched: ${updateResult.matchedCount}, Modified: ${updateResult.modifiedCount}`);

      // Send success response
      res.status(200).json({
          success: true,
          message: `Successfully marked messages as read.`,
          // Optional: return counts if useful for frontend, but often not needed
          // matchedCount: updateResult.matchedCount,
          modifiedCount: updateResult.modifiedCount
      });

  } catch (error) {
      console.error('[MarkRead] Error marking messages as read:', error);
      // Check for specific Mongoose CastErrors if groupId format might be wrong
      if (error.name === 'CastError') {
           return res.status(400).json({ message: "Invalid Group ID format.", error: error.message });
      }
      res.status(500).json({
          message: "Server error while marking messages as read.",
          error: error.message // Provide error message for debugging
      });
  }
};
// --- END NEW CONTROLLER FUNCTION ---


export const removeGroupMember = async (req, res) => {
  try {
    const { groupId, userId } = req.params;
    const requestingUser = req.user._id;

    // Find the group
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Check if requesting user is admin or the user being removed
    const isAdmin = group.members.some(
      member => member.user.equals(requestingUser) && member.role === 'admin'
    );

    const isSelfRemoval = userId === requestingUser.toString();

    if (!isAdmin && !isSelfRemoval) {
      return res.status(403).json({ 
        error: 'Only admins can remove other members' 
      });
    }

    // Prevent admin from removing themselves if they're the last admin
    if (isSelfRemoval && isAdmin) {
      const adminCount = group.members.filter(
        member => member.role === 'admin'
      ).length;
      
      if (adminCount === 1) {
        return res.status(400).json({ 
          error: 'Cannot leave group as the last admin. Assign another admin first or delete the group.' 
        });
      }
    }

    // Remove the member
    group.members = group.members.filter(
      member => !member.user.equals(userId)
    );

    await group.save();

    res.json({ 
      success: true,
      message: 'Member removed successfully' 
    });

  } catch (error) {
    console.error('Error removing group member:', error);
    res.status(500).json({ error: 'Server error while removing member' });
  }
};

export const deleteGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;

    // Find the group
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Check if user is admin
    const isAdmin = group.members.some(
      member => member.user.equals(userId) && member.role === 'admin'
    );

    if (!isAdmin) {
      return res.status(403).json({ 
        error: 'Only group admins can delete the group' 
      });
    }

    // Delete group avatar from Cloudinary if exists
    if (group.avatar?.public_id) {
      await cloudinary.uploader.destroy(group.avatar.public_id);
    }

    // First delete all messages in the group
    await Message.deleteMany({ group: groupId });

    // Then delete the group
    await Group.findByIdAndDelete(groupId);

    res.json({ 
      success: true,
      message: 'Group deleted successfully' 
    });

  } catch (error) {
    console.error('Error deleting group:', error);
    res.status(500).json({ error: 'Server error while deleting group' });
  }
};

export const leaveGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;

    // Find the group
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Check if user is in the group
    const userMembership = group.members.find(
      member => member.user.equals(userId)
    );

    if (!userMembership) {
      return res.status(400).json({ 
        error: 'You are not a member of this group' 
      });
    }

    // If user is admin, check if they're the last admin
    if (userMembership.role === 'admin') {
      const adminCount = group.members.filter(
        member => member.role === 'admin'
      ).length;
      
      if (adminCount === 1) {
        return res.status(400).json({ 
          error: 'Cannot leave group as the last admin. Assign another admin first or delete the group.' 
        });
      }
    }

    // Remove the user from members
    group.members = group.members.filter(
      member => !member.user.equals(userId)
    );

    await group.save();

    res.json({ 
      success: true,
      message: 'Left group successfully' 
    });

  } catch (error) {
    console.error('Error leaving group:', error);
    res.status(500).json({ error: 'Server error while leaving group' });
  }
};

export const updateGroupAdmin = async (req, res) => {
  try {
    const { groupId, userId } = req.params;
    const { action } = req.body; // 'promote' or 'demote'
    const requestingUser = req.user._id;

    // Validate action
    if (!['promote', 'demote'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action' });
    }

    // Find the group
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Check if requesting user is admin
    const isRequestingAdmin = group.members.some(
      member => member.user.equals(requestingUser) && member.role === 'admin'
    );

    if (!isRequestingAdmin) {
      return res.status(403).json({ 
        error: 'Only admins can update admin status' 
      });
    }

    // Find the target user
    const targetMember = group.members.find(
      member => member.user.equals(userId)
    );

    if (!targetMember) {
      return res.status(404).json({ 
        error: 'User not found in group' 
      });
    }

    // Perform the action
    if (action === 'promote' && targetMember.role !== 'admin') {
      targetMember.role = 'admin';
    } else if (action === 'demote' && targetMember.role === 'admin') {
      // Ensure we don't demote the last admin
      const adminCount = group.members.filter(
        member => member.role === 'admin'
      ).length;
      
      if (adminCount === 1) {
        return res.status(400).json({ 
          error: 'Cannot demote the last admin' 
        });
      }
      targetMember.role = 'member';
    }

    await group.save();

    res.json({ 
      success: true,
      message: `User ${action}d successfully`,
      group: await Group.populate(group, {
        path: 'members.user',
        select: 'name photo'
      })
    });

  } catch (error) {
    console.error('Error updating admin status:', error);
    res.status(500).json({ error: 'Server error while updating admin status' });
  }
};

// controllers/groupController.js
export const getGroupMembers = async (req, res) => {
  try {
    const { groupId } = req.params;

    // Find the group with deeply populated member data
    const group = await Group.findById(groupId)
      .populate({
        path: 'members.user',
        select: 'name email photo role skills location',
        model: 'User' // Explicitly specify the model
      })
      .lean(); // Convert to plain JavaScript object

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Format the response with proper null checks
    const members = group.members.map(member => {
      // Ensure we have a user object even if population failed
      const user = member.user || {};
      
      return {
        _id: member._id || user._id,
        name: user.name || 'Unknown User',
        email: user.email || '',
        photo: user.photo || { url: '/default-avatar.png' },
        role: member.role || 'member',
        userRole: user.role || 'member',
        skills: user.skills || [],
        location: user.location || '',
        joinDate: member.joinDate || user.createdAt || new Date()
      };
    });

    res.json({
      success: true,
      count: members.length,
      members
    });

  } catch (error) {
    console.error('Error fetching group members:', error);
    res.status(500).json({ 
      error: 'Server error while fetching group members',
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  }
};

export const getGroupDetails = async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId)
      .populate({
        path: 'members.user',
        select: 'name email photo role skills location'
      })
      .populate('createdBy', 'name photo')
      .lean(); // Convert to plain JavaScript object

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Format the response structure
    const response = {
      _id: group._id,
      name: group.name,
      avatar: group.avatar || { url: '/default-group-avatar.png' },
      createdAt: group.createdAt,
      createdBy: group.createdBy,
      members: group.members.map(member => ({
        _id: member.user._id,
        name: member.user.name,
        email: member.user.email,
        photo: member.user.photo || { url: '/default-avatar.png' },
        role: member.role,
        skills: member.user.skills || [],
        location: member.user.location || '',
        joinDate: member.joinDate || group.createdAt
      }))
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching group details:', error);
    res.status(500).json({ 
      error: 'Failed to fetch group details',
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  }
};