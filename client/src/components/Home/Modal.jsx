import React from "react";

const Modal = ({ show, item, onClose }) => {
    if (!show) {
        return null;
    }

    let thumbnail =
        item.volumeInfo.imageLinks &&
        item.volumeInfo.imageLinks.smallThumbnail;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg w-11/12 md:w-3/4 lg:w-1/2 p-6 relative">
                {/* Close Button */}
                <button
                    className="absolute top-4 right-4 text-gray-600 hover:text-gray-800 text-2xl font-bold"
                    onClick={onClose}
                >
                    &times;
                </button>
                {/* Content */}
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Thumbnail */}
                    {thumbnail && (
                        <img
                            src={thumbnail}
                            alt={item.volumeInfo.title}
                            className="w-full md:w-1/3 rounded-lg shadow-sm object-cover max-h-48 sm:max-h-64"
                        />
                    )}
                    {/* Book Info */}
                    <div className="flex-1">
                        <h1 className="text-xl font-semibold text-gray-800">
                            {item.volumeInfo.title}
                        </h1>
                        <h3 className="text-md text-gray-600 mt-2">
                            {item.volumeInfo.authors?.join(", ")}
                        </h3>
                        <h4 className="text-sm text-gray-500 mt-2">
                            {item.volumeInfo.publisher}{" "}
                            <span className="block text-gray-400">
                                {item.volumeInfo.publishedDate}
                            </span>
                        </h4>
                        <a
                            href={item.volumeInfo.previewLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block mt-4 px-4 py-2 bg-blue-500 text-white font-medium rounded-lg shadow hover:bg-blue-600"
                        >
                            More Info
                        </a>
                    </div>
                </div>
                {/* Description */}
                <div className="mt-6 max-h-32 overflow-y-auto text-sm text-gray-700 border-t pt-4">
                    {item.volumeInfo.description || "No description available."}
                </div>
            </div>
        </div>
    );
};

export default Modal;
