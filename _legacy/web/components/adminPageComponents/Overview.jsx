import React from "react";
import CountUp from 'react-countup';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  ComposedChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Legend,
  Area,
} from "recharts";
import { BarChart as BarIcon, Settings, User, Users } from "lucide-react";
import { Card } from "@nextui-org/react";
import { CardContent, CardTitle } from "../ui/card";

// Sample data for the charts
const totalUsersData = [
  { name: "Jan", value: 500 },
  { name: "Feb", value: 600 },
  { name: "Mar", value: 700 },
  { name: "Apr", value: 900 },
  { name: "May", value: 1100 },
  { name: "Jun", value: 1234 },
];

const activeUsersData = [
  { name: "Jan", value: 300 },
  { name: "Feb", value: 400 },
  { name: "Mar", value: 500 },
  { name: "Apr", value: 700 },
  { name: "May", value: 800 },
  { name: "Jun", value: 1021 },
];

const totalRevenueData = [
  { name: "Product A", value: 20000 },
  { name: "Product B", value: 15000 },
  { name: "Product C", value: 17000 },
];

// Colors for the pie charts
const COLORS = ["#8884d8", "#82ca9d", "#ffc658"];

// Custom label rendering function for PieChart
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
  const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const Overview = () => {
  return (
    <div className="p-6">
    {/* Cards Section */}
    <div className="grid gap-6 mb-8 md:grid-cols-2 lg:grid-cols-4">
      {[
        { title: "Total Users", icon: Users, value: 1234, change: "+10%" },
        { title: "Active Users", icon: User, value: 1021, change: "+5%" },
        { title: "Total Revenue", icon: BarIcon, value: 52000, change: "+12%" },
        { title: "Active Plans", icon: Settings, value: 3, change: "0%" },
      ].map((card, index) => (
        <div key={index} className="bg-gray-800 p-6 rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-medium">{card.title}</h3>
            {React.createElement(card.icon, { className: "w-4 h-4 text-blue-400" })}
          </div>
          <p className="text-2xl font-bold">
            <CountUp end={card.value} duration={2} separator="," />
          </p>
          <p className="text-xs text-blue-400">
            {card.change} from last month
          </p>
        </div>
      ))}
    </div>

      {/* Total Users Growth Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
        <Card className="p-4 bg-background-light dark:bg-background-dark">
          <CardTitle className="mb-6 text-center">Total Users Growth:</CardTitle>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <ComposedChart
                width={500}
                height={400}
                data={totalUsersData}
                margin={{
                  top: 20,
                  right: 20,
                  bottom: 20,
                  left: 20,
                }}
              >
                <CartesianGrid stroke="#f5f5f5" />
                <XAxis dataKey="name" scale="band" />
                <YAxis />
                <Bar dataKey="value" barSize={20} fill="#413ea0" />
                <Line type="monotone" dataKey="value" stroke="#ff7300" />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Active Users Growth Chart */}
      <div className="flex gap-6">
  {/* Active Users Growth (BarChart with 65% width) */}
  <Card className="w-[65%] p-4 bg-background-light dark:bg-background-dark">
    <CardTitle className="mb-6 text-center">Active Users Growth:</CardTitle>
    <CardContent>
      <ResponsiveContainer width="100%" height={400}>
        <ComposedChart
          width={500}
          height={400}
          data={activeUsersData}
          margin={{
            top: 20,
            right: 20,
            bottom: 20,
            left: 20,
          }}
        >
          <XAxis dataKey="name" scale="band" />
          <YAxis />
          <Bar dataKey="value" barSize={20} fill="#8884D8" />
        </ComposedChart>
      </ResponsiveContainer>
    </CardContent>
  </Card>

  {/* Total Revenue Pie Chart (PieChart with 35% width) */}
  <Card className="w-[35%] p-4 bg-background-light dark:bg-background-dark">
    <CardTitle className="mb-6 text-center">Total Revenue by Product:</CardTitle>
    <CardContent>
      <ResponsiveContainer width="100%" height={400}>
        <PieChart>
          <Pie
            data={totalRevenueData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomizedLabel}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {totalRevenueData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </CardContent>
  </Card>
</div>

    </div>
  );
};

export default Overview;
