import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import { url } from '../../url';
import axios from 'axios'
import 'react-toastify/dist/ReactToastify.css';
import {
  fetchChatHistory,
  sendNewMessage,
  markMessagesAsRead,
  setCurrentChat,
  addLocalMessage,
  updateMessageStatus,
} from '../../store/Slices/chatSlice';
import { FiSend, FiCheck, FiDownload, FiX } from 'react-icons/fi';
import { IoMdArrowRoundBack, IoMdClose } from 'react-icons/io';
import { BsThreeDotsVertical, BsEmojiSmile } from 'react-icons/bs';
import { RiAttachment2 } from 'react-icons/ri';

const Chat = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { tutorId, learnerId, tutorName, tutorPhoto, learnerName, learnerPhoto } = location.state || {};
  
  const { 
    messages, 
    currentChat, 
    loading, 
    error, 
    onlineUsers, 
    isConnected,
    uploadProgress 
  } = useSelector((state) => state.chat);
  
  const [message, setMessage] = useState('');
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
   // --- FIX: Get logged-in user's ID from auth state ---
   const loggedInUser = useSelector((state) => state.auth.user);
   const currentUserId = loggedInUser?.id; // Use the ID from the auth state (assuming it's 'id')
   // --- END FIX ---
  const [naam, setNaam] = useState('');
  const [pic, setPic] = useState('');
   const [id, setId] = useState(tutorId);
  // Memoized values
  const sortedMessages = useMemo(() => {
    return [...messages].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  }, [messages]);

  const chatPartner = useMemo(() => {
    return currentChat?.tutorId === tutorId 
      ? { name: learnerName, photo: learnerPhoto }
      : { name: tutorName, photo: tutorPhoto };
  }, [currentChat, tutorId, learnerName, learnerPhoto, tutorName, tutorPhoto]);

  const isOnline = useMemo(() => onlineUsers?.includes(tutorId), [onlineUsers, tutorId]);

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    const fetchChatHistoryAndMarkRead = async () => {
      try {
        const userResponse = await axios.get(`${url}/api/users/${id}`);
        setNaam(userResponse.data.name);
        setPic(userResponse.data.photo);
      } catch (error) {
        console.error('Error fetching chat history or marking messages as read:', error);
      }
    };
  
    fetchChatHistoryAndMarkRead();
  }, [learnerId, tutorId, id]); 
  
  // Handle connection status
  useEffect(() => {
    if (!isConnected) {
      toast.warn('Connection lost. Reconnecting...', { 
        toastId: 'connection-toast',
        autoClose: false,
        className: 'bg-yellow-100 text-yellow-800'
      });
    } else {
      toast.dismiss('connection-toast');
    }
  }, [isConnected]);

  // Handle real-time messages
  // useEffect(() => {
  //   const socket = getSocket();
  //   if (!socket) return;

  //   const handleNewMessage = (message) => {
  //     if (
  //       (message.senderId === tutorId && message.receiverId === learnerId) ||
  //       (message.senderId === learnerId && message.receiverId === tutorId)
  //     ) {
  //       dispatch(addNewMessage(message));
        
  //       // Mark as read if it's the receiver
  //       if (message.receiverId === currentUserId) {
  //         dispatch(markMessagesAsRead({
  //           senderId: message.senderId,
  //           receiverId: message.receiverId
  //         }));
  //       }
  //     }
  //   };

  //   socket.on('newMessage', handleNewMessage);

  //   return () => {
  //     socket.off('newMessage', handleNewMessage);
  //   };
  // }, [dispatch, tutorId, learnerId, currentUserId]);

  // Initialize chat and socket connection
  // useEffect(() => {
  //   if (tutorId && learnerId && currentUserId) {
  //     dispatch(setCurrentChat({ 
  //       tutorId, 
  //       learnerId,
  //       tutorName,
  //       tutorPhoto,
  //       learnerName,
  //       learnerPhoto
  //     }));
      
  //     dispatch(fetchChatHistory({ learnerId, tutorId }));
  //     dispatch(markMessagesAsRead({ senderId: learnerId, receiverId: currentUserId }));
      
  //     // Setup socket connection only if not already connected
  //     if (!isConnected) {
  //       console.log(`[Chat.jsx] Dispatching setupSocketListeners for user: ${currentUserId}`);
  //       const cleanup = dispatch(setupSocketListeners(currentUserId));
  //       return () => cleanup && cleanup();
  //     }
  //   }
  // }, [dispatch, tutorId, learnerId, currentUserId]);

   // Initialize chat state and fetch data for THIS specific chat
   useEffect(() => {
    // Ensure we have the necessary IDs to proceed
    if (tutorId && learnerId && currentUserId) {
      console.log(`[Chat.jsx] Setting up for chat between ${learnerId} and ${tutorId}`);

      // 1. Set the current chat context in Redux
      dispatch(setCurrentChat({
        tutorId,
        learnerId,
        tutorName,
        tutorPhoto,
        learnerName,
        learnerPhoto
      }));

      dispatch(fetchChatHistory({ learnerId, tutorId }));
      const otherUserId = currentUserId === learnerId ? tutorId : learnerId;
      if (otherUserId) {
          dispatch(markMessagesAsRead({ senderId: otherUserId, receiverId: currentUserId }));
      }

    } else {
        console.warn("[Chat.jsx] Missing IDs on mount:", { tutorId, learnerId, currentUserId });
    }

  }, [dispatch, tutorId, learnerId, currentUserId, tutorName, tutorPhoto, learnerName, learnerPhoto]); 

  // Handle image selection
  const handleImageChange = useCallback((e) => {
    const selectedFiles = Array.from(e.target.files);
    if (!selectedFiles.length) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 10 * 1024 * 1024;
    
    const validImages = selectedFiles.filter(file => {
      if (file.size > maxSize) {
        toast.error(`${file.name} is too large (max 10MB)`);
        return false;
      }
      if (!validTypes.includes(file.type)) {
        toast.error(`${file.name} is not a supported image type`);
        return false;
      }
      return true;
    });

    if (!validImages.length) return;

    const newPreviews = validImages.map(image => ({
      url: URL.createObjectURL(image),
      name: image.name,
      type: image.type,
      size: image.size,
      file: image
    }));

    setPreviews(prev => [...prev, ...newPreviews]);
    setImages(prev => [...prev, ...validImages]);
  }, []);

  // Remove selected image
  const removeImage = useCallback((index) => {
    setPreviews(prev => prev.filter((_, i) => i !== index));
    setImages(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Send message handler
  const handleSendMessage = useCallback(async () => {
    if (!message.trim() && !images.length) {
      toast.error('Please enter a message or attach images');
      return;
    }

    const tempId = `temp-${Date.now()}`;
    const now = new Date();
    
    const imagePreviews = previews.map(preview => ({
      url: preview.url,
      filename: preview.name,
      mimetype: preview.type,
      size: preview.size,
      type: 'image',
      isUploading: true
    }));

    // Optimistic update
    dispatch(addLocalMessage({
      _id: tempId,
      tempId,
      senderId: learnerId,
      receiverId: tutorId,
      message: message || '',
      media: imagePreviews.length ? imagePreviews : null,
      status: 'sending',
      createdAt: now.toISOString(),
      formattedTime: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      formattedDate: now.toLocaleDateString()
    }));

    try {
      await dispatch(sendNewMessage({
        senderId: learnerId,
        receiverId: tutorId,
        message,
        files: images,
        tempId
      })).unwrap();
      
      setMessage('');
      setImages([]);
      setPreviews([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error) {
      dispatch(updateMessageStatus({ 
        messageId: tempId, 
        status: 'failed' 
      }));
      toast.error(error.payload || 'Failed to send message');
    }
  }, [dispatch, images, learnerId, message, previews, tutorId]);

  // Render message status indicators
  const renderMessageStatus = useCallback((msg) => {
    const time = msg.formattedTime || new Date(msg.createdAt).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });

    return (
      <div className="flex items-center justify-end space-x-1 mt-1">
        <span className="text-xs text-gray-500 opacity-80">{time}</span>
        {msg.senderId === learnerId && (
          <span className="flex items-center transition-all duration-300">
            {msg.status === 'read' ? (
              <span className="text-blue-500">
                <FiCheck className="inline" />
                <FiCheck className="inline -ml-1" />
              </span>
            ) : msg.status === 'delivered' ? (
              <span className="text-gray-500">
                <FiCheck className="inline" />
                <FiCheck className="inline -ml-1" />
              </span>
            ) : (
              <span className="text-gray-400">
                <FiCheck className="inline" />
              </span>
            )}
          </span>
        )}
      </div>
    );
  }, [learnerId]);

  // Image viewer handlers
  const openImageViewer = useCallback((image) => {
    setSelectedImage(image);
  }, []);

  const closeImageViewer = useCallback(() => {
    setSelectedImage(null);
  }, []);

  // Render image messages
  const renderImageMessage = useCallback((msg) => {
    if (!msg.media?.length) return null;

    return (
      <div className="flex flex-wrap gap-2 mt-2">
        {msg.media.map((image, index) => {
          let imageUrl = image.url;
          if (imageUrl.startsWith('http://res.cloudinary.com')) {
            imageUrl = imageUrl.replace('http://', 'https://');
          }
          
          if (imageUrl.includes('res.cloudinary.com')) {
            imageUrl = imageUrl.replace('/upload/', '/upload/w_400,h_300,c_fill,q_auto,f_auto/');
          }

          return (
            <div key={index} className="relative group">
              <div className="relative rounded-lg overflow-hidden" style={{ width: '120px', height: '120px' }}>
                <img 
                  src={imageUrl}
                  alt={image.filename || "Shared image"}
                  className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => openImageViewer(image)}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://via.placeholder.com/120x120?text=Image+Not+Available';
                  }}
                  loading="lazy"
                />
                <div className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(imageUrl, '_blank');
                    }}
                    className="p-1 bg-black/50 text-white rounded-full hover:bg-black/70"
                  >
                    <FiDownload size={14} />
                  </button>
                </div>
              </div>
              {image.isUploading && !image.url && (
                <div className="absolute inset-0 bg-black/10 rounded-lg flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }, [openImageViewer]);

  // Handle enter key press
  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  if (loading && messages.length === 0) {
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-br from-blue-50 to-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-br from-blue-50 to-gray-50 text-red-500">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-blue-50 to-gray-50">
      <ToastContainer position="top-right" autoClose={3000} />

      {/* Image Viewer Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={closeImageViewer}>
          <button onClick={closeImageViewer}
            className="absolute top-4 right-4 text-white hover:text-gray-300 z-50 p-2">
            <FiX size={24} />
          </button>
          
          <div className="relative w-full h-full flex items-center justify-center">
            <div className="max-w-full max-h-[90vh] flex items-center justify-center">
              <img 
                src={selectedImage.url}
                alt={selectedImage.filename || "Full view"}
                className="max-w-full max-h-[90vh] object-contain"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            
            <div className="absolute bottom-6 left-0 right-0 flex justify-center">
              <div className="bg-black/50 text-white px-4 py-2 rounded-full text-sm flex items-center">
                {selectedImage.filename || 'Image'}
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(selectedImage.url, '_blank');
                  }}
                  className="ml-3 p-1 bg-white/20 rounded-full hover:bg-white/30"
                >
                  <FiDownload size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chat Header */}
      <div className="flex items-center justify-between p-3 bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="flex items-center">
          <button onClick={() => navigate(-1)}
            className="mr-2 p-2 rounded-full hover:bg-gray-100 transition-colors">
            <IoMdArrowRoundBack size={20} className="text-gray-600" />
          </button>
          <div className="relative">
            <img
              src={pic || `https://ui-avatars.com/api/?name=${encodeURIComponent(chatPartner.name || 'User')}&background=random`}
              alt={naam || 'Chat user'}
              className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(chatPartner.name || 'User')}&background=random`;
              }}
            />
            {/* <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
              isOnline ? 'bg-green-500' : 'bg-gray-400'
            }`}></div> */}
          </div>
          <div className="ml-3">
            <h1 className="font-semibold text-gray-800">{naam || 'Chat User'}</h1>
            {/* <p className="text-xs text-gray-500">
              {isOnline ? (
                <span className="flex items-center">
                  <span className="w-2 h-2 rounded-full bg-green-500 mr-1"></span>
                  Online
                </span>
              ) : 'Last seen recently'}
            </p> */}
          </div>
        </div>
        <button className="p-2 text-gray-600 hover:text-gray-800 rounded-full hover:bg-gray-100 transition-colors">
          <BsThreeDotsVertical size={20} />
        </button>
      </div>

      {/* Chat Messages Area */}
      <div ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4"
        style={{ 
          backgroundImage: 'url("https://web.whatsapp.com/img/bg-chat-tile-light_a4be512e7195b6b733d9110b408f075d.png")',
          backgroundBlendMode: 'overlay',
          backgroundColor: 'rgba(240, 242, 245, 0.95)'
        }}>
        {sortedMessages.length === 0 ? (
          <div className="flex flex-col justify-center items-center h-full text-gray-500">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-gray-100 rounded-full mb-4 flex items-center justify-center shadow-inner">
              <RiAttachment2 size={40} className="text-gray-400" />
            </div>
            <p className="text-xl font-light text-gray-600 mb-1">No messages yet</p>
            <p className="text-sm text-gray-400">Send your first message to start chatting</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sortedMessages.map((msg) => (
              <div key={msg._id || msg.tempId}
                className={`flex ${msg.senderId === learnerId ? 'justify-end' : 'justify-start'}`}>
                <div className="relative">
                  <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-xl ${
                    msg.senderId === learnerId
                      ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-br-none shadow-md'
                      : 'bg-white text-gray-800 rounded-bl-none shadow-sm'
                  } ${msg.media ? 'p-1' : ''}`}>
                    {msg.message && (
                      <p className={`break-words text-sm ${msg.media ? 'mb-1' : ''}`}>
                        {msg.message}
                      </p>
                    )}
                    {renderImageMessage(msg)}
                    {renderMessageStatus(msg)}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Message Input Area */}
      <div className="bg-white p-3 border-t border-gray-200 sticky bottom-0 shadow-lg">
        {previews.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {previews.map((preview, index) => (
              <div key={index} className="relative rounded-lg overflow-hidden" style={{ width: '80px', height: '80px' }}>
                <img src={preview.url} alt="Preview" className="w-full h-full object-cover" />
                <button onClick={() => removeImage(index)}
                  className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 transition-colors shadow-lg">
                  <IoMdClose size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        {images.length > 0 && uploadProgress > 0 && uploadProgress < 100 && (
          <div className="mb-2">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-gradient-to-r from-blue-400 to-blue-600 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${uploadProgress}%` }}></div>
            </div>
            <p className="text-xs text-gray-600 mt-1">
              Uploading {Math.round(uploadProgress)}% • {images.length} image(s)
            </p>
          </div>
        )}

        <div className="flex items-center bg-gray-100 rounded-full px-4 py-2">
          <button onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-2 text-gray-500 hover:text-blue-500 transition-colors rounded-full">
            <BsEmojiSmile size={20} />
          </button>
          
          <button onClick={() => fileInputRef.current?.click()}
            className="p-2 text-gray-500 hover:text-blue-500 transition-colors rounded-full">
            <RiAttachment2 size={20} />
          </button>
          
          <input type="file" ref={fileInputRef} onChange={handleImageChange}
            accept="image/*" className="hidden" multiple />
          
          <input type="text" className="flex-1 px-3 py-2 bg-transparent focus:outline-none text-sm"
            value={message} onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyPress} placeholder="Type a message..." />
          
          <button onClick={handleSendMessage}
            disabled={(!message.trim() && !images.length) || !isConnected}
            className={`p-2 rounded-full transition-colors ${
              (!message.trim() && !images.length) || !isConnected
                ? 'text-gray-400'
                : 'bg-gradient-to-br from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-md'
            }`}>
            <FiSend size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat;