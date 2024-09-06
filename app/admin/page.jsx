"use client"
import React, { useState } from 'react';
import { Bell, ChevronDown, Menu, Search, User, Users, BarChart, Settings, Plus } from "lucide-react";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="flex min-h-screen bg-black text-white">
      <aside className="w-64 bg-gray-900 p-4">
        <h2 className="text-2xl font-bold mb-6">Quickstart Admin</h2>
        <nav className="space-y-2">
          {['overview', 'users', 'plans'].map((tab) => (
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
          <>
            <div className="grid gap-6 mb-8 md:grid-cols-2 lg:grid-cols-4">
              {[
                { title: 'Total Users', icon: Users, value: '1,234', change: '+10%' },
                { title: 'Active Users', icon: User, value: '1,021', change: '+5%' },
                { title: 'Total Revenue', icon: BarChart, value: '$52,000', change: '+12%' },
                { title: 'Active Plans', icon: Settings, value: '3', change: '0%' },
              ].map((card, index) => (
                <div key={index} className="bg-gray-800 p-6 rounded-lg">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-medium">{card.title}</h3>
                    <card.icon className="w-4 h-4 text-blue-400" />
                  </div>
                  <p className="text-2xl font-bold">{card.value}</p>
                  <p className="text-xs text-blue-400">{card.change} from last month</p>
                </div>
              ))}
            </div>
            <div className="bg-gray-800 p-6 rounded-lg">
              <h3 className="text-xl font-bold mb-4">Users List</h3>
              <table className="w-full">
                <thead>
                  <tr className="text-left">
                    <th className="pb-2">Name</th>
                    <th className="pb-2">Company</th>
                    <th className="pb-2">Plan</th>
                    <th className="pb-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { name: 'John Doe', company: 'Acme Inc.', plan: 'Pro', status: 'Active' },
                    { name: 'Jane Smith', company: 'Tech Co.', plan: 'Basic', status: 'Active' },
                    { name: 'Bob Johnson', company: 'Dev LLC', plan: 'Enterprise', status: 'Active' },
                  ].map((user, index) => (
                    <tr key={index} className="border-t border-gray-700">
                      <td className="py-2">{user.name}</td>
                      <td className="py-2">{user.company}</td>
                      <td className="py-2">{user.plan}</td>
                      <td className="py-2">{user.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {activeTab === 'users' && (
          <div className="bg-gray-800 p-6 rounded-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Business Owners</h3>
              <button className="bg-blue-600 text-white px-4 py-2 rounded flex items-center">
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
                  { name: 'John Doe', company: 'Acme Inc.', plan: 'Pro', status: 'Active' },
                  { name: 'Jane Smith', company: 'Tech Co.', plan: 'Basic', status: 'Active' },
                  { name: 'Bob Johnson', company: 'Dev LLC', plan: 'Enterprise', status: 'Active' },
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

        {activeTab === 'plans' && (
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
                  { name: 'Basic', price: '$9.99/mo', features: '100 chats, 1 website' },
                  { name: 'Pro', price: '$19.99/mo', features: '500 chats, 3 websites' },
                  { name: 'Enterprise', price: '$49.99/mo', features: 'Unlimited chats, 10 websites' },
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
      </main>
    </div>
  );
}