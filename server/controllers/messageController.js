// controllers/messageController.js
import Message from '../models/Message.js';
import cloudinaryConfig from '../cloudinaryConfig.js';
import { io } from '../server.js'
export const sendMessage = async (req, res) => {
    try {
        const { groupId, text, tempId} = req.body;
        const files = req.files; // Changed from req.file to req.files for multiple files

        // Validate input
        if (!groupId) {
            return res.status(400).json({ error: "Group ID is required" });
        }

        if (!text && (!files || files.length === 0)) {
            return res.status(400).json({ error: "Message text or at least one file is required" });
        }

        const messageData = {
            group: groupId,
            sender: req.user._id,
            content: { 
                text: text || "",
                media: [] // Initialize as array for multiple files
            }
        };

        // Process multiple files if they exist
        if (files && files.length > 0) {
            try {
                // Upload all files in parallel
                const uploadPromises = files.map(file => 
                    cloudinaryConfig(file.path)
                        .then(response => ({
                            file,
                            response
                        }))
                        .catch(error => {
                            console.error(`Error uploading file ${file.originalname}:`, error);
                            throw error;
                        })
                );

                const uploadResults = await Promise.all(uploadPromises);

                // Process successful uploads
                messageData.content.media = uploadResults.map(({ file, response }) => ({
                    url: response.secure_url,
                    public_id: response.public_id,
                    type: file.mimetype.split('/')[0] === 'image' ? 'image' : 
                          file.mimetype.split('/')[0] === 'video' ? 'video' : 'file',
                    format: response.format,
                    size: file.size,
                    width: response.width || null,
                    height: response.height || null,
                    duration: response.duration || null,
                    originalName: file.originalname,
                    mimetype: file.mimetype
                }));

            } catch (uploadError) {
                console.error('File upload error:', uploadError);
                return res.status(500).json({ 
                    error: "One or more file uploads failed",
                    details: uploadError.message 
                });
            }
        }

        const newMessage = await Message.create(messageData);
      // Populate sender details for the socket emission and HTTP response
        // Ensure your User model has 'id' or select '_id' and alias it if needed by frontend
        const populatedMessage = await Message.findById(newMessage._id)
            .populate('sender', 'name photo id _id') // Populate necessary sender fields
            .lean(); // Use .lean() for a plain JS object

        if (!populatedMessage) {
            // This should ideally not happen if create was successful
            console.error('Failed to populate created message:', newMessage._id);
            return res.status(500).json({ error: 'Failed to process sent message' });
        }

        // --- Prepare payload for Socket.IO, including tempId ---
        const socketPayload = {
            ...populatedMessage,
            group: populatedMessage.group.toString(), // Ensure group ID is a string
            sender: { // Ensure sender structure matches frontend expectation
                _id: populatedMessage.sender._id, // Or populatedMessage.sender.id
                name: populatedMessage.sender.name,
                photo: populatedMessage.sender.photo
            },
            tempId: tempId // Include the original tempId from the client
        };
        // --- End prepare payload ---

        console.log(`[MessageCtrl sendMessage] Emitting 'newMessage' to groupId: ${groupId}, Payload with tempId:`, socketPayload);
        io.to(groupId.toString()).emit('newMessage', socketPayload); // Ensure groupId is a string

        // Send the populated message (without tempId unless needed in HTTP response too)
        // back in the HTTP response
        res.status(201).json(populatedMessage);

    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({
            error: 'Failed to send message',
            details: error.message
        });
    }
};
// controllers/messageController.js
export const getGroupMessages = async (req, res) => {
    try {
      const { groupId } = req.params;
      
      const messages = await Message.find({ group: groupId })
        .sort({ createdAt: -1 }) // Newest first
        .populate('sender', 'name photo') // Include sender details
        .populate('group', 'name'); // Include group name
  
      res.status(200).json(messages);
    } catch (error) {
      res.status(500).json({ 
        error: 'Failed to fetch messages',
        details: error.message 
      });
    }
  };