"use client";
import React, { useEffect, useState } from 'react';
import { Button } from "components/ui/button";
import { ArrowRight, Sparkles } from 'lucide-react';
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

// Floating particle component
const FloatingParticle = ({ delay = 0 }) => (
  <motion.div
    className="absolute w-2 h-2 bg-purple-300 rounded-full opacity-60"
    initial={{ y: 0, opacity: 0 }}
    animate={{ 
      y: [-20, -40, -20], 
      opacity: [0, 1, 0],
    }}
    transition={{
      duration: 3,
      repeat: Infinity,
      delay: delay,
      ease: "easeInOut"
    }}
    style={{
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
    }}
  />
);

export default function Hero() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <motion.div 
      initial="hidden" 
      animate="visible" 
      className="bg-gradient-to-r from-purple-500 to-purple-600 pb-12 relative overflow-hidden"
    >
      {/* Floating particles */}
      {[...Array(6)].map((_, i) => (
        <FloatingParticle key={i} delay={i * 0.5} />
      ))}
      
      {/* Interactive background gradient that follows mouse */}
      <motion.div
        className="absolute inset-0 opacity-30"
        style={{
          background: `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, rgba(255,255,255,0.2) 0%, transparent 50%)`,
        }}
      />
      
      <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col lg:flex-row items-center relative z-10">
        
        {/* Left Side */}
        <motion.div variants={staggerContainer} className="lg:w-1/2">
          <motion.h1 variants={fadeInUp} className="text-4xl font-bold text-white leading-tight sm:text-5xl md:text-6xl mb-4">
            Build, Train, and Manage Effortlessly
            <motion.span 
              variants={fadeInUp} 
              className="block text-gradient relative"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              with QuickStart AI
              <motion.div
                className="absolute -top-2 -right-2"
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <Sparkles className="text-yellow-300 w-6 h-6" />
              </motion.div>
            </motion.span>
          </motion.h1>
          <motion.p variants={fadeInUp} className="mt-3 text-lg text-gray-200 md:max-w-lg">
            Create a superior chat experience for your website with QuickStart AI. Manage and train your data with ease.
          </motion.p>
          <motion.div variants={fadeInUp} className="mt-5">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button className="px-6 py-3 text-lg font-medium text-white bg-purple-700 rounded-lg shadow-md hover:bg-purple-800 transition-all duration-300 hover:shadow-xl group">
                BUILD YOUR WORLD
                <motion.div
                  className="ml-2 -mr-1 h-5 w-5"
                  whileHover={{ x: 5 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  <ArrowRight aria-hidden="true" />
                </motion.div>
              </Button>
            </motion.div>
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
            whileHover={{ 
              scale: 1.05,
              rotateY: 15,
              transition: { duration: 0.3 }
            }}
            className="relative group cursor-pointer"
          >
            <img src="/Cute.png" alt="Descriptive Alt Text" className="max-w-full rounded-lg transition-all duration-300" />
            {/* Glow effect on hover */}
            <motion.div
              className="absolute inset-0 bg-purple-400 rounded-lg blur-xl opacity-0 group-hover:opacity-20 transition-opacity duration-300 -z-10"
              initial={{ scale: 0.8 }}
              whileHover={{ scale: 1.1 }}
            />
          </motion.div>
        </motion.div>
      </div>

      {/* Counter Section with Icons */}
      <motion.div variants={staggerContainer} className=" grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-5 px-10 relative z-10">
  {[ 
    {
      countEnd: 100,
      label: "Users",
      icon: <FaUsers className="text-purple-600 text-2xl mr-2" />,
      description: "Active users worldwide"
    },
    {
      countEnd: 2000,
      label: "npm Installs",
      icon: <FaCodeBranch className="text-purple-600 text-2xl mr-2" />,
      description: "Package downloads"
    },
    {
      countEnd: 500,
      label: "Businesses Helped",
      icon: <FaBusinessTime className="text-purple-600 text-2xl mr-2" />,
      description: "Companies using our solution"
    },
    {
      countEnd: 1000,
      label: "Projects Completed",
      icon: <FaCodeBranch className="text-purple-600 text-2xl mr-2" />,
      description: "Successful implementations"
    },
    {
      countEnd: 1,
      label: "Total Products",
      icon: <FaUsers className="text-purple-600 text-2xl mr-2" />,
      description: "AI-powered solutions"
    }

  ].map(({ countEnd, label, icon, description }, index) => (
    <motion.div
      key={index}
      whileHover={{ 
        scale: 1.05,
        y: -5,
        transition: { duration: 0.2 }
      }}
      variants={fadeInUp}
      className="relative group flex items-center p-5 bg-white rounded-xl shadow-lg transition-all transform hover:shadow-[0_0_25px_5px_rgba(129,90,233,0.4)] hover:bg-gradient-to-r from-purple-50 to-white duration-300"
    >
      {icon}
      <div className="flex flex-col">
        <h2 className="text-3xl font-bold text-purple-600">
          <CountUp start={0} end={countEnd} duration={2.5} />
          {label === "Users" ? "+" : ""}
        </h2>
        <p className="mt-2 text-md font-medium text-gray-800">{label}</p>
      </div>
      
      {/* Tooltip on hover */}
      <motion.div
        className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap z-20"
        initial={{ y: 10, opacity: 0 }}
        whileHover={{ y: 0, opacity: 1 }}
      >
        {description}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
      </motion.div>
    </motion.div>
  ))}
      </motion.div>
    </motion.div>
  );
}
