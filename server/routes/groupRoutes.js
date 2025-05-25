import express from 'express';
import {
  createGroup,
  getUserGroups,
  addGroupMembers,
  getGroupMessages,
  sendGroupMessage,
  removeGroupMember,
  deleteGroup,
  leaveGroup,
  updateGroupAdmin,
  getGroupMembers,
  markMessagesAsRead,
  getGroupDetails
  

} from '../controllers/groupController.js';
import multer from 'multer';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

// Apply authMiddleware to all group routes
router.use(authMiddleware);

// Group routes
router.post('/', upload.single('avatar'), createGroup);
router.get('/user/:userId', getUserGroups);
router.post('/:groupId/members', addGroupMembers);
router.get('/:groupId/messages', getGroupMessages);
router.patch('/:groupId/messages/read', markMessagesAsRead);
router.post('/:groupId/messages', upload.single('file'), sendGroupMessage);
router.delete('/:groupId/members/:userId', removeGroupMember);
router.delete('/:groupId', deleteGroup);
router.post('/:groupId/leave', leaveGroup);
router.patch('/:groupId/admins/:userId', updateGroupAdmin);
router.get('/:groupId/members', getGroupMembers);
router.get('/:groupId', getGroupDetails);
export default router;