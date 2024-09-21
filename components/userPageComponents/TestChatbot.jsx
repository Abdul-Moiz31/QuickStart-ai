import { ScrollArea } from '@radix-ui/react-scroll-area';
import { Send } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';

const TestChatbot = () => {
  const [messages, setMessages] = useState([
    { sender: "Bot", message: "Hello! How can I assist you today?" }
  ]);
  const [messageInput, setMessageInput] = useState(""); // For handling message input
  const messagesEndRef = useRef(null); // Reference to auto-scroll on new messages

  // Scroll to the bottom whenever new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle message sending
  const handleSendMessage = () => {
    if (messageInput.trim()) {
      setMessages((prevMessages) => [
        ...prevMessages,
        { sender: "You", message: messageInput },
      ]);
      setMessageInput("");
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 p-4 rounded-lg">
      {/* Message Display Area */}
      <ScrollArea className="flex-1 open-sans-text overflow-y-auto mb-2 p-4 bg-gray-800 rounded-lg">
        {messages.map((chat, index) => (
          <div
            key={index}
            className={`mb-4 ${
              chat.sender === "You" ? "text-right" : "text-left"
            }`}
          >
            <span
              className={`animate-appearance-in inline-block p-2 rounded-lg ${
                chat.sender === "You"
                  ? "bg-blue-500"
                  : "bg-gray-500"
              } text-white`}
            >
              {chat.message}
            </span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </ScrollArea>

      {/* Message Input Area */}
      <div className="flex items-center">
        <input
          type="text"
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 p-2 rounded-lg bg-gray-700 text-white"
        />
        <button
          onClick={handleSendMessage}
          className="ml-2 bg-blue-600 p-2 rounded-lg text-white hover:bg-blue-500"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default TestChatbot;
