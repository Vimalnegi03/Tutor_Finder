import React, { useState } from "react";

import { Upload, ImageIcon } from "lucide-react";

const Chatbot = () => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([
    { sender: "ai", text: "Hello! How can I help you?" },
  ]);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const KEY = import.meta.env.VITE_GEMINI_KEY;
  const Api_Url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${KEY}`;

  const handleInputChange = (e) => {
    setMessage(e.target.value);
  };

  const handleSend = async () => {
    if (!message.trim() && !file) return;
    
    const newUserMessage = { sender: "user", text: message, file };
    setMessages([...messages, newUserMessage]);
    setMessage("");
    setFile(null);
    setPreview(null);
    
    setTimeout(async () => {
      const newAiMessage = { sender: "ai", text: "Loading..." };
      setMessages((prev) => [...prev, newAiMessage]);
      
      try {
        const requestBody = {
          contents: [{ parts: [{ text: message }, file ? [{ inline_data: file }] : []] }]
        };
        
        const response = await fetch(Api_Url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        });
        
        const data = await response.json();
        const aiResponse = data.candidates[0].content.parts[0].text.replace(/\*\*(.*?)\*\*/g, "$1").trim();
        
        setMessages((prev) => {
          const updatedMessages = [...prev];
          updatedMessages[updatedMessages.length - 1] = { sender: "ai", text: aiResponse };
          return updatedMessages;
        });
      } catch (error) {
        console.error("Error fetching AI response:", error);
      }
    }, 600);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64string = e.target.result.split(",")[1];
      setFile({ mime_type: file.type, data: base64string });
      setPreview(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100 p-4">
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white shadow rounded-lg">
        {messages.map((msg, index) => (
          <div key={index} className={`flex ${msg.sender === "ai" ? "justify-start" : "justify-end"}`}>
            {msg.sender === "ai" && <img src="th.jpg" alt="AI" className="w-10 h-10 rounded-full mr-2" />}
            <div className={`p-3 rounded-lg max-w-xs ${msg.sender === "ai" ? "bg-blue-100" : "bg-green-200"}`}>
              {msg.text}
              {msg.file && <img src={`data:${msg.file.mime_type};base64,${msg.file.data}`} className="mt-2 rounded-lg max-w-full" alt="Uploaded" />}
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 mt-4">
        <input
          type="text"
          placeholder="Message ..."
          value={message}
          onChange={handleInputChange}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring focus:ring-blue-300"
        />
        <label className="cursor-pointer">
          {preview ? (
            <img src={preview} alt="Preview" className="w-8 h-8 rounded-full" />
          ) : (
            <ImageIcon className="w-8 h-8 text-blue-500" />
          )}
          <input type="file" accept="image/*" hidden onChange={handleFileChange} />
        </label>
        <button onClick={handleSend} className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
          <Upload className="w-6 h-6 text-white" />
        </button>
      </div>
    </div>
  );
};

export default Chatbot;
