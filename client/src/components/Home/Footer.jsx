import React from 'react';

function Footer() {
    return (
        <>
            {/* Footer Section */}
            <footer className="bg-gray-900 text-gray-300 py-6" id="footer">
                <div className="container mx-auto text-center space-y-4">
                    {/* Logo and Tagline */}
                    <div>
                        <h2 className="text-xl font-bold text-orange-500">LMS Platform</h2>
                        <p className="mt-1 text-xs text-gray-400">
                            Empowering learning through innovation and technology.
                        </p>
                    </div>

                    {/* Contact Information */}
                    <p className="text-sm font-medium">
                        Contact us:{" "}
                        <a
                            href="mailto:support@lms.com"
                            className="text-orange-500 hover:text-orange-400 transition"
                        >
                            support@lms.com
                        </a>
                    </p>

                    {/* Quick Links */}
                    <ul className="flex justify-center space-x-4 text-sm">
                        <li>
                            <a
                                href="#"
                                className="text-gray-300 hover:text-orange-400 transition"
                            >
                                Terms
                            </a>
                        </li>
                        <li>
                            <a
                                href="#"
                                className="text-gray-300 hover:text-orange-400 transition"
                            >
                                Privacy
                            </a>
                        </li>
                        <li>
                            <a
                                href="#"
                                className="text-gray-300 hover:text-orange-400 transition"
                            >
                                Help
                            </a>
                        </li>
                    </ul>

                    {/* Social Media Links */}
                    <div className="flex justify-center space-x-4 text-sm">
                        <a
                            href="#"
                            className="text-gray-300 hover:text-orange-400 transition"
                            aria-label="Twitter"
                        >
                            Twitter
                        </a>
                        <a
                            href="https://www.linkedin.com/in/vimal-negi-233882233/"
                            className="text-gray-300 hover:text-orange-400 transition"
                            aria-label="LinkedIn"
                        >
                            LinkedIn
                        </a>
                        <a
                            href="#"
                            className="text-gray-300 hover:text-orange-400 transition"
                            aria-label="Instagram"
                        >
                            Instagram
                        </a>
                    </div>

                    {/* Newsletter Section */}
                    <div>
                        <p className="text-xs text-gray-400">
                            Subscribe to updates:
                        </p>
                        <form className="flex justify-center space-x-1">
                            <input
                                type="email"
                                placeholder="Email"
                                className="px-2 py-1 rounded-l text-gray-900 text-xs focus:ring-2 focus:ring-orange-500 outline-none"
                                required
                            />
                            <button
                                type="submit"
                                className="bg-orange-500 text-white px-3 py-1 rounded-r hover:bg-orange-600 transition text-xs"
                            >
                                Subscribe
                            </button>
                        </form>
                    </div>

                    {/* Footer Bottom Text */}
                    <p className="text-xs text-gray-500 mt-2">
                        &copy; {new Date().getFullYear()} LMS Platform. All rights reserved.
                    </p>
                </div>
            </footer>
        </>
    );
}

export default Footer;
