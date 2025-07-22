"use client";

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { FaClock, FaChartLine, FaHeadset, FaPalette, FaTools, FaChartArea, FaExpand, FaTimes } from 'react-icons/fa';
import { useState } from 'react';

export default function KeyBenefitsSection() {
  const [expandedCard, setExpandedCard] = useState(null);

  const features = [
    {
      title: "Tracking Time",
      description: "Monitor essential business metrics with ease and efficiency.",
      detailedDescription: "Get real-time insights into your business performance with our comprehensive tracking dashboard. Monitor response times, customer satisfaction rates, and engagement metrics to optimize your operations.",
      icon: FaClock,
    },
    {
      title: "Data Reports",
      description: "Generate comprehensive reports to analyze your performance.",
      detailedDescription: "Create detailed analytics reports with customizable metrics. Export data in multiple formats and share insights with your team to make data-driven decisions.",
      icon: FaChartLine,
    },
    {
      title: "Customer Support",
      description: "Dedicated support to assist you whenever you need it.",
      detailedDescription: "24/7 customer support with live chat, email, and phone assistance. Our expert team is always ready to help you get the most out of our platform.",
      icon: FaHeadset,
    },
    {
      title: "Modern Design",
      description: "Stay ahead with cutting-edge, modern design tailored for you.",
      detailedDescription: "Beautiful, responsive interfaces that adapt to any device. Our design system ensures consistency and provides an exceptional user experience across all platforms.",
      icon: FaPalette,
    },
    {
      title: "Customization",
      description: "Personalize your experience and make it your own.",
      detailedDescription: "Fully customizable chat widgets, themes, and branding options. Tailor the look and feel to match your brand identity perfectly.",
      icon: FaTools,
    },
    {
      title: "Chats Lookup",
      description: "Search for your chats and get the desired information",
      detailedDescription: "Advanced search capabilities with filters, tags, and date ranges. Quickly find specific conversations and extract valuable insights from your chat history.",
      icon: FaChartArea,
    }
  ];

  return (
    <motion.div
      className="bg-gradient-to-b from-gray-50 to-white text-black py-12 px-6 sm:px-10 lg:px-20 flex flex-col items-center gap-12 relative"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 , delay: 0.3 }}
    >
      {/* Header Section */}
      <motion.div
        className="text-center"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.3 }}
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
        {features.map((feature, index) => (
          <motion.div
            key={index}
            className="bg-white rounded-xl p-8 text-center shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col items-center border-black hover:shadow-purple-500/40 cursor-pointer relative group"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ 
              scale: 1.05,
              y: -5,
              transition: { duration: 0.2 }
            }}
            transition={{ delay: index * 0.1, duration: 0.6 }}
            onClick={() => setExpandedCard(expandedCard === index ? null : index)}
          >
            <motion.div 
              className="text-purple-600 text-4xl mb-4 relative"
              whileHover={{ 
                scale: 1.2,
                rotate: [0, -10, 10, 0],
                transition: { duration: 0.3 }
              }}
            >
              <feature.icon />
              {/* Animated ring on hover */}
              <motion.div
                className="absolute inset-0 border-2 border-purple-300 rounded-full opacity-0 group-hover:opacity-100"
                initial={{ scale: 0.8 }}
                whileHover={{ 
                  scale: 1.5,
                  opacity: [0, 1, 0],
                  transition: { duration: 0.8, repeat: Infinity }
                }}
              />
            </motion.div>
            <h3 className="text-xl font-semibold bg-gradient-to-b from-purple-500 to-purple-700 bg-clip-text text-transparent mb-2">
              {feature.title}
            </h3>
            <p className="text-gray-500 text-base mb-4">
              {feature.description}
            </p>
            
            {/* Expand button */}
            <motion.button
              className="mt-auto flex items-center text-purple-600 font-medium hover:text-purple-700 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FaExpand className="mr-2" />
              Learn More
            </motion.button>

            {/* Progress bar animation on hover */}
            <motion.div
              className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-purple-500 to-purple-700 rounded-b-xl"
              initial={{ width: 0 }}
              whileHover={{ width: "100%" }}
              transition={{ duration: 0.3 }}
            />
          </motion.div>
        ))}
      </div>

      {/* Expanded Card Modal */}
      {expandedCard !== null && (
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setExpandedCard(null)}
        >
          <motion.div
            className="bg-white rounded-2xl p-8 max-w-lg w-full relative"
            initial={{ scale: 0.8, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, y: 50 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors"
              onClick={() => setExpandedCard(null)}
            >
              <FaTimes size={20} />
            </button>
            
            <div className="text-center">
              <div className="text-purple-600 text-5xl mb-4 flex justify-center">
                {React.createElement(features[expandedCard].icon)}
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">
                {features[expandedCard].title}
              </h3>
              <p className="text-gray-600 text-lg leading-relaxed">
                {features[expandedCard].detailedDescription}
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
}
