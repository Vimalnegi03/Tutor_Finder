import React, { useState } from 'react';
import { Link,useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../store/Slices/authSlice'; // Import the logout action

function Header() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const dispatch = useDispatch();
    const navigate = useNavigate(); 
    // Get auth state from Redux
    const { isAuthenticated, user } = useSelector((state) => state.auth);

    const handleLogout = () => {
        dispatch(logout()); // Dispatch the logout action
        navigate("/login")
    };

    return (
        <>
            {/* Header Section */}
            <header className="bg-gray-900 py-4 shadow-lg">
                <nav className="container mx-auto flex justify-between items-center px-4">
                    {/* Logo */}
                    <Link to="#" className="text-orange-500 text-3xl font-extrabold tracking-wide">
                        LMS
                    </Link>

                    {/* Desktop Navigation */}
                    <ul className="hidden md:flex space-x-8 text-gray-300">
                        <li>
                            <Link
                                to="/"
                                className="text-lg font-medium hover:text-orange-400 transition-transform transform hover:scale-105"
                            >
                                Home
                            </Link>
                        </li>
                        <li>
                            <Link
                              to="/about_us"
                                className="text-lg font-medium hover:text-orange-400 transition-transform transform hover:scale-105"
                            >
                                About
                            </Link>
                        </li>
                        <li>
                            <Link
                               to="/contact"
                                className="text-lg font-medium hover:text-orange-400 transition-transform transform hover:scale-105"
                            >
                                Contact
                            </Link>
                        </li>
                        <li>
                            <Link
                               to="/book-search"
                                className="text-lg font-medium hover:text-orange-400 transition-transform transform hover:scale-105"
                            >
                              Library
                            </Link>
                        </li>
                        <li>
                            <Link
                               to="/gpt-lite"
                                className="text-lg font-medium hover:text-orange-400 transition-transform transform hover:scale-105"
                            >
                              Doubt-Solver
                            </Link>
                        </li>
                        <li>
                            <Link
                               to="/Notes"
                                className="text-lg font-medium hover:text-orange-400 transition-transform transform hover:scale-105"
                            >
                              Notes
                            </Link>
                        </li>
                        <li>
                            <Link
                                to="/dashboard"
                                className="block text-lg font-medium hover:text-orange-400 transition"
                            >
                               Dashboard
                            </Link>
                        </li>
                    </ul>

                    {/* Login/Logout Buttons */}
                    <div className="hidden md:flex space-x-4">
                        {isAuthenticated ? (
                            <button
                                onClick={handleLogout}
                                className="bg-orange-400 text-white px-4 py-2 rounded hover:bg-orange-500 transition"
                            >
                                Logout
                            </button>
                        ) : (
                            <Link
                                to="/register"
                                className="bg-orange-400 text-white px-4 py-2 rounded hover:bg-orange-500 transition"
                            >
                                Register/Login
                            </Link>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="md:hidden text-gray-300 text-2xl focus:outline-none"
                    >
                        ☰
                    </button>
                </nav>

                {/* Mobile Navigation */}
                {isMenuOpen && (
                    <ul className="md:hidden bg-gray-800 text-gray-300 space-y-2 p-4 absolute w-full left-0 shadow-md z-10">
                        <li>
                            <a
                                href="/"
                                className="block text-lg font-medium hover:text-orange-400 transition"
                            >
                                Home
                            </a>
                        </li>
                        <li>
                            <Link
                                to="/about_us"
                                className="block text-lg font-medium hover:text-orange-400 transition"
                            >
                                About
                            </Link>
                        </li>
                        <li>
                            <Link
                                to="/contact"
                                className="block text-lg font-medium hover:text-orange-400 transition"
                            >
                                Contact
                            </Link>
                        </li>
                        <li>
                            <Link
                                to="/book-search"
                                className="block text-lg font-medium hover:text-orange-400 transition"
                            >
                               Library
                            </Link>
                        </li>
                          <li>
                            <Link
                               to="/gpt-lite"
                                className="text-lg font-medium hover:text-orange-400 transition-transform transform hover:scale-105"
                            >
                              Doubt-Solver
                            </Link>
                        </li>
                        <li>
                            <Link
                               to="/Notes"
                                className="text-lg font-medium hover:text-orange-400 transition-transform transform hover:scale-105"
                            >
                              Notes
                            </Link>
                        </li>
                        <li>
                            <Link
                                to="/dashboard"
                                className="block text-lg font-medium hover:text-orange-400 transition"
                            >
                               Dashboard
                            </Link>
                        </li>
                        {isAuthenticated ? (
                            <li>
                                <button
                                    onClick={handleLogout}
                                    className="block text-lg font-medium bg-orange-400 text-white px-4 py-2 rounded mt-2 hover:bg-orange-500 transition w-full"
                                >
                                    Logout
                                </button>
                            </li>
                        ) : (
                            <li>
                                <Link
                                    to="/register"
                                    className="block text-lg font-medium bg-orange-400 text-white px-4 py-2 rounded mt-2 hover:bg-orange-500 transition"
                                >
                                    Register/Login
                                </Link>
                            </li>
                        )}
                    </ul>
                )}
            </header>
        </>
    );
}

export default Header;
