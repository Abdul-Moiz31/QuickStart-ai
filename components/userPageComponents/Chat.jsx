import { Send } from "lucide-react";
import React, { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
const Chat = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedUser, setSelectedUser] = useState(null);
  const [messageInput, setMessageInput] = useState(""); // For handling message input
  const [sessions, setSessions] = useState({
    Alice: [
      { sender: "Alice", message: "How can I help you today?" },
      { sender: "You", message: "I need assistance with my order." },
      { sender: "Alice", message: "How can I help you today?" },
      { sender: "You", message: "I need assistance with my order." },
      { sender: "Alice", message: "How can I help you today?" },
      { sender: "You", message: "I need assistance with my order." },
      { sender: "Alice", message: "How can I help you today?" },
      { sender: "You", message: "I need assistance with my order." },
      { sender: "Alice", message: "How can I help you today?" },
      { sender: "You", message: "I need assistance with my order." },
      { sender: "Alice", message: "How can I help you today?" },
      { sender: "You", message: "I need assistance with my order." },
      { sender: "Alice", message: "How can I help you today?" },
      { sender: "You", message: "I need assistance with my order." },
      { sender: "Alice", message: "How can I help you today?" },
      { sender: "You", message: "I need assistance with my order." },
    ],
    Bob: [
      { sender: "Bob", message: "Thanks for your assistance!" },
      { sender: "You", message: "No problem, glad to help!" },
    ],
    Charlie: [
      { sender: "Charlie", message: "I have a question about..." },
      { sender: "You", message: "Sure, feel free to ask." },
    ],
    Aqib: [
      { sender: "Aqib", message: "I have a question about..." },
      { sender: "You", message: "Sure, feel free to ask." },
    ],

    Saqib: [
      { sender: "Saqib", message: "I have a question about..." },
      { sender: "You", message: "Sure, feel free to ask." },
    ],
    John: [
      { sender: "John", message: "I have a question about..." },
      { sender: "You", message: "Sure, feel free to ask." },
    ],
    John: [
      { sender: "John", message: "I have a question about..." },
      { sender: "You", message: "Sure, feel free to ask." },
    ],
  });

  const users = [
    { id: 1, name: "Alice", lastMessage: "How can I help you today?" },
    { id: 2, name: "Bob", lastMessage: "Thanks for your assistance!" },
    { id: 3, name: "Charlie", lastMessage: "I have a question about..." },
    { id: 5, name: "Aqib", lastMessage: "Thanks for your assistance!" },
    { id: 6, name: "Saqib", lastMessage: "I have a question about..." },
    { id: 7, name: "John", lastMessage: "Thanks for your assistance!" },
    { id: 9, name: "Malik", lastMessage: "Thanks for your assistance!" },
    { id: 10, name: "Ali", lastMessage: "Thanks for your assistance!" },
    { id: 11, name: "Khan", lastMessage: "Thanks for your assistance!" },
  ];

  const handleSendMessage = () => {
    console.log("Sending message:", messageInput);
  };

  return (
    <div className="flex h-full roboty-headings">
      {/* Chat Sidebar */}
      <ScrollArea className="w-1/4 bg-gray-900 p-4 rounded-lg h-[95%] ">
        <h3 className="text-2xl font-bold mb-4">Recent sessions</h3>
        <ul>
          {users.map((user) => (
            <li
              key={user.id}
              className={`cursor-pointer p-2 mb-2 rounded-lg ${
                selectedUser === user.name ? "bg-blue-600" : "hover:bg-gray-800"
              }`}
              onClick={() => setSelectedUser(user.name)}
            >
              <div className="font-bold text-white">{user.name}</div>
              <div className="text-gray-400 text-sm">{user.lastMessage}</div>
            </li>
          ))}
        </ul>
      </ScrollArea>

      {/* Chat Window */}
      <div className="flex-1 bg-gray-800 ml-4 rounded-lg flex flex-col justify-between h-[95%]">
        {selectedUser ? (
          <>
            {/* Scrollable Messages Area */}
            <ScrollArea className="flex-1 overflow-y-auto mb-2 p-2 bg-gray-900 rounded-lg">
              <h3 className="roboty-headings text-2xl font-bold m-3">
                Chat with {selectedUser}
              </h3>
              {sessions[selectedUser].map((chat, index) => (
                <div
                  key={index}
                  className={`mb-4 ${
                    chat.sender === "You" ? "text-right" : "text-left"
                  }`}
                >
                  <span
                    className={`open-sans-text inline-block p-2 rounded-lg ${
                      chat.sender === "You" ? "bg-blue-500" : "bg-gray-500"
                    } text-white`}
                  >
                    {chat.message}
                  </span>
                </div>
              ))}
            </ScrollArea>

            {/* Message Input */}
            <div className="flex items-center p-2">
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 p-2 rounded-lg bg-gray-700 text-white "
              />
              <button
                onClick={handleSendMessage}
                className="ml-2 bg-blue-600 p-2 rounded-lg text-white hover:bg-blue-500"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </>
        ) : (
          <p className="text-white  mx-auto w-fit my-auto">
            Select a user to view their chat.
          </p>
        )}
      </div>
    </div>
  );
};

export default Chat;
