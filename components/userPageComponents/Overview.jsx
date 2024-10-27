import React, { useState, useEffect } from "react";
import { MessageSquare, User, Settings } from "lucide-react";
import { Area, AreaChart, CartesianGrid, XAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useDispatch, useSelector } from "react-redux";
import { getAllSessions, getSessionsMonthlyData, loadUser } from "@/slices/userSlice";

const Overview = () => {
  const dispatch = useDispatch();
  const { sessions, data } = useSelector((state) => state.user);
  const [credits, setCredits] = useState(0);

  useEffect(() => {
    dispatch(getAllSessions());
    dispatch(getSessionsMonthlyData());
    dispatch(loadUser());
  }, [dispatch]);

  const chartData = data?.map((item) => {
    return { month: item.month, session: item.count };
  });

  const cardData = [
    { 
      title: "Total Sessions", 
      icon: MessageSquare, 
      value: sessions?.length ? sessions.length : 0, 
      change: "+10%" 
    },
    { title: "Total Credits", icon: User, value: "256", change: "+5%" },
    { title: "Current Plan", icon: Settings, value: "Free", subtext: "" },
  ];

  return (
    <div className="space-y-8">
      {/* Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {cardData.map((card, index) => (
          <div key={index} className="bg-[#9e45f1] flex justify-between  p-6 rounded-2xl shadow-lg">
            <div className="flex flex-col text-start justify-between gap-4 mb-4 ">
              <h3 className="text-sm font-medium text-white text-[20px]">{card.title}</h3>
              <div>

              <p className="text-2xl font-bold text-white">{card.value}</p>
              <p className="text-xs text-white">{card.change || card.subtext}</p>
              </div>
              
            </div>
            <div className="flex  flex-col justify-center items-center bg-white h-fit my-auto rounded-full p-4">

              <card.icon className="w-7 h-7  text-[#661fa8] " />
              </div>
           
          </div>
        ))}
      </div>

      {/* Session Area Chart */}
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h3 className="text-sm font-medium text-gray-700 mb-4">Monthly Sessions Overview</h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis dataKey="month" stroke="#888888" />
            <Tooltip />
            <Area
              type="monotone"
              dataKey="session"
              stroke="#1E3A8A"       // Darker blue stroke for the chart line
              fill="#3B82F6"         // Light blue fill for the area under the line
              fillOpacity={0.3}
              animationBegin={1000}
              animationDuration={1500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Overview;
