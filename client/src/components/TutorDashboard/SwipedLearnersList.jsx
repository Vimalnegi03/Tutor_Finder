import { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useDispatch, useSelector } from 'react-redux';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { logoutUser } from '../../store/Slices/authSlice';
import { 
  fetchSwipedLearners, 
  connectWithLearner, 
  fetchUnreadCounts,
  clearUnreadCount
} from '../../store/Slices/swipeSlice';
import { createGroup, fetchUserGroups, addMembersToGroup } from '../../store/Slices/groupSlice';
import { getDistance } from 'geolib';

// Custom icons with better styling
const learnerIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34]
});

const tutorIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34]
});

const SetMapView = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
};

const SwipedLearnersList = ({ tutorId }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const mapRef = useRef(null);
  
  // Get state from Redux store
  const { learners, unreadCounts, loading, error, connecting } = useSelector((state) => state.swipes);
  const { user } = useSelector((state) => state.auth);
  const { groups, status: groupStatus } = useSelector((state) => state.groups);
  
  const userId = user?._id || location.state?.id;
  const photo = user?.photo || location.state?.photo;
  const name = user?.name || location.state?.name;
  const userLocation = user?.location || location.state?.location || { coordinates: [0, 0] };
  
  const [menuOpen, setMenuOpen] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showAddToGroupModal, setShowAddToGroupModal] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [selectedLearners, setSelectedLearners] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [creationStep, setCreationStep] = useState(1);
  const [avatar, setAvatar] = useState(null);
  const [highlightedLearner, setHighlightedLearner] = useState(null);
  const [viewingImage, setViewingImage] = useState(null);

  // Calculate distances for all learners
  const learnersWithDistance = learners.map(learner => {
    const distance = getDistance(
      { latitude: userLocation.coordinates[1], longitude: userLocation.coordinates[0] },
      { latitude: learner.location?.coordinates[1] || 0, longitude: learner.location?.coordinates[0] || 0 }
    );
    return { ...learner, distance: (distance / 1000).toFixed(1) };
  });

  // Calculate map center point
  const getMapCenter = () => {
    if (learners.length === 0) return [userLocation.coordinates[1], userLocation.coordinates[0]];
    
    const avgLat = learners.reduce((sum, learner) => 
      sum + (learner.location?.coordinates[1] || userLocation.coordinates[1]), 
      userLocation.coordinates[1]) / (learners.length + 1);
    
    const avgLng = learners.reduce((sum, learner) => 
      sum + (learner.location?.coordinates[0] || userLocation.coordinates[0]), 
      userLocation.coordinates[0]) / (learners.length + 1);
    
    return [avgLat, avgLng];
  };

  // Fly to learner location when card is hovered
  const handleCardHover = (learnerId) => {
    const learner = learners.find(l => l._id === learnerId);
    if (learner && learner.location?.coordinates && mapRef.current) {
      mapRef.current.flyTo(
        [learner.location.coordinates[1], learner.location.coordinates[0]], 
        14
      );
      setHighlightedLearner(learnerId);
    }
  };

  const handleImageClick = (imageUrl) => {
    setViewingImage(imageUrl);
  };

  const handleConnect = async (learnerId) => {
    try {
      await dispatch(connectWithLearner({ userId, learnerId })).unwrap();
      toast.success('Successfully connected with the learner!');
    } catch (err) {
      toast.error('Failed to connect with the learner.');
    }
  };

  const handleChat = (learnerId) => {
    dispatch(clearUnreadCount(learnerId));
    navigate('/chat', { 
      state: { 
        tutorId: learnerId, 
        learnerId: userId, 
        tutorName: name, 
        tutorPhoto: photo 
      } 
    });
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      toast.error('Please enter a group name');
      return;
    }

    if (selectedLearners.length === 0) {
      toast.error('Please select at least one learner');
      return;
    }

    try {
      await dispatch(createGroup({ 
        name: groupName,
        members: selectedLearners,
        creator: userId,
        avatar
      })).unwrap();
      
      toast.success('Group created successfully!');
      resetGroupCreation();
      dispatch(fetchUserGroups(userId));
    } catch (err) {
      toast.error('Failed to create group');
    }
  };

  const handleAddToGroup = async () => {
    if (!selectedGroup) {
      toast.error('Please select a group');
      return;
    }

    if (selectedLearners.length === 0) {
      toast.error('Please select at least one learner');
      return;
    }

    try {
      const result = await dispatch(addMembersToGroup({
        groupId: selectedGroup._id,
        memberIds: Array.isArray(selectedLearners) ? selectedLearners : [selectedLearners]
      })).unwrap();
      
      if (result.message) {
        toast.info(result.message);
      } else {
        toast.success('Learners added to group successfully!');
      }
      resetAddToGroup();
      dispatch(fetchUserGroups(userId));
    } catch (err) {
      toast.error(err.payload || 'Failed to add learners to group');
    }
  };

  const handleStartGroupCreation = () => {
    setShowGroupModal(true);
    setShowAddToGroupModal(false);
    setCreationStep(1);
  };

  const handleStartAddToGroup = () => {
    if (groups.length === 0) {
      toast.error('You have no groups to add to. Please create a group first.');
      return;
    }
    setShowAddToGroupModal(true);
    setShowGroupModal(false);
    setCreationStep(1);
  };

  const handleLearnerSelection = (learnerId) => {
    setSelectedLearners(prev => {
      const newSelection = prev.includes(learnerId) 
        ? prev.filter(id => id !== learnerId) 
        : [...prev, learnerId];
      return newSelection;
    });
  };

  const resetGroupCreation = () => {
    setShowGroupModal(false);
    setGroupName('');
    setSelectedLearners([]);
    setCreationStep(1);
    setAvatar(null);
  };

  const resetAddToGroup = () => {
    setShowAddToGroupModal(false);
    setSelectedLearners([]);
    setSelectedGroup(null);
    setCreationStep(1);
  };

  const proceedToNaming = () => {
    if (selectedLearners.length === 0) {
      toast.error('Please select at least one learner');
      return;
    }
    setCreationStep(2);
  };

  const handleViewGroups = () => {
    navigate('/groups', { state: { userId } });
  };

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser()).unwrap();
      navigate('/login');
    } catch (error) {
      navigate('/login');
    }
  };

  const handleUpdateProfile = () => {
    navigate('/update-profile', { state: { userId } });
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatar(file);
    }
  };

  useEffect(() => {
    if (userId) {
      dispatch(fetchSwipedLearners(userId))
        .unwrap()
        .then((learners) => {
          if (learners && learners.length > 0) {
            const learnerIds = learners.map(learner => learner._id);
            dispatch(fetchUnreadCounts({ userId, learnerIds }));
          }
        });
      
      dispatch(fetchUserGroups(userId));
    } else {
      toast.error('User ID not found. Please log in again.');
    }
  }, [userId, dispatch]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
    if (groupStatus === 'failed') {
      toast.error('Group operation failed');
    }
  }, [error, groupStatus]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-lg font-medium text-gray-700">Loading learners...</p>
        </div>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center p-6 bg-white rounded-lg shadow-md max-w-md">
          <h2 className="text-2xl font-bold text-red-500 mb-4">Authentication Required</h2>
          <p className="text-gray-600 mb-6">User ID not found. Please log in again.</p>
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Login
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
            <span className="text-blue-600">Learners</span> Who Liked You
          </h1>
          
          {/* Profile dropdown */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center space-x-2 focus:outline-none"
            >
              <div className="relative">
                <img
                  src={photo || 'https://via.placeholder.com/150'}
                  alt="Profile"
                  className="w-10 h-10 rounded-full object-cover border-2 border-blue-500"
                  onError={(e) => e.target.src = 'https://via.placeholder.com/150'}
                />
                {Object.values(unreadCounts).reduce((a, b) => a + b, 0) > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {Object.values(unreadCounts).reduce((a, b) => a + b, 0)}
                  </span>
                )}
              </div>
              <span className="hidden md:inline font-medium text-gray-700">{name}</span>
              <svg
                className={`h-5 w-5 text-gray-500 transition-transform ${menuOpen ? 'transform rotate-180' : ''}`}
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg z-50 ring-1 ring-black ring-opacity-5">
                <div className="py-1">
                  <div className="px-4 py-2 text-sm text-gray-700 border-b">
                    Signed in as <span className="font-medium">{name}</span>
                  </div>
                  <button
                    onClick={handleUpdateProfile}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <svg className="w-5 h-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Update Profile
                  </button>
                  <button
                    onClick={handleStartGroupCreation}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                    Create Group
                  </button>
                  <button
                    onClick={handleStartAddToGroup}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                    Add to Group
                  </button>
                  <button
                    onClick={handleViewGroups}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <svg className="w-5 h-5 mr-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    View Groups ({groups.length})
                  </button>
                  <button
                    onClick={handleLogout}
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
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Total Learners</h3>
                  <p className="text-2xl font-semibold text-gray-900">{learners.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg border border-green-100">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Unread Messages</h3>
                  <p className="text-2xl font-semibold text-gray-900">
                    {Object.values(unreadCounts).reduce((a, b) => a + b, 0)}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
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
        </div>

        {/* Learners and Map */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Learners List */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-3">Learner Matches</h2>
              {learnersWithDistance.length > 0 ? (
                <div className="space-y-3">
                  {learnersWithDistance.map((learner) => (
                    <div
                      key={learner._id}
                      className={`bg-white border rounded-lg p-4 transition-all transform hover:scale-[1.01] ${
                        highlightedLearner === learner._id 
                          ? 'ring-2 ring-blue-500 border-blue-300' 
                          : 'border-gray-200 hover:border-blue-200'
                      }`}
                      onMouseEnter={() => handleCardHover(learner._id)}
                      onMouseLeave={() => setHighlightedLearner(null)}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="relative">
                          <img
                            src={learner.photo}
                            alt={learner.name}
                            className="w-14 h-14 rounded-full object-cover cursor-pointer border-2 border-white shadow-sm hover:opacity-90 transition-opacity"
                            onError={(e) => e.target.src = 'https://via.placeholder.com/150'}
                            onClick={() => handleImageClick(learner.photo)}
                          />
                          <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white text-xs rounded-full px-1.5 py-0.5 shadow-sm">
                            {learner.distance} km
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate">{learner.name}</h3>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {learner.skills?.slice(0, 3).map((skill, index) => (
                              <span key={index} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                                {skill}
                              </span>
                            ))}
                            {learner.skills?.length > 3 && (
                              <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                                +{learner.skills.length - 3}
                              </span>
                            )}
                          </div>
                          <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                            {learner.description || 'No description available'}
                          </p>
                          
                          {/* Action Buttons */}
                          <div className="mt-3 flex space-x-2">
                            {learner.swipes.includes(userId) ? (
                              <button
                                className="flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                                onClick={() => handleChat(learner._id)}
                              >
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                                Chat
                                {unreadCounts[learner._id] > 0 && (
                                  <span className="ml-1.5 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">
                                    {unreadCounts[learner._id]}
                                  </span>
                                )}
                              </button>
                            ) : (
                              <button
                                className="flex items-center px-3 py-1.5 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
                                onClick={() => handleConnect(learner._id)}
                                disabled={connecting}
                              >
                                {connecting ? (
                                  <>
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Connecting...
                                  </>
                                ) : (
                                  <>
                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                    </svg>
                                    Connect
                                  </>
                                )}
                              </button>
                            )}
                            <button 
                              className="p-1.5 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors"
                              onClick={() => handleCardHover(learner._id)}
                              title="Show on map"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-lg p-6 text-center border border-gray-200">
                  <div className="mx-auto w-24 h-24 text-gray-400 mb-4">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-700 mb-2">No matches yet</h3>
                  <p className="text-gray-500 mb-4">
                    Learners who swipe right on you will appear here.
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

          {/* Map Column - Only show if learners exist */}
          {learnersWithDistance.length > 0 && (
            <div className="lg:col-span-2 h-[600px] rounded-lg overflow-hidden shadow-lg sticky top-4 border border-gray-200">
              <MapContainer 
                center={getMapCenter()} 
                zoom={11.9} 
                style={{ height: '100%' }}
                whenCreated={(map) => { mapRef.current = map }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                
                {/* Tutor Marker */}
                <Marker
                  position={[userLocation.coordinates[1], userLocation.coordinates[0]]}
                  icon={tutorIcon}
                >
                  <Popup className="custom-popup">
                    <div className="font-bold text-blue-600">Your Location</div>
                    <div className="text-sm text-gray-600">{name}</div>
                  </Popup>
                </Marker>
                
                {/* Learner Markers */}
                {learnersWithDistance.map((learner) => (
                  learner.location?.coordinates && (
                    <Marker
                      key={learner._id}
                      position={[learner.location.coordinates[1], learner.location.coordinates[0]]}
                      icon={learnerIcon}
                      eventHandlers={{
                        click: () => setHighlightedLearner(learner._id),
                      }}
                    >
                      <Popup className="custom-popup">
                        <div className="flex items-center space-x-2">
                          <img 
                            src={learner.photo} 
                            alt={learner.name} 
                            className="w-8 h-8 rounded-full object-cover"
                            onError={(e) => e.target.src = 'https://via.placeholder.com/150'}
                          />
                          <div>
                            <div className="font-bold">{learner.name}</div>
                            <div className="text-sm text-gray-600">{learner.distance} km from you</div>
                          </div>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {learner.skills?.slice(0, 3).map((skill, index) => (
                            <span key={index} className="bg-red-100 text-red-800 text-xs px-1.5 py-0.5 rounded">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </Popup>
                    </Marker>
                  )
                ))}
              </MapContainer>
            </div>
          )}
        </div>
      </main>

      {/* Full Image View Modal */}
      {viewingImage && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4" onClick={() => setViewingImage(null)}>
          <div className="relative max-w-full max-h-full">
            <img 
              src={viewingImage} 
              alt="Full size profile" 
              className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-xl"
              onClick={(e) => e.stopPropagation()}
            />
            <button 
              className="absolute top-4 right-4 bg-white rounded-full p-2 shadow-lg hover:bg-gray-200 transition-colors"
              onClick={() => setViewingImage(null)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Group Creation Modal */}
      {showGroupModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
            <div className="bg-blue-600 p-4 text-white">
              <h3 className="text-xl font-semibold">
                {creationStep === 1 ? 'Select Learners' : 'Group Details'}
              </h3>
            </div>
            
            <div className="p-6">
              {creationStep === 1 ? (
                <div className="mb-6">
                  <p className="text-gray-600 mb-4">Select learners to include in your new group:</p>
                  <div className="max-h-96 overflow-y-auto border rounded-lg">
                    {learners.map(learner => (
                      <div 
                        key={learner._id} 
                        className={`flex items-center p-3 border-b cursor-pointer transition-colors ${
                          selectedLearners.includes(learner._id) 
                            ? 'bg-blue-50 border-blue-200' 
                            : 'hover:bg-gray-50'
                        }`}
                        onClick={() => handleLearnerSelection(learner._id)}
                      >
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mr-3 ${
                          selectedLearners.includes(learner._id) 
                            ? 'border-blue-500 bg-blue-500' 
                            : 'border-gray-300'
                        }`}>
                          {selectedLearners.includes(learner._id) && (
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        <div className="flex items-center flex-1 min-w-0">
                          <img 
                            src={learner.photo} 
                            alt={learner.name} 
                            className="w-10 h-10 rounded-full mr-3 object-cover"
                            onError={(e) => e.target.src = 'https://via.placeholder.com/150'}
                          />
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 truncate">{learner.name}</p>
                            <p className="text-sm text-gray-500 truncate">
                              {learner.skills?.join(', ') || 'No skills listed'}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Group Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Study Group, Project Team"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Group Avatar (Optional)
                    </label>
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        {avatar ? (
                          <img 
                            src={URL.createObjectURL(avatar)} 
                            alt="Group preview" 
                            className="w-16 h-16 rounded-full object-cover border-2 border-blue-300"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 border-2 border-dashed border-gray-300">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <label className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer">
                          <span className="sr-only">Choose avatar</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarChange}
                            className="hidden"
                          />
                          <div className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-center">
                            Choose Image
                          </div>
                        </label>
                        <p className="text-xs text-gray-500 mt-1">JPG, PNG up to 2MB</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <h4 className="text-sm font-medium text-blue-800 mb-2">Selected Members ({selectedLearners.length})</h4>
                    <div className="flex flex-wrap gap-2">
                      {learners
                        .filter(learner => selectedLearners.includes(learner._id))
                        .map(learner => (
                          <div key={learner._id} className="flex items-center bg-white px-2 py-1 rounded-full text-xs shadow-sm">
                            <img 
                              src={learner.photo} 
                              alt={learner.name} 
                              className="w-4 h-4 rounded-full mr-1 object-cover"
                              onError={(e) => e.target.src = 'https://via.placeholder.com/150'}
                            />
                            <span className="truncate max-w-[80px]">{learner.name}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-between mt-6">
                <button
                  className="px-5 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  onClick={creationStep === 1 ? resetGroupCreation : () => setCreationStep(1)}
                >
                  {creationStep === 1 ? 'Cancel' : 'Back'}
                </button>
                <button
                  className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-300"
                  onClick={creationStep === 1 ? proceedToNaming : handleCreateGroup}
                  disabled={
                    groupStatus === 'loading' ||
                    (creationStep === 1 && selectedLearners.length === 0) ||
                    (creationStep === 2 && !groupName.trim())
                  }
                >
                  {groupStatus === 'loading' ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </>
                  ) : creationStep === 1 ? (
                    'Continue'
                  ) : (
                    'Create Group'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add to Existing Group Modal */}
      {showAddToGroupModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
            <div className="bg-green-600 p-4 text-white">
              <h3 className="text-xl font-semibold">
                {creationStep === 1 ? 'Select Learners' : 'Select Group'}
              </h3>
            </div>
            
            <div className="p-6">
              {creationStep === 1 ? (
                <div className="mb-6">
                  <p className="text-gray-600 mb-4">Select learners to add to a group:</p>
                  <div className="max-h-96 overflow-y-auto border rounded-lg">
                    {learners.map(learner => (
                      <div 
                        key={learner._id} 
                        className={`flex items-center p-3 border-b cursor-pointer transition-colors ${
                          selectedLearners.includes(learner._id) 
                            ? 'bg-green-50 border-green-200' 
                            : 'hover:bg-gray-50'
                        }`}
                        onClick={() => handleLearnerSelection(learner._id)}
                      >
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mr-3 ${
                          selectedLearners.includes(learner._id) 
                            ? 'border-green-500 bg-green-500' 
                            : 'border-gray-300'
                        }`}>
                          {selectedLearners.includes(learner._id) && (
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        <div className="flex items-center flex-1 min-w-0">
                          <img 
                            src={learner.photo} 
                            alt={learner.name} 
                            className="w-10 h-10 rounded-full mr-3 object-cover"
                            onError={(e) => e.target.src = 'https://via.placeholder.com/150'}
                          />
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 truncate">{learner.name}</p>
                            <p className="text-sm text-gray-500 truncate">
                              {learner.skills?.join(', ') || 'No skills listed'}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-gray-600">Select a group to add the learners to:</p>
                  <div className="max-h-96 overflow-y-auto border rounded-lg">
                    {groups.map(group => (
                      <div 
                        key={group._id} 
                        className={`flex items-center p-3 border-b cursor-pointer transition-colors ${
                          selectedGroup?._id === group._id 
                            ? 'bg-green-50 border-green-200' 
                            : 'hover:bg-gray-50'
                        }`}
                        onClick={() => setSelectedGroup(group)}
                      >
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mr-3 ${
                          selectedGroup?._id === group._id 
                            ? 'border-green-500 bg-green-500' 
                            : 'border-gray-300'
                        }`}>
                          {selectedGroup?._id === group._id && (
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        <div className="flex items-center flex-1 min-w-0">
                          {group.avatar ? (
                            <img 
                              src={group.avatar.url} 
                              alt={group.name} 
                              className="w-10 h-10 rounded-full mr-3 object-cover"
                              onError={(e) => e.target.src = 'https://via.placeholder.com/150'}
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 mr-3">
                              {group.name[0].toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 truncate">{group.name}</p>
                            <p className="text-sm text-gray-500">
                              {group.members.length} member{group.members.length !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="bg-green-50 p-3 rounded-lg">
                    <h4 className="text-sm font-medium text-green-800 mb-2">Selected Members ({selectedLearners.length})</h4>
                    <div className="flex flex-wrap gap-2">
                      {learners
                        .filter(learner => selectedLearners.includes(learner._id))
                        .map(learner => (
                          <div key={learner._id} className="flex items-center bg-white px-2 py-1 rounded-full text-xs shadow-sm">
                            <img 
                              src={learner.photo} 
                              alt={learner.name} 
                              className="w-4 h-4 rounded-full mr-1 object-cover"
                              onError={(e) => e.target.src = 'https://via.placeholder.com/150'}
                            />
                            <span className="truncate max-w-[80px]">{learner.name}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-between mt-6">
                <button
                  className="px-5 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  onClick={creationStep === 1 ? resetAddToGroup : () => setCreationStep(1)}
                >
                  {creationStep === 1 ? 'Cancel' : 'Back'}
                </button>
                <button
                  className="px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-green-300"
                  onClick={creationStep === 1 ? proceedToNaming : handleAddToGroup}
                  disabled={
                    groupStatus === 'loading' ||
                    (creationStep === 1 && selectedLearners.length === 0) ||
                    (creationStep === 2 && !selectedGroup)
                  }
                >
                  {groupStatus === 'loading' ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </>
                  ) : creationStep === 1 ? (
                    'Continue'
                  ) : (
                    'Add to Group'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SwipedLearnersList;