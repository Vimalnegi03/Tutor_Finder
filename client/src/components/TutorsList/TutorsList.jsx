import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useDispatch, useSelector } from 'react-redux';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  fetchTutors, 
  connectWithTutor,
  addConnectedTutor
} from '../../store/Slices/tutorSlice';
import { 
  getTutorReviews, 
  selectCurrentTutorReviews,
  selectReviewsLoading,
  selectReviewsError,
  addReview,
  updateReview,
  deleteReview
} from '../../store/Slices/reviewSlice';
import { fetchUserGroups } from '../../store/Slices/groupSlice';
import { logoutUser } from '../../store/Slices/authSlice';
import { getDistance } from 'geolib';
import axios from 'axios';
import { url } from '../../url';

// Enhanced custom marker icons
const learnerIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34]
});

const tutorIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34]
});

const SetMapView = React.memo(({ center }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
});

const TutorsList = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const mapRef = useRef(null);
  
  // State variables
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [expandedReviews, setExpandedReviews] = useState({});
  const [selectedTutorForReview, setSelectedTutorForReview] = useState(null);
  const [editingReview, setEditingReview] = useState(null);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [highlightedTutor, setHighlightedTutor] = useState(null);
  const [userPosition, setUserPosition] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [learnerSwipes, setLearnerSwipes] = useState([]);

  // Redux state
  const { tutors, connectedTutors, loading, error, status, unreadCounts } = useSelector((state) => state.tutors);
  const { groups } = useSelector((state) => state.groups);
  const { reviews: tutorReviews } = useSelector(selectCurrentTutorReviews);
  const reviewsLoading = useSelector(selectReviewsLoading);
  const reviewsError = useSelector(selectReviewsError);

  // User data
  const userData = useMemo(() => location.state || {}, [location.state]);
  const {
    skills: userSkills = [],
    location: userLocation = { coordinates: [0, 0] },
    id: userId = '',
    name = 'User',
    photo
  } = userData;

  // Fetch learner swipes
  const fetchLearnerSwipes = useCallback(async () => {
    if (!userId) return;
    try {
      const response = await axios.get(`${url}/api/users/${userId}`);
      setLearnerSwipes(response.data.swipes || []);
    } catch (error) {
      console.error("Failed to fetch learner swipes:", error);
    }
  }, [userId]);

  // Set user position
  useEffect(() => {
    if (userLocation?.coordinates) {
      setUserPosition([userLocation.coordinates[1], userLocation.coordinates[0]]);
    }
  }, [userLocation]);

  useEffect(() => {
    fetchLearnerSwipes();
  }, [fetchLearnerSwipes]);

  // Calculate distances for all tutors
  const tutorsWithDistance = useMemo(() => {
    return tutors.map(tutor => {
      const distance = userPosition ? 
        getDistance(
          { latitude: userPosition[0], longitude: userPosition[1] },
          { latitude: tutor.location.coordinates[1], longitude: tutor.location.coordinates[0] }
        ) : 0;
      return { ...tutor, distance: (distance / 1000).toFixed(1) };
    });
  }, [tutors, userPosition]);

  // Calculate map center point
  const mapCenter = useMemo(() => {
    if (!userPosition && tutors.length === 0) return [0, 0];
    if (tutors.length === 0) return userPosition;
    
    const sumLat = tutors.reduce((sum, tutor) => 
      sum + tutor.location.coordinates[1], userPosition ? userPosition[0] : 0);
    const sumLng = tutors.reduce((sum, tutor) => 
      sum + tutor.location.coordinates[0], userPosition ? userPosition[1] : 0);
    
    const count = tutors.length + (userPosition ? 1 : 0);
    return [sumLat / count, sumLng / count];
  }, [tutors, userPosition]);

  // Fly to tutor location when card is hovered
  const handleCardHover = useCallback((tutorId) => {
    const tutor = tutors.find(t => t._id === tutorId);
    if (tutor && mapRef.current) {
      mapRef.current.flyTo(
        [tutor.location.coordinates[1], tutor.location.coordinates[0]], 
        14
      );
      setHighlightedTutor(tutorId);
    }
  }, [tutors]);

  // Fly to user location
  const handleLocateUser = useCallback(() => {
    if (userPosition && mapRef.current) {
      mapRef.current.flyTo(userPosition, 15);
    }
  }, [userPosition]);

  const toggleDropdown = useCallback(() => setDropdownOpen(prev => !prev), []);
  
  const handleLogout = useCallback(async () => {
    try {
      await dispatch(logoutUser()).unwrap();
      navigate('/login');
    } catch (error) {
      navigate('/login');
    }
  }, [dispatch, navigate]);

  const handleUpdateProfile = useCallback(() => 
    navigate('/update-profile', { state: { userId } }), [navigate, userId]);

  const handleViewGroups = useCallback(() => 
    navigate('/groups', { state: { userId } }), [navigate, userId]);

  const handleConnect = useCallback(async (tutorId) => {
    dispatch(addConnectedTutor(tutorId));
    try {
      await dispatch(connectWithTutor({ learnerId: userId, tutorId })).unwrap();
      toast.success('Connection request sent!');
    } catch (error) {
      toast.error('Error connecting. Please try again.');
    }
  }, [dispatch, userId]);

  const handleChat = useCallback((tutorId) => {
    navigate('/chat', { state: { tutorId, learnerId: userId, learnerName: name, learnerPhoto: photo } });
  }, [navigate, userId, name, photo]);

  const toggleReviews = useCallback((tutorId) => {
    setExpandedReviews(prev => ({ ...prev, [tutorId]: !prev[tutorId] }));
    if (!expandedReviews[tutorId]) dispatch(getTutorReviews(tutorId));
  }, [dispatch, expandedReviews]);

  const getButtonLabel = useCallback((tutor) => {
    if (learnerSwipes.includes(tutor._id)) return 'Chat';
    if (connectedTutors.includes(tutor._id)) return 'Pending';
    return 'Connect';
  }, [connectedTutors, learnerSwipes]);

  const handleSubmitReview = useCallback(async () => {
    if (!reviewForm.comment.trim()) {
      toast.error('Please enter a review comment');
      return;
    }
    setIsSubmittingReview(true);
    try {
      if (editingReview) {
        await dispatch(updateReview({
          tutorId: selectedTutorForReview,
          reviewId: editingReview._id,
          rating: Number(reviewForm.rating),
          comment: reviewForm.comment
        })).unwrap();
        toast.success('Review updated successfully!');
      } else {
        await dispatch(addReview({
          tutorId: selectedTutorForReview,
          rating: Number(reviewForm.rating),
          comment: reviewForm.comment
        })).unwrap();
        toast.success('Review submitted successfully!');
      }
      setSelectedTutorForReview(null);
      setEditingReview(null);
      setReviewForm({ rating: 5, comment: '' });
      dispatch(getTutorReviews(selectedTutorForReview));
    } catch (error) {
      toast.error(error.payload || 'Failed to submit review');
    } finally {
      setIsSubmittingReview(false);
    }
  }, [dispatch, editingReview, reviewForm, selectedTutorForReview]);

  const handleEditReview = useCallback((review) => {
    setEditingReview(review);
    setSelectedTutorForReview(review.tutorId);
    setReviewForm({ rating: review.rating, comment: review.comment });
  }, []);

  const handleDeleteReview = useCallback(async (reviewId, tutorId) => {
    if (window.confirm('Are you sure you want to delete this review?')) {
      try {
        await dispatch(deleteReview({ tutorId, reviewId })).unwrap();
        toast.success('Review deleted successfully!');
        dispatch(getTutorReviews(tutorId));
      } catch (error) {
        toast.error(error.payload || 'Failed to delete review');
      }
    }
  }, [dispatch]);

  // Fetch tutors and groups
  useEffect(() => {
    if (userId) {
      dispatch(fetchTutors({ userSkills, userLocation, userId }));
      dispatch(fetchUserGroups(userId));
    }
  }, [userSkills, userLocation, userId, dispatch]);

  // Show error toast if there's an error
  useEffect(() => {
    if (error || reviewsError) toast.error(error || reviewsError);
  }, [error, reviewsError]);

  if (loading || status === 'loading') {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-lg font-medium text-gray-700">Loading tutors...</p>
        </div>
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="text-center p-6 bg-white rounded-lg shadow-md max-w-md">
          <h2 className="text-2xl font-bold text-red-500 mb-4">Error Loading Tutors</h2>
          <p className="text-gray-600 mb-6">{error || 'Failed to load tutors'}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} newestOnTop closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
      
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">
            <span className="text-blue-600">Available</span> Tutors
          </h1>
          
          {/* Profile dropdown */}
          <div className="relative">
            <button
              onClick={toggleDropdown}
              className="flex items-center space-x-2 focus:outline-none"
            >
              <div className="relative">
                <img
                  src={photo || 'https://via.placeholder.com/150'}
                  alt="Profile"
                  className="w-10 h-10 rounded-full object-cover border-2 border-blue-500"
                  onError={(e) => e.target.src = 'https://via.placeholder.com/150'}
                />
                {Object.values(unreadCounts || {}).reduce((a, b) => a + b, 0) > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {Object.values(unreadCounts || {}).reduce((a, b) => a + b, 0)}
                  </span>
                )}
              </div>
              <span className="hidden md:inline font-medium text-gray-700">{name}</span>
              <svg
                className={`h-5 w-5 text-gray-500 transition-transform ${dropdownOpen ? 'transform rotate-180' : ''}`}
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg z-50 ring-1 ring-black ring-opacity-5">
                <div className="py-1">
                  <div className="px-4 py-2 text-sm text-gray-700 border-b">
                    Signed in as <span className="font-medium">{name}</span>
                  </div>
                  <button
                    onClick={() => {
                      handleUpdateProfile();
                      setDropdownOpen(false);
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <svg className="w-5 h-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Update Profile
                  </button>
                  <button
                    onClick={() => {
                      handleViewGroups();
                      setDropdownOpen(false);
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <svg className="w-5 h-5 mr-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    View Groups ({groups.length})
                  </button>
                  <button
                    onClick={() => {
                      handleLogout();
                      setDropdownOpen(false);
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100 border-t"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Log Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* Stats Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Available Tutors</h3>
                <p className="text-2xl font-semibold text-gray-900">{tutors.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Unread Messages</h3>
                <p className="text-2xl font-semibold text-gray-900">
                  {Object.values(unreadCounts || {}).reduce((a, b) => a + b, 0)}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100 text-purple-600 mr-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Your Groups</h3>
                <p className="text-2xl font-semibold text-gray-900">{groups.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tutors and Map */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tutors List */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-3">Tutor Matches</h2>
              {tutorsWithDistance.length > 0 ? (
                <div className="space-y-3">
                  {tutorsWithDistance.map((tutor) => (
                    <TutorCard
                      key={tutor._id}
                      tutor={tutor}
                      highlightedTutor={highlightedTutor}
                      onCardHover={handleCardHover}
                      onHighlightChange={setHighlightedTutor}
                      expandedReviews={expandedReviews}
                      toggleReviews={toggleReviews}
                      tutorReviews={tutorReviews}
                      reviewsLoading={reviewsLoading}
                      userId={userId}
                      onEditReview={handleEditReview}
                      onDeleteReview={handleDeleteReview}
                      getButtonLabel={getButtonLabel}
                      onConnect={handleConnect}
                      onChat={handleChat}
                      onImageClick={(image) => {
                        setSelectedImage(image);
                        setIsImageModalOpen(true);
                      }}
                      onAddReviewClick={() => {
                        setEditingReview(null);
                        setSelectedTutorForReview(tutor._id);
                        setReviewForm({ rating: 5, comment: '' });
                      }}
                      unreadCount={unreadCounts?.[tutor._id] || 0}
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-lg p-6 text-center border border-gray-200">
                  <div className="mx-auto w-24 h-24 text-gray-400 mb-4">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-700 mb-2">No tutors found</h3>
                  <p className="text-gray-500 mb-4">
                    {status === 'succeeded' ? 'No tutors found within 10km with matching skills.' : 'Loading tutors...'}
                  </p>
                  <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Refresh
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Map Column */}
          <div className="lg:col-span-2 h-[600px] rounded-lg overflow-hidden shadow-lg sticky top-4 border border-gray-200">
            <MapContainer 
              center={mapCenter} 
              zoom={12} 
              style={{ height: '100%' }}
              whenCreated={(map) => { mapRef.current = map }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              
              <SetMapView center={mapCenter} />
              
              {/* User Location Marker */}
              {userPosition && (
                <Marker position={userPosition} icon={learnerIcon}>
                  <Popup className="custom-popup">
                    <div className="font-bold text-blue-600">Your Location</div>
                    <div className="text-sm text-gray-600">{name}</div>
                  </Popup>
                </Marker>
              )}
              
              {/* Tutor Markers */}
              {tutorsWithDistance.map((tutor) => (
                <Marker
                  key={tutor._id}
                  position={[tutor.location.coordinates[1], tutor.location.coordinates[0]]}
                  icon={tutorIcon}
                  eventHandlers={{
                    click: () => setHighlightedTutor(tutor._id),
                  }}
                >
                  <Popup className="custom-popup">
                    <div className="flex items-center space-x-2">
                      <img 
                        src={tutor.photo} 
                        alt={tutor.name} 
                        className="w-8 h-8 rounded-full object-cover"
                        onError={(e) => e.target.src = 'https://via.placeholder.com/150'}
                      />
                      <div>
                        <div className="font-bold">{tutor.name}</div>
                        <div className="text-sm text-gray-600">{tutor.distance} km from you</div>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center">
                      <span className="text-yellow-500">{tutor.averageRating?.toFixed(1) || '0.0'} ★</span>
                      <span className="text-gray-400 text-xs ml-2">({tutor.reviews?.length || 0} reviews)</span>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>

            {/* Locate User Button */}
            {userPosition && (
              <button 
                onClick={handleLocateUser}
                className="absolute bottom-4 right-4 z-[1000] bg-white p-2 rounded-full shadow-md hover:bg-gray-100 transition-colors"
                title="Center on my location"
                aria-label="Center map on my location"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </main>

      {/* Review Modal */}
      {selectedTutorForReview && (
        <ReviewModal
          editingReview={editingReview}
          reviewForm={reviewForm}
          onFormChange={setReviewForm}
          onClose={() => {
            setSelectedTutorForReview(null);
            setEditingReview(null);
            setReviewForm({ rating: 5, comment: '' });
          }}
          onSubmit={handleSubmitReview}
          isSubmitting={isSubmittingReview}
        />
      )}

      {/* Image Modal */}
      {isImageModalOpen && selectedImage && (
        <ImageModal 
          image={selectedImage} 
          onClose={() => setIsImageModalOpen(false)} 
        />
      )}
    </div>
  );
};

// Enhanced TutorCard component
const TutorCard = React.memo(({
  tutor,
  highlightedTutor,
  onCardHover,
  onHighlightChange,
  expandedReviews,
  toggleReviews,
  tutorReviews,
  reviewsLoading,
  userId,
  onEditReview,
  onDeleteReview,
  getButtonLabel,
  onConnect,
  onChat,
  onImageClick,
  onAddReviewClick,
  unreadCount
}) => {
  const buttonLabel = getButtonLabel(tutor);
  
  return (
    <div
      className={`bg-white border rounded-lg p-4 transition-all transform hover:scale-[1.01] ${
        highlightedTutor === tutor._id 
          ? 'ring-2 ring-blue-500 border-blue-300' 
          : 'border-gray-200 hover:border-blue-200'
      }`}
      onMouseEnter={() => onCardHover(tutor._id)}
      onMouseLeave={() => onHighlightChange(null)}
    >
      <div className="flex items-start space-x-3">
        <div className="relative">
          <img
            src={tutor.photo || 'https://via.placeholder.com/150'}
            alt={tutor.name}
            className="w-14 h-14 rounded-full object-cover cursor-pointer border-2 border-white shadow-sm hover:opacity-90 transition-opacity"
            onClick={() => onImageClick(tutor.photo || 'https://via.placeholder.com/150')}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://via.placeholder.com/150';
            }}
          />
          <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white text-xs rounded-full px-1.5 py-0.5 shadow-sm">
            {tutor.distance} km
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">{tutor.name}</h3>
          <div className="flex items-center mt-1 space-x-2">
            <div className="flex items-center">
              <span className="text-yellow-500 text-sm">
                {tutor.averageRating?.toFixed(1) || '0.0'} ★
              </span>
              <span className="text-gray-400 text-xs ml-1">
                ({tutor.reviews?.length || 0})
              </span>
            </div>
            <span className="text-gray-400">•</span>
            <span className="text-sm text-gray-600">
              {tutor.skills?.slice(0, 2).join(', ')}
              {tutor.skills?.length > 2 && '...'}
            </span>
          </div>
          <p className="text-gray-600 text-sm mt-1 line-clamp-2">
            {tutor.description || 'No description available'}
          </p>
          
          {/* Action Buttons */}
          <div className="mt-3 flex space-x-2 items-center">
            <button
              onClick={() => {
                if (buttonLabel === 'Connect') onConnect(tutor._id);
                else if (buttonLabel === 'Chat') onChat(tutor._id);
              }}
              className={`flex items-center px-3 py-1.5 text-sm rounded-md relative transition-colors ${
                buttonLabel === 'Pending' 
                  ? 'bg-gray-200 text-gray-600 cursor-not-allowed' :
                buttonLabel === 'Chat' 
                  ? 'bg-green-600 text-white hover:bg-green-700' :
                  'bg-blue-600 text-white hover:bg-blue-700'
              }`}
              disabled={buttonLabel === 'Pending'}
            >
              {buttonLabel}
              {buttonLabel === 'Chat' && unreadCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
            
            {buttonLabel === 'Chat' &&
              !tutor.reviews.some((review) => review.learner === userId) && (
                <button
                  onClick={onAddReviewClick}
                  className="flex items-center px-3 py-1.5 bg-purple-600 text-white text-sm rounded-md hover:bg-purple-700 transition-colors"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                  Review
                </button>
              )}
          </div>
          
          {/* Reviews Section */}
          <div className="mt-3">
            <button
              onClick={() => toggleReviews(tutor._id)}
              className="text-blue-600 text-sm hover:underline flex items-center"
            >
              {expandedReviews[tutor._id] ? (
                <>
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
                  </svg>
                  Hide reviews
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                  Show reviews ({tutor.reviews?.length || 0})
                </>
              )}
            </button>
            
            {expandedReviews[tutor._id] && (
              <div className="mt-2 bg-gray-50 p-3 rounded-lg border border-gray-200">
                {reviewsLoading ? (
                  <div className="text-center py-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                  </div>
                ) : (
                  <>
                    {tutorReviews?.length > 0 ? (
                      <div className="max-h-40 overflow-y-auto space-y-3">
                        {tutorReviews.map((review) => (
                          <div key={review._id} className="bg-white p-3 rounded border border-gray-200">
                            <div className="flex justify-between items-start">
                              <div>
                                <span className="font-medium text-sm">{review.learner?.name || 'Anonymous'}</span>
                                <div className="flex items-center mt-1">
                                  {[...Array(5)].map((_, i) => (
                                    <svg
                                      key={i}
                                      className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                                      fill="currentColor"
                                      viewBox="0 0 20 20"
                                    >
                                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                  ))}
                                </div>
                              </div>
                              <span className="text-gray-400 text-xs">
                                {new Date(review.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-gray-600 text-xs mt-2">{review.comment}</p>
                            {review.learner?._id === userId && (
                              <div className="flex justify-end space-x-3 mt-2">
                                <button 
                                  onClick={() => onEditReview({ ...review, tutorId: tutor._id })}
                                  className="text-blue-500 text-xs hover:underline flex items-center"
                                >
                                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                  Edit
                                </button>
                                <button 
                                  onClick={() => onDeleteReview(review._id, tutor._id)}
                                  className="text-red-500 text-xs hover:underline flex items-center"
                                >
                                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-2 text-sm">No reviews yet</p>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

// Enhanced ReviewModal component
const ReviewModal = React.memo(({
  editingReview,
  reviewForm,
  onFormChange,
  onClose,
  onSubmit,
  isSubmitting
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000] p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
        <div className="bg-blue-600 p-4 text-white">
          <h3 className="text-xl font-semibold">
            {editingReview ? 'Edit Review' : 'Add Review'}
          </h3>
        </div>
        
        <div className="p-6">
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Rating</label>
            <div className="flex items-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => onFormChange({...reviewForm, rating: star})}
                  className="focus:outline-none"
                >
                  <svg
                    className={`w-8 h-8 ${star <= reviewForm.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </button>
              ))}
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Your Review</label>
            <textarea
              value={reviewForm.comment}
              onChange={(e) => onFormChange({...reviewForm, comment: e.target.value})}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Share your experience with this tutor..."
              rows="4"
            />
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              onClick={onSubmit}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
              disabled={isSubmitting}
            >
              {isSubmitting && (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {editingReview ? 'Update Review' : 'Submit Review'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

// Enhanced ImageModal component
const ImageModal = React.memo(({ image, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[1001] p-4" onClick={onClose}>
      <div className="relative max-w-4xl max-h-full">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full p-2 z-10 hover:bg-opacity-75 transition-all"
          aria-label="Close image modal"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <img 
          src={image} 
          alt="Full size profile" 
          className="max-w-full max-h-screen object-contain rounded-lg shadow-xl"
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    </div>
  );
});

export default TutorsList;