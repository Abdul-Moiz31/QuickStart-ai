"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation"; 
import { Bell, Plus, LogOut } from "lucide-react";
import Overview from "@/components/adminPageComponents/Overview";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [showLogoutMenu, setShowLogoutMenu] = useState(false);
  const [showModal, setShowModal] = useState(false); 
  const [newUser, setNewUser] = useState({
    name: "",
    company: "",
    plan: "",
    status: "",
  });
  
  const router = useRouter(); // Updated to next/navigation

  // Check if the user is logged in when the component mounts
  useEffect(() => {
    const isLoggedIn = true; // default to true for testing
    if (!isLoggedIn) {
      router.push("/start"); // Redirect to /start if not logged in
    }
  }, [router]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewUser((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = () => {
    console.log("New User Added:", newUser);
    setShowModal(false);
  };

  const toggleLogoutMenu = () => {
    setShowLogoutMenu((prev) => !prev);
  };

  const handleLogout = () => {
    // Add your logout logic here (e.g., clearing auth tokens)
    router.push("/"); // Redirect to / after logout
  };

  return (
    <div className="flex min-h-screen bg-black text-white">
      <aside className="w-64 bg-gray-900 p-4">
        <h2 className="text-2xl font-bold mb-6">Quickstart Admin</h2>
        <nav className="space-y-2">
          {["overview", "users", "plans"].map((tab) => (
            <button
              key={tab}
              className={`roboty-headings w-full text-left py-2 px-4 rounded ${
                activeTab === tab ? "bg-blue-600" : "hover:bg-gray-800"
              }`}
              onClick={() => setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
      </aside>

      <main className="flex-1 p-8">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">
            {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
          </h1>
          <div className="flex items-center space-x-4">
            <button className="p-2 rounded-full hover:bg-gray-800">
              <Bell className="h-5 w-5" />
            </button>
            <div className="relative">
              <div
                className="w-8 h-8 rounded-full bg-gray-600 cursor-pointer"
                onClick={toggleLogoutMenu}
              ></div>
              {showLogoutMenu && (
                <div className="absolute right-0 top-full mt-2 bg-gray-800 text-white rounded-lg shadow-lg">
                  <button
                    onClick={handleLogout} 
                    className="px-4 py-2 hover:bg-gray-700 w-full text-left text-red-600 flex items-center justify-between"
                  >
                    Logout<LogOut className="h-4 w-4 ml-2 inline-block" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {activeTab === "overview" && <Overview />}

        {activeTab === "users" && (
          <div className="bg-gray-800 p-6 rounded-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Business Owners</h3>
              <button
                className="bg-blue-600 text-white px-4 py-2 rounded flex items-center"
                onClick={() => setShowModal(true)}
              >
                <Plus className="mr-2 h-4 w-4" /> Add User
              </button>
            </div>
            <table className="w-full">
              <thead>
                <tr className="text-left">
                  <th className="pb-2">Name</th>
                  <th className="pb-2">Company</th>
                  <th className="pb-2">Plan</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {[
                  {
                    name: "John Doe",
                    company: "Acme Inc.",
                    plan: "Pro",
                    status: "Active",
                  },
                  {
                    name: "Jane Smith",
                    company: "Tech Co.",
                    plan: "Basic",
                    status: "Active",
                  },
                  {
                    name: "Bob Johnson",
                    company: "Dev LLC",
                    plan: "Enterprise",
                    status: "Active",
                  },
                ].map((user, index) => (
                  <tr key={index} className="border-t border-gray-700">
                    <td className="py-2">{user.name}</td>
                    <td className="py-2">{user.company}</td>
                    <td className="py-2">{user.plan}</td>
                    <td className="py-2">{user.status}</td>
                    <td className="py-2">
                      <button className="text-blue-400 mr-2">Edit</button>
                      <button className="text-red-400">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "plans" && (
          <div className="bg-gray-800 p-6 rounded-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Subscription Plans</h3>
              <button className="bg-blue-600 text-white px-4 py-2 rounded flex items-center">
                <Plus className="mr-2 h-4 w-4" /> Add Plan
              </button>
            </div>
            <table className="w-full">
              <thead>
                <tr className="text-left">
                  <th className="pb-2">Plan Name</th>
                  <th className="pb-2">Price</th>
                  <th className="pb-2">Features</th>
                  <th className="pb-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {[
                  {
                    name: "Basic",
                    price: "$9.99/mo",
                    features: "100 chats, 1 website",
                  },
                  {
                    name: "Pro",
                    price: "$19.99/mo",
                    features: "500 chats, 3 websites",
                  },
                  {
                    name: "Enterprise",
                    price: "$49.99/mo",
                    features: "Unlimited chats, 10 websites",
                  },
                ].map((plan, index) => (
                  <tr key={index} className="border-t border-gray-700">
                    <td className="py-2">{plan.name}</td>
                    <td className="py-2">{plan.price}</td>
                    <td className="py-2">{plan.features}</td>
                    <td className="py-2">
                      <button className="text-blue-400 mr-2">Edit</button>
                      <button className="text-red-400">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Modal for adding a new user */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
            <div className="bg-gray-800 p-6 rounded-lg w-96">
              <h3 className="text-xl font-bold mb-4">Add New User</h3>
              <form>
                <div className="mb-4">
                  <label className="block text-sm">Name</label>
                  <input
                    type="text"
                    name="name"
                    placeholder="John Doe"
                    value={newUser.name}
                    onChange={handleInputChange}
                    className="w-full p-2 rounded bg-gray-700 text-white"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm">Company</label>
                  <input
                    type="text"
                    name="company"
                    placeholder="xyz Inc."
                    value={newUser.company}
                    onChange={handleInputChange}
                    className="w-full p-2 rounded bg-gray-700 text-white"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm">Plan</label>
                  <input
                    type="text"
                    name="plan"
                    placeholder="Basic"
                    value={newUser.plan}
                    onChange={handleInputChange}
                    className="w-full p-2 rounded bg-gray-700 text-white"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm">Status</label>
                  <input
                    type="text"
                    name="status"
                    placeholder="Active"
                    value={newUser.status}
                    onChange={handleInputChange}
                    className="w-full p-2 rounded bg-gray-700 text-white"
                  />
                </div>
              </form>
              <div className="flex justify-end">
                <button
                  onClick={() => setShowModal(false)}
                  className="bg-red-600 px-4 py-2 rounded mr-2"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  className="bg-blue-600 px-4 py-2 rounded"
                >
                  Add User
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
