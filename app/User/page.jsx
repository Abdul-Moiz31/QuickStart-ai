"use client";
import React, { useState } from "react";
import { Bell, MessageSquare, User, Settings, Send } from "lucide-react";
import { MdDeleteOutline } from "react-icons/md";

export default function UserDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedUser, setSelectedUser] = useState(null);
  const [messageInput, setMessageInput] = useState(""); // For handling message input
  const [chats, setChats] = useState({
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
    { id: 8, name: "John", lastMessage: "Thanks for your assistance!" },
  ];

  const handleSendMessage = () => {
    console.log("Sending message:", messageInput);
  };
  return (
    <div className="flex min-h-screen bg-black text-white">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 p-4 h-screen">
        <h2 className="text-2xl font-bold mb-6">Quickstart User</h2>
        <nav className="space-y-2">
          {["overview", "chats", "settings", "token"].map((tab) => (
            <button
              key={tab}
              className={`w-full text-left py-2 px-4 rounded ${
                activeTab === tab ? "bg-blue-600" : "hover:bg-gray-800"
              }`}
              onClick={() => setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
      </aside>

      <main className="flex-1 p-8 h-screen overflow-hidden">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">
            {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
          </h1>
          <div className="flex items-center space-x-4">
            <button className="p-2 rounded-full hover:bg-gray-800">
              <Bell className="h-5 w-5" />
            </button>
            <div className="w-8 h-8 rounded-full bg-gray-600"></div>
          </div>
        </header>
        {activeTab === 'overview' && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              { title: 'Total Sessions', icon: MessageSquare, value: '1,234', change: '+10%' },
              { title: 'Total Credits', icon: User, value: '256', change: '+5%' },
              { title: 'Current Plan', icon: Settings, value: 'Pro', subtext: 'Renews on May 1, 2023' },
            ].map((card, index) => (
              <div key={index} className="bg-gray-800 p-6 rounded-lg">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-medium">{card.title}</h3>
                  <card.icon className="w-4 h-4 text-blue-400" />
                </div>
                <p className="text-2xl font-bold">{card.value}</p>
                <p className="text-xs text-blue-400">{card.change || card.subtext}</p>
              </div>
            ))}
          </div>
        )}

        {activeTab === "chats" && (
          <div className="flex h-full">
            {/* Chat Sidebar */}
            <div className="w-1/4 bg-gray-900 p-4 rounded-lg h-[490px] overflow-y-auto">
              <h3 className="text-2xl font-bold mb-4">Recent Chats</h3>
              <ul>
                {users.map((user) => (
                  <li
                    key={user.id}
                    className={`cursor-pointer p-2 mb-2 rounded-lg ${
                      selectedUser === user.name
                        ? "bg-blue-600"
                        : "hover:bg-gray-800"
                    }`}
                    onClick={() => setSelectedUser(user.name)}
                  >
                    <div className="font-bold text-white">{user.name}</div>
                    <div className="text-gray-400 text-sm">
                      {user.lastMessage}
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Chat Window */}
            <div className="flex-1 bg-gray-800 ml-4 rounded-lg flex flex-col justify-between h-[490px]">
              {selectedUser ? (
                <>
                  {/* Scrollable Messages Area */}
                  <div className="flex-1 overflow-y-auto mb-2 p-2 bg-gray-900 rounded-lg">
                    <h3 className="text-2xl font-bold m-3">
                      Chat with {selectedUser}
                    </h3>
                    {chats[selectedUser].map((chat, index) => (
                      <div
                        key={index}
                        className={`mb-4 ${
                          chat.sender === "You" ? "text-right" : "text-left"
                        }`}
                      >
                        <span
                          className={`inline-block p-2 rounded-lg ${
                            chat.sender === "You"
                              ? "bg-blue-500"
                              : "bg-gray-500"
                          } text-white`}
                        >
                          {chat.message}
                        </span>
                      </div>
                    ))}
                  </div>

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
                <p className="text-white ml-[20px] mt-[20px]">Select a user to view their chat.</p>
              )}
            </div>
          </div>
        )}
       {activeTab === "settings" && (
  <div className="bg-gray-800 p-6 rounded-lg">
    <h3 className="text-xl font-bold mb-4">Company Details</h3>
    <form className="space-y-4">
      <div>
        <label
          htmlFor="Add company related question"
          className="block text-sm font-medium text-gray-400"
        >
          Company Related Question
        </label>
        <input
          id="Question"
          type="text"
          placeholder="What is our Company Objectives?"
          className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white"
        />
      </div>
      
      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-gray-400"
        >
          Answer
        </label>
        <textarea
          id="answer"
          placeholder="Our Objectives are to provide the best services to our customers..."
          className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white"
          rows={4}
        ></textarea>
      </div>
      <button
        type="submit"
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        Add Detail
      </button>
    </form>

    {/* Cards for Questions and Answers */}
    <div className="mt-6 space-y-4">
      {[
        {
          question: "What is our Company Objective?",
          answer: "Our objective is to provide the best services to our customers and to continuously improve our offerings.",
        },
        {
          question: "What is our Company Mission?",
          answer: "Our mission is to deliver quality service and create lasting customer relationships.",
        },
      ].map((item, index) => (
        <div key={index} className="bg-gray-700 p-4 rounded-lg relative">
          <button className="absolute text-xl font-bold top-3 right-3 text-red-500 hover:text-red-700">
           <MdDeleteOutline />
          </button>
          <h4 className="text-lg font-bold text-white">{item.question}</h4>
          <p className="text-gray-300 mt-2">{item.answer}</p>
        </div>
      ))}
    </div>
  </div>
)}


        {activeTab === "token" && (
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-xl font-bold mb-4">API Token</h3>
            <p className="mb-4">
              Use this token to integrate our chat service into your website:
            </p>
            <input
              value="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              readOnly
              className="w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white mb-4"
            />
            <p className="text-sm text-gray-400 mb-4">
              Keep this token secret. Do not share it publicly.
            </p>
            <button className="bg-blue-600 text-white px-4 py-2 rounded">
              Generate New Token
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
