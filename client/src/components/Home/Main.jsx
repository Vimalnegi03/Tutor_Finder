import React, { useState } from "react";
import Card from "./Card";
import axios from "axios";

const Main = () => {
    const [search, setSearch] = useState("");
    const [bookData, setData] = useState([]);
    const KEY = import.meta.env.VITE_KEY;
    const searchBook = (evt) => {
        if (evt.key === "Enter") {
            axios
                .get(
                    `https://www.googleapis.com/books/v1/volumes?q=${search}&key=${KEY}`
                )
                .then((res) => setData(res.data.items))
                .catch((err) => console.log(err));
        }
    };

    return (
        <>
            {/* Header Section */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-8">
                <div className="text-center">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">
                        A room without books is like <br /> a body without a soul.
                    </h1>
                </div>
                <div className="mt-8 flex flex-col items-center">
                    <h2 className="text-2xl md:text-3xl font-semibold mb-4">Find Your Book</h2>
                    <div className="relative w-full max-w-md">
                        <input
                            type="text"
                            placeholder="Enter Your Book Name"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyPress={searchBook}
                            className="w-full p-3 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                        <button className="absolute right-2 top-1/2 transform -translate-y-1/2 text-purple-600 hover:text-purple-800">
                            <i className="fas fa-search text-xl"></i>
                        </button>
                    </div>
                </div>
                <div className="mt-6 flex justify-center">
                    <img
                        src="/bg2.png"
                        alt="Books Background"
                        className="w-full max-w-lg rounded-lg shadow-lg"
                    />
                </div>
            </div>

            {/* Book Cards Section */}
            <div className="container mx-auto py-8 px-4">
                {bookData.length > 0 ? (
                    <Card book={bookData} />
                ) : (
                    <div className="text-center mt-12">
                        <p className="text-lg font-medium text-gray-600">
                            Start searching for books to see results here.
                        </p>
                    </div>
                )}
            </div>
        </>
    );
};

export default Main;
