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
import { logout, clearState } from "@/slices/userSlice";
import { useDispatch, useSelector } from "react-redux";
import { MdSettings } from "react-icons/md"; 
import toast from "react-hot-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function UserDashboard() {
  const dispatch = useDispatch();
  const { isLoggedOut, loading, user } = useSelector((state) => state.user);
  const [activeTab, setActiveTab] = useState("overview");
  const [isOutOfCreditsOpen, setIsOutOfCreditsOpen] = useState(false);
  const [showLogoutMenu, setShowLogoutMenu] = useState(false);

  // Define tabs
  const tabs = [
    "overview",
    "chats",
    "business details",
    "test chatbot",
    "token",
    "transactions",
    "appearance",
  ];

  const router = useRouter();

  useEffect(() => {
    const isLoggedIn = true; // Replace with actual login check
    if (!isLoggedIn) {
      router.push("/start");
    }
    console.log("User", user);
    if (user?.bussinessDetails?.length < 5) {
      setIsOutOfCreditsOpen(true); // Open the modal if details are less than 5
    }
  }, [user, router]);

  const handleCloseModal = () => {
    setIsOutOfCreditsOpen(false);
    setActiveTab("business details");
  };

  useEffect(() => {
    if (isLoggedOut) {
      toast.success("Logged out successfully");
      dispatch(clearState());
      router.push("/start");
    }
  }, [isLoggedOut, loading, router]);

  const handleLogout = () => {
    dispatch(logout());
    toggleLogoutMenu();
  };

  const toggleLogoutMenu = () => {
    setShowLogoutMenu((prev) => !prev);
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
    className={`text-md roboty-headings w-full text-left py-2 px-4 rounded transition-all duration-300 
      ${tab === "appearance" ? 
        "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg hover:shadow-xl transform hover:scale-105" 
        : activeTab === tab 
        ? "bg-blue-600 text-white" 
        : "hover:bg-gray-800 text-gray-300"
      }`}
    onClick={() => tab !== "appearance" && setActiveTab(tab)}
  >
    {tab === "appearance" ? (
      <span className="flex items-center" onClick={()=>alert("This feature is currently under beta version")}>
        <MdSettings className="mr-2 text-lg" /> 
        Appearance <span className="ml-1 text-sm font-semibold">β</span> {/* Emphasized "β" */}
      </span>
    ) : (
      tab.charAt(0).toUpperCase() + tab.slice(1)
    )}
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
              className="relative w-8 h-8 cursor-pointer"
              onClick={toggleLogoutMenu}
            >
              <Avatar>
                <AvatarImage src={user?.picture} alt={user?.businessName} />
                <AvatarFallback>{user?.name?.charAt(0)}</AvatarFallback>
              </Avatar>

              {showLogoutMenu && (
                <div className="absolute right-0 mt-2 text-white rounded-lg shadow-lg z-10 bg-red-700">
                  <button
                    className="flex items-center p-2 hover:bg-gray-700 w-full"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-4 w-4 mr-2" color="white" /> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Render content based on active tab */}
        {activeTab === "overview" && <Overview />}
        {activeTab === "chats" && <Chat />}
        {activeTab === "business details" && <BussinessDetails />}
        {activeTab === "test chatbot" && <TestChatbot />}
        {activeTab === "token" && <Token />}
        {activeTab === "transactions" && <Transactions />}

        {/* Show OutOfCredits modal if business details are less than 5 */}
        {isOutOfCreditsOpen && activeTab=="overview" && (
          <OutOfCredits
            onClose={handleCloseModal}
            setActiveTab={setActiveTab}
          />
        )}
      </main>
    </div>
  );
}
