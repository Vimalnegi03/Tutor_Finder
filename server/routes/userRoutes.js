import express from 'express';
import { registerUser, loginUser, getAllUsers ,tutorConnect,getSwipedLearners,learnerConnect,mutualSwipes,getUser,updateProfile,logoutUser} from '../controllers/userController.js';
import {upload} from "../middleware/upload.js";
import User from '../models/userModel.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import Chat from '../models/chat.js';
const router = express.Router();
import geolib from 'geolib';

router.route("/register").post(upload.fields([
    {
       name:"photo",
       maxCount:1
    }
]),registerUser) // Use multer for file upload
router.post('/login', loginUser);
router.get('/users', getAllUsers); // Admin route


 
router.get('/tutors', authMiddleware, async (req, res) => {
    try {
        if (req.userRole !== 'learner') {
            return res.status(403).json({ message: "Access forbidden: Only learners can view tutors." });
        }

        // Ensure userLocation is defined
        const userLocation = req.userLocation?.coordinates;
        console.log(userLocation);
        if (!userLocation) {
            return res.status(400).json({ message: "User location is not set." });
        }
        
        console.log('User Location:', userLocation);
        const skills = req.query.skills ? req.query.skills.split(',') : null;

        let query = { role: 'tutor', location: { $ne: null, $exists: true } };
        if (skills) {
            query.skills = { $in: skills };
        }

        const tutors = await User.find(query);
        console.log('Tutors Data:', tutors); // Log to see tutor data

        const tutorsWithin10Km = tutors.filter(tutor => {
            if (!tutor.location || !tutor.location.coordinates) {
                // Skip if location or coordinates are not defined
                return false;
            }
            const tutorLocation = tutor.location.coordinates;
            const distance = geolib.getDistance(
                { latitude: userLocation[1], longitude: userLocation[0] },
                { latitude: tutorLocation[1], longitude: tutorLocation[0] }
            );
            return distance <= 10000; // 10 km
        });

        res.status(200).json({ tutors: tutorsWithin10Km });
    } catch (error) {
        console.error('Error fetching tutors:', error);
        res.status(500).json({ message: "Server error", error });
    }
});

// Example Express.js route to handle the connection
router.post('/connect', tutorConnect);
router.post('/connect_learner',learnerConnect)
router.get('/swipes/:tutorId', getSwipedLearners);
router.get('/check-mutual-swipe/:learnerId/:tutorId',mutualSwipes)
router.get('/:id',getUser);
router.route('/update-profile').patch(
    authMiddleware, // Authentication middleware
    upload.fields([{ 
      name: "photo", 
      maxCount: 1 
    }]), // Multer middleware for file upload (same as registration)
    updateProfile
  );
router.post('/logout',logoutUser)
export default router;