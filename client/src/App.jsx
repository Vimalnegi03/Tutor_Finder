import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Register from './components/Auth/Register';
import Login from './components/Auth/Login';
import About from "./components/Home/About";
import Chat from './components/Chat/Chat';
import TutorsList from './components/TutorsList/TutorsList';
import Header from './components/Home/Header';
import Footer from './components/Home/Footer';
import SwipedLearnersList from './components/TutorDashboard/SwipedLearnersList';
import Homepage from './components/Home/Homepage';
import EmailForm from './components/Home/Contact';
import Main from './components/Home/Main';
import UpdateProfile from './components/Auth/UpdateProfile';
import Chatbot from './components/Home/ChatBot';
import { StudyNotesHubJsx } from './Notes/components/UI/study-notes-hub';
import { ThemeProvider } from "../src/Notes/components/UI/theme-provider";
import GroupDetailPage from './Groups/GroupDetailPage';
import GroupsPage from './Groups/GroupsPage';
import Dashboard from './components/Home/Dashboard';
import NEETNotesPage from './Notes/components/notesPage/NEETNotesPage';
// Import Actions and Selectors
import { setupSocketListeners, getSocket } from './store/Slices/chatSlice'; // Adjust path
import  { useEffect } from 'react'; // Import useEffect
import { useSelector, useDispatch } from 'react-redux'; // Import hooks
const App = () => {
  const dispatch = useDispatch();
  // Select authentication status and user ID from the auth slice
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const userId = user?.id; // Use the correct ID key ('id' based on your backend)

  // --- Effect for Global Socket Management ---
  useEffect(() => {
    let cleanupFunction = null;

    if (isAuthenticated && userId) {
      console.log(`[App.jsx] User authenticated (ID: ${userId}). Setting up socket listeners.`);
      cleanupFunction = dispatch(setupSocketListeners(userId));
    } else {
      const socket = getSocket();
      if (socket && socket.connected) {
        console.log('[App.jsx] User logged out or not authenticated. Disconnecting socket.');
        socket.disconnect();
      }
    }

    return () => {
      if (cleanupFunction) {
        console.log("[App.jsx] Running socket listener cleanup (likely due to auth change or unmount).");
        cleanupFunction();
      }
    };

  }, [isAuthenticated, userId, dispatch]);
  // --- End Socket Management Effect ---
  
  return (
    <Router>
      <Header />
      <div className="container mx-auto">
        {/* Wrap the entire Routes component with ThemeProvider */}
        <ThemeProvider>
          <Routes>
            <Route path="/" element={<Homepage />} />
            <Route path="/learners/tutors" element={<TutorsList />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/contact" element={<EmailForm />} />
            <Route path="/about_us" element={<About />} />
            <Route path="/chat/:chatId" element={<Chat />} />
            <Route path="/tutor-dashboard" element={<SwipedLearnersList />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/book-search" element={<Main />} />
            <Route path="/update-profile" element={<UpdateProfile />} />
            <Route path="/gpt-lite" element={<Chatbot />} />
            <Route path="/Notes" element={<StudyNotesHubJsx />} />
            <Route path="/subject/:subjectId/semester/:semesterId/:noteType" element={<StudyNotesHubJsx />} />
            <Route path="*" element={<StudyNotesHubJsx />} />
            <Route path="/groups" element={<GroupsPage />} />
            <Route path="/groups/:groupId" element={<GroupDetailPage />} />
            <Route path="/dashboard" element={<Dashboard/>}/>
            <Route path="/neet-notes" element={<NEETNotesPage />} />
          </Routes>
        </ThemeProvider>
      </div>
      <Footer />
    </Router>
  );
};

export default App;
