import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMapMarkerAlt, faClock, faComments, faLightbulb } from '@fortawesome/free-solid-svg-icons';

const Homepage = () => {
    return (
        <>
            {/* Hero Section */}
            <section className="bg-gradient-to-r from-blue-800 to-purple-800 text-white h-screen flex items-center justify-center" id="hero">
                <div className="container mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-center px-4">
                    {/* Left Side Content */}
                    <div className="text-center md:text-left">
                        <h1 className="text-4xl md:text-6xl font-bold mb-4 leading-tight">
                            Unlock Your Potential, Learn from the Best Around You!
                        </h1>
                        <p className="text-lg md:text-xl mb-6">
                            Connect with tutors and students within 10 km. Enhance your skills with local experts.
                        </p>
                        <a
                            href="Register"
                            className="bg-orange-500 text-white px-6 py-3 rounded-lg text-lg hover:bg-orange-600 transition-all"
                        >
                            Join Now
                        </a>
                    </div>
                    {/* Right Side Image */}
                    <div className="flex justify-center md:justify-end">
                        <img
                            src="hero-section.png"
                            alt="Learning Illustration"
                            className="w-full max-w-sm md:max-w-md h-auto"
                        />
                    </div>
                </div>
            </section>

            {/* Mission/About Us Section */}
            <section className="py-16 bg-gray-50" id="aboutUs">
                <div className="container mx-auto text-center">
                    <h2 className="text-4xl font-extrabold mb-6 text-orange-600">Our Mission</h2>
                    <p className="text-xl text-gray-700 leading-relaxed max-w-3xl mx-auto">
                        "We believe in making quality learning accessible to everyone. Our mission is to connect students
                        with local experts who can help them achieve their goals."
                    </p>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-16 px-8 bg-gray-900 text-white" id="features">
                <div className="container mx-auto">
                    <h2 className="text-3xl font-bold text-center mb-8 text-orange-500">Why Choose Us?</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        <div className="p-6 bg-gray-800 rounded-lg shadow-lg hover:scale-105 transform transition-all">
                            <FontAwesomeIcon icon={faMapMarkerAlt} className="w-12 h-12 mx-auto mb-4 text-orange-400" />
                            <h3 className="text-xl font-semibold mb-2 text-orange-400">Connect Locally</h3>
                            <p className="text-gray-300">
                                Find tutors and students within 10 km and build stronger learning relationships.
                            </p>
                        </div>
                        <div className="p-6 bg-gray-800 rounded-lg shadow-lg hover:scale-105 transform transition-all">
                            <FontAwesomeIcon icon={faClock} className="w-12 h-12 mx-auto mb-4 text-orange-400" />
                            <h3 className="text-xl font-semibold mb-2 text-orange-400">Flexible Learning</h3>
                            <p className="text-gray-300">
                                Learn at your own pace and on your schedule with personalized lessons.
                            </p>
                        </div>
                        <div className="p-6 bg-gray-800 rounded-lg shadow-lg hover:scale-105 transform transition-all">
                            <FontAwesomeIcon icon={faComments} className="w-12 h-12 mx-auto mb-4 text-orange-400" />
                            <h3 className="text-xl font-semibold mb-2 text-orange-400">Seamless Communication</h3>
                            <p className="text-gray-300">
                                Chat with tutors and students to enhance collaboration and learning.
                            </p>
                        </div>
                        <div className="p-6 bg-gray-800 rounded-lg shadow-lg hover:scale-105 transform transition-all">
                            <FontAwesomeIcon icon={faLightbulb} className="w-12 h-12 mx-auto mb-4 text-orange-400" />
                            <h3 className="text-xl font-semibold mb-2 text-orange-400">Skill Discovery</h3>
                            <p className="text-gray-300">
                                Explore a variety of skills and topics to enhance your knowledge and abilities.
                            </p>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
};

export default Homepage;
