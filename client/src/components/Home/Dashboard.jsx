import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    // Check if user exists and has required fields
    if (!user || !user.id) {
      console.error('User data is incomplete - missing ID');
      navigate('/profile');
      return;
    }

    // Check if user has a role assigned
    if (!user?.role) {
      navigate('/profile'); // Redirect to profile to complete role selection
      return;
    }

    // Extract all needed user data
    const { id, role, skills, location, photo, swipes, name, email } = user;
     console.log(id, " ",skills," ",role);
     
    // Redirect based on role with all user data as state
    if (role === 'tutor') {
      navigate('/tutor-dashboard', {
        state: {
           id,
          role,
          skills,
          location,
          photo,
          swipes,
          name,
          email
        }
      });
    } else {
      navigate('/learners/tutors', {
        state: {
           id,
          role,
          skills,
          location,
          photo,
          swipes,
          name,
          email
        }
      });
    }
  }, [isAuthenticated, user, navigate]);

  // Show loading state while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
    </div>
  );
};

export default Dashboard;