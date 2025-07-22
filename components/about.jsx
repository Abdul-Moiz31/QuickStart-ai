"use client";

import { motion } from "framer-motion";
import { Button } from "@nextui-org/button";
import { useState } from "react";
import { FaPlay, FaPause, FaRocket, FaClock, FaUsers } from "react-icons/fa";

export default function About() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentMetric, setCurrentMetric] = useState(0);

  const metrics = [
    { icon: FaRocket, value: "99.9%", label: "Uptime", color: "text-green-500" },
    { icon: FaClock, value: "<2s", label: "Response Time", color: "text-blue-500" },
    { icon: FaUsers, value: "24/7", label: "Support", color: "text-purple-500" },
  ];

  const features = [
    { 
      text: "Seamlessly integrates with any website through our simple npm package.",
      icon: "🔗"
    },
    { 
      text: "Empowers businesses to provide 24/7 customer support.",
      icon: "🌙"
    },
    {
      text: "Manage interactions and track customer engagement from a personalized dashboard.",
      icon: "📊"
    },
    {
      text: "Enhances customer satisfaction and reduces response time to seconds.",
      icon: "⚡"
    },
  ];

  return (
    <div className="my-10 relative flex justify-center items-center bg-white text-gray-800">
      <section
        id="about"
        className="max-w-screen-xl mx-auto px-4  gap-20 md:px-8 flex flex-col md:flex-row items-center"
      >
        {/* Right section: Text with animation and better content */}
        <motion.div
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 1.2 }}
          className="flex flex-col justify-center items-center md:items-start space-y-6 max-w-lg mx-auto text-center md:text-left flex-1"
        >
          {/* Heading */}
          <h2 className="text-4xl font-semibold tracking-tight md:text-5xl text-gray-700">
            Welcome to{" "}
            <span className="bg-gradient-to-r from-purple-500 via-purple-600 to-purple-700 text-transparent bg-clip-text">
              QuickStart AI
            </span>
          </h2>

          {/* Subheading with a more engaging message */}
          <div className="flex justify-center items-center text-left mb-4">
            <p className="text-lg contain-content text-gray-600 md:text-xl">
              Revolutionize your customer support with our AI-powered live chat
              solution. QuickStart AI automates real-time interactions, ensuring
              customers get instant, personalized assistance—no agents required!
            </p>
          </div>

          {/* Interactive metrics display */}
          <div className="grid grid-cols-3 gap-4 w-full my-6">
            {metrics.map((metric, index) => (
              <motion.div
                key={index}
                className={`text-center p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-all duration-300 cursor-pointer ${
                  currentMetric === index ? 'ring-2 ring-purple-500 bg-purple-50' : ''
                }`}
                whileHover={{ scale: 1.05 }}
                onClick={() => setCurrentMetric(index)}
              >
                <metric.icon className={`text-2xl mx-auto mb-2 ${metric.color}`} />
                <div className="text-xl font-bold text-gray-800">{metric.value}</div>
                <div className="text-sm text-gray-600">{metric.label}</div>
              </motion.div>
            ))}
          </div>

          {/* Highlight points with icons and animations */}
          <div className="w-full space-y-3">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="flex items-start space-x-3 p-3 rounded-lg hover:bg-purple-50 transition-all duration-300 cursor-pointer group"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.2, duration: 0.5 }}
                whileHover={{ x: 5 }}
              >
                <span className="text-2xl group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </span>
                <span className="text-gray-600 group-hover:text-gray-800 transition-colors duration-300">
                  {feature.text}
                </span>
              </motion.div>
            ))}
          </div>

          {/* Call to action with better styling */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mt-8"
          >
            <Button
              className="bg-gradient-to-r from-purple-500 via-purple-600 to-purple-700 hover:bg-gradient-to-l text-white px-8 py-3 rounded-full text-lg transition duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Explore More
            </Button>
          </motion.div>
        </motion.div>

        {/* Left section: Image with smooth fade-in and interactive elements */}
        <motion.div
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 1.2 }}
          className="mt-12 md:mt-0  flex-1 relative"
        >
          <motion.div
            className="relative group"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.3 }}
          >
            <img
              src="/fea3.png"
              alt="AI-Powered Chat Solution"
              className="rounded-lg transform transition duration-500 ease-in-out"
            />
            
            {/* Floating play button overlay */}
            <motion.div
              className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black bg-opacity-20 rounded-lg"
              initial={{ scale: 0 }}
              whileHover={{ scale: 1 }}
            >
              <motion.button
                className="bg-white bg-opacity-90 rounded-full p-4 text-purple-600 hover:text-purple-700 transition-colors shadow-lg"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsPlaying(!isPlaying)}
              >
                {isPlaying ? (
                  <FaPause className="text-3xl" />
                ) : (
                  <FaPlay className="text-3xl ml-1" />
                )}
              </motion.button>
            </motion.div>

            {/* Animated border effect */}
            <motion.div
              className="absolute inset-0 border-2 border-purple-400 rounded-lg opacity-0 group-hover:opacity-100"
              initial={{ scale: 0.95 }}
              whileHover={{ 
                scale: 1,
                opacity: [0, 1, 0],
                transition: { duration: 1.5, repeat: Infinity }
              }}
            />
          </motion.div>
        </motion.div>
      </section>
    </div>
  );
}
