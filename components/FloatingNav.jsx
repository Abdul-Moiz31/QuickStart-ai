"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaArrowUp, FaHome, FaInfoCircle, FaCog, FaDollarSign, FaQuestion, FaEnvelope } from 'react-icons/fa';

const FloatingNav = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
        setIsExpanded(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
    setIsExpanded(false);
  };

  const navItems = [
    { id: 'hero', icon: FaHome, label: 'Home' },
    { id: 'about', icon: FaInfoCircle, label: 'About' },
    { id: 'features', icon: FaCog, label: 'Features' },
    { id: 'pricing', icon: FaDollarSign, label: 'Pricing' },
    { id: 'faq', icon: FaQuestion, label: 'FAQ' },
    { id: 'contact', icon: FaEnvelope, label: 'Contact' },
  ];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed bottom-6 right-6 z-50"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Navigation Items */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                className="mb-4 space-y-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.2, staggerChildren: 0.1 }}
              >
                {navItems.map((item, index) => (
                  <motion.button
                    key={item.id}
                    onClick={() => scrollToSection(item.id)}
                    className="flex items-center justify-center w-12 h-12 bg-white text-purple-600 rounded-full shadow-lg hover:shadow-xl hover:bg-purple-50 transition-all duration-200 group"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <item.icon className="text-lg" />
                    {/* Tooltip */}
                    <span className="absolute right-14 bg-gray-800 text-white px-2 py-1 rounded text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                      {item.label}
                    </span>
                  </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main Navigation Toggle Button */}
          <motion.button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-14 h-14 bg-purple-600 text-white rounded-full shadow-lg hover:shadow-xl hover:bg-purple-700 transition-all duration-200 flex items-center justify-center mb-2"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <motion.div
              animate={{ rotate: isExpanded ? 45 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <FaCog className="text-xl" />
            </motion.div>
          </motion.button>

          {/* Scroll to Top Button */}
          <motion.button
            onClick={scrollToTop}
            className="w-14 h-14 bg-purple-600 text-white rounded-full shadow-lg hover:shadow-xl hover:bg-purple-700 transition-all duration-200 flex items-center justify-center"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <FaArrowUp className="text-xl" />
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FloatingNav;