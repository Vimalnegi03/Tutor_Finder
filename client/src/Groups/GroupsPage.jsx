import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { 
  fetchUserGroups, 
  setCurrentGroup,
  leaveGroup,
  deleteGroup,
  removeGroupMember,
  getGroupMembers,
  clearGroupMembers,
} from '../store/Slices/groupSlice';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Toast configuration
const toastConfig = {
  position: "top-right",
  autoClose: 5000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  progress: undefined,
};

const GroupsPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const {  
    status, 
    error, 
    members, 
    membersStatus,
    operationStatus,
    unreadCounts
  } = useSelector((state) => state.groups);

  // Get groups from localStorage first, then fallback to Redux state if needed
  const groups = JSON.parse(localStorage.getItem('userGroups')) || [];

  
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [showActions, setShowActions] = useState(null);
  const [showMemberActions, setShowMemberActions] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showMembersModal, setShowMembersModal] = useState(false);
  
  const isProcessing = operationStatus === 'loading' || membersStatus === 'loading';
  
  const userData = JSON.parse(localStorage.getItem('userData')) || {};
  const { role = 'learner', skills = [], location = '', photo = '', id = '', swipes = [], name = '', email = '' } = userData;
  const isTutor = role === 'tutor';

  const fetchGroups = async () => {
    try {
      if (user?._id) {
        await dispatch(fetchUserGroups(user._id)).unwrap();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to load groups', toastConfig);
    }
  };

  const fetchGroupMembers = async (groupId) => {
    try {
      await dispatch(getGroupMembers(groupId)).unwrap();
      setShowMembersModal(true);
    } catch (err) {
      toast.error(err.message || 'Failed to load group members', toastConfig);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, [user?._id]);

  useEffect(() => {
    if (error) {
      toast.error(error, toastConfig);
    }
  }, [error]);

  const handleGroupClick = (groupId) => {
    dispatch(setCurrentGroup(groupId));
    navigate(`/groups/${groupId}`);
  };

  const handleLeaveGroup = async (groupId) => {
    try {
      await dispatch(leaveGroup(groupId)).unwrap();
      toast.success('You have left the group', {
        ...toastConfig,
        autoClose: 3000
      });
      await fetchGroups();
     navigate('/learners/tutors', {
        state: { role, skills, location, photo, id, swipes, name, email }
      });

    } catch (error) {
      toast.error(error.payload || 'Failed to leave group', toastConfig);
    }
  };

  const handleDeleteGroup = async (groupId) => {
    try {
      await dispatch(deleteGroup(groupId)).unwrap();
      toast.success('Group deleted successfully', {
        ...toastConfig,
        autoClose: 3000
      });
      setConfirmDelete(null);
      await fetchGroups();
      navigate('/tutor-dashboard', {
        state: { role, skills, location, photo, id, swipes, name, email }
      });
    } catch (error) {
      toast.error(error.payload || 'Failed to delete group', toastConfig);
    }
  };

  const handleRemoveMember = async (groupId, memberId) => {
    try {
      await dispatch(removeGroupMember({ groupId, userId: memberId })).unwrap();
      toast.success('Member removed successfully', {
        ...toastConfig,
        autoClose: 3000
      });
      setShowMemberActions(null);
      await fetchGroups();
      navigate('/tutor-dashboard', {
        state: { role, skills, location, photo, id, swipes, name, email }
      });
    } catch (error) {
      toast.error(error.payload || 'Failed to remove member', toastConfig);
    }
  };

  const handleBackNavigation = () => {
    if (isTutor) {
      navigate('/tutor-dashboard', {
        state: { role, skills, location, photo, id, swipes, name, email }
      });
    } else {
      navigate('/learners/tutors', {
        state: { role, skills, location, photo, id, swipes, name, email }
      });
    }
  };

  const renderGroupActions = (group) => {
    if (confirmDelete === group._id) {
      return (
        <div className="flex gap-2 mt-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteGroup(group._id);
            }}
            disabled={isProcessing}
            className="bg-red-500 text-white px-3 py-1 text-sm rounded hover:bg-red-600 disabled:opacity-50"
          >
            {isProcessing ? 'Deleting...' : 'Confirm'}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setConfirmDelete(null);
            }}
            className="bg-gray-500 text-white px-3 py-1 text-sm rounded hover:bg-gray-600"
          >
            Cancel
          </button>
        </div>
      );
    }

    return (
      <div className="relative">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowActions(showActions === group._id ? null : group._id);
          }}
          className="text-gray-500 hover:text-gray-700 mt-2"
          disabled={isProcessing}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z"></path>
          </svg>
        </button>

        {showActions === group._id && (
          <div className="absolute right-0 mt-1 w-40 bg-white rounded-md shadow-lg z-10 border border-gray-200">
            <button
              onClick={(e) => {
                e.stopPropagation();
                fetchGroupMembers(group._id);
                setShowActions(null);
              }}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              disabled={isProcessing}
            >
              View Members
            </button>
            {isTutor ? (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setConfirmDelete(group._id);
                    setShowActions(null);
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50"
                  disabled={isProcessing}
                >
                  Delete Group
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedGroup(group);
                    setShowMemberActions(group._id);
                    setShowActions(null);
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  disabled={isProcessing}
                >
                  Manage Members
                </button>
              </>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleLeaveGroup(group._id);
                  setShowActions(null);
                }}
                className="block w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50"
                disabled={isProcessing}
                >
                Leave Group
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderMemberList = () => {
    if (!selectedGroup || showMemberActions !== selectedGroup._id) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Manage Members: {selectedGroup.name}</h3>
            <button 
              onClick={() => setShowMemberActions(null)}
              className="text-gray-500 hover:text-gray-700"
              disabled={isProcessing}
            >
              &times;
            </button>
          </div>
          
          <div className="space-y-3">
            {selectedGroup.members?.map((member) => {
              const memberData = member.user || member;
              const memberId = memberData._id || member._id || 'unknown';
              const memberPhoto = memberData.photo || '/default-avatar.png';
              const memberName = memberData.name || 'Unknown Member';
              const memberRole = member.role || 'member';
              
              return (
                <div key={memberId} className="flex justify-between items-center p-3 border rounded">
                  <div className="flex items-center">
                    <img 
                      src={memberPhoto}
                      alt={memberName}
                      className="w-10 h-10 rounded-full mr-3"
                      onError={(e) => {
                        e.target.src = '/default-avatar.png';
                      }}
                    />
                    <div>
                      <p className="font-medium">{memberName}</p>
                      <p className="text-sm text-gray-500 capitalize">{memberRole}</p>
                    </div>
                  </div>
                  
                  {memberData._id !== user._id && memberRole !== 'admin' && (
                    <button
                      onClick={() => handleRemoveMember(selectedGroup._id, memberData._id)}
                      disabled={isProcessing}
                      className="px-3 py-1 bg-red-100 text-red-600 text-sm rounded hover:bg-red-200 disabled:opacity-50"
                    >
                      {isProcessing ? 'Removing...' : 'Remove'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderMembersModal = () => {
    if (!showMembersModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Group Members</h3>
            <button 
              onClick={() => {
                setShowMembersModal(false);
                dispatch(clearGroupMembers());
              }}
              className="text-gray-500 hover:text-gray-700"
              disabled={isProcessing}
            >
              &times;
            </button>
          </div>
          
          {membersStatus === 'loading' ? (
            <div className="text-center py-4">Loading members...</div>
          ) : membersStatus === 'failed' ? (
            <div className="text-center py-4 text-red-500">Failed to load members</div>
          ) : (
            <div className="space-y-3">
              {members.map((member) => {
                const memberData = member.user || member;
                const memberId = memberData._id || member._id || 'unknown';
                const photoUrl = memberData.photo || '/default-avatar.png';
                const userName = memberData.name || 'Unknown User';
                const userRole = memberData.role || 'member';
                const memberRole = member.role || 'member';
                const skills = Array.isArray(memberData.skills) ? memberData.skills : [];

                return (
                  <div key={memberId} className="flex items-center p-3 border rounded">
                    <img 
                      src={photoUrl}
                      alt={userName}
                      className="w-10 h-10 rounded-full mr-3"
                      onError={(e) => {
                        e.target.src = '/default-avatar.png';
                      }}
                    />
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{userName}</p>
                          <p className="text-sm text-gray-500 capitalize">
                            {memberRole} • {userRole}
                          </p>
                        </div>
                        <span className="text-xs text-gray-400">
                          {member.joinDate ? new Date(member.joinDate).toLocaleDateString() : ''}
                        </span>
                      </div>
                      {skills.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {skills.filter(Boolean).map((skill, index) => (
                            <span key={index} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  if (status === 'loading' && groups.length === 0) {
    return <div className="text-center py-8">Loading groups...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <span
        onClick={handleBackNavigation}
        className="cursor-pointer text-blue-500 hover:underline mb-4 inline-block" // Added margin
      >
        ⬅ Go Back
      </span>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Your Groups</h1>
        <span className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full capitalize">
          {role}
        </span>
      </div>

      {/* Conditional Rendering: No Groups vs. Group List */}
      {status === 'loading'  ? ( // Show loading only on initial fetch
         <div className="text-center py-8">Loading groups...</div>
      ) : groups.length === 0 ? (
         // No Groups Message
         <div className="text-center py-12">
           <p className="text-gray-500 text-lg mb-4">You haven't joined any groups yet</p>
           <button
             onClick={() => navigate(-1)}

             className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
           >
             {isTutor ? 'Create a Group' : 'Find Tutors'} {/* Example adjustment */}
           </button>
         </div>
      ) : (
        // Group List Grid
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map((group) => {
            const count = unreadCounts?.[group._id] || 0;
            return (
              <div
                key={group._id}
                className="bg-white border border-gray-200 rounded-lg shadow-lg p-6 hover:shadow-xl transition-all duration-300 cursor-pointer relative" // Added relative
                onClick={() => handleGroupClick(group._id)} 
              >
                {count > 0 && ( // Only render if count is greater than 0
                  <span
                    className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center z-10" // Styling for the badge
                    title={`${count} unread message${count !== 1 ? 's' : ''}`} // Tooltip
                  >
                    {count > 9 ? '9+' : count}
                  </span>
                )}

                {/* Card content */}
                <div className="flex items-center mb-4">
                  {group.avatar ? (
                    <img
                      src={typeof group.avatar === 'string' ? group.avatar : group.avatar.url}
                      alt={group.name}
                      className="w-16 h-16 rounded-full object-cover mr-4 flex-shrink-0"
                      onError={(e) => { e.target.src = '/default-avatar.png'; }}
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-2xl font-bold text-gray-500 mr-4 flex-shrink-0">
                      {group.name?.charAt(0).toUpperCase() || 'G'}
                    </div>
                  )}
                  <div className="flex-grow overflow-hidden"> {/* Added overflow hidden */}
                    <h2 className="text-xl font-semibold truncate">{group.name}</h2> {/* Added truncate */}
                    <p className="text-gray-600 text-sm">
                      {group.members?.length || 0} member{group.members?.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>

                <div className="flex justify-between items-center mt-auto pt-2 border-t border-gray-100"> {/* Added mt-auto, pt, border */}
                  <p className="text-gray-500 text-sm">
                    Created: {new Date(group.createdAt).toLocaleDateString()}
                  </p>
                  {renderGroupActions(group)}
                </div>
              </div>
            );
            // --- End of return statement for map ---
          })}
        </div>
      )}

      {/* Modals */}
      {renderMemberList()}
      {renderMembersModal()}
    </div>
  );
};

export default GroupsPage;