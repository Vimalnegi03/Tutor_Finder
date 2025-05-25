import express from 'express';
import Chat from '../models/chat.js';
import cloudinaryConfig from '../cloudinaryConfig.js';
import multer from 'multer';
import { io } from '../server.js';
// Configure multer for temporary file storage
const upload = multer({ dest: 'uploads/' });
const router = express.Router();


// Get chat history between two users
router.get('/:learnerId/:tutorId', async (req, res) => {
  try {
    const { learnerId, tutorId } = req.params;
    
    const chatHistory = await Chat.find({
      $or: [
        { senderId: learnerId, receiverId: tutorId },
        { senderId: tutorId, receiverId: learnerId }
      ]
    })
    .sort({ createdAt: 1 })
    .lean(); // Use lean() for better performance

    // // Mark messages as read if needed
    // await Chat.updateMany(
    //   {
    //     senderId: tutorId,
    //     receiverId: learnerId,
    //     status: { $ne: 'read' }
    //   },
    //   { $set: { status: 'read' } }
    // );

    res.status(200).json(chatHistory);
  } catch (error) {
    console.error('Error fetching chat history:', error);
    res.status(500).json({ error: 'Failed to fetch chat history' });
  }
});

// Get unread message count
router.get('/unread/:userId/:learnerId', async (req, res) => {
  try {
    const { userId, learnerId } = req.params;
    
    const unreadCount = await Chat.countDocuments({
      senderId: learnerId,
      receiverId: userId,
      status: { $ne: 'read' } 
    });

    console.log(unreadCount);
    res.status(200).json({ success: true, unreadCount });
  } catch (error) {
    console.error('Error fetching unread messages:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch unread messages' });
  }
});

// Mark messages as read
router.put('/mark-read/:senderId/:receiverId', async (req, res) => {
  try {
    const { senderId, receiverId } = req.params;
    
    console.log(senderId, receiverId);
    await Chat.updateMany(
      {
        senderId: senderId, 
        receiverId: receiverId,  
        status: { $ne: 'read' }   
      },
      {
        $set: { status: 'read' }  
      }
    );

    // Notify sender that messages were read
    io.to(senderId).emit('messagesRead', {
      readerId: receiverId,
      senderId,
      timestamp: new Date()
    });

    res.status(200).json({ message: 'Messages marked as read successfully' });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ error: 'Failed to mark messages as read' });
  }
});




router.post('/', upload.array('files', 10), async (req, res) => {
  // --- ADD THIS LOG AT THE VERY BEGINNING ---
  console.log(`\n--- [POST /api/chats] Request Received ---`);
  console.log(`Body:`, req.body); // Log the request body
  console.log(`Files:`, req.files ? `${req.files.length} files` : 'No files'); // Log file info
  // --- END LOG ---
  try {
    const { senderId, receiverId, message } = req.body;
    const files = req.files;

    // Validate input
    if (!senderId || !receiverId) {
      return res.status(400).json({ error: "Sender and receiver IDs are required" });
    }

    if (!message && (!files || files.length === 0)) {
      return res.status(400).json({ error: "Message or at least one file is required" });
    }

    let media = [];
    if (files && files.length > 0) {
      // Process files sequentially to maintain order
      for (const file of files) {
        try {
          const cloudinaryResponse = await cloudinaryConfig(file.path);
          
          if (!cloudinaryResponse) {
            console.error(`Failed to upload file: ${file.originalname}`);
            continue;
          }

          media.push({
            public_id: cloudinaryResponse.public_id,
            url: cloudinaryResponse.secure_url,
            resource_type: cloudinaryResponse.resource_type,
            format: cloudinaryResponse.format,
            filename: file.originalname,
            mimetype: file.mimetype,
            size: cloudinaryResponse.bytes,
            width: cloudinaryResponse.width || null,
            height: cloudinaryResponse.height || null,
            duration: cloudinaryResponse.duration || null
          });
        } catch (uploadError) {
          console.error(`Error uploading file ${file.originalname}:`, uploadError);
        }
      }
    }

    const newMessage = new Chat({
      senderId,
      receiverId,
      message: message || "",
      media,
      status: 'sent'
    });

    const savedMessage = await newMessage.save();
    console.log(`[POST /api/chats] Message saved to DB. ID: ${savedMessage._id}`);

    // --- >>> ADD THE EMISSION LOGS HERE <<< ---
    const messagePayload = { // Prepare payload for socket
      ...savedMessage.toObject(), // Convert Mongoose doc to plain object
      tempId: req.body.tempId, // Include tempId if sent from client
      // Ensure necessary fields are present if not included by toObject()
      createdAt: savedMessage.createdAt,
      updatedAt: savedMessage.updatedAt
    };

    console.log(`[POST /api/chats] Attempting to emit 'newMessage'`);
    console.log(`   -> Emitting to sender room: ${senderId}`);
    console.log(`   -> Emitting to receiver room: ${receiverId}`);
    console.log(`   -> Emitting payload:`, messagePayload);
    // --- >>> END EMISSION LOGS <<< ---

    // Emit to both parties with consistent data structure
    io.to(senderId.toString()).to(receiverId.toString()).emit('newMessage', messagePayload);
    console.log(`[POST /api/chats] Emission attempted.`);

    res.status(201).json(savedMessage);

  } catch (error) {
    console.error('Error in message route:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
});
export default router;