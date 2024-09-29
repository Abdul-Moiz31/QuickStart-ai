"use client";

import Image from 'next/image';
import { motion } from 'framer-motion';
import { FaClock, FaChartLine, FaHeadset, FaPalette,FaTools,FaChartArea } from 'react-icons/fa';

export default function KeyBenefitsSection() {
  return (
    <motion.div
      className="bg-gradient-to-b from-gray-50 to-white text-black py-12 px-6 sm:px-10 lg:px-20 flex flex-col items-center gap-12"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 , delay: 0.2 }}
    >
      {/* Header Section */}
      <motion.div
        className="text-center"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        <div className="text-purple-600 text-sm font-semibold mb-2 uppercase tracking-wider">
          Key Features
        </div>
        <h2 className="text-4xl font-extrabold bg-gradient-to-b from-purple-500 to-purple-700 bg-clip-text text-transparent sm:text-5xl mb-4">
          Why Choose Us?
        </h2>
        <p className="text-gray-600 mb-8 text-base sm:text-lg">
          Discover the benefits that make our services stand out from the rest.
        </p>
      </motion.div>

      {/* Benefits Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full lg:max-w-7xl">
        {[
          {
            title: "Tracking Time",
            description: "Monitor essential business metrics with ease and efficiency.",
            icon: FaClock,
          },
          {
            title: "Data Reports",
            description: "Generate comprehensive reports to analyze your performance.",
            icon: FaChartLine,
          },
          {
            title: "Customer Support",
            description: "Dedicated support to assist you whenever you need it.",
            icon: FaHeadset,
          },
          {
            title: "Modern Design",
            description: "Stay ahead with cutting-edge, modern design tailored for you.",
            icon: FaPalette,
          },
          {
            title: "Customization",
            description: "Personalize your experience and make it your own.",
            icon: FaTools,
          },
          {
            title:"Chats Lookup",
            description:"Search for your chats and get the desired information",
            icon:FaChartArea,

          }
        ].map((benefit, index) => (
          <motion.div
            key={index}
            className="bg-white rounded-xl p-8 text-center shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col items-center border-black hover:shadow-purple-500/40"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.05 }}
            transition={{ delay: index * 0.1, duration: 0.6 }}
          >
            <div className="text-purple-600 text-4xl mb-4">
              <benefit.icon />
            </div>
            <h3 className="text-xl font-semibold bg-gradient-to-b from-purple-500 to-purple-700 bg-clip-text text-transparent mb-2">
              {benefit.title}
            </h3>
            <p className="text-gray-500 text-base">
              {benefit.description}
            </p>
          </motion.div>
        ))}
      </div>
    </motion.div>

  );
}
