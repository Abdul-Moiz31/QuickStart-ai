"use client";
import React from 'react';
import { Button } from "@/components/ui/button";
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import CountUp from 'react-countup';
import { FaUsers, FaCodeBranch, FaBusinessTime } from 'react-icons/fa'; 

// Motion variants for smooth animation
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeInOut" } },
};

const staggerContainer = {
  hidden: { opacity: 1 },
  visible: { opacity: 1, transition: { staggerChildren: 0.2 } },
};

export default function Hero() {
  return (
    <motion.div initial="hidden" animate="visible" className="bg-gradient-to-r from-purple-500 to-purple-600 pb-12">
      <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col lg:flex-row items-center">
        
        {/* Left Side */}
        <motion.div variants={staggerContainer} className="lg:w-1/2">
          <motion.h1 variants={fadeInUp} className="text-4xl font-bold text-white leading-tight sm:text-5xl md:text-6xl mb-4">
            Build, Train, and Manage Effortlessly
            <motion.span variants={fadeInUp} className="block text-gradient">with QuickStart AI</motion.span>
          </motion.h1>
          <motion.p variants={fadeInUp} className="mt-3 text-lg text-gray-200 md:max-w-lg">
            Create a superior chat experience for your website with QuickStart AI. Manage and train your data with ease.
          </motion.p>
          <motion.div variants={fadeInUp} className="mt-5">
            <Button className="px-6 py-3 text-lg font-medium text-white bg-purple-700 rounded-lg shadow-md hover:bg-purple-800 transition">
              BUILD YOUR WORLD
              <ArrowRight className="ml-2 -mr-1 h-5 w-5" aria-hidden="true" />
            </Button>
          </motion.div>
        </motion.div>

        {/* Right Side with Image */}
        <motion.div variants={fadeInUp} className="mt-10 lg:mt-0 lg:w-1/2 flex justify-center">
          <motion.div
            initial={{ y: 0 }}
            animate={{ y: [0, -10, 0] }}
            transition={{
              duration: 3,
              repeat: Infinity,
              repeatType: "mirror",
            }}
            whileHover={{ scale: 1.05 }} 
          >
            <img src="/Cute.png" alt="Descriptive Alt Text" className="max-w-full rounded-lg " />
          </motion.div>
        </motion.div>
      </div>

      {/* Counter Section with Icons */}
      <motion.div variants={staggerContainer} className=" grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-5 px-10">
  {[ 
    {
      countEnd: 100,
      label: "Users",
      icon: <FaUsers className="text-purple-600 text-2xl mr-2" />, 
    },
    {
      countEnd: 2000,
      label: "npm Installs",
      icon: <FaCodeBranch className="text-purple-600 text-2xl mr-2" />, 
    },
    {
      countEnd: 500,
      label: "Businesses Helped",
      icon: <FaBusinessTime className="text-purple-600 text-2xl mr-2" />, 
    },
    {
      countEnd: 1000,
      label: "Projects Completed",
      icon: <FaCodeBranch className="text-purple-600 text-2xl mr-2" />,
    },
    {
      countEnd: 1,
      label: "Total Products",
      icon: <FaUsers className="text-purple-600 text-2xl mr-2" />,
    }

  ].map(({ countEnd, label, icon }, index) => (
    <motion.div
      key={index}
      whileHover={{ scale: 1.05 }}
      variants={fadeInUp}
      className="flex items-center p-5 bg-white rounded-xl shadow-lg transition-shadow transform hover:shadow-[0_0_15px_5px_rgba(129,90,233,0.5)] hover:bg-gradient-to-r from-purple-50 to-white duration-300"
    >
      {icon}
      <div className="flex flex-col">
        <h2 className="text-3xl font-bold text-purple-600">
          <CountUp start={0} end={countEnd} duration={2.5} />
          {label === "Users" ? "+" : ""}
        </h2>
        <p className="mt-2 text-md font-medium text-gray-800">{label}</p>
      </div>
    </motion.div>
  ))}
      </motion.div>
    </motion.div>
  );
}
