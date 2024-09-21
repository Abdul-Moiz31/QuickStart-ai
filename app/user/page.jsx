"use client";
import React, { useState, useEffect } from "react";
import { Bell, LogOut, User } from "lucide-react";
import Overview from "@/components/userPageComponents/Overview";
import Chat from "@/components/userPageComponents/Chat";
import BussinessDetails from "@/components/userPageComponents/BussinessDetails";
import Token from "@/components/userPageComponents/Token";
import TestChatbot from "@/components/userPageComponents/TestChatbot";
import OutOfCredits from "@/components/userPageComponents/OutOfCredits";
import Transactions from "@/components/userPageComponents/Transactions";
import { useRouter } from "next/navigation";

export default function UserDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [credits, setCredits] = useState(0);
  const [isOutOfCreditsOpen, setIsOutOfCreditsOpen] = useState(true);
  const [showLogoutMenu, setShowLogoutMenu] = useState(false);
  const tabs = [
    "overview",
    "chats",
    "bussiness Details",
    "test chatbot",
    "token",
    "Transactions",
  ];
  const router = useRouter();

  const handleCloseModal = () => {
    setIsOutOfCreditsOpen(false); // Close the modal
  };
  // Check if the user is logged in when the component mounts
  useEffect(() => {
    const isLoggedIn = true; // default to true for testing
    if (!isLoggedIn) {
      router.push("/start"); // Redirect to /start if not logged in
    }
  }, [router]);

  const toggleLogoutMenu = () => {
    setShowLogoutMenu((prev) => !prev);
  };

  const handleLogout = () => {
    // Add your logout logic here (e.g., clearing auth tokens)
    router.push("/"); // Redirect to / after logout
  };

  return (
    <div className="flex min-h-screen bg-black text-white">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 p-4 h-screen fixed top-0 left-0">
        <h2 className="text-2xl font-bold mb-6">Quickstart User</h2>
        <nav className="space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab}
              className={`text-md roboty-headings w-full text-left py-2 px-4 rounded ${
                activeTab === tab ? "bg-blue-600" : "hover:bg-gray-800"
              }`}
              onClick={() => setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8 ml-64 h-screen overflow-y-auto">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">
            {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
          </h1>
          <div className="flex items-center space-x-4">
            <button className="p-2 rounded-full hover:bg-gray-800">
              <Bell className="h-5 w-5" />
            </button>
            <div
              className="relative w-8 h-8 rounded-full bg-gray-600 cursor-pointer"
              onClick={toggleLogoutMenu}
            >
              <User className="h-6 w-6 mx-auto my-auto mt-1 text-white" />

              {showLogoutMenu && (
                <div className="absolute right-0 mt-2 bg-gray-800 text-white rounded-lg shadow-lg z-10">
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 hover:bg-gray-700 w-full text-left text-red-600 flex items-center justify-between"
                  >
                    Logout <LogOut className="h-4 w-4 ml-2" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Render content based on active tab */}
        {activeTab === "overview" && <Overview />}
        {activeTab === "chats" && <Chat />}
        {activeTab === "bussiness Details" && <BussinessDetails />}
        {activeTab === "test chatbot" && <TestChatbot />}
        {activeTab === "token" && <Token />}
        {activeTab === "Transactions" && <Transactions />}

        {/* Conditional rendering for the modal */}
        {credits === 0 && isOutOfCreditsOpen && (
          <OutOfCredits onClose={handleCloseModal} />
        )}
      </main>
    </div>
  );
}
