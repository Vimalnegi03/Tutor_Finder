import React, { useEffect, useState } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { motion } from 'framer-motion';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useDispatch, useSelector } from 'react-redux';
import { registerUser, resetAuthState } from '../../store/Slices/authSlice';

// Comprehensive list of subjects/skills
const SUBJECTS_SKILLS = [
  // Academic Subjects
  { category: 'Academic', items: [
    'Mathematics', 'Algebra', 'Geometry', 'Calculus', 'Statistics',
    'Physics', 'Chemistry', 'Biology', 'Environmental Science',
    'English', 'Literature', 'Creative Writing', 'Grammar',
    'History', 'World History', 'US History', 'European History',
    'Geography', 'Political Science', 'Economics', 'Psychology',
    'Sociology', 'Philosophy', 'Anthropology'
  ]},
  // Languages
  { category: 'Languages', items: [
    'Spanish', 'French', 'German', 'Mandarin', 'Japanese',
    'Korean', 'Arabic', 'Hindi', 'Russian', 'Italian',
    'Portuguese', 'English as Second Language (ESL)'
  ]},
  // Computer Science & Technology
  { category: 'Computer Science', items: [
    'Programming', 'Web Development', 'Mobile Development',
    'Python', 'JavaScript', 'Java', 'C++', 'C#', 'Ruby',
    'PHP', 'Swift', 'Kotlin', 'Go', 'Rust',
    'Data Structures', 'Algorithms', 'Machine Learning',
    'Artificial Intelligence', 'Data Science', 'Database Management',
    'Computer Networking', 'Cybersecurity', 'Blockchain',
    'Game Development', 'UI/UX Design', 'Graphic Design'
  ]},
  // Test Preparation
  { category: 'Test Prep', items: [
    'SAT', 'ACT', 'GRE', 'GMAT', 'LSAT',
    'MCAT', 'TOEFL', 'IELTS', 'AP Exams', 'IB Exams'
  ]},
  // Arts & Music
  { category: 'Arts & Music', items: [
    'Drawing', 'Painting', 'Sculpture', 'Photography',
    'Graphic Design', 'Digital Art', 'Music Theory',
    'Piano', 'Guitar', 'Violin', 'Drums', 'Singing',
    'Music Production', 'Acting', 'Dance'
  ]},
  // Vocational & Professional
  { category: 'Vocational', items: [
    'Public Speaking', 'Creative Writing', 'Resume Writing',
    'Interview Preparation', 'Business Management',
    'Entrepreneurship', 'Marketing', 'Finance',
    'Accounting', 'Stock Market', 'Real Estate',
    'Cooking', 'Baking', 'Carpentry', 'Electrical Work',
    'Plumbing', 'Auto Mechanics'
  ]},
  // Miscellaneous
  { category: 'Other', items: [
    'Yoga', 'Meditation', 'Life Coaching', 'Time Management',
    'Study Skills', 'Special Needs Education', 'Sign Language'
  ]}
];

const Register = () => {
  const dispatch = useDispatch();
  const { loading, error, success } = useSelector((state) => state.auth);
  const [locationError, setLocationError] = useState(null);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [skillInput, setSkillInput] = useState('');
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    if (success) {
      toast.success('Registration successful!', { position: "top-center" });
      dispatch(resetAuthState());
    }
    if (error) {
      toast.error(error, { position: "top-center" });
      dispatch(resetAuthState());
    }
  }, [success, error, dispatch]);

  const validationSchema = Yup.object().shape({
    name: Yup.string().required('Name is required'),
    email: Yup.string().email('Invalid email address').required('Email is required'),
    password: Yup.string().required('Password is required'),
    gender: Yup.string().oneOf(['Male', 'Female', 'Other'], 'Invalid Gender').required('Gender is required'),
    skills: Yup.string().required('Please select at least one skill'),
    location: Yup.string()
      .test('location-required', 'Location is required', function(value) {
        return this.parent.useCurrentLocation || (value && value.trim().length > 0);
      }),
    role: Yup.string().oneOf(['learner', 'tutor'], 'Invalid Role').required('Role is required'),
    photo: Yup.mixed()
      .required('Profile photo is required')
      .test('fileSize', 'File too large', (value) => value && value.size <= 5 * 1024 * 1024)
      .test('fileType', 'Unsupported file type', (value) => value && ['image/jpeg', 'image/png'].includes(value.type)),
    description: Yup.string().required('Description is required'),
    useCurrentLocation: Yup.boolean(),
    coordinates: Yup.array()
      .test('coordinates-required', 'Valid coordinates are required', function(value) {
        return !this.parent.useCurrentLocation || (value && value.length === 2);
      })
  });

  const getCurrentLocation = (setFieldValue) => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      return;
    }

    setLocationError(null);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = [position.coords.longitude, position.coords.latitude];
        setFieldValue('useCurrentLocation', true);
        setFieldValue('coordinates', coords);
        setFieldValue('location', `Current Location (${coords[1].toFixed(4)}, ${coords[0].toFixed(4)})`);
      },
      (err) => {
        setLocationError("Unable to retrieve your location");
        setFieldValue('useCurrentLocation', false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const handleSubmit = async (values, { resetForm }) => {
    const userData = {
      name: values.name,
      email: values.email,
      password: values.password,
      gender: values.gender,
      skills: selectedSkills.join(', '),
      role: values.role,
      photo: values.photo,
      description: values.description,
      useCurrentLocation: values.useCurrentLocation,
      ...(values.useCurrentLocation ? { coordinates: values.coordinates } : { location: values.location })
    };

    try {
      await dispatch(registerUser(userData)).unwrap();
      resetForm();
      setSelectedSkills([]);
      setImagePreview(null);
    } catch (error) {
      // Error is already handled by the thunk and displayed via toast
    }
  };

  const handleFileChange = (e, setFieldValue, setFieldError) => {
    const file = e.currentTarget.files[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      setFieldError('photo', 'Only JPEG/PNG images are allowed');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setFieldError('photo', 'File size must be less than 5MB');
      return;
    }

    // Create image preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);

    setFieldValue('photo', file);
  };

  const addSkill = (skill, setFieldValue) => {
    if (skill && !selectedSkills.includes(skill)) {
      const newSkills = [...selectedSkills, skill];
      setSelectedSkills(newSkills);
      setFieldValue('skills', newSkills.join(', '));
      setSkillInput('');
    }
  };

  const removeSkill = (skillToRemove, setFieldValue) => {
    const newSkills = selectedSkills.filter(skill => skill !== skillToRemove);
    setSelectedSkills(newSkills);
    setFieldValue('skills', newSkills.join(', '));
  };

  const getRoleDescriptionPlaceholder = (role) => {
    if (role === 'tutor') {
      return "Describe your teaching experience, qualifications, methodology, and what makes you a great tutor. Example: 'I'm a certified math teacher with 5 years of experience helping high school students improve their grades. I specialize in algebra and calculus, and I focus on building problem-solving skills through practical examples.'";
    }
    return "Describe your learning goals, areas you need help with, and any specific requirements. Example: 'I'm a high school student looking to improve my understanding of algebra and geometry. I learn best through visual explanations and practical examples. My goal is to improve my grades and prepare for college entrance exams.'";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md space-y-4"
    >
      <h2 className="text-2xl font-bold text-center text-gray-700">Register</h2>

      <Formik
        initialValues={{
          name: '',
          email: '',
          password: '',
          gender: '',
          skills: '',
          location: '',
          role: '',
          photo: null,
          description: '',
          useCurrentLocation: false,
          coordinates: null
        }}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ setFieldValue, setFieldError, values }) => (
          <Form className="space-y-4">
            {/* Name, Email, Password fields remain the same */}
            <div>
              <label className="block text-gray-600 mb-2" htmlFor="name">Name</label>
              <Field
                type="text"
                name="name"
                placeholder="Enter your name"
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-400"
              />
              <ErrorMessage name="name" component="div" className="text-red-500 text-sm" />
            </div>

            <div>
              <label className="block text-gray-600 mb-2" htmlFor="email">Email</label>
              <Field
                type="email"
                name="email"
                placeholder="Enter your email"
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-400"
              />
              <ErrorMessage name="email" component="div" className="text-red-500 text-sm" />
            </div>

            <div>
              <label className="block text-gray-600 mb-2" htmlFor="password">Password</label>
              <Field
                type="password"
                name="password"
                placeholder="Enter your password"
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-400"
              />
              <ErrorMessage name="password" component="div" className="text-red-500 text-sm" />
            </div>

            <div>
              <label className="block text-gray-600 mb-2" htmlFor="gender">Gender</label>
              <Field
                as="select"
                name="gender"
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-400"
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </Field>
              <ErrorMessage name="gender" component="div" className="text-red-500 text-sm" />
            </div>

            {/* Enhanced Skills Selection */}
            <div>
              <label className="block text-gray-600 mb-2" htmlFor="skills">
                {values.role === 'tutor' ? 'Subjects You Teach' : 'Subjects You Want to Learn'}
              </label>
              
              <div className="mb-2">
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    placeholder="Search or type a skill"
                    className="flex-1 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-400"
                  />
                  <button
                    type="button"
                    onClick={() => addSkill(skillInput, setFieldValue)}
                    className="px-4 py-3 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                  >
                    Add
                  </button>
                </div>
                
                {/* Skills dropdown */}
                <div className="relative">
                  {skillInput && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                      {SUBJECTS_SKILLS.map((category) => {
                        const filteredItems = category.items.filter(item =>
                          item.toLowerCase().includes(skillInput.toLowerCase())
                        );
                        
                        return filteredItems.length > 0 ? (
                          <div key={category.category}>
                            <div className="px-3 py-1 bg-gray-100 text-sm font-semibold text-gray-700">
                              {category.category}
                            </div>
                            {filteredItems.map((item) => (
                              <div
                                key={item}
                                className="px-3 py-2 hover:bg-blue-50 cursor-pointer"
                                onClick={() => {
                                  addSkill(item, setFieldValue);
                                }}
                              >
                                {item}
                              </div>
                            ))}
                          </div>
                        ) : null;
                      })}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Selected skills */}
              <div className="flex flex-wrap gap-2 mb-2">
                {selectedSkills.map((skill) => (
                  <div key={skill} className="flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                    {skill}
                    <button
                      type="button"
                      onClick={() => removeSkill(skill, setFieldValue)}
                      className="ml-2 text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              
              <Field type="hidden" name="skills" />
              <ErrorMessage name="skills" component="div" className="text-red-500 text-sm" />
            </div>

            {/* Location field remains the same */}
            <div>
              <label className="block text-gray-600 mb-2" htmlFor="location">
                Location
                {values.useCurrentLocation && (
                  <span className="ml-2 text-green-500 text-sm">(Using current location)</span>
                )}
              </label>
              <div className="flex gap-2">
                <Field
                  type="text"
                  name="location"
                  placeholder={values.useCurrentLocation ? "Current location will be used" : "Enter your location"}
                  className={`flex-1 p-3 border ${values.useCurrentLocation ? 'bg-gray-100' : 'bg-white'} border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-400`}
                  disabled={values.useCurrentLocation}
                />
                <button
                  type="button"
                  onClick={() => getCurrentLocation(setFieldValue)}
                  className={`px-4 py-3 rounded-md ${values.useCurrentLocation ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                  {values.useCurrentLocation ? '✓ Using Current Location' : 'Use My Location'}
                </button>
              </div>
              <ErrorMessage name="location" component="div" className="text-red-500 text-sm" />
              <ErrorMessage name="coordinates" component="div" className="text-red-500 text-sm" />
              {locationError && <div className="text-red-500 text-sm">{locationError}</div>}
            </div>

            <div>
              <label className="block text-gray-600 mb-2" htmlFor="role">Role</label>
              <Field
                as="select"
                name="role"
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-400"
                onChange={(e) => {
                  setFieldValue('role', e.target.value);
                  // Update description placeholder when role changes
                  setFieldValue('description', '');
                }}
              >
                <option value="">Select Role</option>
                <option value="learner">Learner</option>
                <option value="tutor">Tutor</option>
              </Field>
              <ErrorMessage name="role" component="div" className="text-red-500 text-sm" />
            </div>

            {/* Enhanced Profile Photo Upload with Preview */}
            <div>
              <label className="block text-gray-600 mb-2" htmlFor="photo">Profile Photo</label>
              <input
                type="file"
                name="photo"
                onChange={(e) => handleFileChange(e, setFieldValue, setFieldError)}
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none"
                accept="image/jpeg, image/png"
                id="photo-upload"
              />
              <ErrorMessage name="photo" component="div" className="text-red-500 text-sm" />
              
              {/* Image Preview */}
              {imagePreview && (
                <div className="mt-4">
                  <div className="text-sm text-gray-500 mb-2">Preview:</div>
                  <div className="relative w-32 h-32 border border-gray-300 rounded-md overflow-hidden">
                    <img 
                      src={imagePreview} 
                      alt="Profile preview" 
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImagePreview(null);
                        setFieldValue('photo', null);
                        document.getElementById('photo-upload').value = '';
                      }}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                    >
                      ×
                    </button>
                  </div>
                </div>
              )}
              
              {values.photo && !imagePreview && (
                <div className="mt-2 text-sm text-gray-500">
                  Selected: {values.photo.name} ({(values.photo.size / 1024 / 1024).toFixed(2)} MB)
                </div>
              )}
            </div>

            <div>
              <label className="block text-gray-600 mb-2" htmlFor="description">
                {values.role === 'tutor' ? 'Teaching Profile' : 'Learning Profile'}
              </label>
              <Field
                as="textarea"
                name="description"
                placeholder={values.role ? getRoleDescriptionPlaceholder(values.role) : 'Describe yourself'}
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-400"
                rows="4"
              />
              <ErrorMessage name="description" component="div" className="text-red-500 text-sm" />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-blue-500 text-white font-semibold rounded-md hover:bg-blue-600 focus:outline-none disabled:bg-blue-300"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Registering...
                </span>
              ) : 'Register'}
            </button>
          </Form>
        )}
      </Formik>
      
      <div className="text-center">
        <p className="text-sm">Already have an account? <a href="/login" className="text-blue-500 hover:underline">Login</a></p>
      </div>
      
      <ToastContainer 
        position="top-center"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </motion.div>
  );
};

export default Register;