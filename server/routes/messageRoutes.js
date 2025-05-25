// routes/messageRoutes.js
import express from 'express';
import { sendMessage,getGroupMessages } from '../controllers/messageController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import {upload} from "../middleware/upload.js";

const router = express.Router();

router.post('/', authMiddleware, upload.array('files'), sendMessage);
router.get('/group/:groupId', 
    authMiddleware, 
    getGroupMessages
  );
export default router;
