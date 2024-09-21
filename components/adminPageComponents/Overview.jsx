import React from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { BarChart as BarIcon, Settings, User, Users } from 'lucide-react';

// Sample data for the charts
const totalUsersData = [
  { name: 'Jan', value: 500 },
  { name: 'Feb', value: 600 },
  { name: 'Mar', value: 700 },
  { name: 'Apr', value: 900 },
  { name: 'May', value: 1100 },
  { name: 'Jun', value: 1234 },
];

const activeUsersData = [
  { name: 'Jan', value: 300 },
  { name: 'Feb', value: 400 },
  { name: 'Mar', value: 500 },
  { name: 'Apr', value: 700 },
  { name: 'May', value: 800 },
  { name: 'Jun', value: 1021 },
];

const totalRevenueData = [
  { name: 'Product A', value: 20000 },
  { name: 'Product B', value: 15000 },
  { name: 'Product C', value: 17000 },
];

// Colors for the pie charts
const COLORS = ['#8884d8', '#82ca9d', '#ffc658'];

const Overview = () => {
  return (
    <div className="p-6">
      {/* Cards Section */}
      <div className="grid gap-6 mb-8 md:grid-cols-2 lg:grid-cols-4">
        {[
          { title: 'Total Users', icon: Users, value: '1,234', change: '+10%' },
          { title: 'Active Users', icon: User, value: '1,021', change: '+5%' },
          { title: 'Total Revenue', icon: BarIcon, value: '$52,000', change: '+12%' },
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

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left-side large chart taking half of the width */}
        <div className="lg:col-span-1">
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-sm font-medium mb-4">Total Users Growth</h3>
            <LineChart width={450} height={410} data={totalUsersData}>
              <Line type="monotone" dataKey="value" stroke="#8884d8" strokeWidth={2} />
            </LineChart>
          </div>
        </div>

        {/* Right-side stacked charts */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          {/* First chart (active users) */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-sm font-medium mb-4">Active Users</h3>
            <BarChart width={300} height={150} data={activeUsersData}>
              <Bar dataKey="value" fill="#82ca9d" />
            </BarChart>
          </div>

          {/* Second chart (total revenue distribution) */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-sm font-medium mb-4">Total Revenue Distribution</h3>
            <PieChart width={300} height={150}>
              <Pie
                data={totalRevenueData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {totalRevenueData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Overview;
