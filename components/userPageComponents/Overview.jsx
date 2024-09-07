import React, { useState } from 'react'
import { Bell, MessageSquare, User, Settings, Send } from "lucide-react";

const Overview = () => {
    const [credits,setCredits]=useState(0);

    
  return (
<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
{[
  { title: 'Total Sessions', icon: MessageSquare, value: '1,234', change: '+10%' },
  { title: 'Total Credits', icon: User, value: '256', change: '+5%' },
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
  )
}

export default Overview