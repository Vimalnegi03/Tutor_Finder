import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useLocation, useNavigate } from 'react-router-dom';
import { updateProfile } from '../../store/Slices/authSlice';

const UpdateProfile = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userId } = location.state || {};
  const dispatch = useDispatch();
  
  const { user, loading: authLoading, error } = useSelector((state) => state.auth);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    location: '',
    coordinates: null,
    description: '',
    skills: '',
    currentPassword: '',
    newPassword: '',
    photo: null,
  });

  const [loading, setLoading] = useState(true);
  const [skillsError, setSkillsError] = useState('');
  const [locationLoading, setLocationLoading] = useState(false);

  useEffect(() => {
    if (user) {
      let skillsString = '';
      if (Array.isArray(user.skills)) {
        skillsString = user.skills.join(', ');
      } else if (typeof user.skills === 'string') {
        try {
          const cleaned = user.skills.replace(/^"|"$/g, '').replace(/\\"/g, '"');
          const parsed = JSON.parse(cleaned);
          skillsString = Array.isArray(parsed) ? parsed.join(', ') : user.skills;
        } catch {
          skillsString = user.skills;
        }
      }

      setFormData({
        name: user.name || '',
        email: user.email || '',
        location: user.location?.address || '',
        coordinates: user.location?.coordinates || null,
        description: user.description || '',
        skills: skillsString,
        currentPassword: '',
        newPassword: '',
        photo: null,
      });
      setLoading(false);
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
    if (name === 'skills') setSkillsError('');
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.size > 2 * 1024 * 1024) {
      toast.error('Image size should be less than 2MB');
      return;
    }
    setFormData((prevData) => ({
      ...prevData,
      photo: file,
    }));
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    setLocationLoading(true);
    toast.info('Getting your location...');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setFormData(prev => ({
          ...prev,
          coordinates: [longitude, latitude],
          location: 'Current Location'
        }));
        setLocationLoading(false);
        toast.success('Location detected successfully');
      },
      (error) => {
        setLocationLoading(false);
        toast.error(`Error getting location: ${error.message}`);
      }
    );
  };

  const validateSkills = (skillsString) => {
    if (!skillsString.trim()) return true;
    const skillsArray = skillsString.split(',').map(skill => skill.trim()).filter(skill => skill);
    if (skillsArray.length === 0) {
      setSkillsError('Please enter valid skills');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateSkills(formData.skills)) return;

    const formDataToSend = new FormData();
    
    if (formData.name && formData.name !== user.name) {
      formDataToSend.append('name', formData.name);
    }
    
    if (formData.email && formData.email !== user.email) {
      formDataToSend.append('email', formData.email);
    }
    
    if (formData.location !== (user.location?.address || '')) {
      formDataToSend.append('location', formData.location);
    }
    
    if (formData.coordinates && JSON.stringify(formData.coordinates) !== JSON.stringify(user.location?.coordinates || [])) {
      formDataToSend.append('coordinates', JSON.stringify(formData.coordinates));
    }
    
    if (formData.description !== user.description) {
      formDataToSend.append('description', formData.description);
    }
    
    if (formData.skills !== user.skills?.join(', ')) {
      const skillsArray = formData.skills.split(',')
        .map(skill => skill.trim())
        .filter(skill => skill);
      formDataToSend.append('skills', JSON.stringify(skillsArray));
    }
    
    if (formData.currentPassword && formData.newPassword) {
      if (formData.newPassword.length < 6) {
        toast.error('Password must be at least 6 characters');
        return;
      }
      formDataToSend.append('currentPassword', formData.currentPassword);
      formDataToSend.append('password', formData.newPassword);
    }
    
    if (formData.photo) {
      formDataToSend.append('photo', formData.photo);
    }

    if (Array.from(formDataToSend.entries()).length === 0) {
      toast.info('No changes were made');
      return;
    }

    try {
      const result = await dispatch(updateProfile(formDataToSend));
      
      if (updateProfile.fulfilled.match(result)) {
        toast.success('Profile updated successfully!');
        navigate(-1);
      } else if (updateProfile.rejected.match(result)) {
        toast.error(result.payload || 'Failed to update profile');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
      console.error('Update error:', error);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-lg">
      <ToastContainer position="top-right" autoClose={5000} />
      <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">Update Your Profile</h1>
      
      <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-lg shadow-md">
        {/* Name Field */}
        <div>
          <label htmlFor="name" className="block text-gray-700 font-medium mb-1">
            Name <span className="text-gray-500 text-sm">(optional)</span>
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Your display name"
            maxLength="50"
          />
        </div>

        {/* Email Field */}
        <div>
          <label htmlFor="email" className="block text-gray-700 font-medium mb-1">
            Email <span className="text-gray-500 text-sm">(optional)</span>
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="your@email.com"
          />
        </div>

        {/* Location Field */}
        <div>
          <label htmlFor="location" className="block text-gray-700 font-medium mb-1">
            Location <span className="text-gray-500 text-sm">(optional)</span>
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="flex-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="City, Country or use current location"
            />
            <button
              type="button"
              onClick={handleUseMyLocation}
              disabled={locationLoading}
              className="px-4 bg-gray-100 hover:bg-gray-200 rounded transition-colors whitespace-nowrap flex items-center justify-center"
            >
              {locationLoading ? (
                <svg className="animate-spin h-4 w-4 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <span>Use My Location</span>
              )}
            </button>
          </div>
          {formData.coordinates && (
            <p className="text-sm text-gray-500 mt-1">
              Coordinates: {formData.coordinates[0]?.toFixed(4)}, {formData.coordinates[1]?.toFixed(4)}
            </p>
          )}
        </div>

        {/* Description Field */}
        <div>
          <label htmlFor="description" className="block text-gray-700 font-medium mb-1">
            About You <span className="text-gray-500 text-sm">(optional)</span>
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows="3"
            placeholder="Tell others about yourself..."
            maxLength="500"
          />
        </div>

        {/* Skills Field */}
        <div>
          <label htmlFor="skills" className="block text-gray-700 font-medium mb-1">
            Skills <span className="text-gray-500 text-sm">(comma separated, optional)</span>
          </label>
          <input
            type="text"
            id="skills"
            name="skills"
            value={formData.skills}
            onChange={handleChange}
            className={`w-full p-2 border ${skillsError ? 'border-red-500' : 'border-gray-300'} rounded focus:outline-none focus:ring-2 focus:ring-blue-500`}
            placeholder="JavaScript, React, Design"
          />
          {skillsError && <p className="text-red-500 text-sm mt-1">{skillsError}</p>}
        </div>

        {/* Password Change Fields */}
        <div className="space-y-2 border-t pt-4">
          <h3 className="font-medium text-gray-700">
            Change Password <span className="text-gray-500 text-sm font-normal">(leave blank to keep current)</span>
          </h3>
          
          <div>
            <label htmlFor="currentPassword" className="block text-gray-700 mb-1">
              Current Password
            </label>
            <input
              type="password"
              id="currentPassword"
              name="currentPassword"
              value={formData.currentPassword}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Only if changing password"
            />
          </div>
          
          <div>
            <label htmlFor="newPassword" className="block text-gray-700 mb-1">
              New Password
            </label>
            <input
              type="password"
              id="newPassword"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="At least 6 characters"
              minLength="6"
            />
          </div>
        </div>

        {/* Profile Photo Upload */}
        <div className="border-t pt-4">
          <label htmlFor="photo" className="block text-gray-700 font-medium mb-1">
            Profile Photo <span className="text-gray-500 text-sm">(max 2MB, optional)</span>
          </label>
          <div className="flex items-center space-x-4">
            {user?.photo && (
              <img 
                src={user.photo} 
                alt="Current profile" 
                className="w-12 h-12 rounded-full object-cover"
              />
            )}
            <input
              type="file"
              id="photo"
              name="photo"
              onChange={handleFileChange}
              className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              accept="image/*"
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-4">
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            disabled={authLoading}
          >
            {authLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Updating...
              </span>
            ) : 'Update Profile'}
          </button>
        </div>

        {error && (
          <div className="text-red-500 text-center mt-2 p-2 bg-red-50 rounded">
            {error}
          </div>
        )}
      </form>
    </div>
  );
};

export default UpdateProfile;