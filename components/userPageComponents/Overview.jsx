import React, { useState } from "react";
import { MessageSquare, User, Settings } from "lucide-react";
import { Area, AreaChart, CartesianGrid, XAxis, Tooltip, ResponsiveContainer } from "recharts";

const Overview = () => {
  const [credits, setCredits] = useState(0);

  const cardData = [
    { title: "Total Sessions", icon: MessageSquare, value: "1,234", change: "+10%" },
    { title: "Total Credits", icon: User, value: "256", change: "+5%" },
    { title: "Current Plan", icon: Settings, value: "Pro", subtext: "Renews on May 1, 2023" },
  ];

  const sessionData = [
    { month: "Jan", session: 180 },
    { month: "Feb", session: 200 },
    { month: "Mar", session: 150 },
    { month: "Apr", session: 220 },
    { month: "May", session: 250 },
    { month: "Jun", session: 280 },
    { month: "Jul", session: 300 },
    { month: "Aug", session: 320 },
    { month: "Sep", session: 340 },
    { month: "Oct", session: 360 },
    { month: "Nov", session: 380 },
    { month: "Dec", session: 400 },
  ];

  return (
    <div className="space-y-8">
      {/* Cards */}
      <div className="roboty-headings grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {cardData.map((card, index) => (
          <div key={index} className="bg-gray-800 p-6 rounded-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-medium">{card.title}</h3>
              <card.icon className="w-6 h-6 text-blue-400" />
            </div>
            <p className="text-2xl font-bold">{card.value}</p>
            <p className="text-xs text-blue-400">{card.change || card.subtext}</p>
          </div>
        ))}
      </div>

      {/* Session Area Chart */}
      <div className="bg-gray-800 p-6 rounded-lg">
        <h3 className="text-sm font-medium mb-4">Monthly Sessions Overview</h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={sessionData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <Tooltip />
            <Area
              type="monotone"
              dataKey="session"
              stroke="#8884d8"
              fill="blue"
              fillOpacity={0.3}

            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Overview;
