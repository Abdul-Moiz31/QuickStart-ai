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
    <div className="flex  h-full roboty-headings shadow-xl">
      {/* Chat Sidebar */}
      <div className="w-1/4 bg-white   rounded-ss-xl rounded-es-xl p-4  h-[100%]">
        <h3 className="text-2xl font-bold mb-4">Recent Sessions</h3>
        <ScrollArea className="h-[90%]">
        <ul>
          {sessions.map((user) => (
            <li
              key={user._id}
              className={`cursor-pointer p-2 mb-2 rounded-[7px]  ${
                selectedUserId === user._id ? "bg-[#9e45f1]" : "hover:bg-[#a550f5]"
              }`}
              onClick={() => handleSelectUser(user._id)}
            > 
              <div className={`font-bold  ${selectedUserId===user._id?"text-white":"text-black"} `}>{user.username.toUpperCase()}</div>
              <div className={`text-black text-sm ${selectedUserId===user._id?"text-white":"text-black"}`}>{user.lastMessage.slice(0,20)+ "... " || "No messages yet"}</div>
            </li>
          ))}
        </ul>
        </ScrollArea>
      </div>

      {/* Chat Window */}
      <div className="flex-1 pl-4 bg-white rounded-se-xl rounded-ee-xl flex flex-col justify-between h-[100%] ">
        {selectedUserId ? (
          <>
            {/* Scrollable Messages Area */}
            <div className="flex-1 ">
              <h3 className="roboty-headings text-2xl font-bold m-3">
                Chat with {sessions.find(session => session._id === selectedUserId)?.username}
              </h3>
              <ScrollArea className="  bg-[#E5E7EB] rounded-xl  py-3 w-[97%] h-[70vh] overflow-auto">


              {/* Loader for messages */}
              {messagesLoading ? (
                <div className="flex justify-center items-center h-full">
                  <Loader /> {/* Display your loader component */}
                </div>
              ) : (
                messages.length > 0 && messages.map((chat, index) => (
                  <div
                    key={index}
                    className={`mb-4 mx-4 ${chat.role === "user" ? "float-right text-right " : "text-left float-left"} w-[600px] mx-auto`}
                  >
                    <span
                      className={`open-sans-text relative inline-block p-2 ml-2 mr-2   rounded-lg ${
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
              <div className="flex items-center p-2">
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 p-2 rounded-lg bg-white border-gray-700 text-white"
              />
              <button
                onClick={handleSendMessage}
                className="ml-2 bg-blue-600 p-2 rounded-lg text-white hover:bg-blue-500"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            </div>

            {/* Message Input */}
            
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
