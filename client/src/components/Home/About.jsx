import React from 'react';

const AboutUs = () => {
  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-100 via-white to-blue-100 py-10 px-4">
      <div className="max-w-7xl mx-auto text-center mb-10">
        <h1 className="text-4xl font-bold text-blue-700 mb-4">About Us</h1>
        <p className="text-lg text-gray-600">
          Welcome to our Learning Management System (LMS)! We are committed to
          bridging the gap between learners and tutors in offline education.
          Our platform is designed to facilitate quality learning experiences
          by connecting passionate learners with skilled tutors in their local
          communities.
        </p>
      </div>

      {/* Team Section */}
      <div className="flex flex-wrap justify-center items-center gap-10 px-4">
        {/* Member 1 */}
        <div className="max-w-xs bg-white shadow-lg rounded-lg overflow-hidden">
          <img
            src="./vi.jpg"
            alt="Team Member"
            className="w-full h-48 object-cover"
          />
          <div className="p-4">
            <h3 className="font-bold text-xl text-blue-700">Vimal Negi</h3>
            <p className="text-gray-600">
            Passionate about education technology
            </p>
          </div>
        </div>

        
      </div>

      {/* Mission Section */}
      <div className="mt-16 text-center">
        <h2 className="text-3xl font-bold text-blue-700 mb-4">Our Mission</h2>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          To empower students by providing them with access to quality
          education and to create a supportive community for both learners and
          educators. Together, we aim to make learning personal, impactful, and
          accessible for everyone.
        </p>
      </div>

      {/* Contact Section
      <div className="mt-16 text-center">
        <h2 className="text-3xl font-bold text-blue-700 mb-4">Contact Us</h2>
        <p className="text-lg text-gray-600">
          For any inquiries or feedback, feel free to reach out to us at
          <a href="mailto:info@lms.com" className="text-blue-500 underline">
            {' '}
            info@lms.com
          </a>
        </p>
      </div> */}
    </div>
  );
};

export default AboutUs;
