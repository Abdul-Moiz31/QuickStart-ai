"use client"
import React, { useState } from 'react';
import { Bell, ChevronDown, Menu, Search, User, MessageSquare, Settings, Key } from "lucide-react";

export default function UserDashboard() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="flex min-h-screen bg-black text-white">
      <aside className="w-64 bg-gray-900 p-4">
        <h2 className="text-2xl font-bold mb-6">Quickstart User</h2>
        <nav className="space-y-2">
          {['overview', 'chats', 'settings', 'token'].map((tab) => (
            <button
              key={tab}
              className={`w-full text-left py-2 px-4 rounded ${activeTab === tab ? 'bg-blue-600' : 'hover:bg-gray-800'}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
      </aside>
      <main className="flex-1 p-8">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h1>
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
              { title: 'Total Chats', icon: MessageSquare, value: '1,234', change: '+10%' },
              { title: 'Active Users', icon: User, value: '256', change: '+5%' },
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

        {activeTab === 'chats' && (
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-xl font-bold mb-4">Recent Chats</h3>
            <table className="w-full">
              <thead>
                <tr className="text-left">
                  <th className="pb-2">User</th>
                  <th className="pb-2">Last Message</th>
                  <th className="pb-2">Time</th>
                  <th className="pb-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { user: 'Alice', message: 'How can I help you today?', time: '2 mins ago', status: 'Active' },
                  { user: 'Bob', message: 'Thanks for your assistance!', time: '1 hour ago', status: 'Closed' },
                  { user: 'Charlie', message: 'I have a question about...', time: '3 hours ago', status: 'Pending' },
                ].map((chat, index) => (
                  <tr key={index} className="border-t border-gray-700">
                    <td className="py-2">{chat.user}</td>
                    <td className="py-2">{chat.message}</td>
                    <td className="py-2">{chat.time}</td>
                    <td className="py-2">{chat.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-xl font-bold mb-4">Company Details</h3>
            <form className="space-y-4">
              <div>
                <label htmlFor="company-name" className="block text-sm font-medium text-gray-400">Company Name</label>
                <input id="company-name" type="text" placeholder="Enter your company name" className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white" />
              </div>
              <div>
                <label htmlFor="website" className="block text-sm font-medium text-gray-400">Website</label>
                <input id="website" type="text" placeholder="https://www.example.com" className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white" />
              </div>
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-400">Description</label>
                <textarea id="description" placeholder="Describe your business" className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white" rows={4}></textarea>
              </div>
              <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Save Changes</button>
            </form>
          </div>
        )}

        {activeTab === 'token' && (
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-xl font-bold mb-4">API Token</h3>
            <p className="mb-4">Use this token to integrate our chat service into your website:</p>
            <input value="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" readOnly className="w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white mb-4" />
            <p className="text-sm text-gray-400 mb-4">Keep this token secret. Do not share it publicly.</p>
            <button className="bg-blue-600 text-white px-4 py-2 rounded">Generate New Token</button>
          </div>
        )}
      </main>
    </div>
  );
}