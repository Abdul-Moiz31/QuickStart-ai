"use client";
import React, { useState, useEffect } from "react";
import {
  Bell,
  LogOut,
  User,
  Settings,
  LayoutDashboard,
  Briefcase,
  MessageSquare,
  CreditCard,
  Coins,
} from "lucide-react";
import Overview from "@/components/userPageComponents/Overview";
import Chat from "@/components/userPageComponents/Chat";
import BussinessDetails from "@/components/userPageComponents/BussinessDetails";
import Token from "@/components/userPageComponents/Token";
import TestChatbot from "@/components/userPageComponents/TestChatbot";
import OutOfCredits from "@/components/userPageComponents/OutOfCredits";
import Transactions from "@/components/userPageComponents/Transactions";
import { useRouter } from "next/navigation";
import { logout, clearState, loadUser } from "@/slices/userSlice";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";

export default function UserDashboard() {
  const dispatch = useDispatch();
  const { isLoggedOut, loading, user } = useSelector((state) => state.user);

  const [activeTab, setActiveTab] = useState("overview");
  const [isOutOfCreditsOpen, setIsOutOfCreditsOpen] = useState(false);
  const [showLogoutMenu, setShowLogoutMenu] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // For responsive sidebar toggle

  // Define tabs
  const tabs = [
    { name: "overview", icon: <LayoutDashboard /> },
    { name: "sessions", icon: <MessageSquare /> },
    { name: "business details", icon: <Briefcase /> },
    { name: "test chatbot", icon: <MessageSquare /> },
    { name: "token", icon: <Coins /> },
    { name: "transactions", icon: <CreditCard /> },
    { name: "appearance", icon: <Settings /> },
  ];

  const router = useRouter();
  useEffect(() => {
    dispatch(loadUser());
  }, [dispatch]);

  useEffect(() => {
   // const isLoggedIn = true; // Replace with actual login check
    if (!user) {
      router.push("/start");
      clearState();
    }
    if (user?.bussinessDetails?.length < 5) {
      setIsOutOfCreditsOpen(true);
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
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-100 text-gray-800">
      {/* Sidebar */}
      <aside
        className={`${
          isSidebarOpen ? "block" : "hidden"
        } md:block w-64 bg-white p-4 h-screen fixed top-0 left-0 shadow-lg z-50 md:z-0 md:relative`}
      >
        <div className="flex gap-[3px] items-center py-4">
        <Link href={"/"} className="flex items-center">


           <img src="/file.png" alt="quickstart" className="h-12 w-12" />
          <h2 className="text-3xl font-bold text-[#9e45f1]">Quickstart</h2>
        </Link>
        </div>
        <nav className="space-y-4 mt-3">
  {tabs.map((tab) => (
    <button
      key={tab.name}
      className={`text-lg open-sans-headings flex items-center w-full text-left py-3 px-5 rounded transition-all duration-300 ${
        tab.name === "appearance"
          ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg hover:shadow-xl transform hover:scale-105"
          : activeTab === tab.name
          ? "bg-[#9E45F1] text-white"
          : "hover:bg-gray-200 text-gray-700"
      }`}
      onClick={() => {
        if (tab.name !== "appearance") {
          setActiveTab(tab.name);
          setIsSidebarOpen(false); // Close the sidebar after clicking a tab
        }
      }}
      

    >
      {/* Update the icon color based on the activeTab */}
      <span className={`mr-3 text-2xl ${activeTab === tab.name ? "text-white" : "text-gray-600"}`}>
        {tab.icon}
      </span>
      <span className="text-lg font-semibold">
        {tab.name === "appearance" ? (
          <span
            className="flex items-center"
            onClick={() =>
              alert("This feature is currently under beta version")
            }
          >
            <Settings className="mr-2 text-2xl" />
            Appearance{" "}
            <span className="ml-1 text-sm font-semibold">β</span>
          </span>
        ) : (
          tab.name.charAt(0).toUpperCase() + tab.name.slice(1)
        )}
      </span>
    </button>
  ))}
</nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8 ml-0  h-screen overflow-y-auto">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-xl font-bold text-[#661fa8] roboty-headings font-extrabold">
            {activeTab === "overview"
              ? `Welcome, ${user?.name}`
              : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
          </h1>

          <div className="flex items-center space-x-4">
          <button className="p-2 rounded-full hover:bg-gray-200 hidden lg:block">
            <Bell className="h-5 w-5" />
          </button>

            <div
              className="relative w-8 h-8 cursor-pointer mb-2"
              onClick={toggleLogoutMenu}
            >
              <Avatar>
                <AvatarImage src={user?.picture} alt={user?.businessName} />
                <AvatarFallback>{user?.name?.charAt(0)}</AvatarFallback>
              </Avatar>
              {showLogoutMenu && (
                <div className="absolute right-0 mt-2 text-gray-700 rounded-lg shadow-lg z-10 bg-white border">
                  <button
                    className="flex items-center p-2 hover:bg-gray-100 w-full"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-4 w-4 mr-2" /> Logout
                  </button>
                </div>
              )}
            </div>
            <button
            className="block md:hidden p-2 rounded-md hover:bg-gray-200 "
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h16m-7 6h7"
              />
            </svg>
          </button>
          </div>

         
        </header>

        {/* Render content based on active tab */}
        {activeTab === "overview" && <Overview />}
        {activeTab === "sessions" && <Chat />}
        {activeTab === "business details" && <BussinessDetails />}
        {activeTab === "test chatbot" && <TestChatbot />}
        {activeTab === "token" && <Token />}
        {activeTab === "transactions" && <Transactions />}

        {/* Show OutOfCredits modal if business details are less than 5 */}
        {isOutOfCreditsOpen && activeTab === "overview" && (
          <OutOfCredits onClose={handleCloseModal} setActiveTab={setActiveTab} />
        )}
      </main>
    </div>
  );
}
