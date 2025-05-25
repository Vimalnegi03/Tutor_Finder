import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { 
  fetchGroupDetails,
  fetchGroupMessages,
  markMessagesRead,
  getGroupMembers,
  addNewMessage
} from '../store/Slices/groupSlice';
import { sendMessage } from '../store/Slices/messageSlice';
import { toast } from 'react-toastify';
import { getSocket } from '../store/Slices/chatSlice';

const GroupDetailPage = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const socket = getSocket(); 

  // Selectors
  const { 
    currentGroup, 
    messages, 
    members,
    currentGroupStatus,
    messageStatus,
    membersStatus,
    error 
  } = useSelector((state) => state.groups);
  const { user } = useSelector((state) => state.auth);
  const { sendingStatus } = useSelector((state) => state.messages);

  // State
  const [newMessage, setNewMessage] = useState('');
  const [files, setFiles] = useState([]);
  const [filePreviews, setFilePreviews] = useState([]);
  const [viewingMedia, setViewingMedia] = useState(null);
   useEffect(() => {
    const loadDataAndMarkRead = async () => {
      // Validate groupId first
      if (groupId && typeof groupId === 'string' && groupId !== '[object Object]') {
        try { 
          await dispatch(fetchGroupDetails(groupId)).unwrap();
          await dispatch(fetchGroupMessages(groupId)).unwrap();
          // --- Mark messages as read AFTER messages are fetched ---
          await dispatch(markMessagesRead(groupId)).unwrap(); 
          dispatch(getGroupMembers(groupId));

        } catch (err) {
          toast.error(err?.message || err || "Failed to load group data", toastConfig);
        }
      } else {
        console.error('Invalid groupId on mount:', groupId);
        toast.error("Invalid Group ID.", toastConfig);
  
      }
    };

    loadDataAndMarkRead(); 
    // Cleanup function for file previews
    return () => {
      // Use optional chaining for safety
      filePreviews?.forEach(preview => {
        if (preview?.url && preview.url.startsWith('blob:')) {
          URL.revokeObjectURL(preview.url);
        }
      });
    };
    // Dependencies for the effect
  }, [groupId, dispatch]); 

  
  // Effect for joining and leaving group socket room
  useEffect(() => {
    if (socket && groupId && typeof groupId === 'string') {
      console.log(`[GroupDetail] Emitting 'joinGroup' for groupId: ${groupId}`);
      socket.emit('joinGroup', groupId);

      // Cleanup function to leave the room when component unmounts or groupId changes
      return () => {
        if (socket) { // Check if socket still exists
          console.log(`[GroupDetail] Emitting 'leaveGroup' for groupId: ${groupId}`);
          socket.emit('leaveGroup', groupId);
        }
      };
    }
  }, [groupId, socket]);

  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Helper function to get photo URL from either string or object
  const getPhotoUrl = (photo) => {
    if (!photo) return '/default-avatar.png';
    return typeof photo === 'string' ? photo : photo.url || '/default-avatar.png';
  };

  const handleSendMessage = async () => {
    console.log('[GroupDetail] handleSendMessage triggered.');
    if (!newMessage.trim() && files.length === 0) return;

    try {
      const tempId = Date.now().toString();
      const tempMessage = {
        tempId,
        text: newMessage,
        group: groupId,
        sender: { 
          _id: user.id, 
          name: user.name,
          photo: user.photo // Include sender's photo in temp message
        },
        createdAt: new Date().toISOString(),
        files: filePreviews.map((preview, index) => ({
          url: preview.url,
          fileType: files[index].type.startsWith('image/') ? 'image' : 
                   files[index].type.startsWith('video/') ? 'video' : 'file',
          name: files[index].name
        })),
        isTemp: true
      };

      dispatch(addNewMessage(tempMessage));

      const messageData = {
        groupId,
        text: newMessage,
        files,
        tempId
      };

      await dispatch(sendMessage(messageData)).unwrap();
      
      setNewMessage('');
      setFiles([]);
      setFilePreviews([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      toast.error(err.payload || 'Failed to send message');
    }
  };

  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files);
    
    if (newFiles.length > 0) {
      const allFiles = [...files, ...newFiles].slice(0, 5);
      setFiles(allFiles);

      const newPreviews = newFiles.map(file => {
        return new Promise((resolve) => {
          if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
            const reader = new FileReader();
            reader.onload = () => resolve({
              url: reader.result,
              type: file.type.startsWith('image/') ? 'image' : 'video',
              name: file.name
            });
            reader.readAsDataURL(file);
          } else {
            resolve({
              url: URL.createObjectURL(file),
              type: 'file',
              name: file.name
            });
          }
        });
      });

      Promise.all(newPreviews).then(previews => {
        setFilePreviews([...filePreviews, ...previews]);
      });
    }
  };

  const removeFile = (index) => {
    if (filePreviews[index]?.url.startsWith('blob:')) {
      URL.revokeObjectURL(filePreviews[index].url);
    }

    const newFiles = [...files];
    const newPreviews = [...filePreviews];
    
    newFiles.splice(index, 1);
    newPreviews.splice(index, 1);
    
    setFiles(newFiles);
    setFilePreviews(newPreviews);
  };

  const getMediaType = (url) => {
    if (!url) return null;
    if (url.match(/\.(jpg|jpeg|png|gif|webp)$/i)) return 'image';
    if (url.match(/\.(mp4|webm|mov)$/i)) return 'video';
    if (url.match(/\.(mp3|wav|ogg)$/i)) return 'audio';
    return 'file';
  };

  const openMediaViewer = (mediaUrl, mediaType) => {
    setViewingMedia({ url: mediaUrl, type: mediaType });
  };

  const closeMediaViewer = (e) => {
    if (e.target === e.currentTarget) {
      setViewingMedia(null);
    }
  };

  const renderMediaPreviews = () => {
    return (
      <div className="flex flex-wrap gap-2 mb-3">
        {filePreviews.map((preview, index) => (
          <div key={index} className="relative group">
            {preview.type === 'image' ? (
              <img
                src={preview.url}
                alt={`preview-${index}`}
                className="w-24 h-24 object-cover rounded cursor-pointer"
                onClick={() => openMediaViewer(preview.url, 'image')}
              />
            ) : preview.type === 'video' ? (
              <div 
                className="w-24 h-24 rounded bg-black cursor-pointer relative"
                onClick={() => openMediaViewer(preview.url, 'video')}
              >
                <video className="w-full h-full">
                  <source src={preview.url} type={files[index].type} />
                </video>
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path>
                  </svg>
                </div>
              </div>
            ) : (
              <div 
                className="w-24 h-24 bg-gray-100 rounded flex flex-col items-center justify-center p-2 cursor-pointer"
                onClick={() => preview.type === 'file' && window.open(preview.url, '_blank')}
              >
                <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
                </svg>
                <span className="text-xs text-gray-700 text-center truncate w-full">
                  {files[index].name}
                </span>
              </div>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeFile(index);
              }}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center hover:bg-red-600 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    );
  };

  const renderMessageMedia = (media) => {
    if (!media) return null;
    
    const mediaItems = Array.isArray(media) ? media : [media];
    
    return (
      <div className="flex flex-wrap gap-2 mt-2">
        {mediaItems.map((item, index) => {
          const type = getMediaType(item.url);
          return (
            <div key={index} className="relative">
              {type === 'image' ? (
                <div 
                  className="cursor-pointer"
                  onClick={() => openMediaViewer(item.url, 'image')}
                >
                  <img 
                    src={item.url} 
                    alt={`attachment-${index}`}
                    className="max-w-xs max-h-48 rounded object-contain"
                  />
                </div>
              ) : type === 'video' ? (
                <div 
                  className="cursor-pointer relative"
                  onClick={() => openMediaViewer(item.url, 'video')}
                >
                  <video className="max-w-xs max-h-48 rounded">
                    <source src={item.url} type={`video/${item.url.split('.').pop()}`} />
                  </video>
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                    <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path>
                    </svg>
                  </div>
                </div>
              ) : (
                <a 
                  href={item.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline inline-flex items-center bg-gray-100 p-2 rounded"
                >
                  <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
                  </svg>
                  {item.name || 'Download File'}
                </a>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  if (currentGroupStatus === 'loading') {
    return <div className="text-center py-8">Loading group details...</div>;
  }

  if (currentGroupStatus === 'failed') {
    return <div className="text-center py-8 text-red-500">{error || 'Failed to load group'}</div>;
  }

  if (messageStatus === 'loading') {
    return <div className="text-center py-8">Loading messages...</div>;
  }

  if (messageStatus === 'failed') {
    return <div className="text-center py-8 text-red-500">{error || 'Failed to load messages'}</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <button 
        onClick={() => navigate('/groups')}
        className="mb-6 text-blue-500 hover:text-blue-700"
      >
        ← Back to Groups
      </button>

      {/* Group Header Section */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex items-center mb-4">
          {currentGroup?.avatar && (
            <img 
              src={getPhotoUrl(currentGroup.avatar)}
              alt={currentGroup.name}
              className="w-16 h-16 rounded-full object-cover mr-4"
              onError={(e) => {
                e.target.src = '/default-avatar.png';
              }}
            />
          )}
          {!currentGroup?.avatar && (
            <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-2xl font-bold text-gray-500 mr-4">
              {currentGroup?.name?.charAt(0).toUpperCase() || 'G'}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold">
              {currentGroup?.name || 'Group'}
            </h1>
            {membersStatus === 'succeeded' && (
              <p className="text-gray-600">
                {members.length} members
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Media Viewer Modal */}
      {viewingMedia && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={closeMediaViewer}
        >
          <button 
            onClick={closeMediaViewer}
            className="absolute top-4 right-4 text-white text-2xl bg-gray-800 rounded-full w-10 h-10 flex items-center justify-center hover:bg-gray-700"
          >
            &times;
          </button>
          
          <div className="max-w-full max-h-full">
            {viewingMedia.type === 'image' ? (
              <img 
                src={viewingMedia.url} 
                alt="fullscreen media" 
                className="max-w-full max-h-screen object-contain"
              />
            ) : viewingMedia.type === 'video' ? (
              <video 
                controls 
                autoPlay
                className="max-w-full max-h-screen"
              >
                <source src={viewingMedia.url} type={`video/${viewingMedia.url.split('.').pop()}`} />
              </video>
            ) : (
              <div className="bg-gray-800 p-8 rounded-lg text-white text-center">
                <p className="mb-4">This file type cannot be previewed</p>
                <a 
                  href={viewingMedia.url} 
                  download
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded inline-block"
                >
                  Download File
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Messages Container */}

      <div className="flex-grow overflow-y-auto bg-gray-50 p-3 md:p-4"> 
        {messageStatus === 'loading' && messages.length === 0 && ( 
          <div className="text-center py-10 text-gray-500">Loading messages...</div>
        )}
        {messageStatus === 'failed' && messages.length === 0 && ( 
          <div className="text-center py-10 text-red-600">{error || 'Failed to load messages.'}</div>
        )}
        {(messageStatus !== 'loading' || messages.length > 0) && (
          messages.length === 0 ? (
            <div className="flex flex-col justify-center items-center h-full text-gray-500">
              <div className="w-20 h-20 bg-gray-200 rounded-full mb-4 flex items-center justify-center shadow-inner">
                 {/* Placeholder Icon */}
                 <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
              </div>
              <p className="text-lg font-light text-gray-600 mb-1">No messages yet</p>
              <p className="text-sm text-gray-400">Be the first to send a message!</p>
            </div>
          ) : (
            // Map through messages and render them
            <div className="space-y-4"> 
              {messages.map((message) => {
                // Determine if the message sender is the current logged-in user
                const isCurrentUser = message.sender?._id === user?.id;
                return (
                  <div
                    key={message._id || message.tempId} 
                    className={`flex items-end gap-2 ${isCurrentUser ? 'justify-end' : 'justify-start'}`} 
                  >
                    {/* Avatar for OTHER users (appears on the left) */}
                    {!isCurrentUser && (
                      <img
                        src={getPhotoUrl(message.sender?.photo)}
                        alt={message.sender?.name || 'Sender'}
                        className="w-7 h-7 rounded-full object-cover self-start flex-shrink-0" 
                        onError={(e) => { e.target.src = '/default-avatar.png'; }}
                      />
                    )}

                    {/* Message Bubble */}
                    <div
                      className={`max-w-[70%] md:max-w-[60%] p-2.5 rounded-lg shadow-sm ${ // Bubble styling
                        isCurrentUser
                          ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-br-none' 
                          : 'bg-white text-gray-800 rounded-bl-none border border-gray-200' 
                      }`}
                    >
                      {/* Show sender name only for messages from OTHERS in the group */}
                      {!isCurrentUser && message.sender?.name && (
                        <span className="font-semibold text-xs block mb-1 text-blue-700">
                          {message.sender.name}
                        </span>
                      )}

                      {/* Message Text (handle potential variations in structure) */}
                      {(message.text || message.content?.text) && (
                        <p className="text-sm whitespace-pre-wrap break-words mb-1"> {/* Preserve whitespace, wrap words */}
                          {message.text || message.content.text}
                        </p>
                      )}

                      {/* Render Media if present */}
                      {renderMessageMedia(message.content?.media || message.files)} {/* Adapt based on your data structure */}

                      {/* Timestamp and Sending Status */}
                      <div className={`text-[10px] mt-1.5 text-right ${isCurrentUser ? 'text-blue-100 opacity-80' : 'text-gray-400'}`}>
                        {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {/* Show sending indicator only for temp messages from current user */}
                        {isCurrentUser && message.isTemp && sendingStatus === 'loading' && (
                          <span className="ml-1 italic">(Sending...)</span>
                        )}
                        {/* Optional: Add read status icons here later */}
                      </div>
                    </div>

                    {/* Avatar for CURRENT user (appears on the right) */}
                    {isCurrentUser && (
                      <img
                        src={getPhotoUrl(user?.photo)} // Use logged-in user's photo
                        alt={user?.name || 'You'}
                        className="w-7 h-7 rounded-full object-cover self-start flex-shrink-0" // Align avatar top-right
                        onError={(e) => { e.target.src = '/default-avatar.png'; }}
                      />
                    )}
                  </div>
                );
              })}
              {/* Invisible div to ensure scrolling to the very bottom */}
              <div ref={messagesEndRef} className="h-1" />
            </div>
          )
        )}
      </div>
      {/*Message container ends*/}

      {/* Message Input */}
      <div className="bg-white rounded-lg shadow-lg p-4">
        {filePreviews.length > 0 && renderMediaPreviews()}
        
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 p-2 border rounded"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
          />
          
          <label className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300 cursor-pointer">
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileChange} 
              className="hidden" 
              accept="image/*,video/*,audio/*,application/pdf"
              multiple
            />
            Attach
          </label>
          
          <button
            onClick={handleSendMessage}
            disabled={sendingStatus === 'loading' || (files.length === 0 && !newMessage.trim())}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-blue-300"
          >
            {sendingStatus === 'loading' ? 'Sending...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GroupDetailPage;