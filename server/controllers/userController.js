import User from '../models/userModel.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import uploadOnCloudinary from '../cloudinaryConfig.js'; // Adjust the import path as necessary
import axios from 'axios';

const generateToken = (user) => {
    const payload = {
        id: user._id,
        role: user.role,
        location: user.location, // Include location
        name:user.name
    };
    console.log('JWT payload:', payload);
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '60d' }); // Adjust expiration as needed
};


const getCoordinates = async (address) => {
    try {
      const response = await axios.get(`https://nominatim.openstreetmap.org/search`, {
        params: {
          q: address,
          format: 'json',
          limit: 1,
        },
      });
  
      if (response.data.length > 0) {
        const { lat, lon } = response.data[0];
        return { latitude: lat, longitude: lon };
      } else {
        throw new Error('Location not found');
      }
    } catch (error) {
      console.error(error);
      throw new Error('Error fetching location data');
    }
  };

// Register a new user with photo upload
export const registerUser = async (req, res) => {
  console.log("Received request:", req.body);
  console.log("File received:", req.file);

  const { name, email, password, gender, role, description } = req.body;
  const skills = req.body.skills;
  
  try {
      // Check if coordinates are provided directly
      let coordinates;
      if (req.body.coordinates) {
          // Parse coordinates from string if needed
          const coords = typeof req.body.coordinates === 'string' 
              ? JSON.parse(req.body.coordinates)
              : req.body.coordinates;
          
          coordinates = {
              longitude: parseFloat(coords[0]),
              latitude: parseFloat(coords[1])
          };
      } else {
          // Fallback to geocoding if no coordinates provided
          coordinates = await getCoordinates(req.body.location);
      }

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
          return res.status(400).json({ message: 'User already exists' });
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Check if files exist before accessing
      if (!req.files || !req.files.photo || !req.files.photo[0]) {
          return res.status(400).json({ message: "Avatar file is required" });
      }

      const avatarLocalPath = req.files.photo[0].path;
      const avatar = await uploadOnCloudinary(avatarLocalPath);
      if (!avatar) {
          return res.status(400).json({ message: "Avatar file is required" });
      }

      // Create new user with properly formatted coordinates
      const user = await User.create({
          name,
          email,
          password: hashedPassword,
          gender,
          skills,
          photo: avatar.url,
          role: role || 'learner',
          location: {
              type: 'Point',
              coordinates: [coordinates.longitude, coordinates.latitude],
          },
          description
      });
      
      // Generate a JWT token
      const token = generateToken(user);

      res.status(201).json({
          message: "User successfully created",
          user: {
              id: user._id,
              name: user.name,
              email: user.email,
              role: user.role,
              photo: user.photo,
              location: user.location.coordinates,
              swipes: user.swipes,
              description: user.description
          },
          token
      });
  } catch (error) {
      console.error("Error in registerUser:", error);
      res.status(500).json({ 
          message: 'Server error', 
          error: error.message,
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
  }
};
  

// Sign in a user
export const loginUser = async (req, res) => {
    const { email, password } = req.body;
  
    try {
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      // Compare passwords
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }
       
      // Generate a JWT token
      const token = generateToken(user);
  
      res.status(200).json({ token,user:{
        role: user.role,
        location: user.location,
    skills:user.skills,
photo:user.photo,
id:user._id,
swipes:user.swipes,
description:user.description,
name:user.name,
email:user.email
}});
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  };
  
  // Get all users (admin function)
  export const getAllUsers = async (req, res) => {
    try {
      const users = await User.find();
      res.status(200).json(users);
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  };
  
  export const tutorConnect=async (req, res) => {
    const { learnerId, tutorId } = req.body;
    console.log(learnerId);
    console.log(tutorId);
  try {
    // Convert string IDs to ObjectId
    // const learnerObjectId = mongoose.Types.ObjectId(learnerId);
    // const tutorObjectId = mongoose.Types.ObjectId(tutorID);

    // Find the tutor and add the learnerId to the swipes array
    const tutor = await User.findByIdAndUpdate(
      tutorId,
      { $addToSet: { swipes: learnerId } }, // Use $addToSet to avoid duplicates
      { new: true }
    );

    if (!tutor) {
      return res.status(404).json({ error: 'Tutor not found' });
    }

    res.status(200).json({ message: 'Successfully connected with tutor', tutor });
  } catch (error) {
    console.error('Error connecting with tutor:', error);
    res.status(500).json({ error: 'An error occurred while connecting with the tutor' });
  }
  }
  ;
  
 export  const getSwipedLearners = async (req, res) => {
    const { tutorId } = req.params;
    try {
      // Find the tutor by ID and populate the swipes field with learner details
      const tutor = await User.findById(tutorId).populate('swipes'); // Populate 'swipes' with learner details
  
      if (!tutor) {
        return res.status(404).json({ error: 'Tutor not found' });
      }
  
      // Return the learners who swiped on the tutor
      res.status(200).json({ learners: tutor.swipes });
    } catch (error) {
      console.error('Error fetching swiped learners:', error);
      res.status(500).json({ error: 'Server error' });
    }
  };

  // Assuming you're using Express.js
export const learnerConnect= async (req, res) => {
    const { userId, learnerId } = req.body;
  
    try {
      // Find the learner and update their swipes array with the tutor's ID
      const learner = await User.findById(learnerId);
      if (!learner) return res.status(404).json({ message: 'Learner not found' });
  
      learner.swipes.push(userId); // Add tutorId to learner's swipes array
      await learner.save();
  
      res.status(200).json({ message: 'Connected successfully!' });
    } catch (error) {
      console.error('Error connecting tutor to learner:', error);
      res.status(500).json({ message: 'Server error' });
    }
  };
  
  export const mutualSwipes=async (req, res) => {
    const { learnerId, tutorId } = req.params;
    
    try {
      const learner = await User.findById(learnerId);
      const tutor = await User.findById(tutorId);
  
      const isMutualSwipe = learner.swipes.includes(tutorId) && tutor.swipes.includes(learnerId);
      res.json({ isMutualSwipe });
    } catch (error) {
      console.error('Error checking mutual swipes:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
  
  export const getUser = async (req, res) => {
    const { id } = req.params; // Extract the `id` from the request parameters
    try {
      // Use await to handle the asynchronous operation
      const person = await User.findById(id); 
      if (!person) {
        return res.status(404).json({ message: 'User not found' }); // Handle the case where the user is not found
      }
      res.json(person); // Send the user data as the response
    } catch (error) {
      // Handle errors and send an appropriate response
      res.status(500).json({
        message: 'Internal server error',
        error: error.message, // Optionally include the error message for debugging
      });
    }
  };
  
  //updating user
  export const updateProfile = async (req, res) => {
    console.log("Received update request:", req.body);
    console.log("Files received:", req.files);
  
    const { name, email, password, gender, role, description, currentPassword, location } = req.body;
    const skills = req.body.skills;
    const userId = req.user._id;

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const updateData = {};

        // Handle location/coordinates update
        if (req.body.coordinates || req.body.location) {
            let coordinates;
            
            // If coordinates are provided directly
            if (req.body.coordinates) {
                const coords = typeof req.body.coordinates === 'string' 
                    ? JSON.parse(req.body.coordinates)
                    : req.body.coordinates;
                
                coordinates = {
                    longitude: parseFloat(coords[0]),
                    latitude: parseFloat(coords[1])
                };
            } 
            // If location is "Current Location" and we have existing coordinates
            else if (req.body.location === 'Current Location' && user.location?.coordinates) {
                coordinates = {
                    longitude: user.location.coordinates[0],
                    latitude: user.location.coordinates[1]
                };
            }
            // If it's a new location string
            else if (req.body.location && req.body.location !== 'Current Location') {
                try {
                    coordinates = await getCoordinates(req.body.location);
                } catch (error) {
                    console.error("Geocoding error:", error);
                    // Don't fail the entire update if geocoding fails
                    // Just update the address without changing coordinates
                    updateData['location.address'] = req.body.location;
                }
            }

            // Only update coordinates if we have them
            if (coordinates) {
                updateData.location = {
                    type: 'Point',
                    coordinates: [coordinates.longitude, coordinates.latitude],
                    address: req.body.location || user.location?.address
                };
            }
        }

        // Handle name update
        if (name && name !== user.name) {
            updateData.name = name;
        }

        // Handle email update
        if (email && email !== user.email) {
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(400).json({ message: 'Email already in use' });
            }
            updateData.email = email;
        }

        // Handle password change
        if (password) {
            if (!currentPassword) {
                return res.status(400).json({ message: 'Current password is required to change password' });
            }
            
            const isMatch = await bcrypt.compare(currentPassword, user.password);
            if (!isMatch) {
                return res.status(401).json({ message: 'Current password is incorrect' });
            }
            
            updateData.password = await bcrypt.hash(password, 10);
        }

        // Handle other fields
        if (gender) updateData.gender = gender;
        if (role) updateData.role = role;
        if (description) updateData.description = description;
        if (skills) {
            updateData.skills = Array.isArray(skills) ? skills : 
                              typeof skills === 'string' ? skills.split(',') : [];
        }

        // Handle avatar update
        if (req.files?.photo?.[0]) {
            const avatarLocalPath = req.files.photo[0].path;
            const avatar = await uploadOnCloudinary(avatarLocalPath);
            if (avatar) {
                updateData.photo = avatar.url;
                // Optionally delete old avatar if needed
            }
        }

        // Update the user
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $set: updateData },
            { new: true, runValidators: true }
        );

        // Generate new token if email or password changed
        let token;
        if (email || password) {
            token = generateToken(updatedUser);
        }

        const response = {
            message: "Profile updated successfully",
            user: {
                id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                role: updatedUser.role,
                photo: updatedUser.photo,
                location: updatedUser.location,
                description: updatedUser.description
            }
        };

        if (token) response.token = token;

        res.status(200).json(response);

    } catch (error) {
        console.error("Error in updateProfile:", error);
        res.status(500).json({ 
            message: 'Server error', 
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

  export const logoutUser = async (req, res) => {
    try {
      // Option 1: Simple logout (just client-side token removal)
      // Return success response
      res.status(200).json({ 
        success: true,
        message: 'User logged out successfully' 
      });
  
    } catch (error) {
      console.error('Error during logout:', error);
      res.status(500).json({ 
        success: false,
        message: 'Server error during logout',
        error: error.message 
      });
    }
  };