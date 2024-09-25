import { Send } from "lucide-react";
import React, { useState, useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useDispatch, useSelector } from "react-redux";
import { getAllSessions, getAllMessages } from "@/slices/userSlice";
import Loader from "@/components/Loader/index"; // Import your Loader component

const Chat = () => {
  const dispatch = useDispatch();
  const { sessions } = useSelector((state) => state.user);
  const { messages, loading: messagesLoading } = useSelector((state) => state.user); // Assuming loading is part of user state
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [messageInput, setMessageInput] = useState("");
  
  // Ref for scrolling to the bottom
  const messagesEndRef = useRef(null);

  useEffect(() => {
    dispatch(getAllSessions());
  }, [dispatch]);

  useEffect(() => {
    // Scroll to the bottom of the messages area whenever messages change
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]); // Depend on messages to trigger scroll

  const handleSelectUser = (userId) => {
    setSelectedUserId(userId);
    dispatch(getAllMessages(userId)); // Fetch messages when a user is selected
  };

  const handleSendMessage = () => {
    console.log("Sending message:", messageInput);
    // Add logic to send the message
    setMessageInput(""); // Clear the input after sending
  };

  const getUserMessages = (userId) => {
    return sessions.find((session) => session._id === userId)?.messages || [];
  };

  return (
    <div className="flex h-full roboty-headings">
      {/* Chat Sidebar */}
      <ScrollArea className="w-1/4 bg-gray-900 p-4 rounded-lg h-[95%]">
        <h3 className="text-2xl font-bold mb-4">Recent Sessions</h3>
        <ul>
          {sessions.map((user) => (
            <li
              key={user._id}
              className={`cursor-pointer p-2 mb-2 rounded-lg ${
                selectedUserId === user._id ? "bg-blue-600" : "hover:bg-gray-800"
              }`}
              onClick={() => handleSelectUser(user._id)}
            >
              <div className="font-bold text-white">{user.username.toUpperCase()}</div>
              <div className="text-gray-400 text-sm">{user.lastMessage || "No messages yet"}</div>
            </li>
          ))}
        </ul>
      </ScrollArea>

      {/* Chat Window */}
      <div className="flex-1 bg-gray-800 ml-4 rounded-lg flex flex-col justify-between h-[95%]">
        {selectedUserId ? (
          <>
            {/* Scrollable Messages Area */}
            <ScrollArea className="flex-1 overflow-y-auto mb-2 p-2 bg-gray-900 rounded-lg">
              <h3 className="roboty-headings text-2xl font-bold m-3">
                Chat with {sessions.find(session => session._id === selectedUserId)?.username}
              </h3>

              {/* Loader for messages */}
              {messagesLoading ? (
                <div className="flex justify-center items-center h-full">
                  <Loader /> {/* Display your loader component */}
                </div>
              ) : (
                messages.length > 0 && messages.map((chat, index) => (
                  <div
                    key={index}
                    className={`mb-4 ${chat.role === "user" ? "float-right text-right " : "text-left float-left"} w-[600px] mx-auto`}
                  >
                    <span
                      className={`open-sans-text relative inline-block p-2 rounded-lg ${
                        chat.role === "user" ? "bg-blue-500 right-0" : "bg-gray-500 "
                      } text-white`}
                    >
                      {chat.message}
                    </span>
                  </div>
                ))
              )}

              {/* Reference for scrolling to the bottom */}
              <div ref={messagesEndRef} />
            </ScrollArea>

            {/* Message Input */}
            <div className="flex items-center p-2">
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
          </>
        ) : (
          <p className="text-white mx-auto w-fit my-auto">
            Select a user to view their chat.
          </p>
        )}
      </div>
    </div>
  );
};

export default Chat;
