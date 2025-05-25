import React, { useState } from "react";
import Modal from "./Modal";

const Card = ({ book }) => {
    const [show, setShow] = useState(false);
    const [bookItem, setItem] = useState();

    return (
        <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 px-4 py-8">
                {book.map((item, index) => {
                    let thumbnail =
                        item.volumeInfo.imageLinks &&
                        item.volumeInfo.imageLinks.smallThumbnail;
                    let amount =
                        item.saleInfo.listPrice &&
                        item.saleInfo.listPrice.amount;

                    if (thumbnail !== undefined && amount !== undefined) {
                        return (
                            <div
                                key={index}
                                className="card bg-white shadow-lg rounded-lg overflow-hidden transform transition duration-300 hover:scale-105 hover:shadow-xl cursor-pointer"
                                onClick={() => {
                                    setShow(true);
                                    setItem(item);
                                }}
                            >
                                <img
                                    src={thumbnail}
                                    alt={item.volumeInfo.title}
                                    className="w-full h-48 object-cover"
                                />
                                <div className="p-4">
                                    <h3 className="text-lg font-semibold text-gray-800 truncate over">
                                        {item.volumeInfo.title}
                                    </h3>
                                    <p className="text-sm text-gray-600 mt-2">
                                        Price:{" "}
                                        <span className="font-bold text-green-500">
                                            &#8377;{0}
                                        </span>
                                    </p>
                                </div>
                            </div>
                        );
                    }
                    return null;
                })}
            </div>
            {show && (
                <Modal
                    show={show}
                    item={bookItem}
                    onClose={() => setShow(false)}
                />
            )}
        </>
    );
};

export default Card;
